namespace IFY.Booksmart.StorageAPI.Sqlite;

public interface ISchemaBuilder
{
    void UpdateSchema(int version);
}
