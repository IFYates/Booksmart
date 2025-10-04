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
        app.MapPost("/register", CreateAccount);
        app.MapGet("/register/{account}/{token}", ConfirmAccount);
        app.MapPost("/password", SetPassword);
        app.MapGet("/{key}", GetKeyValue);
        app.MapPut("/{key}", SetKeyValue);
        app.MapPut("/{key}/{version}", SetKeyValue);
    }

    // BadRequest = Invalid email address
    [Consumes(MediaTypeNames.Text.Plain)]
    internal async Task<IResult> CreateAccount([FromBody] string emailAddressAndPassword)
    {
        var parts = emailAddressAndPassword.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2)
        {
            return Results.BadRequest();
        }

        // Must be valid email address
        var emailAddress = parts[0].Trim();
        if (!ValidEmailAddress().IsMatch(emailAddress))
        {
            return Results.BadRequest();
        }

        // Validate password
        var password = parts[1].Trim();
        if (string.IsNullOrEmpty(password))
        {
            return Results.BadRequest();
        }

        // Create account in storage
        var token = await accStore.CreateAccount(emailAddress, password);
        // TODO: need welcome email to confirm?
        return Results.Text(token); // Returns OK even if nothing done
    }

    // BadRequest = Invalid or missing token
    // Forbidden = Unknown account or invalid registration token
    internal async Task<IResult> ConfirmAccount(string account, string token, [FromQuery] string? returnUrl)
    {
        // Validate token
        if (string.IsNullOrEmpty(token))
        {
            return Results.BadRequest();
        }

        // Confirm account in storage
        if (!await accStore.ConfirmAccount(account, token))
        {
            return Results.StatusCode(403);
        }

        return returnUrl != null
            ? Results.Redirect(returnUrl)
            : Results.Ok();
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
        context.Response.Headers.Append("X-Version", version.ToString());
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