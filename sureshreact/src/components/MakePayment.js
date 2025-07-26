import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, MenuItem } from '@mui/material';
import axios from 'axios';

const MakePayment = () => {
  const [formData, setFormData] = useState({
    loan_id: '',
    amount: '',
    payment_type: 'EMI'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post(
        `http://localhost:5000/api/v1/loans/${formData.loan_id}/payments`,
        {
          amount: parseFloat(formData.amount),
          payment_type: formData.payment_type
        }
      );
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Make Payment</Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          margin="normal"
          label="Loan ID"
          name="loan_id"
          value={formData.loan_id}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          required
        />
        
        <TextField
          select
          fullWidth
          margin="normal"
          label="Payment Type"
          name="payment_type"
          value={formData.payment_type}
          onChange={handleChange}
          required
        >
          <MenuItem value="EMI">EMI</MenuItem>
          <MenuItem value="LUMP_SUM">Lump Sum</MenuItem>
        </TextField>
        
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Record Payment
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {result && (
        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="h6">Payment Recorded Successfully</Typography>
          <Typography>Payment ID: {result.payment_id}</Typography>
          <Typography>Loan ID: {result.loan_id}</Typography>
          <Typography>Remaining Balance: {result.remaining_balance.toFixed(2)}</Typography>
          <Typography>EMIs Left: {result.emis_left}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MakePayment;