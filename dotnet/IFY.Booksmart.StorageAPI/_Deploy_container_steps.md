1. Build the container with the following command:
    ```
    docker build -t booksmart-api:latest .
    ```

1. Extract the container to a tar file:
    ```
    docker save booksmart-api:latest -o booksmart-api.tar
    ```

1. Open 'Container Manager'
    1. Go to 'Image' tab
    1. Use 'Action' -> 'Import' to import the `booksmart-api.tar` file

1. Run the image as a container
    - Can set up port forwarding. e.g., `9080` -> `8080`
    - Set the local storage volume. e.g., `/volume1/docker/booksmart:/storage:rw`
    - Set the connection string as an environment variable. e.g., `CONNECTIONSTRING__SQLITE` = `Data Source=/storage/booksmart.db`
    - The container details will show the IP address of the container

The internal port can be accessed via `http://<Container_IP>:<port>` or `http://<Host_IP>:<forwarded_port>`.