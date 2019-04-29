# API Endpoints

## Authentication
### `GET /api/auth`
  - generates an authorization url for the client to open in order to initiate the oauth2 workflow
  - *Status Codes*
    - `200 OK` url was successfully generated and returned
    - `500 Internal Server Error` something unexpected happened on the server end

### `POST /api/auth/`
  - exchanges authorization code for access token and refresh token
  - *Status Codes*
    - `200 OK` exchange was successfully completed
    - `400 Bad Request` authorization code was invalid or expired
    - `500 Internal Server Error` something unexpected happened on the server end

### `GET /api/auth/status/`
  - given a jwt, validates the token and returns basic user information
  - *Status Codes*
    - `200 OK` jwt was validated and returned user information
    - `401 Unauthorized` jwt was not found or was invalid
    - `400 Bad Request` jwt was validated but the user was not found

## Rooms
### `GET /api/room`
  - Fetches a list of rooms that the user is registered in
  - *Status Codes*
    - `200 OK` list of rooms was succesfully fetched and returned
    - `401 Unauthorized` the client is not authorized to read the list of rooms
    - `500 Internal Server Error` something unexpected happened on the server end  

### `POST /api/room`
  - Creates a new room with the given request body
  - *Status Codes*
    - `201 Created` room was created
    - `401 Unauthorized` the client is not authorized to create a new room
    - `500 Internal Server Error` something unexpected happened on the server end

### `GET /api/room/<room-id>`
  - Fetches detail of a room specified by the `room-id`
  - *Status Codes*
    - `200 OK` details of the room was found and successfully returned
    - `401 Unauthorized` the client is not authorized to read the details
    - `500 Internal Server Error` something unexpected happened on the server end

### `PUT /api/room/<room-id>`
  - Patches details of the room specified with the `room-id` with the given request body
  - *Status Codes*
    - `200 OK` room was successfully patched with the new information
    - `401 Unauthorized` the client is not authorized to path room details
    - `500 Internal Server Error` something unexpected happened on the server end

### `DELETE /api/room/<room-id>`
  - Deletes a specific room specified by the `room-id`
  - *Status Codes*
    - `202 Accepted` room was successfully marked for deletion
    - `401 Unauthorized` the client is not authorized to delete a room
    - `500 Internal Server Error` something unexpected happened on the server end