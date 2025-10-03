using IFY.Booksmart.StorageAPI;
using IFY.Booksmart.StorageAPI.Data;
using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Extensions.Options;
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
app.UseRouteValueSlashDecoder();

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

file static class MiddlewareExtensions
{
    /// <summary>
    /// Replaces any remaining "%2F" or "%5C" in ALL route values
    /// with the actual '/' or '\' character.
    /// </summary>
    /// <remarks>
    /// This is because ASP.NET Core routing leaves only these characters encoded.
    /// </remarks>
    public static IApplicationBuilder UseRouteValueSlashDecoder(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
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
        });
    }
}