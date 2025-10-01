using IFY.Booksmart.StorageAPI;
using IFY.Booksmart.StorageAPI.Sqlite;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Configure options
builder.Services.Configure<SqliteOptions>(cfg =>
{
    var cs = builder.Configuration.GetConnectionString("Sqlite")
        ?? throw new OptionsValidationException("ConnectionString", typeof(SqliteOptions), ["ConnectionStrings:Sqlite cannot be null or empty"]);
    cfg.ConnectionString = cs;
});

// Register services
builder.Services.AddTransient<ISqliteConnection, SqliteConnection>();
builder.Services.AddTransient<Storage>();

var app = builder.Build();

// Setup platform
SqliteSchema.EnsureSchema(app.Services);
Api.Register(app);

app.Run();