# Ledger Design
Each Transaction has >=2 LedgerEntry rows; signed amounts sum to 0 per currency.
Accounts: cash, user, clearing, revenue, fee, fx. Snapshots capture balances.
Risk hook evaluates ALLOW/REVIEW/HOLD and attaches riskScore (0–100).
