using System.Security.Cryptography;
using System.Text;

namespace IFY.Booksmart.StorageAPI;

public static class Utility
{
    public static string Sha3Base64(string salt, string input)
    {
        // Compute SHA3‑512 (returns a 64‑byte array)
        var hashBytes = SHA3_512.HashData(Encoding.UTF8.GetBytes($"{salt}:{input}"));

        // Convert the binary hash to Base‑64
        return Convert.ToBase64String(hashBytes).TrimEnd('=');
    }

    public static string Sha256Base64(string salt, string input)
    {
        // Compute SHA‑256 (returns a 32‑byte array)
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{salt}:{input}"));

        // Convert the binary hash to Base‑64
        return Convert.ToBase64String(hashBytes);
    }
}