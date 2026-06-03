'use client';
import React from 'react';
import { Card, CardContent, Box, Typography, useTheme, Skeleton } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SalesSummary } from '@/types';
import { formatCurrencyCompact } from '@/utils';
import { motion } from 'framer-motion';

interface SalesChartProps {
  data: SalesSummary[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        boxShadow: 4,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
        {label}
      </Typography>
      {payload.map((entry: any) => (
        <Typography key={entry.name} variant="body2" sx={{ fontWeight: 700 }} color={entry.color}>
          {entry.name === 'amount' ? formatCurrencyCompact(entry.value) : entry.value}
        </Typography>
      ))}
    </Box>
  );
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (isLoading) {
    return (
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width={160} height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={100} height={20} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={220} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Sales Performance</Typography>
            <Typography variant="body2" color="text.secondary">Monthly revenue overview</Typography>
          </Box>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D32F2F" stopOpacity={isDark ? 0.3 : 0.15} />
                  <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrencyCompact(v)}
                tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#D32F2F"
                strokeWidth={2.5}
                fill="url(#colorAmount)"
                dot={false}
                activeDot={{ r: 5, fill: '#D32F2F', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
