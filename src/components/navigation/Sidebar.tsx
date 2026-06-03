'use client';
import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Avatar, Tooltip, Chip,
} from '@mui/material';
import { Dashboard, ShoppingCart, PeopleAlt, Assessment, Logout, Circle } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { ROUTES, APP_NAME } from '@/constants';
import { getInitials, stringToColor } from '@/utils';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: Dashboard, badge: null },
  { label: 'Sales Orders', path: ROUTES.SALES_ORDERS, icon: ShoppingCart, badge: '47' },
  { label: 'Customers', path: ROUTES.CUSTOMERS, icon: PeopleAlt, badge: null },
  { label: 'Reports', path: ROUTES.REPORTS, icon: Assessment, badge: null },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { showSnackbar } = useAppStore();

  const handleLogout = () => {
    logout();
    showSnackbar('Logged out successfully', 'success');
    router.replace(ROUTES.LOGIN);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        },
      }}
    >
      <Box sx={{ px: 2.5, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #D32F2F, #B71C1C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(211,47,47,0.4)' }}>
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>BC</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1 }}>{APP_NAME}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>Business Central</Typography>
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.5 }} />

      <List sx={{ px: 1, pt: 2, flex: 1 }}>
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);
          return (
            <motion.div key={item.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton onClick={() => router.push(item.path)} selected={isActive} sx={{ borderRadius: 2, px: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon fontSize="small" sx={{ color: isActive ? 'primary.main' : 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        sx: { fontWeight: isActive ? 600 : 400, color: isActive ? 'primary.main' : 'text.primary' },
                      },
                    }}
                  />
                  {item.badge && (
                    <Chip label={item.badge} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: isActive ? 'primary.main' : 'action.hover', color: isActive ? 'white' : 'text.secondary', fontWeight: 600 }} />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      <Divider sx={{ opacity: 0.5 }} />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: stringToColor(user?.displayName || 'User'), fontSize: '0.8rem', fontWeight: 700 }}>
            {getInitials(user?.displayName || user?.username || 'U')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user?.displayName || user?.username}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Circle sx={{ fontSize: 6, color: '#4CAF50' }} />
              <Typography variant="caption" color="text.secondary">Active</Typography>
            </Box>
          </Box>
        </Box>
        <Tooltip title="Logout">
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, px: 1.5, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 500, color: 'error.main' } } }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
