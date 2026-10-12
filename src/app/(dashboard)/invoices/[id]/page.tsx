"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from "@mui/material";
import { ArrowBack, ReceiptLong, PictureAsPdf } from "@mui/icons-material";
import { useSalesInvoice, useSalesInvoiceLines } from "@/hooks/useQueries";
import { formatCurrency, formatDate } from "@/utils";
import {
  ROUTES,
  BC_TENANT_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
  COMPANY_NAME,
} from "@/constants";
import { getOAuthToken } from "../../../../services/auth/tokenService";
import { useAppStore } from "@/store/appStore";

type InvoiceReportType = "CSD" | "B2C";

interface ODataResponse {
  value: string;
}

interface InvoiceReportResponse {
  success: boolean;
  message: string;
  output?: string;
  fileName?: string;
  pdfContent?: string;
}

async function generateInvoiceReport(
  invoiceNo: string,
  reportType: InvoiceReportType,
): Promise<void> {
  const tokenData = await getOAuthToken();

  // Use the published Business Central OData V4 service names.
  const serviceName =
    reportType === "CSD"
      ? "Velvotix_GetSingerCSDInvoice"
      : "Velvotix_GetSingerB2CInvoice";

  const response = await fetch(
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
      `/ODataV4/${serviceName}?Company=${COMPANY_NAME}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoiceNo,
      }),
    },
  );

  if (!response.ok) {
    let message = `Failed to generate the ${reportType} invoice report.`;

    try {
      const error = await response.json();
      message = error?.error?.message || error?.message || message;
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  // Business Central returns the procedure's Text result as Edm.String.
  const odata: ODataResponse = await response.json();

  if (!odata.value) {
    throw new Error("Business Central returned an empty response.");
  }

  const result: InvoiceReportResponse = JSON.parse(odata.value);

  if (!result.success) {
    throw new Error(result.message || "Invoice report generation failed.");
  }

  if (!result.pdfContent) {
    throw new Error("Business Central did not return PDF content.");
  }

  // Decode Base64 and download the PDF.
  const binaryString = atob(result.pdfContent);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    result.fileName || `Sales-Invoice-${reportType}-${invoiceNo}.pdf`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function SalesInvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || "";

  const { data: invoice, isLoading } = useSalesInvoice(id);
  const { data: lines = [], isLoading: linesLoading } =
    useSalesInvoiceLines(id);

  const { showSnackbar } = useAppStore();
  const [generatingReport, setGeneratingReport] =
    useState<InvoiceReportType | null>(null);

  const handleGenerateReport = async (reportType: InvoiceReportType) => {
    if (!invoice?.invoiceNo || generatingReport) return;

    setGeneratingReport(reportType);

    try {
      await generateInvoiceReport(invoice.invoiceNo, reportType);

      showSnackbar(
        `${reportType} invoice PDF downloaded successfully.`,
        "success",
      );
    } catch (error) {
      showSnackbar(
        error instanceof Error
          ? error.message
          : "Something went wrong generating the invoice report.",
        "error",
      );
    } finally {
      setGeneratingReport(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push(ROUTES.INVOICES)}
        >
          Back
        </Button>
        <Typography sx={{ mt: 3 }}>Invoice not found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1400,
        mx: "auto",
        width: "100%",
      }}
    >
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.back()}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ReceiptLong color="primary" />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {invoice.invoiceNo}
                </Typography>
                <Typography color="text.secondary">
                  Posted on {formatDate(invoice.postingDate)}
                </Typography>
              </Box>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Chip
                label="Posted"
                color="success"
                variant="outlined"
                sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
              />

              <Button
                variant="outlined"
                startIcon={
                  generatingReport === "CSD" ? (
                    <CircularProgress size={18} />
                  ) : (
                    <PictureAsPdf />
                  )
                }
                disabled={generatingReport !== null}
                onClick={() => handleGenerateReport("CSD")}
              >
                {generatingReport === "CSD" ? "Generating..." : "CSD Invoice"}
              </Button>

              <Button
                variant="contained"
                startIcon={
                  generatingReport === "B2C" ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <PictureAsPdf />
                  )
                }
                disabled={generatingReport !== null}
                onClick={() => handleGenerateReport("B2C")}
              >
                {generatingReport === "B2C" ? "Generating..." : "B2C Invoice"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Customer No.
              </Typography>
              <Typography>{invoice.customerNo || "-"}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Customer Name
              </Typography>
              <Typography>{invoice.customerName || "-"}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Salesperson
              </Typography>
              <Typography>{invoice.salesperson || "-"}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Due Date
              </Typography>
              <Typography>
                {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Location Code
              </Typography>
              <Typography>{invoice.locationCode || "-"}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Payment Terms
              </Typography>
              <Typography>{invoice.paymentTermsCode || "-"}</Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Order No.
              </Typography>
              <Typography>{invoice.orderNo || "-"}</Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                External Document No.
              </Typography>
              <Typography>{invoice.externalDocumentNo || "-"}</Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Invoice Total
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {formatCurrency(
                  invoice.amountIncludingVAT || invoice.amount,
                  invoice.currency,
                )}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Line Items
          </Typography>

          {linesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : lines.length === 0 ? (
            <Typography color="text.secondary">No line items found</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Line No",
                      "Item No",
                      "Description",
                      "Qty",
                      "Unit Price",
                      "Discount %",
                      "Total",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        align={
                          ["Qty", "Unit Price", "Discount %", "Total"].includes(
                            h,
                          )
                            ? "right"
                            : "left"
                        }
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.lineNo}</TableCell>
                      <TableCell>{line.itemNo}</TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(line.unitPrice, invoice.currency)}
                      </TableCell>
                      <TableCell align="right">
                        {line.discountPercent || 0}%
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(line.lineAmount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
