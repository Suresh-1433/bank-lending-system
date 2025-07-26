import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import CreateLoan from './components/CreateLoan';
import MakePayment from './components/MakePayment';
import LoanLedger from './components/LoanLedger';
import CustomerOverview from './components/CustomerOverview';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bank Lending System
          </Typography>
          <Button color="inherit" component={Link} to="/create-loan">Create Loan</Button>
          <Button color="inherit" component={Link} to="/make-payment">Make Payment</Button>
          <Button color="inherit" component={Link} to="/view-ledger">View Ledger</Button>
          <Button color="inherit" component={Link} to="/customer-overview">Customer Overview</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/create-loan" element={<CreateLoan />} />
          <Route path="/make-payment" element={<MakePayment />} />
          <Route path="/view-ledger" element={<LoanLedger />} />
          <Route path="/customer-overview" element={<CustomerOverview />} />
          <Route path="/" element={
            <Box sx={{ textAlign: 'center', mt: 10 }}>
              <Typography variant="h4">Welcome to Bank Lending System</Typography>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Use the navigation bar to access different features
              </Typography>
            </Box>
          } />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;