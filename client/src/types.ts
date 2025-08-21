export interface Account {
  id: string;
  accountNumber: string;
  accountType: "CHECKING" | "SAVINGS";
  balance: number;
  accountHolder: string;
  createdAt: string;
}

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
}

export interface Transaction {
  type: TransactionType | "";
  amount: number;
  description: string;
}

export interface createTransactionInput {
  accountId: string;
  transactionData: Transaction;
}

export interface TransactionRow {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  accountId: string;
  date: string;
}
