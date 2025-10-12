using IFY.Booksmart.StorageAPI;
using IFY.Booksmart.StorageAPI.Data;
using IFY.Booksmart.StorageAPI.Middlewares;
using IFY.Booksmart.StorageAPI.Sqlite;
using IFY.Booksmart.StorageAPI.Tasks;
using Microsoft.Extensions.Options;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure options
builder.Services.Configure<SqliteOptions>(cfg =>
{
    var val = builder.Configuration.GetConnectionString("Sqlite")
        ?? throw new OptionsValidationException("ConnectionString", typeof(SqliteOptions), ["ConnectionStrings:Sqlite cannot be null or empty"]);
    cfg.ConnectionString = val;
});
builder.Services.Configure<AppOptions>(builder.Configuration);
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));

// Logging
builder.Services.AddLogging(b =>
{
    var logger = new LoggerConfiguration()
        //.ReadFrom.Configuration(builder.Configuration)
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}")
        .CreateLogger();
    b.AddSerilog(logger, true);
});

// Register services
builder.Services.AddTransient<ISqliteConnection, SqliteConnection>();
builder.Services.AddTransient<KeyValueStore>();
builder.Services.AddTransient<AccountStore>();
builder.Services.AddSingleton<Api>();

builder.Services.AddHostedService<DisableInactiveAccountsTask>();
builder.Services.AddHostedService<NightlyBackupTask>();

builder.AddRateLimiter();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ChromeExtension", policy =>
    {
        policy.SetIsOriginAllowed(origin => origin.StartsWith("chrome-extension://", StringComparison.OrdinalIgnoreCase))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Build app
var app = builder.Build();

app.UseCors("ChromeExtension");
app.UseRateLimiter();
app.UseRouteValueSlashDecoder();
app.UsePlainTextBodyParser();
app.UseAccountResolver();

// Setup database
using (var sqlite = app.Services.GetRequiredService<ISqliteConnection>())
{
    SqliteSchema.EnsureSchema(sqlite,
        app.Services.GetRequiredService<AccountStore>(),
        app.Services.GetRequiredService<KeyValueStore>()
    );
}

// Setup platform
app.Services.GetRequiredService<Api>().RegisterRoutes(app);

app.Run();