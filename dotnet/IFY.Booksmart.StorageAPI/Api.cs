using System.Text.RegularExpressions;

namespace IFY.Booksmart.StorageAPI;

public partial class Api(KeyValueStore store)
{
    public void Register(WebApplication app)
    {
        app.MapPost("/booksmart/register", CreateAccount); // Body = email address
        app.MapPost("/booksmart/register/{account}", ConfirmAccount); // Body = registration token
        app.MapGet("/booksmart/{key}/{salt}/{hash}", GetByHashedAccount);
        app.MapPut("/booksmart/{key}/{salt}/{hash}", SetByHashedAccount); // Body = value
    }

    // BadRequest = Invalid email address
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

    // BadRequest = Invalid or missing token
    // Forbidden = Unknown account or invalid registration token
    public async Task<IResult> ConfirmAccount(string account, HttpRequest request)
    {
        // Get token from body
        var token = await getWholeRequestBody(request);
        if (string.IsNullOrEmpty(token))
        {
            return Results.BadRequest();
        }

        // Confirm account in storage
        if (!await store.ConfirmAccount(account, token))
        {
            return Results.StatusCode(403);
        }
        return Results.Ok();
    }

    // BadRequest = Invalid salt
    // NotFound = Invalid storage key
    // Forbidden = Unknown account hash
    public async Task<IResult> GetByHashedAccount(string key, string salt, string hash)
    {
        if (!isValidSalt(salt))
        {
            return Results.BadRequest();
        }

        // key must be valid enum value
        if (!Enum.TryParse<KeyValueStore.StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        var (account, tier) = await store.FindAccountByHash(salt, hash);
        if (account == null || tier == KeyValueStore.AccountTier.None)
        {
            return Results.StatusCode(403);
        }

        // Get value
        var value = await store.GetAccountValue(account, skey.ToString());
        return Results.Text(value ?? string.Empty);
    }

    // BadRequest = Invalid salt
    // NotFound = Invalid storage key
    // Forbidden = Unknown account hash
    public async Task<IResult> SetByHashedAccount(string key, string salt, string hash, HttpRequest request)
    {
        if (!isValidSalt(salt))
        {
            return Results.BadRequest();
        }

        // key must be valid enum value
        if (!Enum.TryParse<KeyValueStore.StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        var (account, tier) = await store.FindAccountByHash(salt, hash);
        if (account == null || tier == KeyValueStore.AccountTier.None)
        {
            return Results.StatusCode(403);
        }

        // Set value
        var value = await getWholeRequestBody(request);
        await store.SetAccountValue(account, skey.ToString(), value);
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
        var value = await r.ReadToEndAsync();
        return value.Trim();
    }
}