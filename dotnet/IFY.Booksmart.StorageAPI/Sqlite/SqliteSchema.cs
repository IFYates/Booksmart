namespace IFY.Booksmart.StorageAPI.Sqlite;

public static class SqliteSchema
{
    public static void EnsureSchema(IServiceProvider services)
    {
        using var sqlite = services.GetRequiredService<ISqliteConnection>();

        // Keep schema up-to-date
        var currentVersion = GetCurrentVersion(sqlite);
        if (currentVersion < 1)
        {
            Version1(sqlite);
        }
    }

    public static int GetCurrentVersion(ISqliteConnection sqlite)
    {
        // Ensure version table exists
        using (var command = sqlite.CreateCommand())
        {
            command.CommandText = "CREATE TABLE IF NOT EXISTS [SchemaVersion] ([Version] INTEGER PRIMARY KEY)";
            command.ExecuteNonQuery();
        }

        // Get current version
        using (var command = sqlite.CreateCommand())
        {
            command.CommandText = "SELECT MAX([Version]) FROM [SchemaVersion]";
            var result = command.ExecuteScalar();
            return result != DBNull.Value && result != null
                ? Convert.ToInt32(result)
                : 0;
        }
    }

    public static void Version1(ISqliteConnection sqlite)
    {
        const string createTableSql = @"
CREATE TABLE [KeyValue] (
    [EmailAddress] VARCHAR(500) NOT NULL UNIQUE,
    [Key] VARCHAR(100) NOT NULL,
    [Value] CLOB,

    CONSTRAINT [UQ_KeyValue_EmailAddress_Key] UNIQUE ([EmailAddress], [Key])
)
";
        executeNonQuery(sqlite, createTableSql);

        executeNonQuery(sqlite, "INSERT INTO [SchemaVersion] ([Version]) VALUES (1)");
    }

    private static void executeNonQuery(ISqliteConnection sqlite, string sql)
    {
        using var command = sqlite.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }
}