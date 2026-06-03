'use client';
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  ShoppingCart,
  Payment,
  PersonAdd,
  LocalShipping,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { RecentActivity } from '@/types';
import { formatCurrencyCompact, getStatusColor } from '@/utils';

const ACTIVITY_ICONS: Record<string, React.ComponentType<any>> = {
  order: ShoppingCart,
  payment: Payment,
  customer: PersonAdd,
  shipment: LocalShipping,
};

const ACTIVITY_COLORS: Record<string, string> = {
  order: '#2196F3',
  payment: '#4CAF50',
  customer: '#9C27B0',
  shipment: '#FF9800',
};

interface RecentActivityProps {
  data: RecentActivity[];
  isLoading?: boolean;
}

export function RecentActivityList({ data, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Skeleton variant="circular" width={36} height={36} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700,  mb: 2 }}>
            Recent Activity
          </Typography>
          {data.map((item, idx) => {
            const Icon = ACTIVITY_ICONS[item.type] || ShoppingCart;
            const color = ACTIVITY_COLORS[item.type];
            return (
              <React.Fragment key={item.id}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      py: 1.25,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: `${color}18`,
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ color, fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {item.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                        <Typography variant="caption" color="text.disabled">
                          {item.time}
                        </Typography>
                        {item.status && (
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: `${getStatusColor(item.status)}18`,
                              color: getStatusColor(item.status),
                              fontWeight: 600,
                              border: 'none',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    {item.amount && (
                      <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }} color="text.primary">
                        {formatCurrencyCompact(item.amount)}
                      </Typography>
                    )}
                  </Box>
                </motion.div>
                {idx < data.length - 1 && <Divider sx={{ opacity: 0.4 }} />}
              </React.Fragment>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
