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
import { Account } from "../types";
import { createTransaction, getAccounts } from "../api";
import styles from "./AccountList.module.css";
import { Transaction } from "./../types";

export function AccountList() {
  // Basic state management - Consider using more robust state management for larger applications
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
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

    setOpenModal(false);
    setAccountId("");
    setTransactionData({
      type: "",
      amount: 0,
      description: "",
    });
    setInputError({ type: "", amount: "", description: "" });
  };

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
                    setOpenModal(true);
                  }}
                >
                  Add transaction
                </button>
                <button>View transaction</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Transaction Modal */}
      {openModal && (
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
    </>
  );
}
