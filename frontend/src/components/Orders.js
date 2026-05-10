import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, Receipt } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const ordersData = await orderService.getOrdersByUserId(user.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" align="center">
          Loading orders...
        </Typography>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Orders Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't placed any orders yet. Start shopping to see your orders here.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            size="large"
          >
            Start Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} key={order.id}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ width: '100%' }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="h6">
                        Order #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={order.orderStatus}
                        color={getStatusColor(order.orderStatus)}
                        size="small"
                      />
                    </Grid>
                    {/* <Grid item xs={12} sm={2}>
                      <Chip
                        label={order.paymentStatus}
                        color={getPaymentStatusColor(order.paymentStatus)}
                        size="small"
                      />
                    </Grid> */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="h6" color="primary">
                        ${order.totalPrice.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        {order.items?.length || 0} item(s)
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Order Details
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Shipping Address:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.shippingAddress}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Payment Intent ID:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.paymentIntentId || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Items Ordered
                  </Typography>
                  
                  {order.items?.map((item) => (
                    <Card key={item.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">
                              {item.product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.product.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Category: {item.product.category} | Brand: {item.product.brand}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography variant="body2">
                              Quantity: {item.quantity}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography variant="body2">
                              Price: ${item.product.price}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography variant="h6" color="primary">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="h6">
                      Total: ${order.totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Orders; 