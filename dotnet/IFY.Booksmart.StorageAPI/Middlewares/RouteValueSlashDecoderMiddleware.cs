namespace IFY.Booksmart.StorageAPI.Middlewares;

public static class RouteValueSlashDecoderMiddleware
{
    /// <summary>
    /// Replaces any remaining "%2F" or "%5C" in ALL route values with the actual '/' or '\' character.
    /// </summary>
    /// <remarks>
    /// This is because ASP.NET Core routing leaves only these characters encoded.
    /// </remarks>
    public static IApplicationBuilder UseRouteValueSlashDecoder(this IApplicationBuilder app)
        => app.Use(logic);
    private static async Task logic(HttpContext context, Func<Task> next)
    {
        foreach (var kvp in context.Request.RouteValues.ToArray())
        {
            if (kvp.Value is string raw && !string.IsNullOrEmpty(raw))
            {
                var decoded = raw
                    .Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)
                    .Replace("%5C", "\\", StringComparison.OrdinalIgnoreCase);
                if (!ReferenceEquals(decoded, raw))
                {
                    context.Request.RouteValues[kvp.Key] = decoded;
                }
            }
        }

        await next();
    }
}