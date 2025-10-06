namespace IFY.Booksmart.StorageAPI;

public class SmtpOptions
{
    public required string Host { get; set; }
    public required uint Port { get; set; }
    public required string Username { get; set; }
    public required string Password { get; set; }
    public required string Sender { get; set; }
    public required string ReturnUrl { get; set; }
}
