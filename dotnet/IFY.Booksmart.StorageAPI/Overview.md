# Create account
## Request
```
POST /register
Content-Type: text/plain

{email address}
{password}
```

## Responses
* `200 OK` Account created - registration token sent via email

# Confirm account
## Request
```
GET /register/{account key}/{registration token}
```

## Responses
* Will forward to `returnUrl` query URL, if specified
* `200 OK` Account confirmed and active
* `400 Bad Request` Missing token
* `403 Forbidden` Token invalid or expired

# Change password
## Request
```
POST /password
Authorization: SHA256 {ts_salt} {salted account key} {password}
Content-Type: text/plain

{new password}
```

## Responses
* `200 OK` Password changed
* `400 Bad Request` Missing password
* `403 Forbidden` Authorisation failed

# Set value
## Request
```
PUT /{key}/{version}
Authorization: SHA256 {ts_salt} {salted account key} {password}
Content-Type: text/plain

{value}
```

## Responses
* `200 OK` Value set
* `400 Bad Request` Incorrect version
* `404 Not Found` Unknown key
* `403 Forbidden` Authorisation failed

# Get value
## Request
```
GET /{key}
Authorization: SHA256 {ts_salt} {salted account key} {password}
```

## Responses
* `200 OK` Value retrieved. Body contains the value. Header `X-Version: {version}` contains the version, required for updating.
* `403 Forbidden` Authorisation failed
* `404 Not Found` Unknown key