using System.Security.Cryptography;
using System.Text;

namespace IFY.Booksmart.StorageAPI;

public static class Utility
{
    public static string Sha256Base64(string input)
    {
        // Compute SHA‑256 (returns a 32‑byte array)
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));

        // Convert the binary hash to Base‑64
        return Convert.ToBase64String(hashBytes);
    }
}