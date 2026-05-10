import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const Login = () => {
  const { user, loginWithSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth2 callback with userId and email parameters
    const urlParams = new URLSearchParams(location.search);
    const userId = urlParams.get('userId');
    const email = urlParams.get('email');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth2 login error:', error);
      alert('Login failed: ' + error);
    } else if (userId && email) {
      // OAuth2 successful login - use session-based login
      handleOAuth2Success(userId, email);
    }
  }, [location, loginWithSession]);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [user, navigate, location]);

  const handleOAuth2Success = async (userId, email) => {
    try {
      await loginWithSession(userId, email);
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } catch (error) {
      console.error('Session login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    authService.loginWithGoogle();
  };

  // If already logged in, show loading or redirect
  if (user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Typography variant="h6" align="center">
          Redirecting...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to ECommerce Store
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Sign in to your account to continue shopping
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            sx={{
              backgroundColor: '#4285f4',
              '&:hover': {
                backgroundColor: '#357ae8',
              },
            }}
          >
            Sign in with Google
          </Button>
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demo Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You can also browse products without logging in, but you'll need to sign in to add items to your cart.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/products')}
              fullWidth
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 