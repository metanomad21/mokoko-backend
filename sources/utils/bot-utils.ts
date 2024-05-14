import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from 'telegraf';

// 扩展 NodeJS 的环境变量类型
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
    }
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
export default bot;
