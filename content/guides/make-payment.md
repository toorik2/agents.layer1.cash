# Make a BCH Payment

## Summary

This guide shows an AI agent how to send Bitcoin Cash on mainnet using the `mainnet-js` library. Sending a payment involves specifying the recipient address, amount, and calling `wallet.send()`. The transaction is broadcast to the network and settles via 0-conf in under 3 seconds. No block confirmations need to be awaited.

**Network:** BCH mainnet only.
**Library:** mainnet-js
**Settlement model:** 0-conf (transaction is broadcast and considered final immediately).

---

## Install

```bash
npm install mainnet-js
```

---

## Send a Payment

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

const response = await wallet.send([
  {
    cashaddr: "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k",
    value: 5000,
    unit: "sat",
  },
]);

console.log("Transaction ID:", response.txId);
console.log("Balance after send:", await wallet.getBalance());
```

**Parameters:**
- `cashaddr`: The recipient's BCH address in CashAddr format (`bitcoincash:q...` or `bitcoincash:p...`)
- `value`: The amount to send
- `unit`: `"sat"` for satoshis, `"bch"` for BCH, `"usd"` for USD-equivalent (converted at current rate)

The `send()` method constructs the transaction, signs it with the wallet's private key, and broadcasts it to the network. It returns when the transaction has been accepted by the connected node.

---

## Fee Calculation

Fees in `mainnet-js` are calculated automatically at approximately **1 satoshi per byte** of transaction data.

- A typical single-input, single-output transaction is ~220 bytes = ~220 satoshis fee (~0.001 USD)
- A transaction with multiple inputs or outputs is proportionally larger
- Fees are based on transaction size in bytes, not on the amount transferred
- Sending $0.01 and sending $10,000 cost the same fee

You do not need to manually set the fee. `mainnet-js` handles it.

---

## Send to Multiple Recipients

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

const response = await wallet.send([
  {
    cashaddr: "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k",
    value: 3000,
    unit: "sat",
  },
  {
    cashaddr: "bitcoincash:qpgn5ka4jptc05ug43apnhec5z7faxsv5ut9lkpyk",
    value: 2000,
    unit: "sat",
  },
]);

console.log("Transaction ID:", response.txId);
```

Multiple outputs in a single transaction are more efficient than separate transactions. The fee overhead per additional output is only ~34 bytes (~34 satoshis).

---

## Send All Funds (Max Send)

To send the entire wallet balance to a single address:

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

const response = await wallet.sendMax(
  "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k"
);

console.log("Transaction ID:", response.txId);
console.log("Remaining balance:", await wallet.getBalance()); // Should be 0
```

`sendMax()` calculates the fee and sends the remaining balance. No change output is created.

---

## Verify Broadcast Success

The `send()` call returns a response object. If the transaction was successfully broadcast, `response.txId` will be a 64-character hexadecimal string (the transaction hash).

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

try {
  const response = await wallet.send([
    {
      cashaddr: "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k",
      value: 5000,
      unit: "sat",
    },
  ]);

  if (response.txId && response.txId.length === 64) {
    console.log("Transaction broadcast successfully");
    console.log("txId:", response.txId);
    // The transaction is now in the mempool and considered settled (0-conf)
  } else {
    console.error("Unexpected response:", response);
  }
} catch (error) {
  console.error("Send failed:", error);
}
```

Once `txId` is returned, the payment is done. The recipient will see the transaction in their mempool within seconds. No further action is required.

---

## Error Handling

### Insufficient Funds

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

try {
  const response = await wallet.send([
    {
      cashaddr: "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k",
      value: 999999999999, // More than wallet balance
      unit: "sat",
    },
  ]);
} catch (error: any) {
  if (error.message?.includes("Insufficient")) {
    console.error("Not enough funds in wallet");
    const balance = await wallet.getBalance();
    console.error("Current balance:", balance, "satoshis");
  } else {
    console.error("Unexpected error:", error.message);
  }
}
```

**Before sending, check balance:**

```typescript
const balance = await wallet.getBalance();
const amountToSend = 5000;
const estimatedFee = 300; // Conservative estimate for a simple tx

if (balance >= amountToSend + estimatedFee) {
  const response = await wallet.send([
    { cashaddr: recipientAddress, value: amountToSend, unit: "sat" },
  ]);
  console.log("Sent:", response.txId);
} else {
  console.error("Insufficient funds. Need:", amountToSend + estimatedFee, "Have:", balance);
}
```

### Invalid Address

```typescript
try {
  const response = await wallet.send([
    {
      cashaddr: "not-a-valid-address",
      value: 5000,
      unit: "sat",
    },
  ]);
} catch (error: any) {
  console.error("Invalid address:", error.message);
  // Ensure the address starts with "bitcoincash:" for mainnet
}
```

**Address validation tip:** Valid BCH mainnet addresses always start with `bitcoincash:q` (P2PKH) or `bitcoincash:p` (P2SH). If an address does not have the `bitcoincash:` prefix, it may be a legacy format or invalid.

### Below Dust Limit

The minimum output value on BCH is **546 satoshis** (the dust limit). Attempting to send less will fail:

```typescript
// This will fail — below dust limit
await wallet.send([
  { cashaddr: recipientAddress, value: 100, unit: "sat" }, // 100 < 546
]);
```

Always ensure the send amount is at least 546 satoshis.

---

## Send with OP_RETURN Metadata

Attach arbitrary data to a transaction using OP_RETURN. This is useful for embedding payment references, receipts, or machine-readable metadata.

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

const response = await wallet.send([
  {
    cashaddr: "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k",
    value: 5000,
    unit: "sat",
  },
  ["OP_RETURN", "0x6d02", "agent-payment:ref-12345"],
]);

console.log("Transaction with OP_RETURN:", response.txId);
```

OP_RETURN data is limited to 220 bytes per output. The data is stored permanently on the blockchain and can be read by anyone.

---

## Complete Working Example

Full payment flow with validation and error handling:

```typescript
import { Wallet } from "mainnet-js";

interface SendResult {
  success: boolean;
  txId: string | null;
  amountSat: number;
  recipient: string;
  error: string | null;
}

async function makePayment(
  recipientAddress: string,
  amountSat: number,
  reference?: string
): Promise<SendResult> {
  try {
    // Load wallet
    const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);

    // Check balance
    const balance = await wallet.getBalance();
    const balanceSat = balance;
    const estimatedFee = 500; // Conservative fee estimate

    if (balanceSat < amountSat + estimatedFee) {
      return {
        success: false,
        txId: null,
        amountSat,
        recipient: recipientAddress,
        error: `Insufficient funds. Need ${amountSat + estimatedFee} sat, have ${balanceSat} sat`,
      };
    }

    // Check dust limit
    if (amountSat < 546) {
      return {
        success: false,
        txId: null,
        amountSat,
        recipient: recipientAddress,
        error: `Amount ${amountSat} is below dust limit (546 satoshis)`,
      };
    }

    // Build outputs
    const outputs: any[] = [
      { cashaddr: recipientAddress, value: amountSat, unit: "sat" },
    ];

    // Add OP_RETURN if reference provided
    if (reference) {
      outputs.push(["OP_RETURN", "0x6d02", reference]);
    }

    // Send
    const response = await wallet.send(outputs);

    return {
      success: true,
      txId: response.txId,
      amountSat,
      recipient: recipientAddress,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      txId: null,
      amountSat,
      recipient: recipientAddress,
      error: error.message || "Unknown error",
    };
  }
}

// Usage
const result = await makePayment(
  "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k",
  5000,
  "order-abc-123"
);

if (result.success) {
  console.log("Payment sent. txId:", result.txId);
  // The recipient will see this in their mempool within seconds
} else {
  console.error("Payment failed:", result.error);
}
```

---

## Key Points

- **`wallet.send()` broadcasts immediately.** Once it returns a `txId`, the transaction is in the mempool and the payment is settled (0-conf).
- **Fees are automatic.** Do not manually set fees. `mainnet-js` calculates the optimal fee (~1 sat/byte).
- **Always check balance before sending** to provide a clear error instead of an exception.
- **Dust limit is 546 satoshis.** Do not attempt to send less than this per output.
- **The `txId` is your proof of payment.** Share it with the recipient for verification. It is a 64-character hexadecimal string.
- **Mainnet addresses start with `bitcoincash:`**. Reject any address that does not match this format.
