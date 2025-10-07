namespace IFY.Booksmart.StorageAPI;

public class AppOptions
{
    public required string BaseUri { get; set; }
    public required string BaseApiPath { get; set; }
    public bool EnableDebugEndpoints { get; set; }

    public double TimestampSaltRangeMins { get; set; } = 5;

    public required SmtpOptions Smtp { get; set; }
}
