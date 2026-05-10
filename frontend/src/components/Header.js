import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Store,
  Logout,
  Person,
  Receipt
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleOrders = () => {
    navigate('/orders');
    handleClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          <Store />
        </IconButton>
        
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/products')}
        >
          E-Commerce Store
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <>
              {/* Cart Icon */}
              <IconButton
                color="inherit"
                onClick={() => navigate('/cart')}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={getItemCount()} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>

              {/* User Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                  {user.name}
                </Typography>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar
                    src={user.picture}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleProfile}>
                    <Person sx={{ mr: 1 }} />
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleOrders}>
                    <Receipt sx={{ mr: 1 }} />
                    My Orders
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/products')}
                sx={{ mr: 1 }}
              >
                Products
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                startIcon={<AccountCircle />}
              >
                Login
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 