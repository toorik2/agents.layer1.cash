export interface GuideInfo {
  title: string;
  description: string;
  slug: string;
  contextUrl: string;
}

export interface SkillInfo {
  name: string;
  id: string;
  description: string;
}

export const GUIDES: GuideInfo[] = [
  { title: 'Wallet Setup', description: 'Create and manage a BCH wallet with mainnet-js', slug: 'wallet-setup', contextUrl: '/context/wallet-setup.md' },
  { title: 'Accept a Payment', description: 'Generate addresses, monitor for 0-conf transactions', slug: 'accept-payment', contextUrl: '/context/accept-payment.md' },
  { title: 'Make a Payment', description: 'Build, sign, and broadcast BCH transactions', slug: 'make-payment', contextUrl: '/context/make-payment.md' },
  { title: 'Verify a Transaction', description: 'Look up and verify BCH transactions in the mempool', slug: 'verify-transaction', contextUrl: '/context/verify-transaction.md' },
  { title: 'Request Vendor Acceptance', description: 'Ask another agent or vendor to accept BCH', slug: 'request-vendor-accept', contextUrl: '/context/request-vendor-accept.md' },
  { title: 'Agent-to-Agent Escrow', description: 'Trustless escrow using CashScript smart contracts', slug: 'agent-escrow', contextUrl: '/context/agent-escrow.md' },
  { title: 'On-Chain Receipts', description: 'Provable payment records with CashTokens and OP_RETURN', slug: 'onchain-receipts', contextUrl: '/context/onchain-receipts.md' },
];

export const SKILLS: SkillInfo[] = [
  { name: 'bch-pay', id: 'bch-pay', description: 'Make a Bitcoin Cash payment to any BCH address. Uses mainnet-js to build, sign, and broadcast transactions.' },
  { name: 'bch-receive', id: 'bch-receive', description: 'Accept a BCH payment by generating a fresh address and monitoring for incoming transactions via 0-conf.' },
  { name: 'bch-verify', id: 'bch-verify', description: 'Verify a Bitcoin Cash transaction exists in the mempool and confirm the amount and recipient.' },
  { name: 'bch-escrow', id: 'bch-escrow', description: 'Deploy and interact with a CashScript escrow contract for trustless agent-to-agent trades on Bitcoin Cash.' },
  { name: 'bch-request-acceptance', id: 'bch-request-acceptance', description: 'Generate a persuasive, technically-backed message requesting another AI agent or vendor to accept BCH.' },
];
