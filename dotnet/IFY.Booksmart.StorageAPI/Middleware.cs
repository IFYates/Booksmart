using IFY.Booksmart.StorageAPI.Data;
using System.Net.Mime;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;

namespace IFY.Booksmart.StorageAPI;

public static class Middleware
{
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
            var fixedWindow = RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: ip,
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = RATELIMIT_CAP,
                    Window = TimeSpan.FromSeconds(RATELIMIT_WINDOWS_SECS),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0 // reject immediately when limit exceeded
                });
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
        ///builder.Services.AddSingleton(_rateLimiter);

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

    public static async Task AccountResolver(HttpContext context, Func<Task> next)
    {
        // Ignore if no Authorization header
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader))
        {
            await next();
        }
        else
        {
            // If present, must be valid
            var (accountId, account) = await resolveAccount();
            if (account == null)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
            }
            else
            {
                context.Items["Account"] = (accountId, account);
                await next();
            }
        }

        if (context.Response.StatusCode == StatusCodes.Status403Forbidden)
        {
            // Charge more for an authentication failure
            // TODO: Not working
            var limiter = context.RequestServices.GetRequiredService<PartitionedRateLimiter<HttpContext>>();
            limiter.AttemptAcquire(context, 10);
        }

        // Authorisation header must be in format: SHA3 {salt} {hash} {password}
        //   where {salt} is a UNIX timestamp within 5 minutes of now
        //   and {hash} is SHA3_BASE64(salt, SHA3_BASE64(email_metric, LCASE(email)))
        //   and {password} is the plain-text password to verify - Has to be plain-text to allow hashing with the email hash (emails are not private)
        async Task<(long AccountId, string? Account)> resolveAccount()
        {
            if (!authHeader.StartsWith("SHA3 "))
            {
                return default;
            }
            var parts = authHeader[5..].Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 3)
            {
                return default;
            }

            // Validate salt is a recent UNIX timestamp
            var salt = parts[0];
#if !DEBUG
            if (!long.TryParse(salt, out var ts))
            {
                return default;
            }
            var time = DateTimeOffset.FromUnixTimeSeconds(0).DateTime;
            var diff = Math.Abs((DateTime.UtcNow - time).TotalMinutes);
            if (diff > 2.5)
            {
                return default;
            }
#endif

            // Lookup account by salted hash
            var storage = context.RequestServices.GetRequiredService<AccountStore>();
            var (accountId, account, tier) = await storage.FindAccountByHash(salt, parts[1]);
            if (account == null || tier == AccountTier.None)
            {
                return default;
            }

            return await storage.TestAccountPassword(account, parts[2])
                ? (accountId, account)
                : default;
        }
    }

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
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value)));
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