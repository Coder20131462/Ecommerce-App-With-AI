import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  CircularProgress,
  Avatar,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  SmartToy,
  Send,
  Close,
  AutoAwesome,
  Person
} from '@mui/icons-material';
import { aiService } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

// ── Suggested prompts shown when chat is empty ────────────────
const SUGGESTIONS = [
  '🎧 Find me wireless headphones under $300',
  '💻 What laptops do you have?',
  '🛒 What\'s in my cart?',
  '📦 Show my recent orders',
  '🎁 Recommend something for me',
];

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi${user ? ' ' + user.name.split(' ')[0] : ''}! 👋 I'm ShopBot, your AI shopping assistant. Ask me anything — I can find products, manage your cart, and make personalised recommendations.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const data = await aiService.chat(trimmed, conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          width: { xs: 'calc(100vw - 32px)', sm: 380 },
          maxHeight: 560,
          zIndex: 1300,
          display: open ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <Paper elevation={8} sx={{ display: 'flex', flexDirection: 'column', height: 520, borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{
            px: 2, py: 1.5,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            display: 'flex', alignItems: 'center', gap: 1.5
          }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <SmartToy sx={{ fontSize: 20, color: '#fff' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
                ShopBot
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                AI Shopping Assistant · powered by GPT-4
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 1
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ width: 26, height: 26, bgcolor: '#1976d2', flexShrink: 0 }}>
                    <SmartToy sx={{ fontSize: 15, color: '#fff' }} />
                  </Avatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    px: 1.5, py: 1,
                    maxWidth: '78%',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    bgcolor: msg.role === 'user' ? '#1976d2' : 'grey.100',
                    color: msg.role === 'user' ? '#fff' : 'text.primary',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 13 }}>
                    {msg.content}
                  </Typography>
                </Paper>
                {msg.role === 'user' && (
                  <Avatar sx={{ width: 26, height: 26, bgcolor: 'grey.400', flexShrink: 0 }}>
                    <Person sx={{ fontSize: 15 }} />
                  </Avatar>
                )}
              </Box>
            ))}

            {/* Typing indicator */}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 26, height: 26, bgcolor: '#1976d2' }}>
                  <SmartToy sx={{ fontSize: 15, color: '#fff' }} />
                </Avatar>
                <Paper elevation={0} sx={{ px: 2, py: 1.2, borderRadius: '18px 18px 18px 4px', bgcolor: 'grey.100' }}>
                  <CircularProgress size={14} thickness={5} />
                </Paper>
              </Box>
            )}

            {/* Suggestion chips — only shown on the first message */}
            {messages.length === 1 && !loading && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                {SUGGESTIONS.map((s, i) => (
                  <Box
                    key={i}
                    onClick={() => sendMessage(s.replace(/^[\u{1F300}-\u{1FFFF}\s]+/u, '').trim())}
                    sx={{
                      px: 1.5, py: 0.6,
                      border: '1px solid',
                      borderColor: 'primary.light',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'primary.main',
                      bgcolor: 'primary.50',
                      '&:hover': { bgcolor: 'primary.100' },
                      transition: 'background 0.15s'
                    }}
                  >
                    {s}
                  </Box>
                ))}
              </Box>
            )}

            <div ref={bottomRef} />
          </Box>

          {/* Input area */}
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask ShopBot anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              size="small"
              sx={{ '& fieldset': { borderRadius: 3 } }}
            />
            <Tooltip title="Send message">
              <span>
                <IconButton
                  color="primary"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'grey.200' } }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Box>

      {/* ── Floating action button ───────────────────────────────── */}
      <Tooltip title={open ? 'Close ShopBot' : 'Chat with ShopBot AI'} placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(o => !o)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            background: 'linear-gradient(135deg, #1976d2, #1565c0)',
            boxShadow: '0 4px 20px rgba(25,118,210,0.45)',
            '&:hover': { boxShadow: '0 6px 24px rgba(25,118,210,0.6)' }
          }}
        >
          {open ? <Close /> : <AutoAwesome />}
        </Fab>
      </Tooltip>
    </>
  );
};

export default ChatWidget;