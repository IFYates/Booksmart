using IFY.Booksmart.StorageAPI.Middlewares;
using System.Threading.RateLimiting;

namespace IFY.Booksmart.StorageAPI.Middlewares;

public static class RateLimiterMiddleware
{
    // TODO: Configurable
    const int RATELIMIT_WINDOWS_SECS = 60;
    const int RATELIMIT_CAP = 100;

    private static PartitionedRateLimiter<HttpContext>? _rateLimiter = null;

    public static WebApplicationBuilder AddRateLimiter(this WebApplicationBuilder builder)
    {
        _rateLimiter ??= PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        {
            // Partition key = client IP
            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Fixed‑window: X req per Y secs
            var fixedWindowOptions = new FixedWindowRateLimiterOptions
            {
                PermitLimit = RATELIMIT_CAP,
                Window = TimeSpan.FromSeconds(RATELIMIT_WINDOWS_SECS),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0 // reject immediately when limit exceeded
            };
            var fixedWindow = RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: ip,
                factory: _ => fixedWindowOptions);
            return fixedWindow;

            // TODO
            //// Concurrency limiter: max 1 concurrent request per IP
            //var concurrency = RateLimitPartition.GetConcurrencyLimiter(
            //    partitionKey: ip,
            //    factory: _ => new ConcurrencyLimiterOptions
            //    {
            //        PermitLimit = 1,
            //        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            //        QueueLimit = 0 // reject immediately when limit exceeded
            //    });

            //// Combine them
            //return RateLimiter.CreateChained([fixedWindow, concurrency]);
        });
        builder.Services.AddSingleton(_rateLimiter);

        builder.Services.AddRateLimiter(options =>
        {
            // Global limiter policy
            options.GlobalLimiter = _rateLimiter;

            // 429 response on breach
            options.OnRejected = (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.Headers.RetryAfter = RATELIMIT_WINDOWS_SECS.ToString();
                return ValueTask.CompletedTask;
            };
        });
        return builder;
    }
}