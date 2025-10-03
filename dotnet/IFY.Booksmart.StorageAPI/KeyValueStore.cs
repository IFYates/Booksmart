using IFY.Booksmart.StorageAPI.Sqlite;
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
        Dashboard, // Base64-encoded binary data (decrypted at client)
    }

    private async Task<(string? Account, AccountTier Tier)> findAccountByHash(string salt, string hash)
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

    private async Task markAccountAsAccessed(string account)
    {
        await setAccountValue(account, "LastAccessed", DateTime.UtcNow.ToString("o"));
    }

    public async Task<bool> CreateAccount(string emailAddress)
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
                return false;
            }
        }

        await setAccountValue(account, "Tier", nameof(AccountTier.Free));
        return true;
    }

    public async Task<(string Account, AccountTier Tier, DateTime LastAccessed)[]> GetAllAccountsInfo()
    {
        // Get Tier and LastAccessed date of all accounts
        var results = new List<(string Account, AccountTier Tier, DateTime LastAccessed)>();
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
SELECT LA.[Account], LA.[Value] AS [LastAccessed], T.[Value] AS [Tier]
FROM [KeyValue] LA
LEFT JOIN [KeyValue] T ON T.[Account] = LA.[Account] AND T.[Key] = 'Tier' AND T.[IsDeleted] = 0
WHERE LA.[Key] = 'LastAccessed'
AND LA.[IsDeleted] = 0
";

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

    public async Task<(string Account, string? Value)> GetKeyByAccountHash(string salt, string hash, StorageKey key)
    {
        // Find account
        var (account, tier) = await findAccountByHash(salt, hash);
        if (account == null || tier == AccountTier.None)
        {
            return default;
        }

        // Find value
        (string Account, string? Value) result;
        using (var cmd = sqlite.CreateCommand())
        {
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
                return default;
            }

            var value = reader.IsDBNull(1) ? null : reader.GetString(1);
            result = (account, value);
        }

        await markAccountAsAccessed(result.Account);
        return result;
    }

    public async Task SetKeyByAccountHash(string salt, string hash, StorageKey key, string value)
    {
        // Find account
        var (account, tier) = await findAccountByHash(salt, hash);
        if (account == null || tier == AccountTier.None)
        {
            return;
        }

        await setAccountValue(account, key.ToString(), value);
        await markAccountAsAccessed(account);
    }

    private async Task<bool> setAccountValue(string account, string key, string value)
    {
        // Upsert value
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
INSERT INTO [KeyValue] ([Account], [Key], [Value], [CreatedAt], [UpdatedAt], [IsDeleted])
VALUES (@account, @key, @value, STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), 0)
ON CONFLICT([Account], [Key]) DO UPDATE
SET [Value] = @value, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@key", key);
        cmd.Parameters.AddWithValue("@value", value);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }
}
