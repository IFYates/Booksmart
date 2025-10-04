using Konscious.Security.Cryptography;
using System.Security.Cryptography;
using System.Text;

namespace IFY.Booksmart.StorageAPI;

public static class Utility
{
    /// <summary>
    /// Generates an Argon2id hash for the specified password, using the provided salt and account identifier as inputs.
    /// </summary>
    /// <remarks>The generated hash is suitable for securely storing passwords and verifying user credentials.
    /// The method uses fixed parameters for memory size, parallelism, and iterations to provide strong resistance
    /// against brute-force attacks. Ensure that the salt is unique for each password to maximize security.</remarks>
    /// <param name="accountId">The account identifier to include as associated data in the hash computation.</param>
    /// <param name="salt">A unique salt value, encoded as a UTF-8 string, used to randomize the hash output. Cannot be null or empty.</param>
    /// <param name="password">The password to be hashed. Cannot be null or empty.</param>
    /// <returns>A bae64 string containing the Argon2id hash of the password, incorporating the specified salt and account identifier.</returns>
    public static string Argon2id(long accountId, string salt, string password)
    {
        // Configure Argon2 algorithm
        var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            DegreeOfParallelism = 8,
            MemorySize = 8192,
            Iterations = 40,
            Salt = Encoding.UTF8.GetBytes(salt),
            AssociatedData = BitConverter.GetBytes(accountId),
        };

        // Convert the binary hash to Base‑64
        var hashBytes = argon2.GetBytes(512);
        return Convert.ToBase64String(hashBytes).TrimEnd('=');
    }

    public static string Sha3Base64(string salt, string input)
    {
        // Compute SHA3‑512 (returns a 64‑byte array)
        var hashBytes = SHA3_512.HashData(Encoding.UTF8.GetBytes($"{salt}:{input}"));

        // Convert the binary hash to Base‑64
        return Convert.ToBase64String(hashBytes).TrimEnd('=');
    }
}