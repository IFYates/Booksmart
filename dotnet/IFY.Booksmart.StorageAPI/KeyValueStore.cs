using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Extensions.Options;
using System.Security.Principal;

namespace IFY.Booksmart.StorageAPI;

public class KeyValueStore(ISqliteConnection sqlite)
{
    public enum StorageKey
    {
        //LastAccessed, // datetime in ISO 8601 format
        Dashboard, // Base64-encoded binary data (decrypted at client)
    }

    private async Task<string?> findAccountByHash(string salt, string hash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [Account]
FROM [KeyValue]
WHERE SHA256_BASE64(@salt, [Account]) = @hash
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@salt", salt);
        cmd.Parameters.AddWithValue("@hash", hash);

        return await cmd.ExecuteScalarAsync() as string;
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

        await markAccountAsAccessed(account);
        return true;
    }

    public async Task<string[]> DisableInactiveAccounts(TimeSpan inactivePeriod)
    {
        // Find accounts inactive since cutoff
        var cutoff = DateTime.UtcNow - inactivePeriod;
        var accounts = new List<string>();
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
SELECT [Account]
FROM [KeyValue]
WHERE [Key] = 'LastAccessed'
AND [IsDeleted] = 0
AND [Value] < @cutoff
";
            cmd.Parameters.AddWithValue("@cutoff", cutoff.ToString("o"));
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                accounts.Add(reader.GetString(0));
            }
        }

        // Mark all inactive account keys as deleted
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
UPDATE [KeyValue]
SET [IsDeleted] = 1, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [Account] = @account
AND [IsDeleted] = 0
";

            var accountParam = cmd.Parameters.Add("@account", Microsoft.Data.Sqlite.SqliteType.Text);
            foreach (var account in accounts)
            {
                accountParam.Value = account;
                await cmd.ExecuteNonQueryAsync();
            }
        }

        return accounts.ToArray();
    }

    public async Task<(string Account, string? Value)?> GetKeyByAccountHash(string salt, string hash, StorageKey key)
    {
        // Find value
        (string Account, string? Value) result;
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
SELECT [Account], [Value]
FROM [KeyValue]
WHERE SHA256_BASE64(@salt, [Account]) = @hash
AND [Key] = @key
AND [IsDeleted] = 0
";
            cmd.Parameters.AddWithValue("@salt", salt);
            cmd.Parameters.AddWithValue("@hash", hash);
            cmd.Parameters.AddWithValue("@key", key.ToString());

            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return default;
            }

            var account = reader.GetString(0);
            var value = reader.IsDBNull(1) ? null : reader.GetString(1);
            result = (account, value);
        }

        await markAccountAsAccessed(result.Account);
        return result;
    }

    public async Task SetKeyByAccountHash(string salt, string hash, StorageKey key, string value)
    {
        // Find account
        string? account = await findAccountByHash(salt, hash);
        if (account == null)
        {
            return;
        }

        await setAccountValue(account, key.ToString(), value);
    }

    private async Task<bool> setAccountValue(string account, string key, string value)
    {
        // Upsert value
        const string sql = @"
INSERT INTO [KeyValue] ([Account], [Key], [Value], [CreatedAt], [UpdatedAt], [IsDeleted])
VALUES (@account, @key, @value, STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), 0)
ON CONFLICT([Account], [Key]) DO UPDATE
SET [Value] = @value, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [IsDeleted] = 0
";

        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@key", key);
        cmd.Parameters.AddWithValue("@value", value);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }
}
