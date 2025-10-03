using Microsoft.Data.Sqlite;

namespace IFY.Booksmart.StorageAPI.Sqlite;

public interface ISqliteConnection : IDisposable
{
    SqliteCommand CreateCommand();

    void ExecuteNonQuery(string sql);

    /// <summary>
    /// Returns an open SqliteConnection.
    /// Caller is responsible for disposing it.
    /// </summary>
    Microsoft.Data.Sqlite.SqliteConnection Open();
}