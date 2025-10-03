using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace IFY.Booksmart.StorageAPI.Sqlite;

public sealed class SqliteConnection : ISqliteConnection
{
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;

    public SqliteConnection(IOptions<SqliteOptions> opts)
    {
        _connection = new(opts.Value.ConnectionString);

        // Register the user-defined function
        _connection.CreateFunction<string, string, string>(
            name: "SHA256_BASE64",
            function: Utility.Sha256Base64);
    }

    public Microsoft.Data.Sqlite.SqliteConnection Open()
    {
        _connection.Open();
        return _connection;
    }

    public SqliteCommand CreateCommand()
    {
        _connection.Open();
        return _connection.CreateCommand();
    }

    public void ExecuteNonQuery(string sql)
    {
        using var command = CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}