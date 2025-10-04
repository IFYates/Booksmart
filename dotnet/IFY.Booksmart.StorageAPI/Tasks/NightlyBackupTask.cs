using IFY.Booksmart.StorageAPI.Data;

namespace IFY.Booksmart.StorageAPI.Tasks;

public class NightlyBackupTask(IConfiguration config) : BackgroundService
{
    private readonly TimeSpan _runTime = new(00, 01, 00); // 1AM
    private int _executionCount;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Determine the time to wait until the next run time
            var now = DateTime.Now;
            var nextRun = now.Date.Add(_runTime);
            nextRun = now < nextRun ? nextRun : nextRun.AddDays(1);
            var sleepTime = nextRun - now;
            await Task.Delay(sleepTime, stoppingToken);

            await doWork();
        }
    }

    private async Task doWork()
    {
        // TODO: Make named copy of SQLite db
    }
}