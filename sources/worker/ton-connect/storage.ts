import { IStorage } from '@tonconnect/sdk';
import redisUtils from '../../utils/redis-utils';

export class TonConnectStorage implements IStorage {
    constructor(private readonly chatId: number) {}

    private getKey(key: string): string {
        return this.chatId.toString() + key;
    }

    async removeItem(key: string): Promise<void> {
        await redisUtils.del(this.getKey(key));
    }

    async setItem(key: string, value: string): Promise<void> {
        await redisUtils.set(this.getKey(key), value);
    }

    async getItem(key: string): Promise<string | null> {
        return (await redisUtils.get(this.getKey(key))) || null;
    }
}
