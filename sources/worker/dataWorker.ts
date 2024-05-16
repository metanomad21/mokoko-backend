import axios from 'axios'
import express from 'express'
import { request, gql } from 'graphql-request'
import {PAGESIZE, PAY_ADDRESS, DTON_ENDPOINT, HTTPPORT, GAME_SERVER_HOST} from '../conf/coreCfg'
import db from '../utils/mysql-utils'
import {formatMySQLDateTime, computeMD5Hash, signDataSha256} from '../utils/common'
const app = express();
app.use(express.json());

const SHA256_PK = process.env.SHA256_PK

const main = async () => {
    async function fetchPayData(page: any = 1, pageSize: any = PAGESIZE) {
        try {
            
            //查询最近订单的时间
            let sqlCheckOrder = `select * from orders where status = 0 order by id desc`
            let resCheckOrder: any = await db.query(sqlCheckOrder)
            console.log("Check order ... ", resCheckOrder)

            if(resCheckOrder) {
                //查询每一个未支付订单的链上数据
                for(var i in resCheckOrder) {
                    const query = gql`
                    query {
                        transactions(
                            address_friendly: "${resCheckOrder[i]['to_wallet']}"
                            in_msg_comment: "${resCheckOrder[i]['orderid']}"
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
                        hash
                        }
                    }
                    `
            
                    let reqData: any = await request(DTON_ENDPOINT, query);
                    console.log("req data ... ", reqData)

                    for(var t in reqData.transactions) {
                        //判定金额
    
                        //修改订单状态
                        const sqlPayed = `
                        UPDATE orders 
                        SET status = 1
                        WHERE orderid = ${resCheckOrder[i]['orderid']} AND status = 0;
                        `;
                        await db.query(sqlPayed)

                        let signData = {
                            address: resCheckOrder[i]['player_wallet'],
                            prodId: resCheckOrder[i]['item_id'],
                            txHash: reqData.transactions[t]['hash']
                        }
                        let signedStr = signDataSha256(signData, SHA256_PK)
                        const postData = {
                            signedData: signedStr,
                            originalData: signData
                        };
                        axios.post('游戏服务器的URL', postData)
                    }
                }
            }

            //将超时未支付的订单置2
            const sqlStatus = `
            UPDATE orders 
            SET status = 2 
            WHERE created_at <= DATE_SUB(NOW(), INTERVAL 2 HOUR) AND status = 0;
            `;

            await db.query(sqlStatus)
        } catch (error) {
            console.error("Error fetching data from TheGraph", error);
            return null;
        }
    }


    // 将数据发送到游戏业务服务器
    async function sendDataToBusinessServer() {
        try {
            await axios.post('YOUR_BUSINESS_SERVER_ENDPOINT', {});
        } catch (error) {
            console.error("Error sending data to business server", error);
        }
    }

    async function main() {
        // 设置计划任务，每隔一分钟执行一次
        await fetchPayData()
        setInterval(fetchPayData, 60000)
        // setInterval(sendDataToBusinessServer, 10000)
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
    app.post('/order/:prodId', async (req: any, res: any) => {
        const { prodId } = req.params;
        const { playerWallet } = req.body;
        let returnData = {errcode: 1, data: {}}
        console.log(`Order received for item ${prodId}:`, req.body);

        try {
            const respoProdDetail: any = await axios.post(`${GAME_SERVER_HOST}GetProdsDetail`, {
                prodId: prodId
            });
            if(respoProdDetail.data.code == 0) {
                const dataProd = respoProdDetail.data.data
                const priceUsd = parseFloat(dataProd.price)/100
                const priceTONRes: any = await _getTONPrice()
                const priceTON = parseFloat(priceTONRes['the-open-network']['usd'])
                const priceToken = priceUsd / priceTON
                const gameId = 1
                const walletMd5 = computeMD5Hash(playerWallet+Date.now())
                const orderid = `${gameId}-${prodId}-${walletMd5}`
                const sqlInsert = `
                INSERT INTO orders (orderid, game_id, item_id, price_usd, price_token, pay_token, status, player_wallet, to_wallet)
                VALUES ('${orderid}', '${gameId}', '${prodId}', '${dataProd.price}', '${priceToken}', 'TON', 0, '${playerWallet}', '${PAY_ADDRESS}');
                `;
                console.log("inert sql /// ", sqlInsert)
                await db.query(sqlInsert)

                returnData['data'] = {
                    "orderId": orderid,
                    "priceToken": priceToken,
                    "gameId": gameId,
                    "prodId": prodId,
                    "payToken": "TON",
                    "payAddress": PAY_ADDRESS
                }
                returnData['errcode'] = 0
            }

            res.send(returnData);
        } catch (error) {
            console.log("/order/:prodId error ...", error)
            res.send(returnData);
        }
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
            url: 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
        };
        let priceRes// = await axios.request(config)

        priceRes = {
            "the-open-network": {
                "usd": 7.42
            }
        }
        return priceRes
    }
}

export default async () => {
    await main()
}

