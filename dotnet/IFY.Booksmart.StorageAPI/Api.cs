namespace IFY.Booksmart.StorageAPI;

public static class Api
{
    public static void Register(WebApplication app)
    {
        app.MapGet("/booksmart/{key}/{salt}/{hash}", GetByHashedEmail);
    }

    public static async Task<byte[]?> GetByHashedEmail(string key, string salt, string hash, Storage storage)
    {
        // TODO: salt must be timestamp within 5 minutes of now

        return await storage.GetKeyValueByHashedEmail(salt, hash, key);
    }
}