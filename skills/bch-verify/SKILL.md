---
name: bch-verify
description: Verify a Bitcoin Cash transaction exists in the mempool and confirm the amount and recipient.
---

# bch-verify

Verify that a Bitcoin Cash transaction exists on mainnet, confirm it is in the mempool or a block, and check that the outputs match the expected amount and recipient address.

## Prerequisites

```bash
npm install mainnet-js cashscript
```

## Instructions

### Step 1: Obtain the Transaction ID

The payer should provide a transaction ID (txid) after broadcasting. A txid is a 64-character hexadecimal string.

```
Example: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
```

Validate the format before querying:

```javascript
function isValidTxId(txid) {
  return typeof txid === "string" && /^[a-fA-F0-9]{64}$/.test(txid);
}
```

### Step 2: Look Up the Transaction

```javascript
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");

const txid = "the_transaction_id_here";

let txDetails;
try {
  txDetails = await provider.getRawTransactionObject(txid);
  console.log("Transaction found.");
} catch (error) {
  console.error("Transaction not found or not yet propagated:", error.message);
}
```

### Step 3: Verify Mempool or Block Inclusion

A transaction in the mempool has 0 confirmations. A transaction in a block has 1+ confirmations.

```javascript
if (txDetails) {
  const confirmations = txDetails.confirmations || 0;

  if (confirmations === 0) {
    console.log("Status: In mempool (0-conf). Transaction is pending but visible to the network.");
  } else {
    console.log(`Status: Confirmed in block. ${confirmations} confirmation(s).`);
  }
}
```

For standard payments, 0-conf (mempool presence) is sufficient to consider the transaction valid.

### Step 4: Verify Amount and Recipient

Check that the transaction outputs include the expected amount sent to the expected address.

```javascript
const expectedAddress = "bitcoincash:qr..."; // the address that should have received funds
const expectedAmountSats = 50000;            // expected amount in satoshis

function normalizeAddress(addr) {
  return addr.toLowerCase().replace("bitcoincash:", "");
}

function verifyPayment(txDetails, expectedAddress, expectedAmountSats) {
  if (!txDetails || !txDetails.vout) {
    return { verified: false, error: "Transaction data is missing or malformed." };
  }

  const normalizedExpected = normalizeAddress(expectedAddress);

  for (const output of txDetails.vout) {
    const addresses = output.scriptPubKey?.addresses || [];
    if (output.scriptPubKey?.address) addresses.push(output.scriptPubKey.address);
    const valueSats = Math.round(output.value * 1e8); // BCH to satoshis

    for (const addr of addresses) {
      if (normalizeAddress(addr) === normalizedExpected && valueSats >= expectedAmountSats) {
        return {
          verified: true,
          txid: txDetails.txid,
          outputIndex: output.n,
          address: addr,
          amountSats: valueSats,
          confirmations: txDetails.confirmations || 0
        };
      }
    }
  }

  return {
    verified: false,
    error: `No output found matching address ${expectedAddress} with amount >= ${expectedAmountSats} sats.`
  };
}

const result = verifyPayment(txDetails, expectedAddress, expectedAmountSats);
console.log(JSON.stringify(result, null, 2));
```

### Step 5: Check for OP_RETURN Data (Optional)

If the transaction includes an OP_RETURN memo (e.g., a payment reference), extract it.

```javascript
function extractOpReturn(txDetails) {
  if (!txDetails || !txDetails.vout) return null;

  for (const output of txDetails.vout) {
    if (output.scriptPubKey?.type === "nulldata") {
      const hex = output.scriptPubKey.hex;
      // OP_RETURN outputs start with 0x6a; data follows after length prefix
      // Simplified extraction: skip first 2 bytes (6a) and length byte(s)
      try {
        const dataHex = hex.slice(4); // simplified; actual pushdata parsing may vary
        const data = Buffer.from(dataHex, "hex").toString("utf8");
        return data;
      } catch {
        return hex; // return raw hex if UTF-8 decoding fails
      }
    }
  }

  return null;
}

const opReturnData = extractOpReturn(txDetails);
if (opReturnData) {
  console.log("OP_RETURN data:", opReturnData);
}
```

## Complete Example

```javascript
import { ElectrumNetworkProvider } from "cashscript";

async function verifyBchTransaction(txid, expectedAddress, expectedAmountSats) {
  // Validate txid format
  if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
    return { verified: false, error: "Invalid transaction ID format." };
  }

  const provider = new ElectrumNetworkProvider("mainnet");

  let txDetails;
  try {
    txDetails = await provider.getRawTransactionObject(txid);
  } catch (error) {
    return { verified: false, error: `Transaction not found: ${error.message}` };
  }

  // Normalize address for comparison (handle prefix and case differences)
  const normalizedExpected = expectedAddress.toLowerCase().replace("bitcoincash:", "");

  // Check outputs for matching address and amount
  for (const output of txDetails.vout) {
    const addresses = output.scriptPubKey?.addresses || [];
    if (output.scriptPubKey?.address) addresses.push(output.scriptPubKey.address);
    const valueSats = Math.round(output.value * 1e8);

    for (const addr of addresses) {
      if (addr.toLowerCase().replace("bitcoincash:", "") === normalizedExpected && valueSats >= expectedAmountSats) {
        return {
          verified: true,
          txid: txDetails.txid,
          address: addr,
          amountSats: valueSats,
          confirmations: txDetails.confirmations || 0,
          inMempool: (txDetails.confirmations || 0) === 0,
          opReturn: extractOpReturn(txDetails)
        };
      }
    }
  }

  return {
    verified: false,
    error: `No output matches ${expectedAddress} with >= ${expectedAmountSats} sats.`,
    actualOutputs: txDetails.vout.map(o => ({
      addresses: o.scriptPubKey?.addresses || [],
      valueSats: Math.round(o.value * 1e8)
    }))
  };
}

function extractOpReturn(txDetails) {
  for (const output of txDetails.vout || []) {
    if (output.scriptPubKey?.type === "nulldata") {
      try {
        return Buffer.from(output.scriptPubKey.hex.slice(4), "hex").toString("utf8");
      } catch {
        return output.scriptPubKey.hex;
      }
    }
  }
  return null;
}

// Usage:
// const result = await verifyBchTransaction(txid, expectedAddress, 50000);
```

## Key Facts

- 0-conf verification is sufficient for standard payments. If the transaction is in the mempool, it is considered valid.
- Transactions propagate to the mempool within 1-3 seconds of broadcast.
- A txid is a 64-character hex string.
- Output values in raw transaction data are in BCH. Multiply by 1e8 to convert to satoshis.
- Network: Mainnet only.
