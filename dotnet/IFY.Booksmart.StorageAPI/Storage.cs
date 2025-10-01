using IFY.Booksmart.StorageAPI.Sqlite;

namespace IFY.Booksmart.StorageAPI;

public class Storage(ISqliteConnection sqlite)
{
    public async Task<byte[]?> GetKeyValueByHashedEmail(string salt, string hash, string key)
    {
        using var cmd = sqlite.CreateCommand();
        cmd.CommandText = @"
SELECT [Value]
FROM [KeyValue]
WHERE SHA256_BASE64(CONCAT(@salt, ':', [EmailAddress])) = @hash
AND [Key] = @key
";
        cmd.Parameters.AddWithValue("@salt", salt);
        cmd.Parameters.AddWithValue("@hash", hash);
        cmd.Parameters.AddWithValue("@key", key);
        return (await cmd.ExecuteScalarAsync()) as byte[];
    }
}
