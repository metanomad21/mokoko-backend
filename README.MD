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
### 4. Get History Order

- **Endpoint**: `/getHistoryOrder/:address`
- **Method**: `GET`
- **URL Parameters**:
  - `address`: Wallet address of the player for whom to fetch history orders.
- **Description**: Retrieves the most recent order details for a specific wallet address where the order status is active and related to game ID 1.
- **Response**:
  - **200 OK**:
    ```json
    {
      "errcode": 0,
      "data": {
        "orderId": "order identifier",
        "itemId": "item identifier",
        "priceUsd": "price in USD",
        "priceToken": "price in tokens",
        "expireTime": "expiration time in Unix timestamp"
      }
    }
    ```
  - **200 OK** (No active order):
    ```json
    {
      "errcode": 1,
      "data": {}
    }
    ```

### 5. Cancel Order

- **Endpoint**: `/cancelOrder/:orderid`
- **Method**: `POST`
- **URL Parameters**:
  - `orderid`: Unique identifier of the order to be cancelled.
- **Description**: Cancels an active order (where status is 0 and game ID is 1) by changing its status to 2 (cancelled).
- **Response**:
  - **200 OK**:
    ```json
    {
      "errcode": 0,
      "data": {}
    }
    ```
  - **200 OK** (Order not found or already processed):
    ```json
    {
      "errcode": 1,
      "data": {}
    }
    ```


## Notes

- All endpoints return data in JSON format unless otherwise specified.
- It's important to handle errors and edge cases not shown here in a production environment.
- Make sure to secure endpoints that modify data or access sensitive information.
