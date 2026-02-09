# Accept a BCH Payment

## Summary

This guide shows an AI agent how to accept Bitcoin Cash payments on mainnet. The pattern is: generate a fresh address, share it with the payer, watch for an incoming 0-conf transaction, verify the amount, and consider the payment complete. No block confirmations are needed.

**Network:** BCH mainnet only.
**Library:** mainnet-js
**Settlement model:** 0-conf (transaction is final when seen in the mempool, typically under 3 seconds).

---

## Install

```bash
npm install mainnet-js
```

---

## Payment Flow

```
1. Agent generates a fresh receiving address
2. Agent shares the address and expected amount with the payer
3. Payer broadcasts a BCH transaction to that address
4. Agent detects the transaction in the mempool (0-conf)
5. Agent verifies the received amount matches the expected amount
6. Payment is complete — agent delivers the service
```

No waiting for block confirmations. The transaction is considered settled at step 4.

---

## Why 0-Conf Is Safe

BCH enforces the **first-seen rule**: nodes accept the first valid transaction spending a given UTXO and reject all subsequent attempts. Combined with:

- **No Replace-By-Fee (RBF):** Transactions cannot be replaced once broadcast. This is a protocol-level guarantee on BCH.
- **Adaptive block size (ABLA):** Block size adjusts with demand (32 MB floor, no upper bound). Blocks are never full, so transactions are never evicted from the mempool due to low fees. Every broadcast transaction will be mined.
- **Double-Spend Proofs (DSProofs):** If someone attempts a double-spend, nodes generate and propagate a cryptographic proof. Detection happens in seconds.

For agent-scale payments (typically small amounts), the risk of a successful double-spend against a well-connected node is effectively zero.

---

## Step 1: Generate a Fresh Address

Use a fresh address for each payment to maintain privacy and simplify payment matching.

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

// The simplest approach: use the wallet's deposit address
const paymentAddress = wallet.getDepositAddress();
// Returns: "bitcoincash:qr..."
```

If you need a unique address per payment (recommended for concurrent payments), create a sub-wallet:

```typescript
import { Wallet } from "mainnet-js";

async function generatePaymentAddress(): Promise<{
  address: string;
  wallet: Wallet;
}> {
  // Create a fresh wallet for this specific payment
  const paymentWallet = await Wallet.newRandom();
  const address = paymentWallet.getDepositAddress();
  return { address, wallet: paymentWallet };
}

const payment = await generatePaymentAddress();
console.log("Send payment to:", payment.address);
// Store payment.wallet.mnemonic if you need to recover this wallet later
```

---

## Step 2: Share Address and Expected Amount

Provide the payer with:
- The `bitcoincash:` address
- The expected amount in satoshis (or BCH)

```typescript
const expectedAmountSat = 5000; // 5,000 satoshis

const paymentRequest = {
  address: paymentAddress,
  amount: expectedAmountSat,
  unit: "satoshis",
  // Optional: include a reference ID for your records
  reference: "order-abc-123",
};

// Share this with the payer via your communication channel
console.log("Payment request:", JSON.stringify(paymentRequest));
```

---

## Step 3: Watch for Incoming Transaction

### Method A: Poll the balance (simple)

```typescript
import { Wallet } from "mainnet-js";

async function waitForPayment(
  wallet: Wallet,
  expectedAmountSat: number,
  timeoutMs: number = 600000 // 10 minutes
): Promise<{ paid: boolean; balance: number }> {
  const startTime = Date.now();
  const pollIntervalMs = 3000; // Check every 3 seconds

  while (Date.now() - startTime < timeoutMs) {
    const balance = await wallet.getBalance();

    if (balance >= BigInt(expectedAmountSat)) {
      return { paid: true, balance };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return { paid: false, balance: 0 };
}

// Usage
const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);
const result = await waitForPayment(wallet, 5000);

if (result.paid) {
  console.log("Payment received:", result.balance, "satoshis");
  // Deliver the service
} else {
  console.log("Payment timed out");
}
```

### Method B: Use watchBalance (event-driven)

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);
const expectedAmountSat = 5000;

// watchBalance calls the callback whenever the balance changes
const cancel = wallet.watchBalance(async (newBalance: any) => {
  const satBalance =
    newBalance;

  if (satBalance >= expectedAmountSat) {
    console.log("Payment received:", satBalance, "satoshis");
    cancel(); // Stop watching
    // Deliver the service
  }
});

// To stop watching after a timeout:
setTimeout(() => {
  cancel();
  console.log("Payment watch timed out");
}, 600000); // 10 minutes
```

---

## Step 4: Verify the Amount

Always verify that the received amount meets or exceeds the expected amount. Overpayments are acceptable; underpayments should be rejected or flagged.

```typescript
async function verifyPayment(
  wallet: Wallet,
  expectedAmountSat: number
): Promise<{ verified: boolean; receivedSat: number }> {
  const balance = await wallet.getBalance();
  const receivedSat = balance;

  return {
    verified: receivedSat >= expectedAmountSat,
    receivedSat,
  };
}
```

---

## Complete Working Example

Full payment acceptance flow from start to finish:

```typescript
import { Wallet } from "mainnet-js";

interface PaymentResult {
  success: boolean;
  address: string;
  expectedSat: number;
  receivedSat: number;
  reference: string;
}

async function acceptPayment(
  expectedAmountSat: number,
  reference: string,
  timeoutMs: number = 600000
): Promise<PaymentResult> {
  // Step 1: Load wallet
  const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);
  const address = wallet.getDepositAddress();

  console.log(`Payment request created:`);
  console.log(`  Address: ${address}`);
  console.log(`  Amount: ${expectedAmountSat} satoshis`);
  console.log(`  Reference: ${reference}`);

  // Step 2: Record initial balance (in case wallet already has funds)
  const initialBalance = await wallet.getBalance();
  const initialSat =
    typeof initialBalance === "number" ? initialBalance : 0;

  // Step 3: Wait for incoming payment
  const startTime = Date.now();
  const pollIntervalMs = 3000;

  while (Date.now() - startTime < timeoutMs) {
    const currentBalance = await wallet.getBalance();
    const currentSat =
      currentBalance;
    const received = currentSat - initialSat;

    if (received >= expectedAmountSat) {
      console.log(`Payment received: ${received} satoshis`);
      return {
        success: true,
        address,
        expectedSat: expectedAmountSat,
        receivedSat: received,
        reference,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  // Timeout
  console.log("Payment timed out");
  return {
    success: false,
    address,
    expectedSat: expectedAmountSat,
    receivedSat: 0,
    reference,
  };
}

// Usage
const result = await acceptPayment(5000, "order-abc-123");
if (result.success) {
  // Deliver the service or product
  console.log("Order fulfilled:", result.reference);
}
```

---

## Key Points

- **0-conf is the standard.** Do not wait for block confirmations. The transaction is settled when it appears in the mempool.
- **Use a fresh address per payment** when handling concurrent payments. This avoids ambiguity about which payment corresponds to which order.
- **Poll interval of 3 seconds** is appropriate. BCH transactions propagate in under 3 seconds, so this catches payments promptly without excessive network requests.
- **Always compare against expected amount.** Accept overpayments. Reject or flag underpayments.
- **Timeout is important.** Do not watch indefinitely. Set a reasonable timeout (e.g., 10-30 minutes) and handle the case where payment is not received.
