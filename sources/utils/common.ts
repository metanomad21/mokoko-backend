import fs from 'fs';
import w3utils from 'web3-utils';
import path from 'path';
import { ethers } from 'ethers';
import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// const __filename: string = fileURLToPath(import.meta.url);
// const __dirname: string = dirname(__filename);

const toBytes32 = (key: string): string => w3utils.rightPad(w3utils.asciiToHex(key), 64);

const sortObjectKeys = <T extends Record<string, unknown>>(obj: T): T => {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key: string) => {
      result[key] = obj[key];
      return result;
    }, {}) as T;
};

const readJson = (filePath: string): Record<string, unknown> => {
  let jsonObj: Record<string, unknown> = {};
  if (fs.existsSync(filePath)) {
    try {
      jsonObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      
    }
  }
  return jsonObj;
};

const writeJson = (jsonObj: Record<string, unknown>, filePath: string): void => {
  fs.writeFileSync(filePath, JSON.stringify(jsonObj, null, 2));
};

const getAbi = (tokenname: string, netStr: string = ''): any[] => {
  const abiPath: string = path.join(
    __dirname,
    '../',
    'abis/',
    netStr,
    `${tokenname}.json`
  );
  const filecontent: string = fs.readFileSync(abiPath, 'utf-8');
  return JSON.parse(filecontent);
};

const formatAddressToByte32 = (address: string): string => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(address, 32));
};

const checkAddress = (list: string[], address: string): boolean => {
  return list.some((addr) => ethers.utils.getAddress(addr) === ethers.utils.getAddress(address));
};

const getRequest = async (url: string, headersKey?: any, params?: any): Promise<AxiosResponse<any>> => {
  return axios
    .get(url, { headers: headersKey, params: params })
    .then((response) => response)
    .catch((error) => Promise.reject(error));
};

const convertTimestampToUtcDateTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // 将秒级时间戳转换为毫秒级

  // 获取日期部分
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JavaScript 中月份是从 0 开始的，所以需要 +1
  const day = date.getUTCDate();

  // 获取时间部分
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  // 格式化日期和时间部分，确保它们为两位数
  const formattedMonth = month < 10 ? `0${month}` : month.toString();
  const formattedDay = day < 10 ? `0${day}` : day.toString();
  const formattedHours = hours < 10 ? `0${hours}` : hours.toString();
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds.toString();

  return `${formattedMonth}/${formattedDay}/${year} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

const formatMySQLDateTime = (date: any) : string => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// This function references `providerRopsten` and `providerBscTest` which aren't defined in the provided code.
// Make sure these are defined somewhere in your project or else this function will throw an error when called.
// const waitForTransaction = async (transactionHash: string, netID: string): Promise<boolean> => {
//   // Define providerRopsten and providerBscTest accordingly
//   // let provider: ethers.providers.Provider = providerRopsten;
//   // // if (speeds.isBinanceNetwork(netID)) {
//   // //   provider = providerBscTest;
//   // // }

//   // return new Promise((resolve) => {
//   //   const check = async () => {
//   //     const transactionInformation = await provider.getTransaction(transactionHash);
//   //     if (transactionInformation && transactionInformation.blockHash) {
//   //       const transactionInfo = await provider.getTransactionReceipt(transactionHash);
//   //       resolve(transactionInfo.status === 1);
//   //     } else {
//   //       setTimeout(check, 3000);
//   //     }
//   //   };

//   //   check();
//   // });
// };

const isTron = (id: string | number): boolean => {
  return ['shasta', 'tron', 66666, 66665].includes(id);
};

const convertDecimals = (inputPrecision: ethers.BigNumberish, outputPrecision: ethers.BigNumberish, amount: ethers.BigNumberish): ethers.BigNumber => {
  const inputMultiplier = ethers.BigNumber.from(10).pow(inputPrecision);
  const outputMultiplier = ethers.BigNumber.from(10).pow(outputPrecision);

  const normalizedInput = ethers.BigNumber.from(amount).mul(outputMultiplier);
  return normalizedInput.div(inputMultiplier);
};

const fillTemplate = (template: string, data: Record<string, string>): string => {
  let result: string = template;
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

const containsUpperCase = (str: any) => {
  return /[A-Z]/.test(str);
}

const computeMD5Hash = (input: any) => {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}

const signDataSha256 = (data: any, privateKey: any) => {
  const stringToSign = sortObjectAndStringify(data);
  const signer = crypto.createSign('sha256');
  signer.update(stringToSign);
  signer.end();

  // 使用提供的私钥字符串，这里假设 privateKey 是直接的密钥字符串
  const signature = signer.sign({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
  }, 'base64');
  return signature;
}

const sortObjectAndStringify = (data: any) => {
  // 创建一个新数组，用于存储排序并格式化后的键值对
  const sortedKeyValuePairs = Object.keys(data)
    .sort()  // 对键进行排序
    .map(key => `${key}=${data[key]}`);  // 将每个键值对转换为`key=value`格式

  // 将键值对数组连接成一个字符串，每对之间用`#`分隔
  return sortedKeyValuePairs.join('#');
}

const truncateDecimal = (num: any, precision: any) => {
  const factor = Math.pow(10, precision);
  return Math.floor(num * factor) / factor;
}


export {
  toBytes32,
  sortObjectKeys,
  readJson,
  writeJson,
  getAbi,
  formatAddressToByte32,
  checkAddress,
  getRequest,
  // waitForTransaction,
  isTron,
  convertDecimals,
  fillTemplate,
  convertTimestampToUtcDateTime,
  containsUpperCase,
  formatMySQLDateTime,
  computeMD5Hash,
  signDataSha256,
  truncateDecimal,
  sortObjectAndStringify
};
