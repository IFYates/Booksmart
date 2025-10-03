using IFY.Booksmart.StorageAPI;
using IFY.Booksmart.StorageAPI.Data;
using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Extensions.Options;
using System.Net.Mime;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Configure options
builder.Services.Configure<SqliteOptions>(cfg =>
{
    var val = builder.Configuration.GetConnectionString("Sqlite")
        ?? throw new OptionsValidationException("ConnectionString", typeof(SqliteOptions), ["ConnectionStrings:Sqlite cannot be null or empty"]);
    cfg.ConnectionString = val;
});

// Register services
builder.Services.AddTransient<ISqliteConnection, SqliteConnection>();
builder.Services.AddTransient<KeyValueStore>();
builder.Services.AddTransient<AccountStore>();
builder.Services.AddHostedService<DisableInactiveAccountsTask>();
builder.Services.AddSingleton<Api>();

// Add the rate‑limiting service
builder.Services.AddRateLimiter(options =>
{
    const int windowSeconds = 60;
    const int requestLimit = 10;

    // Global fallback policy
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        // Partition key = client IP
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // Fixed‑window: X req per Y secs
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = requestLimit,
                Window = TimeSpan.FromSeconds(windowSeconds),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0 // reject immediately when limit exceeded
            });
    });

    // 429 response on breach
    options.OnRejected = (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = windowSeconds.ToString();
        return ValueTask.CompletedTask;
    };
});

// Build app
var app = builder.Build();
app.UseRateLimiter();
app.Use(Middleware.RouteValueSlashDecoder);
app.Use(Middleware.PlainTextBodyParser);

// Setup database
using (var sqlite = app.Services.GetRequiredService<ISqliteConnection>())
{
    SqliteSchema.EnsureSchema(sqlite,
        app.Services.GetRequiredService<AccountStore>(),
        app.Services.GetRequiredService<KeyValueStore>()
    );
}

// Setup platform
app.Services.GetRequiredService<Api>().RegisterRoutes(app);

app.Run();

file static class Middleware
{
    /// <summary>
    /// Processes requests with a Content-Type of text/plain by converting the request body to a JSON string, enabling
    /// model binding for [FromBody] parameters expecting a string.
    /// </summary>
    /// <remarks>This middleware allows endpoints expecting a string parameter via [FromBody] to accept plain
    /// text requests by reformatting the body as a JSON string. The Content-Type is changed to application/json to
    /// ensure correct model binding. This conversion only occurs for requests with a Content-Type of text/plain; other
    /// requests are passed through unchanged.</remarks>
    /// <param name="context">The HTTP context for the current request. Must not be null.</param>
    /// <param name="next">A delegate representing the next middleware in the pipeline. Must not be null.</param>
    /// <returns>A task that represents the asynchronous operation of the middleware.</returns>
    public static async Task PlainTextBodyParser(HttpContext context, Func<Task> next)
    {
        // If the Content-Type is text/plain, change it to application/json
        // so that the [FromBody] attribute can parse it as a string.
        if (context.Request.ContentType != null &&
            context.Request.ContentType.StartsWith(MediaTypeNames.Text.Plain, StringComparison.OrdinalIgnoreCase))
        {
            // Read the entire body as a string
            using var r = new StreamReader(context.Request.Body);
            var value = await r.ReadToEndAsync();
            context.Request.Body.Dispose();

            // Replace the body with a new stream containing the JSON string
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes($"\"{value}\""));
            context.Request.ContentType = MediaTypeNames.Application.Json;
        }
        await next();
    }

    /// <summary>
    /// Replaces any remaining "%2F" or "%5C" in ALL route values with the actual '/' or '\' character.
    /// </summary>
    /// <remarks>
    /// This is because ASP.NET Core routing leaves only these characters encoded.
    /// </remarks>
    public static async Task RouteValueSlashDecoder(HttpContext context, Func<Task> next)
    {
        foreach (var kvp in context.Request.RouteValues.ToArray())
        {
            if (kvp.Value is string raw && !string.IsNullOrEmpty(raw))
            {
                var decoded = raw
                    .Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)
                    .Replace("%5C", "\\", StringComparison.OrdinalIgnoreCase);
                if (!ReferenceEquals(decoded, raw))
                {
                    context.Request.RouteValues[kvp.Key] = decoded;
                }
            }
        }

        await next();
    }
}