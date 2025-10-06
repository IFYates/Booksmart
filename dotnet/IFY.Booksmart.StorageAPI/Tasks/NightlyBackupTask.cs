using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace IFY.Booksmart.StorageAPI.Tasks;

public class NightlyBackupTask(IOptions<SqliteOptions> opts) : BackgroundService
{
    private readonly TimeSpan _runTime = new(00, 01, 00); // 1AM

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var connStr = new SqliteConnectionStringBuilder(opts.Value.ConnectionString);

        while (!stoppingToken.IsCancellationRequested)
        {
            // Determine the time to wait until the next run time
            var now = DateTime.Now;
            var nextRun = now.Date.Add(_runTime);
            nextRun = now < nextRun ? nextRun : nextRun.AddDays(1);
            var sleepTime = nextRun - now;
            await Task.Delay(sleepTime, stoppingToken);

            await doWork(connStr.DataSource);
        }
    }

    private static Task doWork(string dataSource)
    {
        // TODO: Tidy up old backups?

        // Make named copy of SQLite db
        File.Copy(dataSource, $"{dataSource}-{DateTime.Now:yyyy-MM-dd}.backup", true);
        return Task.CompletedTask;
    }
}