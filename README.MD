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
        "gems": "gems amount",
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

### 6. Submit Payment

- **Endpoint**: `/submitPayment/:orderid`
- **Method**: `POST`
- **URL Parameters**:
  - `orderid`: Unique identifier of the order for which payment is being submitted.
- **Description**: Marks an order as pre-paid if it hasn't been paid for yet, and if it is still in an active status (status = 0) and belongs to game ID 1. This operation only affects orders that have not been previously marked as pre-paid.
- **Response**:
  - **200 OK** (Payment marked):
    ```json
    {
      "errcode": 0,
      "data": {}
    }
    ```
  - **200 OK** (No payment marked):
    ```json
    {
      "errcode": 1,
      "data": {}
    }
    ```


### 7. Get Prod List

- **Endpoint**: `/getProds`
- **Method**: `GET`
- **URL Parameters**:
  - `userId`: user id from game server
  - `address`: Wallet address of the player 
- **Description**: get player products list
- **Response**:
  - **200 OK**:
    ```json
    {
      "errcode": 0,
      "data": [{
        "price": 199, // 价格，前端显⽰时需要除以100，保留两位⼩数，即 $1.99
        "gems": 1200, // 钻⽯数量
        "prodId": 10001, // 商品ID，游戏后端保存的ID
        "prodType": 1, // 商品类型，⽬前均为1，即 Gems
        "times": 1, // 可以购买的次数，该字段为后端业务⽤，前端⾃⾏判断是否需合约内
        "imgId": 1000, // ⽤于 显⽰的图⽚资源ID，前端显⽰图⽚格式为：1000.png
        "double": "Super Double +400%" // 该字段不为空时，显⽰在左上⻆促销信息
      },
      {xxx}
      ...
      ]
    }
    ```
  - **200 OK** (No prod):
    ```json
    {
      "errcode": 1,
      "data": {}
    }
    ```


### 8. Get Order

- **Endpoint**: `/getOrder/:orderid`
- **Method**: `GET`
- **URL Parameters**:
  - `orderid`: order id
- **Description**: get order info
- **Response**:
  - **200 OK**:
    ```json
    {
      "errcode": 0,
      "data": {
        "id": 55,
        "orderid": "1-10001-c4bc931a30b5697a1535ba32b129b9ba",
        "player_wallet": "UQC_b2HJy4r3-PXAcxRVZ5t0EzUjXNx0Jin_JlNLufwBzNWb",
        "game_id": 1,
        "item_id": 10001,
        "price_usd": 199,
        "price_token": "0.26819407008086255",
        "pay_token": "TON",
        "status": 2,
        "created_at": "2024-05-25T02:47:57.000Z",
        "payed_at": null,
        "payed_tx": null,
        "from_wallet": null,
        "to_wallet": "UQAMclYF4e51025kBpyfZ24TL0jKVJ9ZTRkAw8EA2m0gZ4MI",
        "sync_game_at": null,
        "sync_status": null,
        "pre_pay": 1
      }
    }
    ```
  - **200 OK** (No order):
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
