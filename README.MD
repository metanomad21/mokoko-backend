# API Documentation

This document outlines the RESTful API endpoints for a service that provides functionalities related to managing orders and fetching cryptocurrency prices.

## Endpoints

### 1. Get TON Coin Price

- **Endpoint**: `/toncoin-price`
- **Method**: `GET`
- **Description**: Retrieves the current price of TON Coin.
- **Response**:
  - **200 OK**:
    ```json
    {
      "price": "current price in USD"
    }
    ```
  - **500 Internal Server Error**:
    ```plaintext
    Error fetching TON price
    ```

### 2. Place an Order

- **Endpoint**: `/order/:prodId`
- **Method**: `POST`
- **URL Parameters**:
  - `prodId`: Product ID for which the order is being placed.
- **Body Parameters**:
  - `playerWallet`: Wallet address of the player placing the order.
- **Description**: Places an order for a specific product, calculates the price in TON based on the current USD price, and records the order in the database.
- **Response**:
  - **200 OK**:
    ```json
    {
      "errcode": 0,
      "data": {
        "orderId": "unique order identifier",
        "priceToken": "price in TON",
        "gameId": "game identifier",
        "prodId": "product identifier",
        "payToken": "currency type used for payment",
        "payAddress": "payment receiver address"
      }
    }
    ```
  - **200 OK** (Error Case):
    ```json
    {
      "errcode": 1,
      "data": {}
    }
    ```

### 3. Get Orders by Address

- **Endpoint**: `/orders/:address`
- **Method**: `GET`
- **URL Parameters**:
  - `address`: Wallet address to fetch orders for.
- **Description**: Fetches a list of orders associated with a specific wallet address. This endpoint needs further implementation to return meaningful data.
- **Response**:
  - **200 OK**:
    ```plaintext
    Orders for address {address}
    ```
    (Note: This response is placeholder and should be replaced with actual data representation when implemented.)

## Notes

- All endpoints return data in JSON format unless otherwise specified.
- It's important to handle errors and edge cases not shown here in a production environment.
- Make sure to secure endpoints that modify data or access sensitive information.
