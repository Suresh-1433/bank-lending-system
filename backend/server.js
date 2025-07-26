const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());


const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});


function initializeDatabase() {
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS Customers (
        customer_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Loans (
        loan_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        principal_amount DECIMAL NOT NULL,
        total_amount DECIMAL NOT NULL,
        interest_rate DECIMAL NOT NULL,
        loan_period_years INTEGER NOT NULL,
        monthly_emi DECIMAL NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Payments (
        payment_id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        payment_type TEXT NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
      )
    `);


    db.get("SELECT COUNT(*) as count FROM Customers", (err, row) => {
      if (row.count === 0) {
        db.run("INSERT INTO Customers (customer_id, name) VALUES (?, ?)", ['cust001', 'John Doe']);
        db.run("INSERT INTO Customers (customer_id, name) VALUES (?, ?)", ['cust002', 'Jane Smith']);
        console.log('Sample customers created');
      }
    });
  });
}



/**
 * @api {get} /api/v1/customers Get all customers
 * @apiName GetCustomers
 * @apiGroup Customer
 */
app.get('/api/v1/customers', (req, res) => {
  db.all('SELECT * FROM Customers', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * @api {get} /api/v1/customers/:customer_id Get customer by ID
 * @apiName GetCustomer
 * @apiGroup Customer
 */
app.get('/api/v1/customers/:customer_id', (req, res) => {
  const { customer_id } = req.params;
  db.get('SELECT * FROM Customers WHERE customer_id = ?', [customer_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(row);
  });
});

/**
 * @api {post} /api/v1/customers Create new customer
 * @apiName CreateCustomer
 * @apiGroup Customer
 */
app.post('/api/v1/customers', (req, res) => {
  const { customer_id, name } = req.body;
  if (!customer_id || !name) {
    return res.status(400).json({ error: 'Customer ID and name are required' });
  }

  db.run(
    'INSERT INTO Customers (customer_id, name) VALUES (?, ?)',
    [customer_id, name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        customer_id,
        name,
        message: 'Customer created successfully'
      });
    }
  );
});

/**
 * @api {post} /api/v1/loans Create new loan
 * @apiName CreateLoan
 * @apiGroup Loan
 */
app.post('/api/v1/loans', (req, res) => {
  const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;
  
  if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
    return res.status(400).json({ error: 'All fields are required' });
  }


  const totalInterest = loan_amount * loan_period_years * (interest_rate_yearly / 100);
  const totalAmount = parseFloat(loan_amount) + parseFloat(totalInterest);
  const monthlyEmi = totalAmount / (loan_period_years * 12);
  const loanId = uuidv4();

  db.serialize(() => {
    db.run(
      'INSERT INTO Loans (loan_id, customer_id, principal_amount, total_amount, interest_rate, loan_period_years, monthly_emi) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [loanId, customer_id, loan_amount, totalAmount, interest_rate_yearly, loan_period_years, monthlyEmi],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to create loan' });
        }
        
        res.status(201).json({
          loan_id: loanId,
          customer_id,
          total_amount_payable: totalAmount,
          monthly_emi: monthlyEmi
        });
      }
    );
  });
});

/**
 * @api {post} /api/v1/loans/:loan_id/payments Record payment
 * @apiName RecordPayment
 * @apiGroup Payment
 */
app.post('/api/v1/loans/:loan_id/payments', (req, res) => {
  const { loan_id } = req.params;
  const { amount, payment_type } = req.body;

  if (!amount || !payment_type || (payment_type !== 'EMI' && payment_type !== 'LUMP_SUM')) {
    return res.status(400).json({ error: 'Invalid payment data' });
  }

  db.serialize(() => {
    db.get('SELECT * FROM Loans WHERE loan_id = ?', [loan_id], (err, loan) => {
      if (err || !loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      const paymentId = uuidv4();
      db.run(
        'INSERT INTO Payments (payment_id, loan_id, amount, payment_type) VALUES (?, ?, ?, ?)',
        [paymentId, loan_id, amount, payment_type],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to record payment' });
          }

          db.get(
            'SELECT COALESCE(SUM(amount), 0) as total_paid FROM Payments WHERE loan_id = ?',
            [loan_id],
            (err, row) => {
              const totalPaid = row.total_paid;
              const balanceAmount = loan.total_amount - totalPaid;
              let emisLeft = Math.ceil(Math.max(0, balanceAmount) / loan.monthly_emi);

              if (balanceAmount <= 0) {
                db.run('UPDATE Loans SET status = "PAID_OFF" WHERE loan_id = ?', [loan_id]);
              }

              res.status(200).json({
                payment_id: paymentId,
                loan_id,
                message: 'Payment recorded successfully',
                remaining_balance: balanceAmount,
                emis_left: emisLeft
              });
            }
          );
        }
      );
    });
  });
});

/**
 * @api {get} /api/v1/loans/:loan_id/ledger Get loan ledger
 * @apiName GetLoanLedger
 * @apiGroup Loan
 */
app.get('/api/v1/loans/:loan_id/ledger', (req, res) => {
  const { loan_id } = req.params;

  db.serialize(() => {
    db.get('SELECT * FROM Loans WHERE loan_id = ?', [loan_id], (err, loan) => {
      if (err || !loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      db.all('SELECT * FROM Payments WHERE loan_id = ? ORDER BY payment_date', [loan_id], (err, payments) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const balanceAmount = loan.total_amount - totalPaid;
        const emisLeft = Math.ceil(Math.max(0, balanceAmount) / loan.monthly_emi);

        res.status(200).json({
          loan_id: loan.loan_id,
          customer_id: loan.customer_id,
          principal: loan.principal_amount,
          total_amount: loan.total_amount,
          monthly_emi: loan.monthly_emi,
          amount_paid: totalPaid,
          balance_amount: balanceAmount,
          emis_left: emisLeft,
          transactions: payments.map(payment => ({
            transaction_id: payment.payment_id,
            date: payment.payment_date,
            amount: payment.amount,
            type: payment.payment_type
          }))
        });
      });
    });
  });
});

/**
 * @api {get} /api/v1/customers/:customer_id/overview Get customer overview
 * @apiName GetCustomerOverview
 * @apiGroup Customer
 */
app.get('/api/v1/customers/:customer_id/overview', (req, res) => {
  const { customer_id } = req.params;

  db.serialize(() => {
    db.get('SELECT * FROM Customers WHERE customer_id = ?', [customer_id], (err, customer) => {
      if (err || !customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      db.all('SELECT * FROM Loans WHERE customer_id = ?', [customer_id], (err, loans) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch loans' });
        }

        if (loans.length === 0) {
          return res.status(200).json({
            customer_id,
            total_loans: 0,
            loans: []
          });
        }

        const loanPromises = loans.map(loan => {
          return new Promise((resolve, reject) => {
            db.get(
              'SELECT COALESCE(SUM(amount), 0) as total_paid FROM Payments WHERE loan_id = ?',
              [loan.loan_id],
              (err, payment) => {
                if (err) return reject(err);
                
                const totalPaid = payment.total_paid;
                const balanceAmount = loan.total_amount - totalPaid;
                const emisLeft = Math.ceil(Math.max(0, balanceAmount) / loan.monthly_emi);

                resolve({
                  loan_id: loan.loan_id,
                  principal: loan.principal_amount,
                  total_amount: loan.total_amount,
                  total_interest: loan.total_amount - loan.principal_amount,
                  emi_amount: loan.monthly_emi,
                  amount_paid: totalPaid,
                  emis_left: emisLeft
                });
              }
            );
          });
        });

        Promise.all(loanPromises)
          .then(loanSummaries => {
            res.status(200).json({
              customer_id,
              total_loans: loans.length,
              loans: loanSummaries
            });
          })
          .catch(error => {
            res.status(500).json({ error: 'Failed to fetch payment details' });
          });
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Bank Lending API running on http://localhost:${PORT}`);
});