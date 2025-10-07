using IFY.Booksmart.StorageAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Net.Mime;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;

namespace IFY.Booksmart.StorageAPI;

public partial class Api(AccountStore accStore, KeyValueStore kvStore, IOptions<AppOptions> config)
{
    private readonly AppOptions _config = config.Value;
    private readonly SmtpOptions _smtp = config.Value.Smtp;

    public void RegisterRoutes(WebApplication app)
    {
        var basePath = _config.BaseApiPath?.TrimEnd('/') ?? string.Empty;

        app.MapPost(basePath + "/register", CreateAccount);
        app.MapGet(basePath + "/register/{account}/{token}", ConfirmAccount);
        app.MapPost(basePath + "/password", SetPassword);

        // TODO: Future app.MapDelete
        app.MapMethods(basePath + "/key/{key}", ["HEAD"], GetKeyVersion);
        app.MapGet(basePath + "/key/{key}", GetKeyValue);
        app.MapPut(basePath + "/key/{key}", SetKeyValue);
        app.MapPut(basePath + "/key/{key}/{version}", SetKeyValue);

        if (_config.EnableDebugEndpoints)
        {
            var dt = DateTime.UtcNow;
            app.MapGet(basePath + "/debug", () => Results.Text($"Started: {dt}"));

            app.MapGet("{**path}", (HttpRequest req, HttpResponse resp, string path) =>
            {
                // Output request info
                resp.StatusCode = 404;
                return Results.Text(@$"{req.Method} {path}
{string.Join("\r\n", req.Headers.SelectMany(h => h.Value.Select(v => $"{h.Key}: {v}")))}
");
            });
        }
    }

    // BadRequest = Invalid email address
    [Consumes(MediaTypeNames.Text.Plain)]
    internal async Task<IResult> CreateAccount([FromBody] string emailAddressAndPassword, CancellationToken cancellationToken)
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
        var (emailHash, token) = await accStore.CreateAccount(emailAddress, password); // TODO: in transaction

        // Send welcome email, if account created
        if (emailHash != null && token != null)
        {
            using var smtp = new MailKit.Net.Smtp.SmtpClient();
            await smtp.ConnectAsync(_smtp.Host, (int)_smtp.Port, MailKit.Security.SecureSocketOptions.StartTls, cancellationToken);
            await smtp.AuthenticateAsync(_smtp.Username, _smtp.Password, cancellationToken);

            var confirmUrl = $"{_config.BaseUri}/register/{Uri.EscapeDataString(emailHash)}/{Uri.EscapeDataString(token)}";
            if (_smtp.ReturnUrl?.Length > 0)
            {
                confirmUrl += $"?returnUrl={UrlEncoder.Default.Encode(_smtp.ReturnUrl)}";
            }
            var body = new MimeKit.BodyBuilder
            {
                TextBody = @$"Thank you for registering with Booksmart.

Please confirm your account by clicking the link below:
    {confirmUrl}

If you did not register for Booksmart, please ignore this email.
The associated account will be deleted in 7 days, if not confirmed.",
                HtmlBody = @$"<p>Thank you for registering with Booksmart.</p>
<p>Please confirm your account by clicking the link below:<br/>
<a href=""{confirmUrl}"">Confirm Account</a></p>
<p>If you did not register for Booksmart, please ignore this email.<br/>
The associated account will be deleted in 7 days, if not confirmed.</p>"
            };

            var msg = new MimeKit.MimeMessage()
            {
                Subject = "Welcome to Booksmart",
                Body = body.ToMessageBody()
            };
            msg.From.Add(new MimeKit.MailboxAddress(null, "booksmart@iyates.co.uk"));
            msg.To.Add(new MimeKit.MailboxAddress(null, emailAddress));
            var r = await smtp.SendAsync(msg, cancellationToken);
        }

        return Results.Ok(); // Returns OK even if nothing done
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

        // Redirect via HTML meta refresh
        var html = (returnUrl is null) switch
        {
            true => $@"<!DOCTYPE html>
<html>
<head>
    <title>Account Confirmed</title>
</head>
<body>
    <p>Account confirmed.</p>
    <p>You can close this page.</p>
</body>
</html>",
            false => $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>Account Confirmed</title>
    <meta http-equiv=""refresh"" content=""0; url={HtmlEncoder.Default.Encode(returnUrl)}"">
</head>
<body>
    <p>Account confirmed. Redirecting...</p>
    <p>If you are not redirected automatically, <a href=""{HtmlEncoder.Default.Encode(returnUrl)}"">click here</a>.</p>
</body>
</html>"
        };

        return Results.Text(html, MediaTypeNames.Text.Html);
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

    private static void setKeyHeaders(HttpResponse response, int version, DateTime lastModified)
    {
        response.Headers.Append(KEY_META_HEADERS[0], version.ToString());
        response.Headers.Append(KEY_META_HEADERS[1], lastModified.ToString("o"));
        response.Headers.Append("Access-Control-Expose-Headers", KEY_META_HEADERS);
    }
    private static readonly string[] KEY_META_HEADERS = ["X-Version", "X-LastModified"];

    // NotFound = Invalid storage key
    // Forbidden = Not authenticated
    internal async Task<IResult> GetKeyVersion(string key, HttpContext context)
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
        var (version, lastModified) = await kvStore.GetAccountKeyVersion(account.AccountId, skey);
        setKeyHeaders(context.Response, version, lastModified);
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
        var (value, version, lastModified) = await kvStore.GetAccountValue(account.AccountId, skey);
        setKeyHeaders(context.Response, version, lastModified);
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