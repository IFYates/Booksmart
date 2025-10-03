using IFY.Booksmart.StorageAPI.Sqlite;

namespace IFY.Booksmart.StorageAPI.Data;

public class AccountStore(ISqliteConnection sqlite) : ISchemaBuilder
{
    public async Task<string?> CreateAccount(string emailAddress)
    {
        var emailMetric = $"{ emailAddress[0]}{emailAddress.Length}";
        var account = Utility.Sha256Base64(emailMetric, emailAddress.Trim().ToLowerInvariant());

        // Check if account already exists
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
SELECT [IsDeleted]
FROM [Account]
WHERE [EmailHash] = @account
";
            cmd.Parameters.AddWithValue("@account", account);

            var exists = await cmd.ExecuteScalarAsync();
            if (exists != null)
            {
                return null;
            }
        }

        await UpdateAccountTier(account, AccountTier.None);

        // Record registration token
        var registrationToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        await UpdateAccountPassword(account, registrationToken);
        return registrationToken;
    }

    public async Task<bool> ConfirmAccount(string account, string token, string password)
    {
        // Find account
        var (foundAccount, tier, _) = (await GetAllAccountsInfo(account)).FirstOrDefault();
        if (foundAccount == null || tier != AccountTier.None)
        {
            return false;
        }

        // Must match
        if (!await TestAccountPassword(account, token))
        {
            return false;
        }

        // Activate account as Free tier
        await UpdateAccountTier(account, AccountTier.Free);
        await UpdateAccountPassword(account, password);
        await MarkAccountAsAccessed(account);
        return true;
    }

    public async Task<bool> TestAccountPassword(string account, string password)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT 1
FROM [Account]
WHERE [EmailHash] = @account
AND [PasswordHash] = @password
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@password", Utility.Sha256Base64(account, password));

        return await cmd.ExecuteScalarAsync() != null;
    }

    public async Task<bool> UpdateAccountTier(string account, AccountTier tier)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [Tier] = @tier, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [EmailHash] = @account
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@tier", tier.ToString());

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> UpdateAccountPassword(string account, string password)
    {
        if (password.Length > 0)
        {
            password = Utility.Sha256Base64(account, password);
        }

        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [PasswordHash] = @password, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [EmailHash] = @account
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);
        cmd.Parameters.AddWithValue("@password", password);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // hash = SHA256_BASE64(salt, SHA256_BASE64(email_metric, LCASE(email)))
    public async Task<(string? Account, AccountTier Tier)> FindAccountByHash(string salt, string hash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [EmailHash], [Tier]
FROM [Account]
WHERE SHA256_BASE64(@salt, [EmailHash]) = @hash
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

    public async Task<bool> MarkAccountAsAccessed(string account)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [EmailHash] = @account
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@account", account);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<(string Account, AccountTier Tier, DateTime LastAccessed)[]> GetAllAccountsInfo(string? forAccount = null)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [EmailHash], [Tier], [LastAccessed]
FROM [Account]
WHERE (@account IS NULL OR [EmailHash] = @account)
AND [IsDeleted] = 0
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

    #region Schema

    public void UpdateSchema(int version)
    {
        switch (version)
        {
            case 1:
                applySchemaV1(sqlite);
                break;
        }
    }

    private static void applySchemaV1(ISqliteConnection sqlite)
    {
        const string createTableSql = @"
CREATE TABLE [Account] (
    [Id] INTEGER PRIMARY KEY AUTOINCREMENT, -- Never goes external
    [EmailHash] CHAR(44) NOT NULL, -- SHA256_BASE64(email_metric, LCASE(email))
    [PasswordHash] CHAR(44) NOT NULL, -- SHA256_BASE64(EmailHash, password)
    [Tier] VARCHAR(5) NOT NULL DEFAULT 'None', -- From AccountTier
    [LastAccessed] DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    [CreatedAt] DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    [UpdatedAt] DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    [IsDeleted] BOOLEAN NOT NULL DEFAULT 0
)
";
        sqlite.ExecuteNonQuery(createTableSql);
    }

    #endregion
}
