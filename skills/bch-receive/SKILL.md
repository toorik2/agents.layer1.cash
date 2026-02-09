---
name: bch-receive
description: Accept a Bitcoin Cash payment by generating a fresh address and monitoring for incoming transactions via 0-conf.
---

# bch-receive

Accept a Bitcoin Cash payment on mainnet by generating a fresh receiving address and monitoring it for incoming transactions.

## Prerequisites

```bash
npm install mainnet-js
```

## Instructions

### Step 1: Load or Create a Wallet

```javascript
import { Wallet } from "mainnet-js";

// Option A: Load existing wallet
const wallet = await Wallet.fromSeed("your twelve word seed phrase goes here ...");

// Option B: Create new wallet
// const wallet = await Wallet.newRandom();
// console.log("SAVE THIS SEED:", wallet.mnemonic);
```

### Step 2: Generate a Fresh Receiving Address

Always generate a fresh address for each payment to maintain privacy and simplify payment matching.

```javascript
const depositAddress = wallet.getDepositAddress();
console.log("Send payment to:", depositAddress);
```

Share this address with the payer. The address uses CashAddr format with `bitcoincash:` prefix.

### Step 3: Communicate Payment Details to Payer

Provide the payer with:

```javascript
const paymentRequest = {
  address: depositAddress,
  amount: 50000,          // requested amount in satoshis
  unit: "sat",
  memo: "Payment for service X"  // optional reference
};

console.log(JSON.stringify(paymentRequest, null, 2));
```

### Step 4: Monitor for Incoming Payment (Event-Based)

Use `waitForTransaction` or `watchBalance` to detect incoming payments via 0-conf.

```javascript
// Watch for balance changes (triggers on 0-conf)
wallet.watchBalance((newBalance) => {
  console.log("Balance changed:", Number(newBalance), "satoshis");
});
```

### Step 5: Monitor for Incoming Payment (Polling-Based)

If event-based monitoring is not available in your environment, poll at intervals.

```javascript
const expectedAmount = 50000; // satoshis
const pollInterval = 3000;    // 3 seconds
const maxWaitTime = 600000;   // 10 minutes

async function waitForPayment(wallet, expectedAmount, pollInterval, maxWaitTime) {
  const startBalance = await wallet.getBalance();
  const deadline = Date.now() + maxWaitTime;

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const currentBalance = await wallet.getBalance();
    const received = currentBalance - startBalance;

    if (received >= BigInt(expectedAmount)) {
      return {
        success: true,
        received: Number(received),
        totalBalance: Number(currentBalance)
      };
    }
  }

  return {
    success: false,
    error: "Payment not received within timeout"
  };
}

const result = await waitForPayment(wallet, expectedAmount, pollInterval, maxWaitTime);
console.log(JSON.stringify(result, null, 2));
```

### Step 6: Verify the Payment Amount

After detecting a payment, verify the exact amount received.

```javascript
const balance = await wallet.getBalance();
console.log("Total balance:", Number(balance), "satoshis");

// Get recent transactions to find the specific payment
// wallet.getHistory() returns an array of { txId: string, height: number, ... }
// sorted with most recent first
const history = await wallet.getHistory();
const latestTx = history[0]; // most recent transaction

console.log("Latest transaction ID:", latestTx.txId);
```

### Step 7: Acknowledge Payment

Return confirmation to the payer or to your own system.

```javascript
const receipt = {
  success: true,
  txId: latestTx.txId,
  amountReceived: Number(balance),
  address: depositAddress,
  timestamp: new Date().toISOString(),
  explorer: `https://blockchair.com/bitcoin-cash/transaction/${latestTx.txId}`
};

console.log(JSON.stringify(receipt, null, 2));
```

## Complete Example

```javascript
import { Wallet } from "mainnet-js";

async function acceptPayment(seedPhrase, expectedAmountSats, timeoutMs = 600000) {
  const wallet = await Wallet.fromSeed(seedPhrase);
  const address = wallet.getDepositAddress();

  console.log("Waiting for payment of", expectedAmountSats, "sats to", address);

  const startBalance = await wallet.getBalance();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    const currentBalance = await wallet.getBalance();
    const received = currentBalance - startBalance;

    if (received >= BigInt(expectedAmountSats)) {
      const history = await wallet.getHistory();
      return {
        success: true,
        address: address,
        received: Number(received),
        txId: history[0]?.txId || "unknown",
        timestamp: new Date().toISOString()
      };
    }
  }

  return { success: false, address: address, error: "Timeout: no payment received" };
}

// Usage:
// const result = await acceptPayment(mySeed, 50000);
```

## Key Facts

- 0-conf transactions appear within 1-3 seconds of broadcast.
- Each address can receive multiple transactions, but using one address per payment is best practice.
- No account setup, API key, or registration is required.
- The wallet seed phrase is the only secret. Store it securely.
- Network: Mainnet only.

## References

- [Address monitoring reference](./references/address-monitoring.md)
- [Transaction reference](https://agents.layer1.cash/skills/bch-pay/references/transaction-reference.md)
