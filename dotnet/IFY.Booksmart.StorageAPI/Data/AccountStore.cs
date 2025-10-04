using IFY.Booksmart.StorageAPI.Sqlite;

namespace IFY.Booksmart.StorageAPI.Data;

public class AccountStore(ISqliteConnection sqlite) : ISchemaBuilder
{
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
        var results = new List<(long, string?, AccountTier, DateTime)>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var accountId = reader.GetInt64(0);
            var emailHash = reader.GetStringOrNull(1);
            if (!Enum.TryParse<AccountTier>(reader.GetStringOrNull(2) ?? nameof(AccountTier.None), true, out var tier))
            {
                tier = AccountTier.Free;
            }
            var lastAccessed = reader.GetDateTimeOrNull(3) ?? DateTime.MinValue;
            results.Add((accountId, emailHash, tier, lastAccessed));
        }
        return [.. results];
    }

    public async Task<string?> CreateAccount(string emailAddress, string password)
    {
        emailAddress = emailAddress.ToLowerInvariant();
        var emailMetric = $"{emailAddress[0]}{emailAddress.Length}";
        var emailHash = Utility.Sha3Base64(emailMetric, emailAddress);

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
        long? newAccountId;
        using (var cmd = sqlite.CreateCommand())
        {
            cmd.CommandText = @"
INSERT INTO [Account] ([EmailHash], [PasswordHash], [Tier], [LastAccessed])
VALUES (@emailHash, SHA256_BASE64(@emailHash, @password), 'None', STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'));
SELECT last_insert_rowid();
";
            cmd.Parameters.AddWithValue("@emailHash", emailHash);
            cmd.Parameters.AddWithValue("@password", password);

            newAccountId = await cmd.ExecuteScalarAsync() as long?;
            if (!newAccountId.HasValue)
            {
                return null;
            }
        }

        // Return registration token
        return getRegistrationToken(newAccountId.Value, emailHash);
    }

    private string getRegistrationToken(long accountId, string emailHash)
    {
        // TODO
        return Utility.Sha256Base64(accountId.ToString(), emailHash);
    }

    public async Task<bool> ConfirmAccount(string emailHash, string token)
    {
        // Find account
        var (accountId, foundEmailHash, tier, _) = await GetAccountInfo(emailHash);
        if (foundEmailHash == null || tier != AccountTier.None)
        {
            return false;
        }

        // Check token is as expected
        var expectedToken = getRegistrationToken(accountId, foundEmailHash);
        if (token != expectedToken)
        {
            return false;
        }

        // Activate account as Free tier
        await SetAccountTier(accountId, AccountTier.Free);
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

    public async Task<bool> SetAccountTier(long accountId, AccountTier tier)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [Tier] = @tier, [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [AccountId] = @accountId
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@accountId", accountId);
        cmd.Parameters.AddWithValue("@tier", tier.ToString());

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> SetAccountPassword(long accountId, string password)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [PasswordHash] = SHA256_BASE64([EmailHash], @password), [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [AccountId] = @accountId
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@accountId", accountId);
        cmd.Parameters.AddWithValue("@password", password);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    // hash = SHA3_BASE64(
    //     salt, // UNIX timestamp within 5 minutes of now
    //     SHA3_BASE64(email_metric, LCASE(email)) // EmailHash
    // )
    public async Task<(long AccountId, string? EmailHash, AccountTier Tier)> FindAccountByHash(string salt, string hash)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [AccountId], [EmailHash], [Tier]
FROM [Account]
WHERE SHA3_BASE64(@salt, [EmailHash]) = @hash
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
        var emailHash = reader.GetStringOrNull(1);
        if (!Enum.TryParse<AccountTier>(reader.GetStringOrNull(2) ?? nameof(AccountTier.None), true, out var tier))
        {
            tier = AccountTier.Free;
        }
        return (accountId, emailHash, tier);
    }

    public async Task<bool> MarkAccountAsAccessed(long accountId)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [Account]
SET [LastAccessed] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [AccountId] = @accountId
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@accountId", accountId);

        return await cmd.ExecuteNonQueryAsync() > 0;
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
    [EmailHash] CHAR(88) NOT NULL, -- SHA3_BASE64(email_metric, LCASE(email))
    [PasswordHash] TEXT NOT NULL, -- SHA256_BASE64(EmailHash, password)
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
