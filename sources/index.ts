import dotenv from 'dotenv'
dotenv.config()
// import redisUtils from './utils/redis-utils';
import mysqlUtils from './utils/mysql-utils'
import dataWorker from './worker/dataWorker'
const MYSQL_HOST: any = process.env.MYSQL_HOST
const MYSQL_USER: any = process.env.MYSQL_USER
const MYSQL_PASSWORD: any = process.env.MYSQL_PASSWORD
const MYSQL_PORT: any = parseInt(process.env.MYSQL_PORT as string)
const MYSQL_DBNAME: any = process.env.MYSQL_DBNAME

const REDIS_HOST: any = process.env.REDIS_HOST
const REDIS_PORT: any = process.env.REDIS_PORT

async function main(): Promise<void> {
    await mysqlUtils.init(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DBNAME, MYSQL_PORT)
    // await redisUtils.init(REDIS_HOST, REDIS_PORT)
    await dataWorker()
}

main();