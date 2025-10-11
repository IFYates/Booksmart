using IFY.Booksmart.StorageAPI.Data;

namespace IFY.Booksmart.StorageAPI.Tasks;

public class DisableInactiveAccountsTask(AccountStore store, IConfiguration config, ILogger<DisableInactiveAccountsTask> log)
    : BaseScheduledTask(log)
{
    private readonly int _idleDaysRemovalNone = config.GetValue<int?>("IdleDaysRemoval_None") ?? 7;
    private readonly int _idleDaysRemovalFree = config.GetValue<int?>("IdleDaysRemoval_Free") ?? 30;

    private readonly TimeSpan _runTime = new(00, 00, 05); // 5 seconds after midnight
    protected override TimeSpan GetNextWakeTime() => _runTime;

    protected override async Task doWork()
    {
        var accountsInfo = await store.GetAllAccountsInfo();

        // Find accounts inactive since cutoff
        var cutoffNone = DateTime.UtcNow - TimeSpan.FromDays(_idleDaysRemovalNone);
        var cutoffFree = DateTime.UtcNow - TimeSpan.FromDays(_idleDaysRemovalFree);
        var disableAccounts = accountsInfo
            .Where(a => a.Tier switch
            {
                AccountTier.None => a.LastAccessed < cutoffNone,
                AccountTier.Free => a.LastAccessed < cutoffFree,
                _ => false
            })
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