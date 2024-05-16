# API Documentation

## API Name: Submit Transaction Data

### Request URL
`https://game-server.com/api/submit-transaction`

### Request Method
`POST`

### Headers
| Header        | Required | Type   | Description              |
|---------------|----------|--------|--------------------------|
| Content-Type  | Yes      | String | Must be `application/json` |

### Body Parameters

The request body should be a JSON object containing the following fields:

| Field         | Required | Type   | Description                        |
|---------------|----------|--------|------------------------------------|
| signedData    | Yes      | String | Transaction data signed with SHA256 private key |
| originalData  | Yes      | Object | Original transaction data          |

#### `originalData` Object Fields

| Field    | Required | Type   | Description          |
|----------|----------|--------|----------------------|
| address  | Yes      | String | Player's wallet address |
| prodId   | Yes      | String | Item ID              |
| txHash   | Yes      | String | Transaction hash     |

### Responses

#### Success Response

If the request is successful, the server will return the following data:

```json
{
  "status": 200,
  "message": "Transaction submitted successfully",
  "data": {
    "confirmationCode": "ABC123XYZ"
  }
}

```json
{
  "status": 400,
  "message": "Bad Request: Missing or invalid data",
  "errors": {
    "signedData": "Missing or invalid signature"
  }
}

