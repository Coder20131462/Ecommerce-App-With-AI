import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { ArrowBack, Add, Remove, ShoppingCart } from '@mui/icons-material';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const productData = await productService.getProductById(id);
      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await addItem(product.id, quantity);
      setSnackbar({
        open: true,
        message: `${quantity} × "${product.name}" added to cart!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbar({ open: true, message: 'Error adding product to cart.', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" align="center">Loading product...</Typography>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" align="center">Product not found</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          {/* FIX: navigates back to / which is the product list */}
          <Button onClick={() => navigate('/')} startIcon={<ArrowBack />}>
            Back to Products
          </Button>
        </Box>
      </Container>
    );
  }

  const isOutOfStock = product.stockQuantity === 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* FIX: was navigate('/') already, keeping consistent */}
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBack />} sx={{ mb: 3 }}>
        Back to Products
      </Button>

      <Card>
        <Grid container>
          <Grid item xs={12} md={6}>
            <CardMedia
              component="img"
              height="450"
              image={product.imageUrl || 'https://via.placeholder.com/450x450?text=No+Image'}
              alt={product.name}
              sx={{ objectFit: 'cover' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>
                {product.name}
              </Typography>

              <Typography variant="h4" color="primary" sx={{ mb: 2, fontWeight: 700 }}>
                ${product.price}
              </Typography>

              <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                <Chip label={product.category} color="primary" variant="outlined" />
                <Chip label={product.brand} variant="outlined" />
              </Box>

              <Typography variant="body1" paragraph color="text.secondary">
                {product.description}
              </Typography>

              <Typography
                variant="subtitle1"
                color={isOutOfStock ? 'error.main' : product.stockQuantity <= 5 ? 'warning.main' : 'success.main'}
                sx={{ mb: 3, fontWeight: 600 }}
              >
                {isOutOfStock
                  ? 'Out of Stock'
                  : product.stockQuantity <= 5
                  ? `Only ${product.stockQuantity} left in stock!`
                  : `${product.stockQuantity} in stock`}
              </Typography>

              {!isOutOfStock && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Quantity:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Remove />
                    </IconButton>
                    <TextField
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= product.stockQuantity) {
                          setQuantity(val);
                        }
                      }}
                      type="number"
                      inputProps={{ min: 1, max: product.stockQuantity }}
                      sx={{ mx: 2, width: 80 }}
                    />
                    <IconButton
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stockQuantity}
                    >
                      <Add />
                    </IconButton>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<ShoppingCart />}
                    onClick={handleAddToCart}
                    sx={{ py: 1.5 }}
                  >
                    Add to Cart — ${(product.price * quantity).toFixed(2)}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Grid>
        </Grid>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetail;