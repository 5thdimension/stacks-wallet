import { network, transactions, config } from "blockstack";
import { c32address, c32ToB58, versions } from "c32check";
import Transport from "@ledgerhq/hw-transport-node-hid";
import btc from "bitcoinjs-lib";
import { sumUTXOs, toBigInt } from "@utils/utils";
import { TrezorSigner } from "@vendor/blockstack-trezor";
import { LedgerSigner } from "@vendor/blockstack-ledger";
import { WALLET_TYPES } from "@stores/reducers/wallet";
import { PATH } from "@common/constants";

export const ERRORS = {
  // not enough btc for fees
  INSUFFICIENT_BTC_BALANCE: {
    error: true,
    type: "INSUFFICIENT_BTC_BALANCE",
    message: "Insufficient Bitcoin balance to fund transaction fees."
  },
  PENDING_CONFIRMATIONS: {
    error: true,
    type: "PENDING_CONFIRMATIONS",
    message: "Your BTC is still being confirmed. Please try again later."
  },
  // not enough stx to send
  INSUFFICIENT_STX_BALANCE: {
    error: true,
    type: "INSUFFICIENT_STX_BALANCE",
    message: "Insufficient Stacks balance."
  },
  // locked tokens error
  LOCKED_TOKENS: {
    error: true,
    type: "LOCKED_TOKENS",
    message:
      "Token transfer cannot be safely sent. Tokens have not been unlocked."
  },
  // generic error
  TRANSACTION_ERROR: (message = "Token transfer cannot be safely sent.") => ({
    error: true,
    type: "TRANSACTION_ERROR",
    message
  })
};

/**
 * prepareTransaction
 *
 * This will generate and sign our transaction with either a ledger or trezor
 *
 * @param {string} senderAddress - from Stacks address
 * @param {string} recipientAddress - to Stacks address
 * @param {object} amount - the amount of stacks to send
 * @param {string} walletType - one of WALLET_TYPES.TREZOR or WALLET_TYPES.LEDGER
 * @param {string} memo - the message for the tx
 */

const prepareTransaction = async (
  senderAddress,
  recipientAddress,
  amount,
  walletType,
  memo = ""
) => {
  // generate our btc addresses for sender and recipient
  const senderBtcAddress = c32ToB58(senderAddress);
  const recipientBtcAddress = c32ToB58(recipientAddress);

  // define token type (always stacks)
  const tokenType = "STACKS";

  const tokenAmount = toBigInt(amount); // convert to bigi

  // get an estimate
  const utxos = await config.network.getUTXOs(senderBtcAddress);
  const numUTXOs = utxos.length;

  const estimate =
    (await transactions.estimateTokenTransfer(
      recipientBtcAddress,
      tokenType,
      tokenAmount,
      memo,
      numUTXOs
    )) + 5500;

  // current BTC balance
  const btcBalance = sumUTXOs(utxos);

  // account status
  const accountStatus = await config.network.getAccountStatus(
    senderBtcAddress,
    tokenType
  );
  // current STACKS balance
  const currentAccountBalance = await config.network.getAccountBalance(
    senderBtcAddress,
    tokenType
  );

  // current Block Height
  const blockHeight = await config.network.getBlockHeight();

  // check for our errors

  // not enough btc
  if (btcBalance < estimate) {
    return {
      ...ERRORS.INSUFFICIENT_BTC_BALANCE,
      estimate,
      btcBalance,
      difference: estimate - btcBalance
    };
  }
  // not enough stacks (should be impossible to get here)
  if (currentAccountBalance.compareTo(tokenAmount) < 0) {
    return ERRORS.INSUFFICIENT_STX_BALANCE;
  }

  // not enough tokens unlocked or no unlocked tokens  (should be impossible to get here)
  if (accountStatus.lock_transfer_block_id > blockHeight) {
    return ERRORS.LOCKED_TOKENS;
  }

  return {
    senderBtcAddress,
    recipientBtcAddress,
    tokenType,
    tokenAmount,
    utxos,
    numUTXOs,
    estimate,
    btcBalance,
    accountStatus,
    currentAccountBalance,
    blockHeight
  };
};

/**
 * generateTransaction
 *
 * This will generate and sign our transaction with either a ledger or trezor
 *
 * @param {string} senderAddress - from Stacks address
 * @param {string} recipientAddress - to Stacks address
 * @param {object} amount - the amount of stacks to send
 * @param {string} walletType - one of WALLET_TYPES.TREZOR or WALLET_TYPES.LEDGER
 * @param {string} memo - the message for the tx
 */
const generateTransaction = async (
  senderAddress,
  recipientAddress,
  amount,
  walletType,
  memo = ""
) => {
  try {
    const tx = await prepareTransaction(
      senderAddress,
      recipientAddress,
      amount,
      walletType,
      memo
    );

    // if we don't have an obj from this, return generic error (should be impossible)
    if (!tx) return ERRORS.TRANSACTION_ERROR();

    // if we have an error, return it.
    if (tx.error) {
      return tx;
    }

    // define our signer
    const isLedger = walletType === WALLET_TYPES.LEDGER;
    const signer = isLedger
      ? new LedgerSigner(PATH, Transport)
      : new TrezorSigner(PATH, tx.senderBtcAddress);

    // if we get here there are no errors
    const rawTx = await transactions.makeTokenTransfer(
      tx.recipientBtcAddress,
      tx.tokenType,
      tx.tokenAmount,
      memo,
      signer
    );
    return {
      fee: tx.estimate,
      rawTx
    };
  } catch (e) {
    console.log("ERROR", e);
    return ERRORS.TRANSACTION_ERROR(e.message);
  }
};

/**
 * postTransaction
 *
 *
 */
const postTransaction = async rawTx => {
  const form = new FormData();
  form.append("tx", rawTx);
  return fetch(`${config.network.btc.utxoProviderUrl}/pushtx?cors=true`, {
    method: "POST",
    body: form
  });
};

/**
 * broadcastTransaction
 *
 * This will broadcast our transaction
 * @param {string} rawTx - the raw tx
 */

const broadcastTransaction = async rawTx => {
  try {
    // return Promise.resolve("txHash");
    const response = await postTransaction(rawTx);
    const text = await response.text();
    const success = text.toLowerCase().indexOf("transaction submitted") >= 0;
    if (success) {
      // generate tx hash
      return btc.Transaction.fromHex(rawTx)
        .getHash()
        .reverse()
        .toString("hex"); // big_endian
    } else {
      await Promise.reject(
        `Broadcast transaction failed with message: ${text}`
      );
    }
  } catch (e) {
    console.log(e);
    throw new Error(e.message);
  }
};

export { generateTransaction, broadcastTransaction, prepareTransaction };
