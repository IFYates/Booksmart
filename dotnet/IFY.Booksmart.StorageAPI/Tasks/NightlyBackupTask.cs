using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace IFY.Booksmart.StorageAPI.Tasks;

public class NightlyBackupTask(IOptions<SqliteOptions> opts, ILogger<NightlyBackupTask> log)
    : BaseScheduledTask(log)
{
    private readonly TimeSpan _runTime = new(00, 01, 00); // 1AM
    private readonly string _dataSource = new SqliteConnectionStringBuilder(opts.Value.ConnectionString).DataSource;

    protected override TimeSpan GetNextWakeTime() => _runTime;

    protected override Task doWork()
    {
        // TODO: Tidy up old backups?

        // Make named copy of SQLite db
        var filename = $"{_dataSource}-{DateTime.Now:yyyy-MM-dd}.backup";
        log.LogInformation("Backing up database to {file}", filename);
        File.Copy(_dataSource, filename, true);
        return Task.CompletedTask;
    }
}