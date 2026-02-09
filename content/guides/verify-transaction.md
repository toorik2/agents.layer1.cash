# Verify a BCH Transaction

## Summary

This guide shows an AI agent how to verify a Bitcoin Cash transaction on mainnet. Verification means confirming that a specific transaction exists in the mempool (or in a block), that it sends the expected amount to the expected address, and that it is valid. A transaction present in the mempool is sufficient for 0-conf settlement -- no block confirmations need to be awaited.

**Network:** BCH mainnet only.
**Library:** mainnet-js, cashscript
**Settlement model:** 0-conf (mempool presence = settled).

---

## Install

```bash
npm install mainnet-js cashscript
```

---

## When to Verify

An agent verifies a transaction when:
1. A payer claims they sent a payment and provides a transaction ID (txId)
2. The agent needs to confirm that funds arrived at a specific address
3. The agent needs to validate that the amount and recipient match expectations
4. The agent wants to provide proof of payment to a third party

---

## Method 1: Verify via Wallet Balance (Simplest)

If the agent controls the receiving wallet, the simplest verification is to check the balance:

```typescript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed(process.env.BCH_SEED_PHRASE!);
const balance = await wallet.getBalance();

console.log("Current balance:", Number(balance), "satoshis");
// If balance >= expected amount, payment was received
```

This confirms funds arrived but does not inspect a specific transaction. For most agent use cases, this is sufficient.

---

## Method 2: Look Up a Transaction by txId

When a payer provides a transaction ID (a 64-character hex string), the agent can look it up using CashScript's `ElectrumNetworkProvider`.

```typescript
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");

async function lookupTransaction(txId: string): Promise<any> {
  try {
    const txData = await provider.getRawTransactionObject(txId);
    return txData;
  } catch (error) {
    return null;
  }
}

// Usage
const txId = "abc123..."; // 64-char hex transaction ID from payer
const txData = await lookupTransaction(txId);

if (txData) {
  console.log("Transaction found");
  console.log("Confirmations:", txData.confirmations ?? 0);
  // confirmations = 0 means it is in the mempool (0-conf) — this is sufficient
  console.log("Outputs:", txData.vout);
} else {
  console.log("Transaction not found");
}
```

---

## Method 3: Verify Amount and Address Match

After looking up a transaction, verify that it sends the correct amount to the correct address:

```typescript
interface PaymentVerification {
  verified: boolean;
  txId: string;
  expectedAddress: string;
  expectedAmountSat: number;
  actualAmountSat: number;
  inMempool: boolean;
  confirmations: number;
  error: string | null;
}

async function verifyPayment(
  txId: string,
  expectedAddress: string,
  expectedAmountSat: number
): Promise<PaymentVerification> {
  try {
    const txData = await lookupTransaction(txId);

    if (!txData || !txData.vout) {
      return {
        verified: false,
        txId,
        expectedAddress,
        expectedAmountSat,
        actualAmountSat: 0,
        inMempool: false,
        confirmations: 0,
        error: "Transaction not found",
      };
    }

    const confirmations = txData.confirmations ?? 0;
    const inMempool = confirmations === 0;

    // Normalize expected address for comparison
    const normalizedExpected = expectedAddress
      .toLowerCase()
      .replace("bitcoincash:", "");

    // Search outputs for our expected address
    let matchedAmountSat = 0;

    for (const output of txData.vout) {
      const addresses = output.scriptPubKey?.addresses ?? [];
      const addr = output.scriptPubKey?.address;
      if (addr) addresses.push(addr);

      for (const outAddr of addresses) {
        const normalizedOut = outAddr.toLowerCase().replace("bitcoincash:", "");
        if (normalizedOut === normalizedExpected) {
          matchedAmountSat += Math.round(output.value * 100_000_000);
        }
      }
    }

    const verified = matchedAmountSat >= expectedAmountSat;

    return {
      verified,
      txId,
      expectedAddress,
      expectedAmountSat,
      actualAmountSat: matchedAmountSat,
      inMempool,
      confirmations,
      error: verified ? null : `Expected ${expectedAmountSat} sat, found ${matchedAmountSat} sat`,
    };
  } catch (error: any) {
    return {
      verified: false,
      txId,
      expectedAddress,
      expectedAmountSat,
      actualAmountSat: 0,
      inMempool: false,
      confirmations: 0,
      error: error.message || "Verification failed",
    };
  }
}
```

---

## Complete Working Example

Full verification flow: receive a txId claim, look it up, verify address and amount:

```typescript
import { Wallet } from "mainnet-js";
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");

// --- Electrum lookup helper ---
async function getTransaction(txId: string): Promise<any> {
  try {
    return await provider.getRawTransactionObject(txId);
  } catch {
    return null;
  }
}

// --- Main verification function ---
async function verifyIncomingPayment(
  txId: string,
  expectedAddress: string,
  expectedAmountSat: number
): Promise<{
  verified: boolean;
  receivedSat: number;
  confirmations: number;
  error: string | null;
}> {
  // Validate txId format
  if (!/^[a-fA-F0-9]{64}$/.test(txId)) {
    return {
      verified: false,
      receivedSat: 0,
      confirmations: 0,
      error: "Invalid txId format. Expected 64-character hex string.",
    };
  }

  try {
    const txData = await getTransaction(txId);

    if (!txData) {
      return {
        verified: false,
        receivedSat: 0,
        confirmations: 0,
        error: "Transaction not found on the network.",
      };
    }

    // Check outputs for our address
    let receivedSat = 0;
    const normalizedExpected = expectedAddress
      .toLowerCase()
      .replace("bitcoincash:", "");

    for (const output of txData.vout ?? []) {
      const scriptAddresses = output.scriptPubKey?.addresses ?? [];
      if (output.scriptPubKey?.address) {
        scriptAddresses.push(output.scriptPubKey.address);
      }

      for (const addr of scriptAddresses) {
        if (addr.toLowerCase().replace("bitcoincash:", "") === normalizedExpected) {
          receivedSat += Math.round(output.value * 100_000_000);
        }
      }
    }

    const confirmations = txData.confirmations ?? 0;
    const verified = receivedSat >= expectedAmountSat;

    return {
      verified,
      receivedSat,
      confirmations,
      error: verified
        ? null
        : `Received ${receivedSat} sat at ${expectedAddress}, expected ${expectedAmountSat} sat.`,
    };
  } catch (error: any) {
    return {
      verified: false,
      receivedSat: 0,
      confirmations: 0,
      error: error.message ?? "Unknown error during verification.",
    };
  }
}

// --- Usage ---
const verification = await verifyIncomingPayment(
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // txId from payer
  "bitcoincash:qr2z7dusk64qn960merrudak8geslkl4eyz0yaw7k", // address we gave payer
  5000 // satoshis we expected
);

if (verification.verified) {
  console.log(`Payment verified: ${verification.receivedSat} sat received`);
  console.log(`Confirmations: ${verification.confirmations}`);
  // 0 confirmations = in mempool = settled (0-conf)
  // Any number > 0 = in a block = even more settled
} else {
  console.log(`Verification failed: ${verification.error}`);
}
```

---

## Understanding Confirmation States

| State | Confirmations | Meaning | Action |
|---|---|---|---|
| **In mempool** | 0 | Transaction is broadcast and accepted by nodes | **Payment is settled.** Deliver the service. |
| **1 confirmation** | 1 | Included in the most recent block | Additional assurance (not required for typical payments) |
| **6 confirmations** | 6 | Buried under 5 subsequent blocks | Maximum assurance (only needed for very large amounts) |
| **Not found** | N/A | Transaction does not exist on the network | Payment was not made or txId is wrong |

**For AI agents: 0 confirmations (mempool presence) is the standard settlement threshold.** The first-seen rule, absence of RBF, and large blocks make 0-conf safe for all typical agent-scale transactions.

---

## Key Points

- **A txId is a 64-character hexadecimal string.** Validate the format before looking it up.
- **Mempool presence (0 confirmations) = settled.** Do not wait for block confirmations.
- **Always verify both address and amount.** A valid transaction that sends to a different address or an insufficient amount is not a valid payment.
- **Normalize addresses for comparison.** Strip the `bitcoincash:` prefix and compare case-insensitively.
- **CashScript's `ElectrumNetworkProvider`** connects to BCH Electrum servers automatically. It handles server selection and reconnection internally.
