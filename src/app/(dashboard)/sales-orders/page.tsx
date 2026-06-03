'use client';
import React, { useState, useCallback } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Card, CardContent,
  Chip, Grid, Skeleton, useMediaQuery, useTheme, Pagination,
  IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Search, Refresh, ShoppingCart, Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSalesOrders } from '@/hooks/useQueries';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { SalesOrder } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/utils';
import { DEFAULT_PAGE_SIZE } from '@/constants';

const STATUS_OPTIONS = ['All', 'Open', 'Released', 'Pending Approval', 'Shipped', 'Invoiced'];

function OrderCard({ order, index }: { order: SalesOrder; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.04 }}
      layout
    >
      <Card sx={{ mb: 1.5, cursor: 'pointer' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{order.orderNo}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{order.customerName}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{formatCurrency(order.amount, order.currency)}</Typography>
              <Chip
                label={order.status}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: `${getStatusColor(order.status)}18`, color: getStatusColor(order.status), fontWeight: 600, mt: 0.3 }}
              />
            </Box>
          </Box>
          <Typography variant="caption" color="text.disabled">
            {formatDate(order.orderDate)} · {order.salesperson}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OrderRowSkeleton() {
  return (
    <TableRow>
      {[120, 180, 80, 100, 80, 100].map((w, i) => (
        <TableCell key={i}><Skeleton width={w} /></TableCell>
      ))}
    </TableRow>
  );
}

function OrderCardSkeleton() {
  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box><Skeleton width={80} /><Skeleton width={140} /></Box>
          <Box><Skeleton width={80} /><Skeleton width={60} /></Box>
        </Box>
        <Skeleton width={200} />
      </CardContent>
    </Card>
  );
}

export default function SalesOrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const router = useRouter();
  const pageSize = DEFAULT_PAGE_SIZE;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => { setDebouncedSearch(value); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isFetching, refetch } = useSalesOrders({
    page,
    pageSize,
    search: debouncedSearch,
    filter: statusFilter !== 'All' ? `status='${statusFilter}'` : undefined,
  });

  const orders = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const filteredOrders = statusFilter === 'All' ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Sales Orders</Typography>
            <Typography variant="body2" color="text.secondary">{data?.total ?? 0} total orders</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()} disabled={isFetching}>
                <motion.div animate={{ rotate: isFetching ? 360 : 0 }} transition={{ duration: 1, repeat: isFetching ? Infinity : 0 }}>
                  <Refresh />
                </motion.div>
              </IconButton>
            </Tooltip>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => router.push(ROUTES.SALES_ORDERS + '/new')}>
              New Order
            </Button>
          </Box>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search orders..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </motion.div>

      {isMobile ? (
        <Box>
          <AnimatePresence mode="wait">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <OrderCardSkeleton key={i} />)
              : filteredOrders.map((order, idx) => <OrderCard key={order.id} order={order} index={idx} />)
            }
          </AnimatePresence>
          {orders.length === 0 && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ShoppingCart sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No orders found</Typography>
              </Box>
            </motion.div>
          )}
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Order No', 'Customer', 'Date', 'Amount', 'Status', 'Salesperson'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 10 }).map((_, i) => <OrderRowSkeleton key={i} />)
                    : filteredOrders.map((order, idx) => (
                        <TableRow
                          key={order.id}
                          component={motion.tr as any}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{order.orderNo}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{order.customerName}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{formatDate(order.orderDate)}</Typography></TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(order.amount, order.currency)}</Typography></TableCell>
                          <TableCell>
                            <Chip label={order.status} size="small" sx={{ bgcolor: `${getStatusColor(order.status)}18`, color: getStatusColor(order.status), fontWeight: 600, fontSize: '0.72rem' }} />
                          </TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{order.salesperson}</Typography></TableCell>
                        </TableRow>
                      ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
        </Box>
      )}
    </Box>
  );
}
