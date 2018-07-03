'use strict';

import config from './config';
import {
  getWalletFromMnemonic,
  getAddressFromPrivateKey,
  getBalance,
  getTransaction,
  getHistory,
  utxoWithdraw,
  transferLTC,
  createMnemonic
} from './src/litecoin_lib';

(async () => {
  console.log('Start app.....');

  console.log('Create mnemonic: ', await createMnemonic());

  const data = await getWalletFromMnemonic('spatial attitude zone pizza list error mix whale open clinic retire annual', config.testnet);
  console.log('Wallet from mnemonic: ', data);

  // console.log('Get address from privatekey: ', (await getAddressFromPrivateKey('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', config.testnet)).toString())

  console.log('Get balance of address: ', await getBalance('muZpTpBYhxmRFuCjLc7C6BBDF32C8XVJUi', config.mainnet));

  console.log('Get balance of address: ', await getBalance('muR6pDgtVxCgGgfYYo1Tr3v48EanW6RaRU', config.mainnet));

  console.log('Get balance of address: ', await getBalance('msboCpAHFWoVrAVTvULxCzPjL5We3rv3r5', config.mainnet));


  // console.log('Get transaction by txid: ', await getTransaction('91f7f871584ea0050b1adec8c26ff0f38f7fce096a474186b289915464458cdb'))

  // console.log('Get all transaction from address: ', await getHistory('muZpTpBYhxmRFuCjLc7C6BBDF32C8XVJUi', 1, 10))

  // console.log('utxoWithdraw: ', await utxoWithdraw('muZpTpBYhxmRFuCjLc7C6BBDF32C8XVJUi'))

  // console.log('transferLTC: ', await transferLTC('muZpTpBYhxmRFuCjLc7C6BBDF32C8XVJUi', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'msboCpAHFWoVrAVTvULxCzPjL5We3rv3r5', 1))

})().catch(err => {
  console.log('Error app: ', err);
})