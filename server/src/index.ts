/**
 * Banking Dashboard API Server
 *
 * TECHNICAL ASSESSMENT NOTES:
 * This is a basic implementation with intentional areas for improvement:
 * - Currently uses in-memory SQLite (not persistent)
 * - Basic error handling
 * - No authentication/authorization
 * - No input validation
 * - No rate limiting
 * - No caching
 * - No logging system
 * - No tests
 *
 * Candidates should consider:
 * - Data persistence
 * - Security measures
 * - API documentation
 * - Error handling
 * - Performance optimization
 * - Code organization
 * - Testing strategy
 */

import express, { Request, Response } from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { Database } from "sqlite3";
import { validateCreateTransaction } from "./middleware/transactionMiddleware";

const app = express();
const PORT = 3001;

// Basic middleware setup - Consider additional security middleware
app.use(cors());
app.use(express.json());

// Database setup - Currently using in-memory SQLite for simplicity
// Consider: Production database, connection pooling, error handling
const db: Database = new sqlite3.Database(":memory:", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to in-memory SQLite database");
    initializeDatabase();
  }
});

// Basic database initialization
// Consider: Migration system, seed data management, error handling
function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      accountNumber TEXT UNIQUE,
      accountType TEXT CHECK(accountType IN ('CHECKING', 'SAVINGS')),
      balance REAL,
      accountHolder TEXT,
      createdAt TEXT
    )
  `;

  const createTransactionsTableQuery = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ("DEPOSIT", "WITHDRAWAL", "TRANSFER")),
    amount REAL,
    description TEXT,
    accountId TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE ON UPDATE CASCADE
  )
`;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err);
    } else {
      console.log("Accounts table created");
      db.run(createTransactionsTableQuery, (trxErr) => {
        if (trxErr) {
          console.log("Error creating transactions table:", trxErr);
        } else {
          console.log("Transactions table created");

          insertSampleData();
        }
      });
    }
  });
}

// Sample data insertion
// Consider: Data validation, error handling, transaction management
function insertSampleData() {
  const sampleAccounts = [
    {
      id: "1",
      accountNumber: "1001",
      accountType: "CHECKING",
      balance: 5000.0,
      accountHolder: "John Doe",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      accountNumber: "1002",
      accountType: "SAVINGS",
      balance: 10000.0,
      accountHolder: "Jane Smith",
      createdAt: new Date().toISOString(),
    },
  ];

  const insertQuery = `
    INSERT OR REPLACE INTO accounts (id, accountNumber, accountType, balance, accountHolder, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  sampleAccounts.forEach((account) => {
    db.run(
      insertQuery,
      [
        account.id,
        account.accountNumber,
        account.accountType,
        account.balance,
        account.accountHolder,
        account.createdAt,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting sample data:", err);
        }
      }
    );
  });
}

// Basic API routes
// Consider: Input validation, authentication, rate limiting, response formatting
app.get("/api/accounts", (req, res) => {
  db.all("SELECT * FROM accounts", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get("/api/accounts/:id", (req, res) => {
  db.get("SELECT * FROM accounts WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(row);
  });
});

// Get transactions
app.get(
  "/api/accounts/:id/transactions",
  (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.page as string) || 10;
      const offset = (page - 1) * limit;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          type: "Error",
          message:
            "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.",
        });
        return;
      }

      // Get total count for pagination info
      const countQuery = `
      SELECT COUNT(*) as total FROM transactions WHERE accountId = ?
    `;

      db.get(countQuery, [id], (countErr, countResult) => {
        if (countErr) {
          console.error("Error counting transactions:", countErr);
          res.status(500).json({
            type: "Error",
            message: "Failed to count transactions.",
          });
          return;
        }

        // Ensure countResult is typed correctly
        const totalTransactions =
          countResult &&
          typeof countResult === "object" &&
          "total" in countResult
            ? Number((countResult as any).total)
            : 0;
        const totalPages = Math.ceil(totalTransactions / limit);

        // Get paginated transactions with ordering by date (newest first)
        const getTransactionsQuery = `
        SELECT id, type, amount, description, accountId, date 
        FROM transactions 
        WHERE accountId = ? 
        ORDER BY date DESC, id DESC
        LIMIT ? OFFSET ?
      `;

        db.all(getTransactionsQuery, [id, limit, offset], (err, rows) => {
          if (err) {
            console.error("Error fetching transactions:", err);
            res.status(500).json({
              type: "Error",
              message: "Failed to fetch transactions.",
            });
            return;
          }

          res.status(200).json({
            type: "Success",
            message: "Transaction details fetched successfully.",
            data: {
              transactions: rows,
              pagination: {
                currentPage: page,
                limit: limit,
                totalTransactions: totalTransactions,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
              },
            },
          });
        });
      });
    } catch (error) {
      res.status(400).json({
        type: "Error",
        message: "Error in fetching transactions.",
      });
    }
  }
);

// Create transaction
app.post(
  "/api/accounts/:id/transactions",
  validateCreateTransaction,
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type, amount, description } = req.body;

      // First, get the current account balance
      db.get(
        "SELECT balance FROM accounts WHERE id = ?",
        [id],
        (err, account) => {
          if (err) {
            console.error("Error fetching account:", err);
            res.status(500).json({
              type: "Error",
              message: "Failed to fetch account details.",
            });
            return;
          }

          if (!account) {
            res.status(404).json({
              type: "Error",
              message: "Account not found.",
            });
            return;
          }

          // Calculate new balance based on transaction type
          let newBalance = Number(
            (account as { balance: number | string }).balance
          );
          if (type === "DEPOSIT") {
            newBalance += Number(amount);
          } else {
            newBalance -= Number(amount);
          }

          // Check if withdrawal/transfer would result in negative balance
          if (newBalance < 0) {
            res.status(400).json({
              type: "Error",
              message: "Insufficient funds for this transaction.",
            });
            return;
          }

          // Insert transaction with date (will use DEFAULT CURRENT_TIMESTAMP)
          const transactionsInsertQuery = `
          INSERT INTO transactions (type, amount, description, accountId, date) 
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

          db.run(
            transactionsInsertQuery,
            [type, amount, description, id],
            (err) => {
              if (err) {
                console.error("Error inserting transaction:", err);
                res.status(500).json({
                  type: "Error",
                  message: "Failed to create transaction.",
                });
                return;
              }

              // Update account balance
              const updateBalanceQuery = `
              UPDATE accounts SET balance = ? WHERE id = ?
            `;

              db.run(updateBalanceQuery, [newBalance, id], (updateErr) => {
                if (updateErr) {
                  console.error("Error updating account balance:", updateErr);
                  res.status(500).json({
                    type: "Error",
                    message:
                      "Transaction created but failed to update balance.",
                  });
                  return;
                }

                res.status(201).json({
                  type: "Success",
                  message:
                    "Transaction created and balance updated successfully.",
                  data: {
                    transactionType: type,
                    amount: amount,
                    newBalance: newBalance,
                  },
                });
              });
            }
          );
        }
      );
    } catch (error) {
      res.status(400).json({
        type: "Error",
        message: "Error in creating transaction.",
      });
    }
  }
);

// Server startup
// Consider: Graceful shutdown, environment configuration, clustering
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
