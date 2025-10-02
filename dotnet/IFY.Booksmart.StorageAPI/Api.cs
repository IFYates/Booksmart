using Microsoft.AspNetCore.Mvc;

namespace IFY.Booksmart.StorageAPI;

public static class Api
{
    public static void Register(WebApplication app)
    {
        app.MapPost("/booksmart/register", CreateAccount);
        app.MapGet("/booksmart/{key}/{salt}/{hash}", GetByHashedEmail);
    }

    public static async Task<ActionResult> CreateAccount([FromBody] string emailAddress, KeyValueStore storage)
    {
        // Create account in storage
        await storage.CreateAccount(emailAddress);
        // TODO: need welcome email to confirm?
        return new OkResult();
    }

    // hash = SHA256_BASE64(salt, SHA256_BASE64(email_metric, lower(email)))
    public static async Task<ActionResult<string>> GetByHashedEmail(string key, string salt, string hash, KeyValueStore storage)
    {
        // salt must be UNIX timestamp within 5 minutes of now
        if (!long.TryParse(salt, out var ts))
        {
            return new BadRequestResult();
        }
        var diff = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(ts);
        if (diff.TotalMinutes is < -5 or > 5)
        {
            return new BadRequestResult();
        }

        // key must be valid enum value
        if (!Enum.TryParse<KeyValueStore.StorageKey>(key, ignoreCase: true, out var skey))
        {
            return new ForbidResult();
        }

        // Get value
        var result = await storage.GetKeyByAccountHash(salt, hash, skey);
        if (result == null)
        {
            return new NotFoundResult();
        }
        return new OkObjectResult(result.Value);
    }

    public static async Task<ActionResult> SetByHashedAccount(string key, string salt, string hash, [FromBody] string value, KeyValueStore storage)
    {
        // salt must be UNIX timestamp within 5 minutes of now
        if (!long.TryParse(salt, out var ts))
        {
            return new BadRequestResult();
        }
        var diff = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(ts);
        if (diff.TotalMinutes is < -5 or > 5)
        {
            return new BadRequestResult();
        }

        // key must be valid enum value
        if (!Enum.TryParse<KeyValueStore.StorageKey>(key, ignoreCase: true, out var skey))
        {
            return new ForbidResult();
        }

        // Set value
        await storage.SetKeyByAccountHash(salt, hash, skey, value);
        return new OkResult();
    }
}