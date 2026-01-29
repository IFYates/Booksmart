1. Build the container with the following command:
    ```ps
    docker build . -t booksmart-api:version
    ```

1. Extract the container to a tar file:
    ```ps
    docker save -o booksmart-api.tar booksmart-api:version
    ```

1. Open 'Container Manager'
    1. Go to 'Image' tab
    1. Use 'Action' -> 'Import' to import the `booksmart-api.tar` file
    1. Ensure the correct tag is displayed

1. Update the `docker-compose.yml` file to run the new container
    - The container details will show the IP address of the container

The internal port can be accessed via `http://<Container_IP>:<port>` or `http://<Host_IP>:<forwarded_port>`.

`docker-compose.yml`
```yaml
version: '3.8'

services:
  api:
    image: booksmart-api:version
    user: "uuuu:gggg" # Permissioned user to access the volume
    ports:
      - "9080:8080" # Host port (9080) to container port mapping (8080)
    environment:
      BaseApiPath: "/booksmart"
      EnableDebugEndpoints: false

      # Database
      CONNECTIONSTRINGS__SQLITE: "Data Source=/storage/data.db;Mode=ReadWriteCreate"

      # SMTP configuration
      SMTP__Username: "..."
      SMTP__Password: "..."
    volumes:
      - /host_data_volume:/storage # Host path to the data volume
```