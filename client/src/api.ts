import { Account, createTransactionInput } from "./types";

const API_URL = "http://localhost:3001/api";

export const getAccounts = async (): Promise<Account[]> => {
  const response = await fetch(`${API_URL}/accounts`);
  if (!response.ok) {
    throw new Error("Failed to fetch accounts");
  }
  return response.json();
};

export const getAccount = async (id: string): Promise<Account> => {
  const response = await fetch(`${API_URL}/accounts/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch account");
  }
  return response.json();
};

export const createTransaction = async ({
  accountId,
  transactionData,
}: createTransactionInput) => {
  const response = await fetch(
    `${API_URL}/accounts/${accountId}/transactions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to insert account transactions");
  }
  return response.json();
};

export const getTransactions = async (
  id: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await fetch(
    `${API_URL}/accounts/${id}/transactions?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch account transactions");
  }
  return response.json();
};
