using IFY.Booksmart.StorageAPI.Data;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Net.Mime;
using System.Text.RegularExpressions;

namespace IFY.Booksmart.StorageAPI;

public partial class Api(AccountStore accStore, KeyValueStore kvStore)
{
    public void RegisterRoutes(WebApplication app)
    {
        app.MapPost("/booksmart/register", CreateAccount);
        app.MapPost("/booksmart/register/{account}/{token}", ConfirmAccount);
        app.MapPost("/booksmart/password", SetPassword);
        app.MapGet("/booksmart/{key}", GetKeyValue);
        app.MapPut("/booksmart/{key}", SetKeyValue);
        app.MapPut("/booksmart/{key}/{version}", SetKeyValue);
    }

    // BadRequest = Invalid email address
    [Consumes(MediaTypeNames.Text.Plain)]
    internal async Task<IResult> CreateAccount([FromBody] string emailAddress)
    {
        // Must be valid email address
        if (!ValidEmailAddress().IsMatch(emailAddress))
        {
            return Results.BadRequest();
        }

        // Create account in storage (hashes email address)
        var x = await accStore.CreateAccount(emailAddress);
        // TODO: need welcome email to confirm?
        return Results.Ok(x); // Returns OK even if nothing done
    }

    // BadRequest = Invalid or missing token
    // Forbidden = Unknown account or invalid registration token
    [Consumes(MediaTypeNames.Text.Plain)]
    internal async Task<IResult> ConfirmAccount(string account, string token, [FromBody] string password)
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

    // BadRequest = Invalid or missing passwordf
    // Forbidden = Not authenticated
    [Consumes(MediaTypeNames.Text.Plain)]
    internal async Task<IResult> SetPassword([FromBody] string password, HttpContext context)
    {
        // Password must be non-empty
        if (string.IsNullOrEmpty(password))
        {
            return Results.BadRequest();
        }

        // Find active account
        if (!isAuthenticated(context, out var account))
        {
            return Results.StatusCode(403);
        }

        // Update password in storage
        await accStore.SetAccountPassword(account.AccountId, password);
        return Results.Ok();
    }

    // NotFound = Invalid storage key
    // Forbidden = Not authenticated
    internal async Task<IResult> GetKeyValue(string key, HttpContext context)
    {
        // key must be valid enum value
        if (!Enum.TryParse<StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        if (!isAuthenticated(context, out var account))
        {
            return Results.StatusCode(403);
        }

        // Get value
        var (value, version) = await kvStore.GetAccountValue(account.AccountId, skey);
        context.Response.Headers.Append("X-Value-Version", version.ToString());
        return Results.Text(value ?? string.Empty);
    }

    // NotFound = Invalid storage key
    // Forbidden = Not authenticated
    // BadRequest = Value version mismatch
    [Consumes(MediaTypeNames.Text.Plain)]
    internal async Task<IResult> SetKeyValue(string key, int? version, [FromBody] string value, HttpContext context)
    {
        // key must be valid enum value
        if (!Enum.TryParse<StorageKey>(key, ignoreCase: true, out var skey))
        {
            return Results.NotFound();
        }

        // Find active account
        if (!isAuthenticated(context, out var account))
        {
            return Results.StatusCode(403);
        }

        // Set value
        return await kvStore.SetAccountValue(account.AccountId, skey, version ?? 0, value)
            ? Results.Ok()
            : Results.BadRequest();
    }

    [GeneratedRegex(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$")]
    private static partial Regex ValidEmailAddress();

    private static bool isAuthenticated(HttpContext context, out (long AccountId, string EmailHash) account)
    {
        if (!context.Items.TryGetValue("Account", out var value)
            || value is not (long, string))
        {
            account = default;
            return false;
        }

        account = ((long AccountId, string EmailHash))value;
        return true;
    }
}