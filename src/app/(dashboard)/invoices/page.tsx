"use client";

import React, { useCallback, useState } from "react";
import {
  Box, Typography, TextField, InputAdornment, Card, CardContent, Chip,
  Skeleton, useMediaQuery, useTheme, Pagination, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { Search, Refresh, ReceiptLong } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useSalesInvoices } from "@/hooks/useQueries";
import { useRouter } from "next/navigation";
import { ROUTES, DEFAULT_PAGE_SIZE } from "@/constants";
import { SalesInvoice } from "@/types";
import { formatCurrency, formatDate } from "@/utils";

function InvoiceCard({ invoice, index }: { invoice: SalesInvoice; index: number }) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.04 }}
      layout
    >
      <Card
        onClick={() => router.push(`${ROUTES.INVOICES}/${invoice.id}`)}
        sx={{ mb: 1.5, cursor: "pointer" }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {invoice.invoiceNo}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {invoice.customerName || invoice.customerNo}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", ml: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {formatCurrency(invoice.amountIncludingVAT || invoice.amount, invoice.currency)}
              </Typography>
              <Chip label="Posted" size="small" sx={{ height: 20, fontSize: "0.65rem", mt: 0.3, bgcolor: "success.50", color: "success.main", fontWeight: 600 }} />
            </Box>
          </Box>
          <Typography variant="caption" color="text.disabled">
            {formatDate(invoice.postingDate)} · {invoice.salesperson || "—"}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InvoiceRowSkeleton() {
  return (
    <TableRow>
      {[120, 180, 100, 100, 120, 100].map((w, i) => (
        <TableCell key={i}><Skeleton width={w} /></TableCell>
      ))}
    </TableRow>
  );
}

export default function SalesInvoicesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const router = useRouter();
  const pageSize = DEFAULT_PAGE_SIZE;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isFetching, refetch } = useSalesInvoices({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const invoices = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto", width: "100%" }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Sales Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data?.total ?? 0} total posted invoices
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} disabled={isFetching}>
              <motion.div animate={{ rotate: isFetching ? 360 : 0 }} transition={{ duration: 1, repeat: isFetching ? Infinity : 0 }}>
                <Refresh />
              </motion.div>
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><Search fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </motion.div>

      {isMobile ? (
        <Box>
          <AnimatePresence mode="wait">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} sx={{ mb: 1.5 }}><CardContent sx={{ p: 2 }}><Skeleton width={100} /><Skeleton width={170} /><Skeleton width={220} /></CardContent></Card>
                ))
              : invoices.map((invoice, idx) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} index={idx} />
                ))}
          </AnimatePresence>
          {invoices.length === 0 && !isLoading && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <ReceiptLong sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">No invoices found</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["Invoice No", "Customer", "Posting Date", "Due Date", "Amount", "Salesperson"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => <InvoiceRowSkeleton key={i} />)
                  : invoices.map((invoice, idx) => (
                      <TableRow
                        key={invoice.id}
                        component={motion.tr as any}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => router.push(`${ROUTES.INVOICES}/${invoice.id}`)}
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                      >
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{invoice.invoiceNo}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{invoice.customerName || invoice.customerNo}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{formatDate(invoice.postingDate)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(invoice.amountIncludingVAT || invoice.amount, invoice.currency)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{invoice.salesperson || "—"}</Typography></TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
        </Box>
      )}
    </Box>
  );
}
