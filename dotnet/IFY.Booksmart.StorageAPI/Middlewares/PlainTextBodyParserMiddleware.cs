using System.Net.Mime;
using System.Text;
using System.Text.Json;

namespace IFY.Booksmart.StorageAPI.Middlewares;

/// <summary>
/// Processes requests with a Content-Type of text/plain by converting the request body to a JSON string, enabling
/// model binding for [FromBody] parameters expecting a string.
/// </summary>
/// <remarks>This middleware allows endpoints expecting a string parameter via [FromBody] to accept plain
/// text requests by reformatting the body as a JSON string. The Content-Type is changed to application/json to
/// ensure correct model binding. This conversion only occurs for requests with a Content-Type of text/plain; other
/// requests are passed through unchanged.</remarks>
public static class PlainTextBodyParserMiddleware
{
    public static IApplicationBuilder UsePlainTextBodyParser(this IApplicationBuilder app)
        => app.Use(logic);
    private static async Task logic(HttpContext context, Func<Task> next)
    {
        // If the Content-Type is text/plain, change it to application/json
        // so that the [FromBody] attribute can parse it as a string.
        if (context.Request.ContentType != null &&
            context.Request.ContentType.StartsWith(MediaTypeNames.Text.Plain, StringComparison.OrdinalIgnoreCase))
        {
            // Read the entire body as a string
            using var r = new StreamReader(context.Request.Body);
            var value = await r.ReadToEndAsync();
            context.Request.Body.Dispose();

            // Replace the body with a new stream containing the JSON string
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value)));
            context.Request.ContentType = MediaTypeNames.Application.Json;
        }
        await next();
    }
}
