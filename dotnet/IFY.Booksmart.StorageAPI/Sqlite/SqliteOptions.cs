namespace IFY.Booksmart.StorageAPI.Sqlite;

public sealed class SqliteOptions
{
    /// <summary>
    /// The full SQLite connection string (e.g. "Data Source=/data/app.db;Cache=Shared")
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;
}