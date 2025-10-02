namespace IFY.Booksmart.StorageAPI;

public class DisableInactiveAccountsTask(KeyValueStore store) : BackgroundService
{
    private readonly TimeSpan _runTime = new(00, 00, 05); // 5 seconds after midnight
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
        Interlocked.Increment(ref _executionCount);
        await store.DisableInactiveAccounts(TimeSpan.FromDays(30)); // 30 days of inactivity
    }
}