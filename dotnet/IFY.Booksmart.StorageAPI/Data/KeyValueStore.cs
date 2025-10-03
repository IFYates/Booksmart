using IFY.Booksmart.StorageAPI.Sqlite;

namespace IFY.Booksmart.StorageAPI.Data;

public class KeyValueStore(ISqliteConnection sqlite) : ISchemaBuilder
{
    public async Task<(string? Value, int Version)> GetAccountValue(long accountId, StorageKey key)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [Value], [Version]
FROM [KeyValue]
WHERE [AccountId] = @accountId
AND [Key] = @key
AND [IsDeleted] = 0
";
        cmd.Parameters.AddWithValue("@accountId", accountId);
        cmd.Parameters.AddWithValue("@key", key.ToString());

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return default;
        }

        return (reader.GetStringOrNull(0), reader.GetInt32(1));
    }

    public async Task<bool> SetAccountValue(long accountId, StorageKey key, int version, string value)
    {
        // Upsert value
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
INSERT INTO [KeyValue] ([AccountId], [Key], [Version], [Value])
VALUES (@accountId, @key, @version + 1, @value)
ON CONFLICT([AccountId], [Key]) DO UPDATE
SET [Value] = @value, [Version] = @version + 1, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'), [IsDeleted] = 0
WHERE [Version] = @version
";
        cmd.Parameters.AddWithValue("@accountId", accountId);
        cmd.Parameters.AddWithValue("@key", key.ToString());
        cmd.Parameters.AddWithValue("@version", version);
        cmd.Parameters.AddWithValue("@value", value);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> RemoveAccountValue(long accountId, StorageKey key)
    {
        // Upsert value
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
UPDATE [KeyValue]
SET [IsDeleted] = 1, [UpdatedAt] = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
WHERE [AccountId] = @accountId
";
        cmd.Parameters.AddWithValue("@accountId", accountId);
        cmd.Parameters.AddWithValue("@key", key.ToString());

        return await cmd.ExecuteNonQueryAsync() > 0;
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
CREATE TABLE [KeyValue] (
    [AccountId] INTEGER NOT NULL,
    [Key] VARCHAR(100) NOT NULL, -- From StorageKey
    [Value] TEXT, -- Literal or base64-encoded binary data (depending on key)
    [Version] INTEGER NOT NULL DEFAULT 1, -- Incremented on each change
    [CreatedAt] DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    [UpdatedAt] DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    [IsDeleted] BOOLEAN NOT NULL DEFAULT 0,

    PRIMARY KEY ([AccountId], [Key])
)
";
        sqlite.ExecuteNonQuery(createTableSql);
    }

    #endregion
}
