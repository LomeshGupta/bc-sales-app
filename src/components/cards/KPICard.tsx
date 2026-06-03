'use client';
import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, ShoppingCart, People, BarChart, AttachMoney } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { KPICard as KPICardType } from '@/types';
import { formatCurrencyCompact, formatNumber, formatPercent } from '@/utils';
import { alpha } from '@mui/material/styles';

const ICONS: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  ShoppingCart,
  People,
  BarChart,
  AttachMoney,
};

interface KPICardProps {
  data: KPICardType;
  index?: number;
}

export function KPICard({ data, index = 0 }: KPICardProps) {
  const Icon = ICONS[data.icon] || BarChart;
  const isIncrease = data.changeType === 'increase';
  const isNeutral = data.changeType === 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.07 }}
      whileTap={{ scale: 0.98 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'default',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${data.color}, ${alpha(data.color, 0.4)})`,
          },
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: alpha(data.color, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color: data.color, fontSize: 22 }} />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.3,
                background: alpha(isIncrease ? '#4CAF50' : isNeutral ? '#9E9E9E' : '#F44336', 0.1),
                borderRadius: 1.5,
                px: 0.8,
                py: 0.3,
              }}
            >
              {!isNeutral && (
                isIncrease
                  ? <TrendingUp sx={{ fontSize: 14, color: '#4CAF50' }} />
                  : <TrendingDown sx={{ fontSize: 14, color: '#F44336' }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: isIncrease ? '#4CAF50' : isNeutral ? 'text.secondary' : '#F44336',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              >
                {formatPercent(data.change)}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, mb: 0.5 }}
          >
            {data.currency
              ? formatCurrencyCompact(Number(data.value))
              : formatNumber(Number(data.value))}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {data.title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KPICardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="rounded" width={44} height={44} />
          <Skeleton variant="rounded" width={50} height={24} />
        </Box>
        <Skeleton variant="text" width="60%" sx={{ fontSize: '2rem', mb: 0.5 }} />
        <Skeleton variant="text" width="80%" />
      </CardContent>
    </Card>
  );
}
