import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Rg6aMQe5v4wM5RZYIcFyNhPmVkiCTlewJBnt2cXUciw3l9AYUkQXCdh1sIN32yU325O9yW8fj8tUezR6MMntCYQ00K3qkAO4x');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Calculate total from cart items
  const calculateTotal = () => {
    if (!cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const totalAmount = calculateTotal();

  const handleAddressChange = (field) => (event) => {
    setShippingAddress({
      ...shippingAddress,
      [field]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Create order first
      const orderData = {
        userId: user.id,
        shippingAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`,
        billingAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}` // Use same as shipping for now
      };

      const order = await orderService.createOrder(orderData);

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(order.id);

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.name,
              email: user.email,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Update order with payment info
      await orderService.updatePaymentStatus(
        order.id,
        confirmedPayment.id,
        confirmedPayment.status === 'succeeded' ? 'COMPLETED' : 'FAILED'
      );

      if (confirmedPayment.status === 'succeeded') {
        setSuccess(true);
        await clearCart();
        
        setTimeout(() => {
          navigate(`/orders`);
        }, 3000);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while processing your order.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            Order Successful!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Thank you for your purchase. You will be redirected to your orders page shortly.
          </Typography>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      {/* Demo Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>🧪 Demo Mode:</strong> This is a demonstration app. Use test card: <code>4242 4242 4242 4242</code>, CVV: <code>123</code>, Expiry: <code>12/25</code>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shipping Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={shippingAddress.street}
                  onChange={handleAddressChange('street')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={shippingAddress.city}
                  onChange={handleAddressChange('city')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={shippingAddress.state}
                  onChange={handleAddressChange('state')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={shippingAddress.zipCode}
                  onChange={handleAddressChange('zipCode')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={shippingAddress.country}
                  onChange={handleAddressChange('country')}
                  required
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Box sx={{ mt: 2, mb: 3 }}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!stripe || processing}
              sx={{ mt: 2 }}
            >
              {processing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Pay $${totalAmount.toFixed(2)}`
              )}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {cart.items?.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {item.product.name} × {item.quantity}
                </Typography>
                <Typography variant="body2">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Total:
              </Typography>
              <Typography variant="h6" color="primary">
                ${totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

const Checkout = () => {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
  }, [user, cart, navigate]);

  if (!cart.items || cart.items.length === 0) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout; 