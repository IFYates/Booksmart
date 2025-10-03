using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using System.Security.Principal;

namespace IFY.Booksmart.StorageAPI;

public class KeyValueStore(ISqliteConnection sqlite)
{
    public enum AccountTier
    {
        None, // Not yet confirmed
        Free, // Default
        Paid // Paid account (Reserved for future use)
    }
    public enum StorageKey
    {
        //LastAccessed, // datetime in ISO 8601 format
        //Tier, // See AccountTier
        //RegistrationToken, // Token to confirm account registration
        Dashboard, // Base64-encoded binary data (decrypted at client)
    }

    public async Task<string?> CreateAccount(string emailAddress)
    {
        var emailMetric = $"{emailAddress[0]}{emailAddress.Length}";
        var account = Utility.Sha256Base64(emailMetric, emailAddress.Trim().ToLowerInvariant());

        // Check if account already exists
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
SELECT [IsDeleted]
FROM [KeyValue]
WHERE [Account] = @account
";
            cmd.Parameters.AddWithValue("@account", account);

            var exists = await cmd.ExecuteScalarAsync();
            if (exists != null)
            {
                return null;
            }
        }

        await SetAccountValue(account, "Tier", nameof(AccountTier.None));

        // Record registration token
        var registrationToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        await SetAccountValue(account, "RegistrationToken", registrationToken);
        await MarkAccountAsAccessed(account);
        return registrationToken;
    }

    public async Task<bool> ConfirmAccount(string account, string token)
    {
        // Find account
        var (foundAccount, tier, _) = (await GetAllAccountsInfo(account)).FirstOrDefault();
        if (foundAccount == null || tier != AccountTier.None)
        {
            return false;
        }

        // Find registration token
        var storedToken = await GetAccountValue(account, "RegistrationToken");

        // Must match
        if (storedToken != token)
        {
            return false;
        }

        // Activate account as Free tier
        await SetAccountValue(account, "Tier", nameof(AccountTier.Free));
        await SetAccountValue(account, "RegistrationToken", string.Empty);
        await MarkAccountAsAccessed(account);
        return true;
    }

    // hash = SHA256_BASE64(salt, SHA256_BASE64(email_metric, lower(email)))
    public async Task<(string? Account, AccountTier Tier)> FindAccountByHash(string salt, string hash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [Account], [Value] AS [Tier]
FROM [KeyValue]
WHERE SHA256_BASE64(@salt, [Account]) = @hash
AND [Key] = 'Tier'
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@salt", salt);
        cmd.Parameters.AddWithValue("@hash", hash);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return default;
        }

        var account = reader.GetString(0);
        if (!Enum.TryParse<AccountTier>(reader.GetString(1) ?? nameof(AccountTier.None), true, out var tier))
        {
            tier = AccountTier.Free;
        }
        return (account, tier);
    }

    public Task<bool> MarkAccountAsAccessed(string account)
    {
        return SetAccountValue(account, "LastAccessed", DateTime.UtcNow.ToString("o"));
    }

    public async Task<(string Account, AccountTier Tier, DateTime LastAccessed)[]> GetAllAccountsInfo(string? forAccount = null)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT LA.[Account], T.[Value] AS [Tier], LA.[Value] AS [LastAccessed]
FROM [KeyValue] LA
LEFT JOIN [KeyValue] T ON T.[Account] = LA.[Account] AND T.[Key] = 'Tier' AND T.[IsDeleted] = 0
WHERE (@account IS NULL OR LA.[Account] = @account)
AND LA.[Key] = 'LastAccessed'
AND LA.[IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", forAccount);

        // Get Tier and LastAccessed date of all accounts
        var results = new List<(string Account, AccountTier Tier, DateTime LastAccessed)>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var account = reader.GetString(0);
            if (!Enum.TryParse<AccountTier>(reader.GetString(1) ?? nameof(AccountTier.None), true, out var tier))
            {
                tier = AccountTier.Free;
            }
            var lastAccessed = reader.IsDBNull(2) ? DateTime.MinValue : DateTime.Parse(reader.GetString(2));
            results.Add((account, tier, lastAccessed));
        }
        return [.. results];
    }

    public async Task DisableAccount(string account)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [KeyValue]
SET [IsDeleted] = 1, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [Account] = @account
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<string?> GetAccountValue(string account, string key)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [Value]
FROM [KeyValue]
WHERE [Account] = @account
AND [Key] = @key
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@key", key.ToString());

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return reader.IsDBNull(0) ? null : reader.GetString(0);
    }

    public async Task<bool> SetAccountValue(string account, string key, string value)
    {
        // Upsert value
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
INSERT INTO [KeyValue] ([Account], [Key], [Value])
VALUES (@account, @key, @value)
ON CONFLICT([Account], [Key]) DO UPDATE
SET [Value] = @value, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@key", key);
        cmd.Parameters.AddWithValue("@value", value);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> RemoveAccountValue(string account, string key)
    {
        // Upsert value
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [KeyValue]
SET [IsDeleted] = 1, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [Account] = @account
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@key", key);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }
}
