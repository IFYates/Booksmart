namespace IFY.Booksmart.StorageAPI.Tasks;

public abstract class BaseScheduledTask(ILogger log) : BackgroundService
{
    protected abstract TimeSpan GetNextWakeTime();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Determine the time to wait until the next run time
            var nextWakeTime = GetNextWakeTime();
            var now = DateTime.UtcNow;
            var nextRun = now.Date.Add(nextWakeTime);
            nextRun = now < nextRun ? nextRun : nextRun.AddDays(1);
            var sleepTime = nextRun - now;
            log.LogInformation("Sleeping until {time} ({delay})", nextWakeTime, sleepTime);

            await Task.Delay(sleepTime, stoppingToken);

            log.LogInformation("Performing work");
            try
            {
                await doWork();
                log.LogInformation("Work complete");
            }
            catch (Exception ex)
            {
                log.LogError(ex, "Failed to complete: {message}", ex.Message);
            }
        }
    }

    protected abstract Task doWork();
}