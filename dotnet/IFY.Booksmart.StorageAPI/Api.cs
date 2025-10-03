using System.Text.RegularExpressions;

namespace IFY.Booksmart.StorageAPI;

public partial class Api(KeyValueStore store)
{
    public void Register(WebApplication app)
    {
        app.MapPost("/booksmart/register", CreateAccount);
        app.MapGet("/booksmart/{key}/{salt}/{hash}", GetByHashedEmail);
        app.MapPut("/booksmart/{key}/{salt}/{hash}", SetByHashedAccount);
    }

    public async Task<IResult> CreateAccount(HttpRequest request)
    {
        // Must be valid email address
        var emailAddress = await getWholeRequestBody(request);
        if (!ValidEmailAddress().IsMatch(emailAddress))
        {
            return Results.BadRequest();
        }

        // Create account in storage (hashes email address)
        await store.CreateAccount(emailAddress);
        // TODO: need welcome email to confirm?
        return Results.Ok();
    }

    // hash = SHA256_BASE64(salt, SHA256_BASE64(email_metric, lower(email)))
    public async Task<IResult> GetByHashedEmail(string key, string salt, string hash)
    {
        if (!isValidSalt(salt))
        {
            return Results.BadRequest();
        }

        // key must be valid enum value
        if (!Enum.TryParse<KeyValueStore.StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.Forbid();
        }

        // Get value
        var (account, value) = await store.GetKeyByAccountHash(salt, hash, skey);
        if (account == null)
        {
            return Results.NotFound();
        }
        return Results.Text(value ?? string.Empty);
    }

    public async Task<IResult> SetByHashedAccount(string key, string salt, string hash, HttpRequest request)
    {
        if (!isValidSalt(salt))
        {
            return Results.BadRequest();
        }

        // key must be valid enum value
        if (!Enum.TryParse<KeyValueStore.StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.Forbid();
        }

        // Set value
        var value = await getWholeRequestBody(request);
        await store.SetKeyByAccountHash(salt, hash, skey, value);
        return Results.Ok();
    }

    [GeneratedRegex(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$")]
    private static partial Regex ValidEmailAddress();

    private static bool isValidSalt(string salt)
    {
#if DEBUG
        return true;
#endif

        // Salt must be UNIX timestamp within 5 minutes of now
        if (!long.TryParse(salt, out var ts))
        {
            return false;
        }
        var diff = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(ts);
        return diff.TotalMinutes is < -5 or > 5;
    }

    private static async Task<string> getWholeRequestBody(HttpRequest request)
    {
        using var r = new StreamReader(request.Body);
        return await r.ReadToEndAsync();
    }
}