using IFY.Booksmart.StorageAPI;
using IFY.Booksmart.StorageAPI.Data;
using IFY.Booksmart.StorageAPI.Sqlite;
using IFY.Booksmart.StorageAPI.Tasks;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Configure options
builder.Services.Configure<SqliteOptions>(cfg =>
{
    var val = builder.Configuration.GetConnectionString("Sqlite")
        ?? throw new OptionsValidationException("ConnectionString", typeof(SqliteOptions), ["ConnectionStrings:Sqlite cannot be null or empty"]);
    cfg.ConnectionString = val;
});

// Register services
builder.Services.AddTransient<ISqliteConnection, SqliteConnection>();
builder.Services.AddTransient<KeyValueStore>();
builder.Services.AddTransient<AccountStore>();
builder.Services.AddSingleton<Api>();

builder.Services.AddHostedService<DisableInactiveAccountsTask>();
builder.Services.AddHostedService<NightlyBackupTask>();

builder.AddRateLimiter();

// Build app
var app = builder.Build();
app.UseRateLimiter();
app.Use(Middleware.RouteValueSlashDecoder);
app.Use(Middleware.PlainTextBodyParser);
app.Use(Middleware.AccountResolver);

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