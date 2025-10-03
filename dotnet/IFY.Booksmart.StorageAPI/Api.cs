using IFY.Booksmart.StorageAPI.Data;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;
using System.Text.RegularExpressions;

namespace IFY.Booksmart.StorageAPI;

public partial class Api(AccountStore accStore, KeyValueStore kvStore)
{
    public void RegisterRoutes(WebApplication app)
    {
        app.MapPost("/booksmart/register", CreateAccount);
        app.MapPost("/booksmart/register/{account}/{token}", ConfirmAccount);
        // TODO: change password
        app.MapGet("/booksmart/{key}", GetByHashedAccount);
        app.MapPut("/booksmart/{key}", SetByHashedAccount);
    }

    // BadRequest = Invalid email address
    [Consumes("text/plain")]
    public async Task<IResult> CreateAccount([FromBody] string emailAddress)
    {
        // Must be valid email address
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
    [Consumes("text/plain")]
    public async Task<IResult> ConfirmAccount(string account, string token, [FromBody] string password)
    {
        // Validate token
        if (string.IsNullOrEmpty(token))
        {
            return Results.BadRequest();
        }

        // Confirm account in storage
        if (!await accStore.ConfirmAccount(account, token, password))
        {
            return Results.StatusCode(403);
        }
        return Results.Ok();
    }

    // BadRequest = Invalid salt
    // NotFound = Invalid storage key
    // Forbidden = Unknown account hash
    public async Task<IResult> GetByHashedAccount(string key, HttpRequest request)
    {
        // key must be valid enum value
        if (!Enum.TryParse<StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        var (accountId, account) = await resolveAccount(request);
        if (account == null)
        {
            return Results.StatusCode(403);
        }

        // Get value
        var value = await kvStore.GetAccountValue(accountId, skey);
        return Results.Text(value ?? string.Empty);
    }

    // BadRequest = Invalid salt
    // NotFound = Invalid storage key
    // Forbidden = Unknown account hash
    [Consumes("text/plain")]
    public async Task<IResult> SetByHashedAccount(string key, [FromBody] string value, HttpRequest request)
    {
        // key must be valid enum value
        if (!Enum.TryParse<StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        var (accountId, account) = await resolveAccount(request);
        if (account == null)
        {
            return Results.StatusCode(403);
        }

        // Set value
        await kvStore.SetAccountValue(accountId, skey, value);
        return Results.Ok();
    }

    [GeneratedRegex(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$")]
    private static partial Regex ValidEmailAddress();

    // Authorisation header must be in format:
    //   Authorization: SHA256 {salt} {hash} {password}
    //      where {salt} is a UNIX timestamp within 5 minutes of now
    //      and {hash} is SHA256_BASE64(salt, SHA256_BASE64(email_metric, LCASE(email)))
    //      and {password} is the plain-text password to verify
    private async Task<(long AccountId, string? Account)> resolveAccount(HttpRequest request, bool forNoneTier = false)
    {
        var authHeader = request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("SHA256 "))
        {
            return default;
        }

        var parts = authHeader[7..].Split(' ');
        if (parts.Length != 3)
        {
            return default;
        }

        var salt = parts[0];
        if (!isValidSalt(salt))
        {
            return default;
        }

        var (accountId, account, tier) = await accStore.FindAccountByHash(salt, parts[1]);
        if (account == null || forNoneTier != (tier == AccountTier.None))
        {
            return default;
        }

        return await accStore.TestAccountPassword(account, parts[2])
            ? (accountId, account)
            : default;
    }

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
}