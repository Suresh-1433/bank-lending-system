import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';

const LoanLedger = () => {
  const [loanId, setLoanId] = useState('');
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/loans/${loanId}/ledger`
      );
      
      setLedger(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch ledger');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>View Loan Ledger</Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
          required
        />
        
        <Button type="submit" variant="contained">
          View Ledger
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {ledger && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Loan Summary</Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <Box>
              <Typography>Principal: {ledger.principal.toFixed(2)}</Typography>
              <Typography>Total Amount: {ledger.total_amount.toFixed(2)}</Typography>
              <Typography>Monthly EMI: {ledger.monthly_emi.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography>Amount Paid: {ledger.amount_paid.toFixed(2)}</Typography>
              <Typography>Balance Amount: {ledger.balance_amount.toFixed(2)}</Typography>
              <Typography>EMIs Left: {ledger.emis_left}</Typography>
            </Box>
          </Box>
          
          <Typography variant="h6" sx={{ mt: 3 }}>Transaction History</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.transactions.map((txn) => (
                  <TableRow key={txn.transaction_id}>
                    <TableCell>{new Date(txn.date).toLocaleString()}</TableCell>
                    <TableCell>{txn.amount.toFixed(2)}</TableCell>
                    <TableCell>{txn.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
};

export default LoanLedger;