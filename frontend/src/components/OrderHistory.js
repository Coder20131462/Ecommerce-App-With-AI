import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress
} from '@mui/material';
import { orderService } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
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
      case 'CONFIRMED':
        return 'info';
      case 'PROCESSING':
        return 'primary';
      case 'SHIPPED':
        return 'secondary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'REFUNDED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Order History
      </Typography>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No orders found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        Order #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={order.status} 
                        color={getStatusColor(order.status)} 
                        size="small"
                      />
                      {/* {order.paymentStatus && (
                        <Chip 
                          label={`Payment: ${order.paymentStatus}`} 
                          color={getPaymentStatusColor(order.paymentStatus)} 
                          size="small"
                        />
                      )} */}
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle1" gutterBottom>
                        Items:
                      </Typography>
                      <List dense>
                        {order.orderItems?.map((item) => (
                          <ListItem key={item.id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar 
                                src={item.product.imageUrl} 
                                alt={item.product.name}
                                variant="square"
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={item.product.name}
                              secondary={`Quantity: ${item.quantity} × $${item.unitPrice}`}
                            />
                            <Typography variant="body2" fontWeight="bold">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary">
                          Total: ${order.totalAmount}
                        </Typography>
                        
                        {order.shippingAddress && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Shipping Address:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.shippingAddress}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default OrderHistory; 