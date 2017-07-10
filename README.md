# GiftDibs API

## Error Codes

### General

- `0` Uncaught server error.
- `1` The ObjectId provided in the request is formatted incorrectly (mongoose `CastError`).

### `/auth`

- `100` The login request is missing credentials.
- `101` A user was not found matching the login credentials provided.
- `102` The registration request failed database schema validation.
- `103` The request user does not have permission to modify the resource.

### `/users`

- `200` A user was not found with the specified ID.
- `201` The user update request failed database schema validation.
