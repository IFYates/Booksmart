using IFY.Booksmart.StorageAPI.Data;
using System.Threading.RateLimiting;

namespace IFY.Booksmart.StorageAPI.Middlewares;

/// <summary>
/// Resolves the account from the Authorization header, if present.
/// </summary>
/// <remarks>
/// Authorisation header must be in format: SHA3 {salt} {hash} {password}
///   where {salt} is a UNIX timestamp within 5 minutes of now
///   and {hash} is SHA3_BASE64(salt, SHA3_BASE64(email_metric, LCASE(email)))
///   and {password} is the plain-text password to verify - Has to be plain-text to allow hashing with the email hash (emails are not private)
/// </remarks>
public static class AccountResolverMiddleware
{
    public static IApplicationBuilder UseAccountResolver(this IApplicationBuilder app)
        => app.Use(logic);
    private static async Task logic(HttpContext context, Func<Task> next)
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
            var (accountId, account) = await resolveAccount(context, authHeader);
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
    }

    private static async Task<(long AccountId, string? Account)> resolveAccount(HttpContext context, string authHeader)
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
