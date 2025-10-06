namespace IFY.Booksmart.StorageAPI;

public class AppOptions
{
    public required string BaseUri { get; set; }
    public required string BaseApiPath { get; set; }
    public bool EnableDebugEndpoints { get; set; }

    public required SmtpOptions Smtp { get; set; }
}
