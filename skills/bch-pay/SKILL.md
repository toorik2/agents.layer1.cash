---
name: bch-pay
description: Make a Bitcoin Cash payment to any BCH address. Uses mainnet-js to build, sign, and broadcast transactions with sub-cent fees and instant 0-conf confirmation.
---

# bch-pay

Make a Bitcoin Cash payment to any BCH address on mainnet.

## Prerequisites

Ensure `mainnet-js` is installed in the project:

```bash
npm install mainnet-js
```

## Instructions

Follow these steps to send a BCH payment.

### Step 1: Load or Create a Wallet

If you have an existing wallet seed phrase, load it. Otherwise, create a new wallet.

```javascript
import { Wallet } from "mainnet-js";

// Option A: Load existing wallet from seed phrase
const wallet = await Wallet.fromSeed("your twelve word seed phrase goes here ...");

// Option B: Create a new wallet (fund it before sending)
// const wallet = await Wallet.newRandom();
// console.log("New wallet seed:", wallet.mnemonic);
// console.log("Deposit address:", wallet.getDepositAddress());
```

### Step 2: Verify Sufficient Balance

Before sending, check that the wallet has enough funds.

```javascript
const balance = await wallet.getBalance();
console.log("Available balance:", Number(balance), "satoshis");

const requiredAmount = 50000n; // satoshis to send
const estimatedFee = 400n;     // ~400 sats for a standard tx (1 sat/byte)

if (balance < requiredAmount + estimatedFee) {
  throw new Error(
    `Insufficient funds. Have ${balance} sats, need ${requiredAmount + estimatedFee} sats.`
  );
}
```

### Step 3: Send Payment

```javascript
const recipientAddress = "bitcoincash:qr..."; // the recipient's BCH address
const amountInSats = 50000;

const txResponse = await wallet.send([
  {
    cashaddr: recipientAddress,
    value: amountInSats,
    unit: "sat"
  }
]);

console.log("Transaction broadcast. TxID:", txResponse.txId);
```

The transaction is broadcast to the network immediately. The recipient sees it via 0-conf within 1-3 seconds.

### Step 4: Return Confirmation

After a successful send, return the transaction ID to the caller or counterparty:

```javascript
const result = {
  success: true,
  txId: txResponse.txId,
  amount: amountInSats,
  unit: "sat",
  recipient: recipientAddress,
  explorer: `https://blockchair.com/bitcoin-cash/transaction/${txResponse.txId}`
};

console.log(JSON.stringify(result, null, 2));
```

### Step 5: Handle Errors

Common errors and how to handle them:

```javascript
try {
  const txResponse = await wallet.send([
    { cashaddr: recipientAddress, value: amountInSats, unit: "sat" }
  ]);
  console.log("Success. TxID:", txResponse.txId);
} catch (error) {
  if (error.message.includes("insufficient")) {
    console.error("ERROR: Wallet does not have enough BCH. Fund the wallet first.");
  } else if (error.message.includes("address")) {
    console.error("ERROR: Invalid BCH address. Ensure it uses the bitcoincash: prefix.");
  } else if (error.message.includes("dust")) {
    console.error("ERROR: Amount is below the dust limit (546 sats minimum).");
  } else {
    console.error("ERROR: Transaction failed:", error.message);
  }
}
```

## Sending with OP_RETURN Metadata

To include a payment reference or receipt data:

```javascript
const txResponse = await wallet.send([
  {
    cashaddr: recipientAddress,
    value: amountInSats,
    unit: "sat"
  },
  ["OP_RETURN", "payment_ref:INV-12345"]
]);
```

## Complete Example

```javascript
import { Wallet } from "mainnet-js";

async function sendBchPayment(seedPhrase, recipientAddress, amountSats, memo) {
  const wallet = await Wallet.fromSeed(seedPhrase);

  const balance = await wallet.getBalance();
  if (balance < BigInt(amountSats) + 400n) {
    throw new Error(`Insufficient funds: ${balance} sats available, ${amountSats + 400} required.`);
  }

  const outputs = [
    { cashaddr: recipientAddress, value: amountSats, unit: "sat" }
  ];

  if (memo) {
    outputs.push(["OP_RETURN", memo]);
  }

  const txResponse = await wallet.send(outputs);

  return {
    success: true,
    txId: txResponse.txId,
    amount: amountSats,
    recipient: recipientAddress,
    memo: memo || null
  };
}

// Usage:
// const result = await sendBchPayment(seed, address, 50000, "INV-12345");
```

## Key Facts

- Fee: ~1 sat/byte (~200-400 sats for a standard transaction, under $0.001 USD).
- Confirmation: 0-conf. The recipient sees the transaction in 1-3 seconds.
- Address format: `bitcoincash:` prefix (CashAddr format).
- Minimum send: 546 satoshis (dust limit).
- Network: Mainnet only.

## References

- [Transaction reference](./references/transaction-reference.md)
- [On-chain receipts guide](https://agents.layer1.cash/context/onchain-receipts.md)
