using IFY.Booksmart.StorageAPI;
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
builder.Services.AddHostedService<DisableInactiveAccountsTask>();

// Add the rate‑limiting service
builder.Services.AddRateLimiter(options =>
{
    // Global fallback policy
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        // Partition key = client IP
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // Fixed‑window: 100 req / 60 sec
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0 // reject immediately when limit exceeded
            });
    });

    // 429 response on breach
    options.OnRejected = (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = "60"; // 1-minute retry
        return ValueTask.CompletedTask;
    };
});

// Build app
var app = builder.Build();

app.UseRateLimiter();

// Setup platform
SqliteSchema.EnsureSchema(app.Services);
Api.Register(app);

app.Run();