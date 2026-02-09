# BCH Address Monitoring Reference

This reference covers methods for monitoring a Bitcoin Cash address for incoming transactions. All methods work on mainnet and detect transactions at 0-conf (as soon as they enter the mempool).

## Method 1: Wallet Balance Watching (mainnet-js)

The simplest approach. Uses mainnet-js built-in Electrum connection.

```javascript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed("your_seed_phrase");

// Event-based: fires callback when balance changes
wallet.watchBalance((newBalance) => {
  console.log("New balance:", Number(newBalance), "sats");
});
```

Pros:
- Simplest to implement.
- Handles Electrum connection internally.
- Triggers on 0-conf (mempool) transactions.

Cons:
- Monitors the entire wallet, not a single address.
- Requires keeping the process alive.

## Method 2: Polling Balance (mainnet-js)

Periodically check the wallet balance. Suitable for environments where persistent connections are difficult.

```javascript
import { Wallet } from "mainnet-js";

const wallet = await Wallet.fromSeed("your_seed_phrase");

async function pollBalance(intervalMs = 3000) {
  let lastBalance = await wallet.getBalance();

  setInterval(async () => {
    const current = await wallet.getBalance();
    if (current !== lastBalance) {
      console.log(`Balance changed: ${lastBalance} -> ${current} sats`);
      lastBalance = current;
    }
  }, intervalMs);
}

pollBalance(3000); // check every 3 seconds
```

Pros:
- Works in any environment (no persistent connection required per poll).
- Simple logic.

Cons:
- Latency depends on poll interval.
- More network requests than event-based approaches.

## Method 3: Electrum Protocol Subscription

mainnet-js uses the Electrum protocol internally. You can also use it directly for fine-grained control.

The Electrum protocol supports `blockchain.scripthash.subscribe`, which notifies the client when a new transaction involving a specific script hash appears in the mempool or is confirmed.

```javascript
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");

// Subscribe to an address (internally converts to scripthash)
// This is a lower-level approach; mainnet-js abstracts this in wallet.watchBalance
```

Electrum servers used by mainnet-js on mainnet:
- Connections are managed automatically.
- Multiple servers are tried for reliability.
- The protocol operates over TCP/SSL or WebSocket.

## Method 4: WebSocket via Public API

Some BCH infrastructure providers offer WebSocket APIs for transaction notifications.

General pattern:

```javascript
import WebSocket from "ws";

// Connect to a BCH WebSocket service (example pattern)
const ws = new WebSocket("wss://bch-ws-provider.example.com");

ws.on("open", () => {
  // Subscribe to address
  ws.send(JSON.stringify({
    op: "subscribe",
    address: "bitcoincash:qr..."
  }));
});

ws.on("message", (data) => {
  const event = JSON.parse(data);
  if (event.type === "transaction") {
    console.log("Incoming tx:", event.txid, "Amount:", event.amount);
  }
});
```

Note: The specific WebSocket endpoint and message format depend on the provider. The mainnet-js library handles this internally, so prefer using mainnet-js unless you need direct WebSocket control.

## Method 5: UTXO Polling

Instead of checking balance, check for new UTXOs at the address. This gives you transaction-level detail.

```javascript
import { ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");
const address = "bitcoincash:qr...";

async function pollUtxos(address, intervalMs = 3000) {
  let knownUtxos = new Set();

  // Initialize with current UTXOs
  const initial = await provider.getUtxos(address);
  for (const utxo of initial) {
    knownUtxos.add(`${utxo.txid}:${utxo.vout}`);
  }

  setInterval(async () => {
    const current = await provider.getUtxos(address);
    for (const utxo of current) {
      const key = `${utxo.txid}:${utxo.vout}`;
      if (!knownUtxos.has(key)) {
        knownUtxos.add(key);
        console.log("New UTXO detected:", utxo.txid, "vout:", utxo.vout, "value:", utxo.satoshis);
      }
    }
  }, intervalMs);
}
```

Pros:
- Gives per-UTXO detail (txid, vout, amount).
- Can detect multiple payments in the same polling interval.

Cons:
- More complex than balance polling.
- Same latency tradeoff as balance polling.

## Comparison

| Method | Latency | Complexity | Persistent Connection |
|---|---|---|---|
| watchBalance (mainnet-js) | ~1-3 sec | Low | Yes |
| Balance polling | Poll interval | Low | No |
| Electrum subscribe | ~1-3 sec | Medium | Yes |
| WebSocket API | ~1-3 sec | Medium | Yes |
| UTXO polling | Poll interval | Medium | No |

## Recommendation

For most AI agent use cases, use **mainnet-js wallet balance polling** (Method 2) with a 3-second interval. It is simple, reliable, and does not require maintaining a persistent connection. If your environment supports long-lived processes, use **watchBalance** (Method 1) for lower latency.

## 0-Conf Reliability

All methods above detect transactions at the 0-conf stage (mempool acceptance). On BCH mainnet, 0-conf is reliable for standard payment amounts due to the first-seen rule: once a transaction enters the mempool, conflicting transactions are rejected by nodes. This makes 0-conf the standard for payment acceptance.
