import dotenv from 'dotenv'
dotenv.config()
import redisUtils from './utils/redis-utils';
// import botWorker from './worker/botWorker'

const REDIS_HOST: any = process.env.REDIS_HOST
const REDIS_PORT: any = process.env.REDIS_PORT

async function main(): Promise<void> {
    await redisUtils.init(REDIS_HOST, REDIS_PORT)
    await botWorker()
}

main();