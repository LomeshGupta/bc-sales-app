"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Pagination,
  Avatar,
  Chip,
  Drawer,
  Divider,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Search,
  Close,
  Email,
  Phone,
  Place,
  PeopleAlt,
  Refresh,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomers } from "@/hooks/useQueries";
import { Customer } from "@/types";
import { formatCurrency, getInitials, stringToColor } from "@/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";

function CustomerCard({
  customer,
  index,
  onSelect,
}: {
  customer: Customer;
  index: number;
  onSelect: (c: Customer) => void;
}) {
  const balance = Number(customer.balance ?? 0);
  const creditLimit = Number(customer.creditLimit ?? 0);

  const usagePercent = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;

  const safeUsagePercent = Number.isFinite(usagePercent) ? usagePercent : 0;
  const usageColor =
    usagePercent > 80 ? "#F44336" : usagePercent > 50 ? "#FF9800" : "#4CAF50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.04,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{ cursor: "pointer", mb: { xs: 1.5, md: 0 } }}
        onClick={() => onSelect(customer)}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: stringToColor(customer.name),
                fontSize: "0.9rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(customer.name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                {customer.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {customer.no}
              </Typography>
              {customer.city && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.3,
                    mt: 0.3,
                  }}
                >
                  <Place sx={{ fontSize: 12, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.disabled">
                    {customer.city}
                  </Typography>
                </Box>
              )}
            </Box>
            <Chip
              label={customer.customerGroup || "General"}
              size="small"
              sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
            />
          </Box>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}
          >
            <Typography variant="caption" color="text.secondary">
              Balance
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {formatCurrency(customer.balance)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(usagePercent, 100)}
            sx={{
              height: 4,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { bgcolor: usageColor },
            }}
          />
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 0.5, display: "block" }}
          >
            {usagePercent.toFixed(0)}% of {formatCurrency(customer.creditLimit)}{" "}
            limit
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomerDetailDrawer({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  if (!customer) return null;
  const usagePercent =
    customer.creditLimit > 0
      ? (customer.balance / customer.creditLimit) * 100
      : 0;

  return (
    <Drawer
      anchor="right"
      open={!!customer}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: "90%",
              sm: 400,
            },
            height: {
              xs: "calc(100% - 40px)",
              sm: "100%",
            },
            top: {
              xs: "5%",
              sm: 0,
            },
            right: {
              xs: "5%",
              sm: 0,
            },
            borderRadius: {
              xs: 3,
              sm: 0,
            },
          },
        },
      }}
    >
      <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Customer Details
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: stringToColor(customer.name),
              fontSize: "1.5rem",
              fontWeight: 700,
              mx: "auto",
              mb: 1.5,
            }}
          >
            {getInitials(customer.name)}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {customer.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {customer.no}
          </Typography>
          <Chip
            label={customer.customerGroup || "General"}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ mb: 2.5, opacity: 0.5 }} />

        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: "text.secondary",
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
          }}
        >
          Contact
        </Typography>
        {[
          { icon: <Email fontSize="small" />, label: customer.email || "N/A" },
          { icon: <Phone fontSize="small" />, label: customer.phone || "N/A" },
          {
            icon: <Place fontSize="small" />,
            label:
              [customer.address, customer.city, customer.country]
                .filter(Boolean)
                .join(", ") || "N/A",
          },
        ].map((item, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              gap: 1.5,
              mb: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ color: "text.secondary", mt: 0.2 }}>{item.icon}</Box>
            <Typography variant="body2">{item.label}</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 2.5, opacity: 0.5 }} />

        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: "text.secondary",
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
          }}
        >
          Financial
        </Typography>
        {[
          {
            label: "Outstanding Balance",
            value: formatCurrency(customer.balance, customer.currency),
          },
          {
            label: "Credit Limit",
            value: formatCurrency(customer.creditLimit, customer.currency),
          },
          {
            label: "Available Credit",
            value: formatCurrency(
              Math.max(0, customer.creditLimit - customer.balance),
              customer.currency,
            ),
          },
          { label: "Currency", value: customer.currency },
          { label: "Salesperson", value: customer.salesperson || "N/A" },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
              py: 0.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.value}
            </Typography>
          </Box>
        ))}

        <Box sx={{ mt: 2 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Credit Utilization
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {usagePercent.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(usagePercent, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": {
                bgcolor:
                  usagePercent > 80
                    ? "#F44336"
                    : usagePercent > 50
                      ? "#FF9800"
                      : "#4CAF50",
                borderRadius: 4,
              },
            }}
          />
        </Box>
      </Box>
    </Drawer>
  );
}

export default function CustomersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch, isFetching } = useCustomers({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: debouncedSearch,
  });

  const customers = data?.data || [];

  return (
    <Box
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto", width: "100%" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Customers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data?.total ?? 0} customers
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} disabled={isFetching}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TextField
          fullWidth
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ mb: 2.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </motion.div>

      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                <Card>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                      <Skeleton variant="circular" width={44} height={44} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="70%" />
                        <Skeleton width="40%" />
                      </Box>
                    </Box>
                    <Skeleton
                      width="100%"
                      height={8}
                      sx={{ borderRadius: 4 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : customers.map((customer, idx) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={customer.id}>
                <CustomerCard
                  customer={customer}
                  index={idx}
                  onSelect={setSelectedCustomer}
                />
              </Grid>
            ))}
      </Grid>

      {customers.length === 0 && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ textAlign: "center", py: 8 }}>
            <PeopleAlt sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">No customers found</Typography>
          </Box>
        </motion.div>
      )}

      {(data?.totalPages || 1) > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={data?.totalPages || 1}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      <CustomerDetailDrawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </Box>
  );
}
