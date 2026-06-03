'use client';
import { Box, Typography, Button } from '@mui/material';
import { WifiOff } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <WifiOff sx={{ fontSize: 72, color: 'text.disabled', mb: 3 }} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Typography variant="h5" sx={{  fontWeight: 700, mb: 1 }} >You're Offline</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
          Check your internet connection and try again. Some cached data may still be available.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </motion.div>
    </Box>
  );
}
