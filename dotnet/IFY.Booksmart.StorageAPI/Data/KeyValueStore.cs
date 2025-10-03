using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using System.Runtime.CompilerServices;
using System.Security.Principal;

namespace IFY.Booksmart.StorageAPI.Data;

public class KeyValueStore(ISqliteConnection sqlite) : ISchemaBuilder
{
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

    #region Schema

    public void UpdateSchema(int version)
    {
        switch (version)
        {
            case 1:
                ApplySchemaV1(sqlite);
                break;
        }
    }

    private static void ApplySchemaV1(ISqliteConnection sqlite)
    {
        const string createTableSql = @"
CREATE TABLE [KeyValue] (
    [AccountId] INTEGER NOT NULL,
    [Key] VARCHAR(100) NOT NULL, -- From StorageKey
    [Value] TEXT, -- Literal or base64-encoded binary data (depending on key)
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
