import dotenv from 'dotenv'
dotenv.config()
import { isWalletInfoRemote, WalletsListManager } from '@tonconnect/sdk'

const WALLETS_LIST_CAHCE_TTL_MS = process.env.WALLETS_LIST_CAHCE_TTL_MS

async function getWallets(){
    const walletsListManager = new WalletsListManager({
        cacheTTLMs: Number(WALLETS_LIST_CAHCE_TTL_MS)
    })
    const wallets = await walletsListManager.getWallets();
    return wallets.filter(isWalletInfoRemote);
}

async function getWalletInfo(walletAppName:any) {
    const wallets = await getWallets();
    return wallets.find(wallet => wallet.appName.toLowerCase() === walletAppName.toLowerCase());
}

export {getWallets, getWalletInfo}