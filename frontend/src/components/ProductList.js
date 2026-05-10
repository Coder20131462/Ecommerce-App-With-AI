import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Chip,
  Container,
  Snackbar,
  Alert
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const ProductList = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (searchTerm) {
        response = await productService.searchProducts(searchTerm, { page, size: 12 });
      } else if (selectedCategory) {
        const data = await productService.getProductsByCategory(selectedCategory);
        response = { content: data, totalPages: 1 };
      } else if (selectedBrand) {
        const data = await productService.getProductsByBrand(selectedBrand);
        response = { content: data, totalPages: 1 };
      } else {
        response = await productService.getAllProducts({ page, size: 12, sortBy, sortDir });
      }
      setProducts(response.content || response);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading products:', error);
      setSnackbar({ open: true, message: 'Failed to load products. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, searchTerm, selectedCategory, selectedBrand]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    const loadBrands = async () => {
      try {
        const data = await productService.getBrands();
        setBrands(data);
      } catch (error) {
        console.error('Error loading brands:', error);
      }
    };
    loadCategories();
    loadBrands();
  }, []);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedCategory, selectedBrand]);

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await addItem(product.id, 1);
      setSnackbar({ open: true, message: `"${product.name}" added to cart!`, severity: 'success' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbar({ open: true, message: 'Error adding product to cart.', severity: 'error' });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setPage(0);
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const getStockLabel = (stockQuantity) => {
    if (stockQuantity === 0) return { label: 'Out of Stock', color: 'error.main' };
    if (stockQuantity <= 5) return { label: `Only ${stockQuantity} left!`, color: 'warning.main' };
    return { label: `${stockQuantity} in stock`, color: 'success.main' };
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
        Our Products
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search Products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                label="Brand"
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortBy(field);
                  setSortDir(direction);
                }}
                label="Sort By"
              >
                <MenuItem value="id-asc">Newest First</MenuItem>
                <MenuItem value="name-asc">Name A-Z</MenuItem>
                <MenuItem value="name-desc">Name Z-A</MenuItem>
                <MenuItem value="price-asc">Price Low to High</MenuItem>
                <MenuItem value="price-desc">Price High to Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button onClick={clearFilters} variant="outlined" fullWidth>
              Clear
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Active Filters */}
      {(searchTerm || selectedCategory || selectedBrand) && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="subtitle2">Active Filters:</Typography>
          {searchTerm && (
            <Chip label={`Search: ${searchTerm}`} onDelete={() => setSearchTerm('')} variant="outlined" />
          )}
          {selectedCategory && (
            <Chip label={`Category: ${selectedCategory}`} onDelete={() => setSelectedCategory('')} variant="outlined" />
          )}
          {selectedBrand && (
            <Chip label={`Brand: ${selectedBrand}`} onDelete={() => setSelectedBrand('')} variant="outlined" />
          )}
        </Box>
      )}

      {/* Product Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">Loading products...</Typography>
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No products found
          </Typography>
          <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
            Clear Filters
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => {
              const stock = getStockLabel(product.stockQuantity);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                      cursor: 'pointer'
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image'}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    />
                    <CardContent sx={{ flexGrow: 1 }} onClick={() => navigate(`/products/${product.id}`)}>
                      <Typography gutterBottom variant="h6" component="div" noWrap title={product.name}>
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        ${product.price}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {product.category} · {product.brand}
                      </Typography>
                      <Typography variant="caption" color={stock.color} display="block" sx={{ mt: 0.5 }}>
                        {/* FIX: was product.quantity — now correctly product.stockQuantity */}
                        {stock.label}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stockQuantity === 0}
                        size="medium"
                      >
                        {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(event, value) => setPage(value - 1)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Snackbar for cart feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductList;