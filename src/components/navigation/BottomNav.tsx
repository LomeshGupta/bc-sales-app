'use client';
import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Box } from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  PeopleAlt,
  Assessment,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants';

const NAV_ITEMS = [
  { label: 'Dashboard', value: ROUTES.DASHBOARD, icon: <Dashboard /> },
  { label: 'Orders', value: ROUTES.SALES_ORDERS, icon: <ShoppingCart /> },
  { label: 'Customers', value: ROUTES.CUSTOMERS, icon: <PeopleAlt /> },
  { label: 'Reports', value: ROUTES.REPORTS, icon: <Assessment /> },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const currentValue = NAV_ITEMS.find((item) => pathname.startsWith(item.value))?.value || ROUTES.DASHBOARD;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid',
        borderColor: 'divider',
        // Safe area support for iPhone
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'transparent',
      }}
    >
      <BottomNavigation
        value={currentValue}
        onChange={(_, newValue) => router.push(newValue)}
        showLabels
        sx={{ background: 'transparent' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentValue === item.value;
          return (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={
                <Box sx={{ position: 'relative' }}>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      style={{
                        position: 'absolute',
                        top: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#D32F2F',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {item.icon}
                  </motion.div>
                </Box>
              }
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
