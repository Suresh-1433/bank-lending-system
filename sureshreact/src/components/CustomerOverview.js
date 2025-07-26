import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';

const CustomerOverview = () => {
  const [customerId, setCustomerId] = useState('');
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/customers/${customerId}/overview`
      );
      
      setOverview(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch customer overview');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Customer Account Overview</Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
        />
        
        <Button type="submit" variant="contained">
          View Overview
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {overview && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Customer: {overview.customer_id}</Typography>
          <Typography>Total Loans: {overview.total_loans}</Typography>
          
          {overview.total_loans > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 3 }}>Loan Details</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Loan ID</TableCell>
                      <TableCell>Principal</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Total Interest</TableCell>
                      <TableCell>EMI Amount</TableCell>
                      <TableCell>Amount Paid</TableCell>
                      <TableCell>EMIs Left</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overview.loans.map((loan) => (
                      <TableRow key={loan.loan_id}>
                        <TableCell>{loan.loan_id}</TableCell>
                        <TableCell>{loan.principal.toFixed(2)}</TableCell>
                        <TableCell>{loan.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{loan.total_interest.toFixed(2)}</TableCell>
                        <TableCell>{loan.emi_amount.toFixed(2)}</TableCell>
                        <TableCell>{loan.amount_paid.toFixed(2)}</TableCell>
                        <TableCell>{loan.emis_left}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default CustomerOverview;