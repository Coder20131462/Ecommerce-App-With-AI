import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        cart: action.payload,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'ADD_ITEM':
    case 'UPDATE_ITEM':
    case 'REMOVE_ITEM':
      return {
        ...state,
        cart: action.payload
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: { items: [], totalPrice: 0 }
      };
    default:
      return state;
  }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    cart: { items: [], totalPrice: 0 },
    loading: false,
    error: null
  });

  useEffect(() => {
    if (user) {
      console.log('CartContext: User authenticated, loading cart. User:', user);
      loadCart();
    } else {
      console.log('CartContext: No user authenticated');
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      let cart;
      if (user.id) {
        cart = await cartService.getCart(user.id);
      } else {
        // Fallback to session-based endpoint
        cart = await cartService.getCurrentUserCart();
      }
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addItem = async (productId, quantity) => {
    if (!user) {
      throw new Error('Please login to add items to cart');
    }
    
    try {
      let updatedCart;
      if (user.id) {
        updatedCart = await cartService.addItemToCart(user.id, productId, quantity);
      } else {
        // Fallback to session-based endpoint
        updatedCart = await cartService.addItemToCurrentUserCart(productId, quantity);
      }
      dispatch({ type: 'ADD_ITEM', payload: updatedCart });
      return updatedCart;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateItem = async (productId, quantity) => {
    if (!user) return;
    
    try {
      const updatedCart = await cartService.updateCartItem(user.id, productId, quantity);
      dispatch({ type: 'UPDATE_ITEM', payload: updatedCart });
      return updatedCart;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const removeItem = async (productId) => {
    if (!user) return;
    
    try {
      const updatedCart = await cartService.removeItemFromCart(user.id, productId);
      dispatch({ type: 'REMOVE_ITEM', payload: updatedCart });
      return updatedCart;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      await cartService.clearCart(user.id);
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const getItemCount = () => {
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    loadCart,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 