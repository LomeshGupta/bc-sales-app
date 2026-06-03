'use client';
import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAppStore } from '@/store/appStore';

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const { snackbar, hideSnackbar } = useAppStore();

  return (
    <>
      {children}
      <Snackbar
        open={snackbar?.open ?? false}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar?.severity ?? 'info'}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 500, minWidth: 280 }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
