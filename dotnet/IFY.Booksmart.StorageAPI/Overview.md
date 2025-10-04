# Logic
:::mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as Database

    C->>+S: POST /register <br> Body: {email, password*}
    S->>D: Create account (inactive) <br> Password hashed
    D-->>S: Success
    S->>-C: 200 OK (registration token sent via email)

    C->>+S: GET /register/{account key}/{registration token}
    S->>D: Activate account
    D-->>S: Success
    S->>-C: 200 OK (account confirmed and active) <br> 300 redirect to returnUrl if specified

    C->>+S: POST /password <br> Body: {new password*} <br> Authorization: SHA3 {ts} {salted account key} {password*}
    S->>D: Verify authorisation <br> Update password (hashed)
    D-->>S: Success
    S->>-C: 200 OK (password changed)

    C->>+S: PUT /{key}/{version} <br> Body: {value} <br> Authorization: SHA3 {ts} {salted account key} {password*}
    S->>D: Verify authorisation <br> Set value if version correct
    D-->>S: Success
    S->>-C: 200 OK (value set)

    C->>+S: GET /{key} <br> Authorization: SHA3 {ts} {salted account key} {password*}
    S->>D: Verify authorisation <br> Get value
    D-->>S: Success
    S->>-C: 200 OK <br> Body: {value} <br> X-Version: {version}
:::

All bodies sent as `text/plain`.

## Definitions
* `email metric` The first character of the email address followed by the length  
   e.g., `a15` for `abcdef@hijk.com`
* `account key` `SHA3-512('{email metric}:{email address}')`  
   e.g., `SHA3-512('a15:aabcdef@hijk.com')`
* `ts` Current UNIX timestamp
* `salted account key` `SHA3-512('{ts}:{account key}')`
* `password*` The account password. Suggested that passwords are always sent after client hashing; not sharing plain text passwords over the wire.

# API

| Name | Method | URL | Auth required | Body | Success response | Error responses
| - | - | - | - | - | - | -
| Create account | `POST` | `/register` | No | `{email address}\n{password}` | `200 OK` Account created - registration token sent via email | `400 Bad Request` Missing email or password
| Confirm account | `GET` | `/register/{account key}/{registration token}?requestUrl={url}` | No | None | `200 OK` Account confirmed and active (omitted `returnUrl`) <br> `300 Redirect` to `returnUrl`, if specified | `400 Bad Request` Missing token <br> `403 Forbidden` Token invalid or expired
| Change password | `POST` | `/password` | Yes | `{new password}` | `200 OK` Password changed | `400 Bad Request` Missing body <br> `403 Forbidden` Authorisation failed
| Set value | `PUT` | `/{key}/{version}` | Yes | `{value}` | `200 OK` Value set | `400 Bad Request` Incorrect version <br> `404 Not Found` Unknown key <br> `403 Forbidden` Authorisation failed
| Get value | `GET` | `/{key}` | Yes | None | `200 OK` Value retrieved. Body contains the value. Header `X-Version: {version}` contains the version, required for updating. | `403 Forbidden` Authorisation failed <br> `404 Not Found` Unknown key

# Authentication
All authenticated requests require an `Authorization` header of the form:

    Authorization: SHA3 {ts} {salted account key} {password*}