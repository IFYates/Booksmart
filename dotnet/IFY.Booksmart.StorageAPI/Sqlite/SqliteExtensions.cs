using Microsoft.Data.Sqlite;

namespace IFY.Booksmart.StorageAPI.Sqlite;

public static class SqliteExtensions
{
    public static DateTime? GetDateTimeOrNull(this SqliteDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    public static string? GetStringOrNull(this SqliteDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }
}