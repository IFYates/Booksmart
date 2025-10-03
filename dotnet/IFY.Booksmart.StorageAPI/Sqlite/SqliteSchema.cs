namespace IFY.Booksmart.StorageAPI.Sqlite;

public static class SqliteSchema
{
    public const int SchemaVersion = 1;

    public static void EnsureSchema(ISqliteConnection sqlite, params ISchemaBuilder[] schemaBuilders)
    {
        // Keep schema up-to-date
        var currentVersion = GetCurrentVersion(sqlite);
        for (var v = currentVersion + 1; v <= SchemaVersion; v++)
        {
            foreach (var builder in schemaBuilders)
            {
                builder.UpdateSchema(v);
            }

            sqlite.ExecuteNonQuery($"INSERT INTO [SchemaVersion] ([Version]) VALUES ({v})");
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
}