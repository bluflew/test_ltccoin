"use strict";


import litecore from 'litecore-lib';
import bip39 from 'bip39';
import config from '../config';
import request from 'request';

/**
 * Create mnemonic.
 */
async function createMnemonic() {
  return bip39.generateMnemonic();
}

/**
 * Get wallet from mnemonic.
 * @param {String} mnemonic 
 */

async function getWalletFromMnemonic(mnemonic, mainnet = config.mainnet) {
  let network = litecore.Networks.mainnet;
  if (!mainnet) {
    network = litecore.Networks.testnet;
  }
  // Validate mnemonic using bip39.
  if (!bip39.validateMnemonic(mnemonic, bip39.wordlists.EN)) throw new Error('invalid mnemonic!');
  const seed = bip39.mnemonicToSeedHex(mnemonic);

  const rootKey = new litecore.HDPrivateKey.fromSeed(seed, network);
  const childPrivateKey = rootKey.derive(config.path);
  const privateKey = childPrivateKey.privateKey.toString();

  const address = new litecore.PrivateKey(privateKey).toAddress(network);

  return {
    address: address.toString(),
    privateKey: privateKey.toString()
  }
}

/**
 * Get address from privatekey.
 * @param {String} secretKey
 */

function getAddressFromPrivateKey(privateKey, mainnet = config.mainnet) {
  let network = 'mainnet';
  if (!mainnet) network = 'testnet';
  return new litecore.PrivateKey(privateKey).toAddress(network);
};

/** Get balance from address.
 * @param {String} address - address want get balance.
 */

async function getBalance(address, mainnet = config.mainnet) {
  if (!litecore.Address.isValid(address, mainnet)) {
    throw new Error('Address invalid');
  }
  const url = `${config.ltcAPIUrl}addr/${address}/balance`;

  return new Promise(resolve => {
    request.get(url, (err, data, body) => {
      if (err) resolve(undefined);
      else {
        resolve(body / (10 ** 8));
      }
    });
  })
};

/**
 * Get transaction from txHash.
 * @param {String} txtHash - transaction hash want to check from node.
 */

async function getTransaction(txtHash) {
  const url = `${config.ltcAPIUrl}tx/${txtHash}`;
  return new Promise(resolve => {
    request.get(url, (err, data, body) => {
      if (err) resolve({});
      else {
        resolve(JSON.parse(body));
      }
    });
  })
};

/**
 * Get transactions from address.
 * @param {String} address - address want to check from node.
 */

async function getHistory(address, page, offest) {
  let from = 0,
    to = 0;
  if (page == 1) {
    from = 0;
    to = offest - 1;
  } else {
    from = page * offest;
    to = from + offest - 1;
  }
  const url = `${config.ltcAPIUrl}addrs/${address}/txs?from=${from}&to=${to}`;
  return new Promise((resolve) => {
    request.get(url, (err, data, body) => {
      if (err) resolve({});
      else {
        resolve(JSON.parse(body));
      }
    });
  })
};

function sortUTXO(utxo1, utxo2) {
  if (utxo1.satoshis < utxo2.satoshis) {
    return -1;
  } else {
    return 1;
  }
  return 0;
};

/**
 * Unspent Outputs for Address
 * @param {*} address
 */

async function utxoWithdraw(address) {
  let url = `${config.ltcAPIUrl}addr/${address}/utxo`;
  return new Promise((resolve) => {
    request.get(url, (err, data, body) => {
      if (err) resolve([]);
      else {
        resolve(JSON.parse(body));
      }
    })
  })
};

/**
 * Create Transaction and Transaction Broadcasting.
 * @param {String} fromAddress 
 * @param {String} privateKey 
 * @param {String} toAddress 
 * @param {Number} amount 
 * @param {Number} feeRate 
 * @param {Boolean} mainnet 
 */

async function transferLTC(fromAddress, privateKey, toAddress, amount, feeRate, mainnet = config.mainnet) {
  if (!litecore.Address.isValid(fromAddress, mainnet)) {
    throw new Error('From Address invalid');
  }
  if (!litecore.Address.isValid(toAddress, mainnet)) {
    throw new Error('To Address invalid');
  }
  const balance = await getBalance(fromAddress);
  // balance = balance * (10 ** 8);
  let amountSend = amount * 100000000; // amount in satoshi
  if (amountSend + feeRate > balance) throw new Error('Not enough balance');

  let utxoArray = [];
  let subUTXO = [];

  let listUTXO = await utxoWithdraw(fromAddress);
  if (listUTXO.length > 0) {
    const lengthUTXO = listUTXO.length;
    for (let i = 0; i < lengthUTXO; i++) {
      const utxos = listUTXO[i];
      let utxo = new litecore.Transaction.UnspentOutput({
        "txId": utxos.txid,
        "outputIndex": utxos.vout,
        "address": utxos.address,
        "script": utxos.scriptPubKey,
        "satoshis": utxos.satoshis
      });
      utxoArray.push(utxo);
    }
  }
  let totalAmount = 0,
    sort = utxoArray.sort(sortUTXO),
    lengthSort = sort.length;

  for (let i = 0; i < lengthSort; i++) {
    let utxos = sort[i];
    if (utxos.satoshis >= amountSend) {
      totalAmount = utxos.satoshis;
      subUTXO = [];
      subUTXO.push(utxos);
      break;
    }
    if (totalAmount < amountSend) {
      totalAmount += utxos.satoshis;
      subUTXO.push(utxos);
    }
  }

  // let transaction = new litecore.Transaction().fee(feeRate)
  const transaction = new litecore.Transaction()
    .from(subUTXO)
    .to(toAddress, amountSend)
    .change(fromAddress)
    .sign(privateKey);

  return await new Promise((resolve) => {
    request.post({
      url: `${config.ltcAPIUrl}tx/send`,
      form: {
        rawtx: transaction.toString()
      }
    }, (err, data, body) => {
      if (err) resolve({});
      resolve(body);
    })
  });
}

export {
  getWalletFromMnemonic,
  getAddressFromPrivateKey,
  getBalance,
  getTransaction,
  getHistory,
  utxoWithdraw,
  transferLTC,
  createMnemonic
};