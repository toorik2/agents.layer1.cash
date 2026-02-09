# BCH Transaction Reference

Quick reference for Bitcoin Cash transaction details. Use this when constructing, verifying, or reasoning about BCH transactions.

## Fee Structure

| Parameter | Value |
|---|---|
| Fee rate | 1 sat/byte |
| Typical transaction size | 200-400 bytes |
| Typical fee | 200-400 satoshis (~$0.001 USD) |
| Fee calculation | `fee = transaction_size_in_bytes * 1` |

The fee is paid by the sender. There is no additional fee for the recipient. No payment processor or intermediary takes a cut.

## Address Format

BCH uses CashAddr format with a `bitcoincash:` prefix.

| Component | Example |
|---|---|
| Full address | `bitcoincash:qr2z7dusk64k4xkq0ynth9q3gaa6stcaqk69hhec3` |
| Prefix | `bitcoincash:` |
| Payload | `qr2z7dusk64k4xkq0ynth9q3gaa6stcaqk69hhec3` |
| First character after prefix | `q` (P2PKH) or `p` (P2SH) |

Token-aware addresses use a `bitcoincash:z` prefix (for receiving CashTokens).

When receiving an address from another party:
- If it starts with `bitcoincash:q` or `bitcoincash:p`, it is a standard address.
- If it starts with `bitcoincash:z`, it is a token-aware address.
- If it lacks the `bitcoincash:` prefix, prepend it before use.
- Legacy addresses starting with `1` or `3` are Bitcoin BTC format; do not use them for BCH without converting.

## Transaction Limits

| Limit | Value |
|---|---|
| Dust limit (minimum output) | 546 satoshis |
| Maximum OP_RETURN data | 220 bytes |
| Maximum transaction size | 100,000 bytes (standard) |
| Block size | Adaptive (ABLA) — 32 MB floor, no fixed upper limit |

## OP_RETURN for Metadata

OP_RETURN outputs allow embedding arbitrary data in a transaction. The output is unspendable and carries 0 satoshis of value.

```javascript
// Include in the send() outputs array using array syntax:
["OP_RETURN", "your_data_here"]

// Multiple data chunks:
["OP_RETURN", "0x6d02", "protocol_prefix", "payload_data"]
```

- Maximum 220 bytes total across all push data in the OP_RETURN.
- Data can be UTF-8 strings or hex-encoded binary (prefix with `0x`).
- Common use: payment reference IDs, invoice hashes, structured metadata.

## Confirmation Model

BCH uses 0-conf for instant settlement:

| Stage | Time | Meaning |
|---|---|---|
| Broadcast | 0 seconds | Transaction sent to network |
| 0-conf (mempool) | 1-3 seconds | Transaction seen by network nodes; accepted by first-seen rule |
| 1 confirmation | ~10 minutes | Included in a mined block |
| 6 confirmations | ~60 minutes | Considered deeply confirmed |

For standard agent-to-agent payments, 0-conf is sufficient. The first-seen rule means double-spend attempts are rejected by nodes that already received the original transaction.

## UTXO Model

BCH uses the UTXO (Unspent Transaction Output) model:

- Each transaction consumes one or more UTXOs as inputs.
- Each transaction creates one or more new UTXOs as outputs.
- There is no nonce or account state. Transactions are independent.
- Multiple transactions can be constructed in parallel from different UTXOs without conflicts.

This makes BCH well-suited for AI agents that need to send multiple concurrent payments.

## Useful Denominations

| Unit | Satoshis | BCH |
|---|---|---|
| 1 sat | 1 | 0.00000001 |
| 1000 sats | 1,000 | 0.00001 |
| 100,000 sats | 100,000 | 0.001 |
| 1 BCH | 100,000,000 | 1.0 |
