using IFY.Booksmart.StorageAPI.Sqlite;

namespace IFY.Booksmart.StorageAPI.Data;

public class AccountStore(ISqliteConnection sqlite) : ISchemaBuilder
{
    public async Task<string?> CreateAccount(string emailAddress)
    {
        emailAddress = emailAddress.Trim().ToLowerInvariant();
        var emailMetric = $"{emailAddress[0]}{emailAddress.Length}";
        var emailHash = Utility.Sha256Base64(emailMetric, emailAddress);

        // Check if account already exists
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
SELECT [IsDeleted]
FROM [Account]
WHERE [EmailHash] = @emailHash
";
            cmd.Parameters.AddWithValue("@emailHash", emailHash);

            var exists = await cmd.ExecuteScalarAsync();
            if (exists != null)
            {
                return null;
            }
        }

        // Create account
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
INSERT INTO [Account] ([EmailHash], [PasswordHash], [Tier], [LastAccessed])
VALUES (@emailHash, '', 'None', STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
";
            cmd.Parameters.AddWithValue("@emailHash", emailHash);
            await cmd.ExecuteNonQueryAsync();
        }

        // Record registration token
        var registrationToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        await SetAccountPassword(emailHash, registrationToken);
        return registrationToken;
    }

    public async Task<bool> ConfirmAccount(string emailHash, string token, string password)
    {
        // Find account
        var (_, foundEmailHash, tier, _) = await GetAccountInfo(emailHash);
        if (foundEmailHash == null || tier != AccountTier.None)
        {
            return false;
        }

        // Must match
        if (!await TestAccountPassword(emailHash, token))
        {
            return false;
        }

        // Activate account as Free tier
        await UpdateAccountTier(emailHash, AccountTier.Free);
        await SetAccountPassword(emailHash, password);
        return true;
    }

    public async Task<bool> TestAccountPassword(string emailHash, string password)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT 1
FROM [Account]
WHERE [EmailHash] = @emailHash
AND [PasswordHash] = @password
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@emailHash", emailHash);
        cmd.Parameters.AddWithValue("@password", Utility.Sha256Base64(emailHash, password));

        return await cmd.ExecuteScalarAsync() != null;
    }

    public async Task<bool> UpdateAccountTier(string emailHash, AccountTier tier)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [Tier] = @tier, [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [EmailHash] = @emailHash
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@emailHash", emailHash);
        cmd.Parameters.AddWithValue("@tier", tier.ToString());

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> SetAccountPassword(string emailHash, string password)
    {
        if (password.Length > 0)
        {
            password = Utility.Sha256Base64(emailHash, password);
        }

        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [PasswordHash] = @password, [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [EmailHash] = @emailHash
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@emailHash", emailHash);
        cmd.Parameters.AddWithValue("@password", password);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // hash = SHA256_BASE64(
    //     salt, // UNIX timestamp within 5 minutes of now
    //     SHA256_BASE64(email_metric, LCASE(email)) // EmailHash
    // )
    public async Task<(long AccountId, string? EmailHash, AccountTier Tier)> FindAccountByHash(string salt, string hash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [AccountId], [EmailHash], [Tier]
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

        var accountId = reader.GetInt64(0);
        var emailHash = reader.GetString(1);
        if (!Enum.TryParse<AccountTier>(reader.GetString(2) ?? nameof(AccountTier.None), true, out var tier))
        {
            tier = AccountTier.Free;
        }
        return (accountId, emailHash, tier);
    }

    public async Task<bool> MarkAccountAsAccessed(string emailHash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [EmailHash] = @emailHash
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@emailHash", emailHash);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<(long AccountId, string? EmailHash, AccountTier Tier, DateTime LastAccessed)> GetAccountInfo(string forEmailHash)
        => (await GetAllAccountsInfo(forEmailHash)).SingleOrDefault();
    public async Task<(long AccountId, string? EmailHash, AccountTier Tier, DateTime LastAccessed)[]> GetAllAccountsInfo(string? forEmailHash = null)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [AccountId], [EmailHash], [Tier], [LastAccessed]
FROM [Account]
WHERE (@emailHash IS NULL OR [EmailHash] = @emailHash)
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@emailHash", forEmailHash);

        // Get Tier and LastAccessed date of all accounts
        var results = new List<(long, string, AccountTier, DateTime)>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var accountId = reader.GetInt64(0);
            var emailHash = reader.GetString(1);
            if (!Enum.TryParse<AccountTier>(reader.GetString(2) ?? nameof(AccountTier.None), true, out var tier))
            {
                tier = AccountTier.Free;
            }
            var lastAccessed = reader.IsDBNull(3) ? DateTime.MinValue : DateTime.Parse(reader.GetString(3));
            results.Add((accountId, emailHash, tier, lastAccessed));
        }
        return [.. results];
    }

    public async Task DisableAccount(string emailHash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [KeyValue]
SET [IsDeleted] = 1, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [Account] = @emailHash
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@emailHash", emailHash);

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
    [AccountId] INTEGER PRIMARY KEY AUTOINCREMENT, -- Never goes external
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
