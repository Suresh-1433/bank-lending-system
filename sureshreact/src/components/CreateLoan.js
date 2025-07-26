import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';
import axios from 'axios';

const CreateLoan = () => {
  const [formData, setFormData] = useState({
    customer_id: '',
    loan_amount: '',
    loan_period_years: '',
    interest_rate_yearly: ''
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
      const response = await axios.post('http://localhost:5000/api/v1/loans', {
        customer_id: formData.customer_id,
        loan_amount: parseFloat(formData.loan_amount),
        loan_period_years: parseInt(formData.loan_period_years),
        interest_rate_yearly: parseFloat(formData.interest_rate_yearly)
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create loan');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Create New Loan</Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          margin="normal"
          label="Customer ID"
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Loan Amount"
          name="loan_amount"
          type="number"
          value={formData.loan_amount}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Loan Period (Years)"
          name="loan_period_years"
          type="number"
          value={formData.loan_period_years}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Yearly Interest Rate (%)"
          name="interest_rate_yearly"
          type="number"
          value={formData.interest_rate_yearly}
          onChange={handleChange}
          required
        />
        
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Create Loan
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {result && (
        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="h6">Loan Created Successfully</Typography>
          <Typography>Loan ID: {result.loan_id}</Typography>
          <Typography>Customer ID: {result.customer_id}</Typography>
          <Typography>Total Amount Payable: {result.total_amount_payable.toFixed(2)}</Typography>
          <Typography>Monthly EMI: {result.monthly_emi.toFixed(2)}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CreateLoan;