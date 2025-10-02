:::mermaid
graph LR


subgraph Service
    Set -->|Salt + Hash| Get
    Register
    Get -->|Account| Set
end

Update -->|Salt + Hash, Value| Set
Create -->|EmailAddress| Register
Fetch ---->|"Salt + Hash <br> SHA256_B64(Salt ':' SHA256_B64(email_metric ':' EmailAddress))"| Get

Set -->|Account, Value| DB
DB[(DB)] -->|"WHERE SHA256_B64(Salt ':' Account) = Hash"| Get
Register -->|"Account = SHA256_B64(email_metric ':' EmailAddress)"| DB
:::