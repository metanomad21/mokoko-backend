import axios from 'axios'
import express from 'express'
import { request, gql } from 'graphql-request'
import {PAGESIZE, PAY_ADDRESS, DTON_ENDPOINT, HTTPPORT, GAME_SERVER_HOST, TEST_GAME_SERVER_HOST, PAY_ADDRESS_TEST} from '../conf/coreCfg'
import db from '../utils/mysql-utils'
import {formatMySQLDateTime, computeMD5Hash, signDataSha256, truncateDecimal, sortObjectAndStringify, convertToUnixTimestamp} from '../utils/common'
import { Address, Contract, Slice, beginCell, contractAddress, toNano, TonClient4, internal, fromNano, WalletContractV4 } from "@ton/ton";
const app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // 允许所有域名的访问
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // 允许的 HTTP 方法
    if (req.method === 'OPTIONS') {
      res.sendStatus(204); // 对于预检请求直接返回204 No Content
    } else {
      next();
    }
});
app.use(express.json());

const SHA256_PK = process.env.SHA256_PK
const IS_DEV: Number = Number(process.env.IS_DEV) ?? 0
const gameServerHost = IS_DEV == 1?TEST_GAME_SERVER_HOST:GAME_SERVER_HOST
const payWallet = IS_DEV == 1?PAY_ADDRESS_TEST:PAY_ADDRESS
let currentTonPrice: any

const main = async () => {

    async function rectifyPay() {

        try {
            //查询最近订单的时间
            //注意 id>500 是id523订单促使了此次修改，523之前的订单不理，以免重复发放钻石
            let sqlCheckOrder = `select * from orders where status = 2 and is_rectify is null and id > 500 order by id desc limit 100`
            let resCheckOrder: any = await db.query(sqlCheckOrder)
            console.log("rectify Check order ... ", resCheckOrder)

            if(resCheckOrder) {
                //查询每一个未支付订单的链上数据
                for(var i in resCheckOrder) {
                    const query = gql`
                    query {
                        transactions(
                            address_friendly: "${resCheckOrder[i]['to_wallet']}"
                            in_msg_comment: "${resCheckOrder[i]['orderid']}"
                        ){
                        address
                        gen_utime
                        lt
                        account_storage_balance_grams
                        in_msg_op_code
                        in_msg_comment
                        out_msg_count
                        out_msg_body
                        end_status
                        hash
                        in_msg_value_grams
                        }
                    }
                    `
            
                    let reqData: any = await request(DTON_ENDPOINT, query);
                    console.log("rectify req data ... ", query, reqData)

                    for(var t in reqData.transactions) {
                        //判定金额 用account_storage_balance_grams
                        let msgVal = reqData.transactions[t].in_msg_value_grams
                        let newStatus = 1
                        if(parseFloat(fromNano(msgVal).toString()) < (Math.floor(resCheckOrder[i].price_token * 100000) / 100000)) {
                            newStatus = 3
                        }

                        // console.log("from address ... ", Address.parseRaw("0:"+reqData.transactions[t].address.toString()), reqData.transactions[t].address)
                        const genUtimeDate = new Date(reqData.transactions[t].gen_utime);
                        const formattedDate = formatMySQLDateTime(genUtimeDate);

                        //修改订单状态
                        const sqlPayed = `
                        UPDATE orders 
                        SET status = '${newStatus}',
                        payed_at = '${formattedDate}',
                        payed_tx = '${reqData.transactions[t]['hash']}',
                        from_wallet = '${Address.parseRaw("0:"+reqData.transactions[t].address.toString())}',
                        msg_value = '${msgVal}'
                        WHERE orderid = '${resCheckOrder[i]['orderid']}' AND status = 2;
                        `;
                        // console.log("sqlPayed ... ", sqlPayed)
                        await db.query(sqlPayed)
                        await sendDataToBusinessServer()
                    }

                    //已复查
                    let rectifySql = `UPDATE orders SET is_rectify = 1 WHERE orderid = '${resCheckOrder[i]['orderid']}';`
                    await db.query(rectifySql)
                }
            }

        } catch (error) {
            console.error("Error rectify pay from dton", error);
            return null;
        }


    }

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
                        ){
                        in_msg_src_addr_address_hex
                        address
                        gen_utime
                        lt
                        account_storage_balance_grams
                        in_msg_op_code
                        in_msg_comment
                        out_msg_count
                        out_msg_body
                        end_status
                        hash
                        in_msg_value_grams
                        }
                    }
                    `
            
                    let reqData: any = await request(DTON_ENDPOINT, query);
                    console.log("req data ... ", query, reqData)

                    for(var t in reqData.transactions) {
                        //判定金额 用account_storage_balance_grams
                        let msgVal = reqData.transactions[t].in_msg_value_grams
                        let newStatus = 1
                        if(parseFloat(fromNano(msgVal).toString()) < (Math.floor(resCheckOrder[i].price_token * 100000) / 100000)) {
                            newStatus = 3
                        }

                        // console.log("from address ... ", Address.parseRaw("0:"+reqData.transactions[t].address.toString()), reqData.transactions[t].address)
                        const genUtimeDate = new Date(reqData.transactions[t].gen_utime);
                        const formattedDate = formatMySQLDateTime(genUtimeDate);

                        //修改订单状态
                        const sqlPayed = `
                        UPDATE orders 
                        SET status = '${newStatus}',
                        payed_at = '${formattedDate}',
                        payed_tx = '${reqData.transactions[t]['hash']}',
                        from_wallet = '${Address.parseRaw("0:"+reqData.transactions[t].in_msg_src_addr_address_hex.toString())}',
                        msg_value = '${msgVal}'
                        WHERE orderid = '${resCheckOrder[i]['orderid']}' AND status = 0;
                        `;
                        // console.log("sqlPayed ... ", sqlPayed)
                        await db.query(sqlPayed)
                        console.log("UIUIUUU ... ", resCheckOrder[i]['price_token'], truncateDecimal(resCheckOrder[i]['price_token'], 9).toString(), toNano("0.13342318"))

                        await sendDataToBusinessServer()
                    }
                }
            }

            //将超时未支付的订单置2
            const sqlStatus = `
            UPDATE orders 
            SET status = 2 
            WHERE created_at <= DATE_SUB(NOW(), INTERVAL 2 HOUR) AND status = 0 AND pre_pay != 1;
            `;
            console.log("update expire sqlStatus ... ", sqlStatus)

            await db.query(sqlStatus)
        } catch (error) {
            console.error("Error fetching data from TheGraph", error);
            return null;
        }
    }


    // 将数据发送到游戏业务服务器
    async function sendDataToBusinessServer() {
        try {
            console.log("enter sendDataToBusinessServer/// ")
            let orderSql= `select * from orders where status = 1 and sync_game_at is null`
            let orderRes = await db.query(orderSql)
            if(orderRes.length > 0) {
                let signData = {
                    address: orderRes[0]['player_wallet'],
                    prodId: orderRes[0]['item_id'],
                    txHash: orderRes[0]['payed_tx'],
                    orderId: orderRes[0]['orderid'],
                    payAmount: toNano(truncateDecimal(orderRes[0]['price_token'], 9).toString()).toString(),
                    payToken: orderRes[0]['pay_token']
                }
                let signedStr = signDataSha256(signData, SHA256_PK)
                const postData = {
                    signedData: signedStr,
                    originalData: sortObjectAndStringify(signData)
                };
    
                console.log("post data ... ", postData)
    
                let noticeRespo = await axios.post(gameServerHost+'FinishRecharge', postData)
                console.log("noticeRespo ... ", noticeRespo)
                if(noticeRespo.status == 200) {
                    const sqlSynced = `
                    UPDATE orders 
                    SET sync_game_at = NOW(),
                    sync_status = '${noticeRespo.data.code}',
                    balance = '${noticeRespo.data.data}'
                    WHERE orderid = '${orderRes[0]['orderid']}' AND status = 1 AND sync_game_at is null;
                    `;
                    await db.query(sqlSynced)
                }
            }
            
        } catch (error) {
            console.error("Error sending data to business server", error);
        }
    }

    async function main() {
        // 设置计划任务，每隔一分钟执行一次
        await fetchPayData()
        setInterval(fetchPayData, 60000)
        setInterval(sendDataToBusinessServer, 10000)

        //1小时更新一次ton price
        await _getTONPrice()
        setInterval(_getTONPrice, 3600000)

        //每隔20分钟进行一次已取消订单的二次确认
        await rectifyPay()
        setInterval(rectifyPay, 60000 * 20)
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
            const respoProdDetail: any = await axios.post(`${gameServerHost}GetProdsDetail`, {
                prodId: prodId
            })
            if(respoProdDetail.data.code == 0) {

                //检查该地址有下单未支付记录吗
                let checkUnpaySql = `select * from orders where player_wallet = '${playerWallet}' and status = 0 and game_id = 1 and pre_pay = 0`
                let checkUnpayRes = await db.query(checkUnpaySql) 
                if(checkUnpayRes.length > 0) {
                    returnData['errcode'] = 2
                    throw(2)
                }

                const dataProd = respoProdDetail.data.data
                const priceUsd = parseFloat(dataProd.price)/100
                const priceTONRes: any = await _getTONPrice()
                const priceTON = parseFloat(priceTONRes['the-open-network']['usd'])
                const priceToken = truncateDecimal(priceUsd / priceTON, 9)
                const gameId = 1
                const walletMd5 = computeMD5Hash(playerWallet+Date.now())
                const orderid = `${gameId}-${prodId}-${walletMd5}`
                const sqlInsert = `
                INSERT INTO orders (orderid, game_id, item_id, price_usd, price_token, pay_token, status, player_wallet, to_wallet, pre_pay, ton_price)
                VALUES ('${orderid}', '${gameId}', '${prodId}', '${dataProd.price}', '${priceToken}', 'TON', 0, '${playerWallet}', '${payWallet}', 0, '${priceTONRes['the-open-network']['usd']}');
                `;
                console.log("inert sql /// ", sqlInsert)
                await db.query(sqlInsert)

                returnData['data'] = {
                    "orderId": orderid,
                    "priceToken": priceToken,
                    "gameId": gameId,
                    "prodId": prodId,
                    "payToken": "TON",
                    "payAddress": payWallet
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
    app.get('/getHistoryOrder/:address', async (req, res) => {
        const { address } = req.params;
        let returnData: { errcode: number, data: { [key: string]: any } | null } = {errcode: 1, data: null}

        try {
            let historySql = `select * from orders where player_wallet = '${address}' and game_id = 1 order by id desc`
            console.log("historySql ... ", historySql)
            let historyRes = await db.query(historySql) 

            if(historyRes.length > 0) {
                returnData.data = {}
                returnData.data['orderId'] = historyRes[0].orderid
                returnData.data['itemId'] = historyRes[0].item_id
                const respoProdDetail: any = await axios.post(`${gameServerHost}GetProdsDetail`, {
                    prodId: historyRes[0].item_id
                })
                if(respoProdDetail.data.code == 0) {
                    returnData.data['gems'] = respoProdDetail.data.data.gems
                }

                returnData.data['priceUsd'] = historyRes[0].price_usd
                returnData.data['priceToken'] = historyRes[0].price_token
                let unixTimeC = new Date(historyRes[0].created_at).getTime() / 1000
                let unixTimeE = unixTimeC + 2 * 3600
                returnData.data['expireTime'] = unixTimeE
                returnData.data['createdAt'] = unixTimeC
                returnData.data['payAddress'] = historyRes[0].to_wallet
                returnData.data['status'] = historyRes[0].status
                returnData.data['balance'] = historyRes[0].balance
                returnData.data['prePay'] = historyRes[0].pre_pay
                returnData.data['syncGameAt'] = historyRes[0].sync_game_at
                returnData['errcode'] = 0
            }
            res.send(returnData);
        } catch (error) {
            console.log("/getHistoryOrder error ...", error)
            res.send(returnData);
        }   
    });

    app.post('/submitPayment/:orderid', async (req, res) => {
        const { orderid } = req.params;
        let returnData = {errcode: 1, data: {}}

        try {
            let historySql = `select * from orders where orderid = '${orderid}' and pre_pay = 0 and status = 0 and game_id = 1`
            let historyRes = await db.query(historySql) 

            if(historyRes.length > 0) {
                const sqlCancel = `
                    UPDATE orders 
                    SET pre_pay = 1
                    WHERE orderid = '${orderid}' AND pre_pay = 0 AND status = 0 AND game_id = 1;`;
                await db.query(sqlCancel)
                returnData['errcode'] = 0
            }
            res.send(returnData);
        } catch (error) {
            console.log("/submitPayment error ...", error)
            res.send(returnData);
        }   
    });

    app.post('/cancelOrder/:orderid', async (req, res) => {
        const { orderid } = req.params;
        let returnData = {errcode: 1, data: {}}

        try {
            let historySql = `select * from orders where orderid = '${orderid}' and status = 0 and pre_pay != 1 and game_id = 1`
            let historyRes = await db.query(historySql) 

            if(historyRes.length > 0) {
                const sqlCancel = `
                    UPDATE orders 
                    SET status = 2,
                    cancel_time = NOW()
                    WHERE orderid = '${orderid}' AND status = 0 AND game_id = 1;`;
                await db.query(sqlCancel)
                returnData['errcode'] = 0
            }
            res.send(returnData);
        } catch (error) {
            console.log("/cancelOrder error ...", error)
            res.send(returnData);
        }   
    });

    // Endpoint to get order list for a specific address
    app.get('/getProds', async (req, res) => {
        const userId = parseInt(req.query.userId as string) || null;
        const address = req.query.address as string || null;
        let returnData: { errcode: number, data: any[] } = {errcode: 1, data: []}

        try {
            if(userId != null && address != null) {
                //向服务器请求prod列表
                const respoProdDetail: any = await axios.post(`${gameServerHost}GetProds`, {
                    userId: userId
                })
                if(respoProdDetail.data.code == 0) {
                    let checkOrderSql = `select * from orders where player_wallet = '${address}' and pre_pay = 1 and status = 0`
                    let checkOrderRes = await db.query(checkOrderSql)
                    // console.log("checkOrderRes .. ", checkOrderSql, checkOrderRes)
                    for(var p in respoProdDetail.data.data) {
                        let isSkip = 0
                        for(var o in checkOrderRes) {
                            if(checkOrderRes[o].item_id.toString() == respoProdDetail.data.data[p].prodId.toString()) {
                                if(parseInt(respoProdDetail.data.data[p].times) - 1 == 0) {
                                    isSkip = 1
                                    break
                                } else {
                                    respoProdDetail.data.data[p].times --;
                                }
                            }
                        }
        
                        if(!isSkip) {
                            returnData.data.push(respoProdDetail.data.data[p])
                        }
                    }
                    returnData['errcode'] = 0
                }
            }
            res.send(returnData)
        } catch (error) {
            console.log("/getProds error ...", error)
            res.send(returnData);
        }   
    }); 

    app.get('/getOrder/:orderid', async (req, res) => {
        const { orderid } = req.params;
        let returnData: { errcode: number, data: any[] } = {errcode: 1, data: []}

        try{
            let orderSql = `select * from orders where orderid = '${orderid}'`
            console.log("orderSql ... ", orderSql)
            let orderRes = await db.query(orderSql)
            
            if(orderRes.length > 0) {
                returnData['errcode'] = 0
                returnData['data'] = orderRes[0]
            }
            res.send(returnData)

        } catch (error) {
            console.log("/getOrder error ...", error)
            res.send(returnData);
        }   
    })

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

        try {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
            };
            let priceRes = await axios.request(config)
            console.log("_getTONPrice ... ", priceRes.data)
            currentTonPrice = priceRes.data
            return priceRes.data

        }catch(e) {
            if(currentTonPrice) {
                return currentTonPrice
            }
        }
    }
}

export default async () => {
    await main()
}

