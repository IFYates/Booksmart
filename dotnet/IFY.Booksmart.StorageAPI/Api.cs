using IFY.Booksmart.StorageAPI.Data;
using System.Text.RegularExpressions;

namespace IFY.Booksmart.StorageAPI;

public partial class Api(AccountStore accStore, KeyValueStore kvStore)
{
    public void RegisterRoutes(WebApplication app)
    {
        app.MapPost("/booksmart/register", CreateAccount); // Body = email address
        app.MapPost("/booksmart/register/{account}/{token}", ConfirmAccount); // Body = new password
        // TODO: change password
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
        var x = await accStore.CreateAccount(emailAddress);
        // TODO: need welcome email to confirm?
        return Results.Ok(x);
    }

    // BadRequest = Invalid or missing token
    // Forbidden = Unknown account or invalid registration token
    public async Task<IResult> ConfirmAccount(string account, string token, HttpRequest request)
    {
        // Validate token
        if (string.IsNullOrEmpty(token))
        {
            return Results.BadRequest();
        }

        // Confirm account in storage
        var password = await getWholeRequestBody(request);
        if (!await accStore.ConfirmAccount(account, token, password))
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
        if (!Enum.TryParse<StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        var (account, tier) = await accStore.FindAccountByHash(salt, hash);
        if (account == null || tier == AccountTier.None)
        {
            return Results.StatusCode(403);
        }

        // Get value
        var value = await kvStore.GetAccountValue(account, skey.ToString());
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
        if (!Enum.TryParse<StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        var (account, tier) = await accStore.FindAccountByHash(salt, hash);
        if (account == null || tier == AccountTier.None)
        {
            return Results.StatusCode(403);
        }

        // Set value
        var value = await getWholeRequestBody(request);
        await kvStore.SetAccountValue(account, skey.ToString(), value);
        return Results.Ok();
    }

    [GeneratedRegex(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$")]
    private static partial Regex ValidEmailAddress();

    private static bool isValidSalt(string salt)
    {
#if DEBUG
        return true;
#else
        // Salt must be UNIX timestamp within 5 minutes of now
        if (!long.TryParse(salt, out var ts))
        {
            return false;
        }
        var diff = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(ts);
        return diff.TotalMinutes is < -5 or > 5;
#endif
    }

    private static async Task<string> getWholeRequestBody(HttpRequest request)
    {
        using var r = new StreamReader(request.Body);
        var value = await r.ReadToEndAsync();
        return value.Trim();
    }
}