using IFY.Booksmart.StorageAPI.Data;

namespace IFY.Booksmart.StorageAPI.Tasks;

public class DisableInactiveAccountsTask(AccountStore store, IConfiguration config) : BackgroundService
{
    private readonly TimeSpan _runTime = new(00, 00, 05); // 5 seconds after midnight
    private readonly int _idleDaysRemovalFree = config.GetValue<int?>("IdleDaysRemoval_Free") ?? 30;
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

        var accountsInfo = await store.GetAllAccountsInfo();

        // Find accounts inactive since cutoff
        var cutoff = DateTime.UtcNow - TimeSpan.FromDays(_idleDaysRemovalFree);
        var disableAccounts = accountsInfo
            .Where(a => a.Tier == AccountTier.Free && a.LastAccessed < cutoff)
            .Select(a => a.EmailHash).OfType<string>()
            .ToArray();

        // Disable accounts
        var tasks = disableAccounts.Select(async account =>
        {
            await store.DisableAccount(account);
        });
        await Task.WhenAll(tasks);
    }
}