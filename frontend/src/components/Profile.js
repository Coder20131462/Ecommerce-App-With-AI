import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import { Person, Email, Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Sync form data if user object updates
  React.useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setSuccess(false);
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email cannot be empty.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await updateUser(formData);
      setSuccess(true);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', email: user?.email || '' });
    setEditing(false);
    setError('');
    setSuccess(false);
  };

  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={user.imageUrl}
            alt={user.name}
            sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}
          >
            {user.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={!editing}
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={!editing}
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Auth Provider:</strong> {user.provider || 'OAuth'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>User ID:</strong> {user.id}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {!editing ? (
            <Button variant="contained" onClick={() => setEditing(true)} startIcon={<Person />}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={<Save />}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outlined" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/orders')}>
              View Orders
            </Button>
            <Button variant="outlined" onClick={() => navigate('/cart')}>
              View Cart
            </Button>
            {/* FIX: was navigate('/products') — now navigate('/') */}
            <Button variant="outlined" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;