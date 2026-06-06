"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { useSalesOrder, useSalesOrderLines } from "@/hooks/useQueries";

import { formatCurrency, formatDate, getStatusColor } from "@/utils";

export default function SalesOrderDetailsPage({ id }: { id: string }) {
  const router = useRouter();

  const { data: order, isLoading: orderLoading } = useSalesOrder(id);

  const { data: lines = [], isLoading: linesLoading } = useSalesOrderLines(id);
  console.log(lines);
  if (orderLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box p={3}>
        <Typography variant="h6">Order not found</Typography>
      </Box>
    );
  }

  const orderTotal = lines.reduce(
    (sum, line) =>
      sum +
      line.quantity * line.unitPrice * (1 - (line.discountPercent || 0) / 100),
    0,
  );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1400,
        mx: "auto",
      }}
    >
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.back()}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {order.orderNo || "Draft Order"}
              </Typography>

              <Typography color="text.secondary">
                Created on {formatDate(order.orderDate)}
              </Typography>
            </Box>

            <Chip
              label={order.status}
              sx={{
                bgcolor: `${getStatusColor(order.status)}18`,
                color: getStatusColor(order.status),
                fontWeight: 700,
              }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Customer No.
              </Typography>

              <Typography>{order.customerNo}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Customer Name
              </Typography>

              <Typography>{order.customerName}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Salesperson
              </Typography>

              <Typography>{order.salesperson || "-"}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Shipment Date
              </Typography>

              <Typography>
                {order.shipmentDate ? formatDate(order.shipmentDate) : "-"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Location Code
              </Typography>

              <Typography>{order.locationCode || "-"}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Payment Terms
              </Typography>

              <Typography>{order.paymentTermsCode || "-"}</Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                External Document No.
              </Typography>

              <Typography>{order.externalDocumentNo || "-"}</Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Total Amount
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                }}
              >
                {formatCurrency(orderTotal, order.currency)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Line Items
          </Typography>

          {linesLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : lines.length === 0 ? (
            <Typography color="text.secondary">No line items found</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Line No</TableCell>
                    <TableCell>Item No</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Discount %</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {lines.map((line) => {
                    const lineTotal =
                      line.quantity *
                      line.unitPrice *
                      (1 - (line.discountPercent || 0) / 100);

                    return (
                      <TableRow key={line.id}>
                        <TableCell>{line.lineNo}</TableCell>

                        <TableCell>{line.itemNo}</TableCell>

                        <TableCell>{line.description}</TableCell>

                        <TableCell align="right">{line.quantity}</TableCell>

                        <TableCell align="right">
                          {formatCurrency(line.unitPrice, order.currency)}
                        </TableCell>

                        <TableCell align="right">
                          {line.discountPercent || 0}%
                        </TableCell>

                        <TableCell align="right">
                          {formatCurrency(lineTotal, order.currency)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Grand Total
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: "primary.main",
                      }}
                    >
                      {formatCurrency(orderTotal, order.currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
