/**
 * AccountList Component
 *
 * TECHNICAL ASSESSMENT NOTES:
 * This is a basic implementation with intentional areas for improvement:
 * - Basic error handling
 * - Simple loading state
 * - No skeleton loading
 * - No retry mechanism
 * - No pagination
 * - No sorting/filtering
 * - No animations
 * - No accessibility features
 * - No tests
 *
 * Candidates should consider:
 * - Component structure
 * - Error boundary implementation
 * - Loading states and animations
 * - User feedback
 * - Performance optimization
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Testing strategy
 */

import { useState, useEffect } from "react";
import { Account, TransactionRow } from "../types";
import { createTransaction, getAccounts, getTransactions } from "../api";
import styles from "./AccountList.module.css";
import { Transaction } from "./../types";

export function AccountList() {
  // Basic state management - Consider using more robust state management for larger applications
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreateTransactionModal, setOpenCreateTransactionModal] =
    useState<boolean>(false);
  const [openViewTransactionModal, setOpenViewTransactionModal] =
    useState<boolean>(false);
  const [accountId, setAccountId] = useState<string>("");
  const [transactionData, setTransactionData] = useState<Transaction>({
    type: "", // Default to a valid TransactionType
    amount: 0,
    description: "",
  });
  const [inputError, setInputError] = useState<{
    type: string;
    amount: string;
    description: string;
  }>({ type: "", amount: "", description: "" });

  const [transactionsLoading, setTransactionsLoading] =
    useState<boolean>(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(
    null
  );
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  // Data fetching - Consider implementing retry logic, caching, and better error handling
  const fetchAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // handleCreateTransaction
  const handleCreateTransaction = async () => {
    setInputError({ type: "", amount: "", description: "" });

    // Validate inputs
    const { amount, description, type } = transactionData;
    if (
      !type ||
      !description ||
      !amount ||
      amount <= 0 ||
      (type !== "DEPOSIT" &&
        amount > (accounts.find((acct) => acct.id === accountId)?.balance ?? 0))
    ) {
      setInputError({
        type: !type ? "Transaction type is required" : "",
        amount: !amount
          ? "Amount is required"
          : amount <= 0
          ? "Amount must be greater than zero"
          : type !== "DEPOSIT" &&
            amount >
              (accounts.find((acct) => acct.id === accountId)?.balance ?? 0)
          ? "Insufficient balance"
          : "",
        description: !description ? "Description is required" : "",
      });
      return;
    }

    // set loading
    setLoading(true);
    try {
      await createTransaction({ accountId, transactionData });
      fetchAccounts(); // Refetch accounts data after successful transactions
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    if (loading) return;

    setOpenCreateTransactionModal(false);
    setAccountId("");
    setTransactionData({
      type: "",
      amount: 0,
      description: "",
    });
    setInputError({ type: "", amount: "", description: "" });
  };

  const handleCloseViewModal = () => {
    if (transactionsLoading) return;
    setOpenViewTransactionModal(false);
    setAccountId("");
    setTransactions([]);
    setTransactionsError(null);
  };

  useEffect(() => {
    if (!openViewTransactionModal && !accountId) return;

    setTransactionsLoading(true);
    setTransactionsError(null);
    getTransactions(accountId)
      .then((res) => {
        const list = res?.data?.transactions ?? [];
        setTransactions(list);
      })
      .catch((err) => {
        setTransactionsError(
          err instanceof Error ? err.message : "An error occurred"
        );
      })
      .finally(() => setTransactionsLoading(false));
  }, [openViewTransactionModal, accountId]);

  // Basic loading and error states - Consider implementing skeleton loading and error boundaries
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Basic render logic - Consider implementing:
  // - Sorting and filtering
  // - Pagination
  // - Search functionality
  // - More interactive features
  // - Accessibility improvements
  return (
    <>
      <div className={styles.container}>
        <h2>Accounts</h2>
        <div className={styles.grid}>
          {accounts.map((account) => (
            <div key={account.id} className={styles.card}>
              <h3>{account.accountHolder}</h3>
              <p>Account Number: {account.accountNumber}</p>
              <p>Type: {account.accountType}</p>
              <p>Balance: ${account.balance.toFixed(2)}</p>

              <div className={styles.actionBtn}>
                <button
                  onClick={() => {
                    setAccountId(account.id);
                    setOpenCreateTransactionModal(true);
                  }}
                >
                  Add transaction
                </button>
                <button
                  onClick={() => {
                    setAccountId(account.id);
                    setOpenViewTransactionModal(true);
                  }}
                >
                  View transaction
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Transaction Modal */}
      {openCreateTransactionModal && (
        <div className={styles.modal}>
          <div className={styles.modalInner}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                height: "2rem",
                alignItems: "center",
                position: "relative",
              }}
            >
              <h3 style={{ color: "gray", fontSize: "20px" }}>
                Create Transaction
              </h3>
              <span
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  color: "black",
                  position: "absolute",
                  right: 10,
                  top: 0,
                }}
              >
                X
              </span>
            </div>

            <div className={styles.inputContainer}>
              <label htmlFor="type">Transaction type:</label>
              <select
                name="type"
                id="type"
                value={transactionData.type}
                onChange={(e) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    type: e.target.value as typeof prev.type,
                  }));
                }}
              >
                <option value="">Select transaction type</option>
                <option value="DEPOSIT">DEPOSIT</option>
                <option value="WITHDRAWAL">WITHDRAWAL</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
              <span>{inputError.type}</span>
            </div>

            <div className={styles.inputContainer}>
              <label htmlFor="amount">Amount:</label>
              <input
                type="number"
                id="amount"
                min={0}
                value={transactionData.amount}
                onChange={(e) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }));
                }}
              />
              <span>{inputError.amount}</span>
            </div>

            <div className={styles.inputContainer}>
              <label htmlFor="description">Description:</label>
              <input
                type="text"
                id="description"
                value={transactionData.description}
                onChange={(e) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                }}
                placeholder="Enter description"
              />
              <span>{inputError.description}</span>
            </div>

            <button
              type="button"
              onClick={() => handleCreateTransaction()}
              disabled={loading}
            >
              {loading ? "Add ..." : "Add transaction"}
            </button>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {openViewTransactionModal && (
        <div className={styles.modal}>
          <div className={styles.modalInner}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                height: "2rem",
                alignItems: "center",
                position: "relative",
              }}
            >
              <h3 style={{ color: "gray", fontSize: "20px" }}>Transactions</h3>
              <span
                onClick={handleCloseViewModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  color: "black",
                  position: "absolute",
                  right: 10,
                  top: 0,
                }}
              >
                X
              </span>
            </div>

            {transactionsLoading && (
              <div className={styles.state}>Loading transactions...</div>
            )}

            {!transactionsLoading && transactionsError && (
              <div className={`${styles.state} ${styles.error}`}>
                {transactionsError}
              </div>
            )}

            {!transactionsLoading &&
              !transactionsError &&
              transactions.length === 0 && (
                <div className={styles.state}>No transactions found.</div>
              )}

            {!transactionsLoading &&
              !transactionsError &&
              transactions.length > 0 && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th style={{ textAlign: "right" }}>Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id}>
                          <td>{new Date(t.date).toDateString()}</td>
                          <td>{t.type}</td>
                          <td>{t.description}</td>
                          <td style={{ textAlign: "right" }}>
                            {Number(t.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}
