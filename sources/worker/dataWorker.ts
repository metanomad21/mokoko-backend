import axios from 'axios'
import express from 'express'
import { request, gql } from 'graphql-request'
import {PAGESIZE, PAY_ADDRESS, DTON_ENDPOINT, HTTPPORT} from '../conf/coreCfg'
import mysql from '../utils/mysql-utils'

const app = express();
app.use(express.json()); // 用于解析 JSON 格式的请求体
const db = mysql.init()

// 定义函数以请求数据
async function fetchPayData(page: any = 1, pageSize: any = PAGESIZE) {
    try {
        const inMsg = null
        const query = gql`
        query {
            transactions(
                address_friendly: "${PAY_ADDRESS}"
                in_msg_comment: ${inMsg}
                end_status: "active"
                page: ${page}
                page_size: ${pageSize}
            ){
              gen_utime
              lt
              account_storage_balance_grams
              in_msg_op_code
              in_msg_comment
              out_msg_count
              out_msg_body
              end_status
            }
          }
        `

        let reqData = await request(DTON_ENDPOINT, query);
        console.log("req data ... ", reqData)
    } catch (error) {
        console.error("Error fetching data from TheGraph", error);
        return null;
    }
}


// 将数据发送到游戏业务服务器
async function sendDataToBusinessServer(data: any) {
    try {
        await axios.post('YOUR_BUSINESS_SERVER_ENDPOINT', data);
    } catch (error) {
        console.error("Error sending data to business server", error);
    }
}

async function main() {
    // 设置计划任务，每隔一分钟执行一次
    await fetchPayData()
    setInterval(fetchPayData, 60000)
}

main()

// Endpoint to get current TONCoin price
app.get('/toncoin-price', async (req: any, res: any) => {
    try {
        const price = await _getTONPrice();
        res.json({ price });
    } catch (error) {
        res.status(500).send("Error fetching TON price");
    }
});

// Endpoint to place an order for an item
app.post('/order/:itemId', (req: any, res: any) => {
    const { itemId } = req.params;
    const orderData = req.body;
    console.log(`Order received for item ${itemId}:`, orderData);
    res.status(201).send(`Order placed for item ${itemId}`);
});

// Endpoint to get order list for a specific address
app.get('/orders/:address', (req, res) => {
    const { address } = req.params;
    // Here, implement logic to fetch order details based on address
    res.send(`Orders for address ${address}`);
});

app.listen(HTTPPORT, () => {
    console.log(`HTTP Server running on port ${HTTPPORT}`);
});

/**
 * 
 * {
    "the-open-network": {
        "usd": 7.42
    }
}
 */
async function _getTONPrice() {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd',
        headers: { 
          'Cookie': '__cf_bm=TzSIdddq4OFzY4IaCSQSwZj7JuKPfEYGR2Uo7Bt3R5o-1715593131-1.0.1.1-5T5ZdoYlHyxfPuH9xQxPf8kKqy7Aq8obcWZnqLQlG8ZIMOdm.h6CPpNXIqJRzMtGKd41BSkecYxzd39Pbybnbg'
        }
    };
    let priceRes = await axios.request(config)
    return JSON.stringify(priceRes.data)
}
