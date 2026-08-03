"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  IconButton,
  Divider,
  CircularProgress,
  Autocomplete,
  TextField,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  PictureAsPdf,
  ArrowForward,
  CloudDone,
  Close,
  Email,
  Search,
} from "@mui/icons-material";
import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
  COMPANY_NAME,
} from "@/constants";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useAppStore } from "@/store/appStore";
import { useAllCustomers } from "@/hooks/useQueries";
import { stringToColor, getInitials } from "@/utils";
import {
  getOAuthToken,
  calculateTokenExpiry,
} from "../../../services/auth/tokenService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Customer {
  id: string;
  no: string;
  name: string;
  city?: string;
  blocked?: string; // "True" | "False", as returned by Business Central
}

type StatementOutput = "pdf" | "email";

interface CustomerStatementRequest {
  customerNo: string;
  statementDate: string; // ISO date, e.g. "2026-08-03"
  fromDate: string;
  toDate: string;
  includeOpenEntries: boolean;
  includeClosedEntries: boolean;
  includeReversedEntries: boolean;
  output: StatementOutput;
}

interface CustomerStatementResult {
  output: StatementOutput;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

/**
 * Extracts a filename from a Content-Disposition header, falling back to a
 * sensible default built from the request payload.
 */
function resolveFileName(
  contentDisposition: string | null,
  payload: CustomerStatementRequest,
): string {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);
    if (match?.[1]) return match[1];
  }
  return `Customer-Statement-${payload.customerNo}-${payload.toDate}.pdf`;
}

/**
 * Calls POST /api/customer-statement, which in turn invokes the
 * Business Central OData action Velvotix_GetCustomerStatement.
 *
 * - output "pdf": downloads the returned PDF directly in the browser.
 * - output "email": expects a JSON acknowledgement from the backend.
 * 
 * `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
      `/ODataV4/Velvotix_GetCustomerStatement?Company=${COMPANY_NAME}`
 */
interface ODataResponse {
  "@odata.context": string;
  value: string;
}

interface CustomerStatementApiResponse {
  success: boolean;
  message: string;
  output: "pdf" | "email";
  fileName?: string;
  pdfContent?: string;
}

async function generateCustomerStatement(
  payload: CustomerStatementRequest,
): Promise<CustomerStatementResult> {
  const tokenData = await getOAuthToken();

  const response = await fetch(
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
      `/ODataV4/Velvotix_GetCustomerStatement?Company=${COMPANY_NAME}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let message = "Failed to generate customer statement.";

    try {
      const error = await response.json();
      message = error?.error?.message || error?.message || message;
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }

  // Business Central returns an Edm.String
  const odata: ODataResponse = await response.json();

  if (!odata.value) {
    throw new Error("Business Central returned an empty response.");
  }

  // Parse the JSON string contained in "value"
  const result: CustomerStatementApiResponse = JSON.parse(odata.value);

  if (!result.success) {
    throw new Error(result.message);
  }

  if (result.output === "email") {
    return {
      output: "email",
    };
  }

  if (!result.pdfContent) {
    throw new Error("Business Central did not return PDF content.");
  }

  // Decode Base64 PDF
  const binaryString = atob(result.pdfContent);

  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], {
    type: "application/pdf",
  });

  const fileName =
    result.fileName ??
    `CustomerStatement_${payload.customerNo}_${payload.toDate}.pdf`;

  // Download PDF
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  return {
    output: "pdf",
  };
}

// ---------------------------------------------------------------------------
// Request Dialog
// ---------------------------------------------------------------------------

interface CustomerStatementDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormErrors {
  customer?: string;
  statementDate?: string;
  fromDate?: string;
  toDate?: string;
}

const initialFormState = {
  customer: null as Customer | null,
  statementDate: dayjs() as Dayjs | null,
  fromDate: dayjs().startOf("month") as Dayjs | null,
  toDate: dayjs() as Dayjs | null,
  includeOpenEntries: true,
  includeClosedEntries: false,
  includeReversedEntries: false,
  output: "pdf" as StatementOutput,
};

function CustomerStatementDialog({
  open,
  onClose,
}: CustomerStatementDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { showSnackbar } = useAppStore();
  const { data: customers, isLoading: customersLoading } = useAllCustomers();

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateForm = <K extends keyof typeof initialFormState>(
    key: K,
    value: (typeof initialFormState)[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  // Reset the form each time the dialog is opened fresh.
  useEffect(() => {
    if (open) {
      setForm(initialFormState);
      setErrors({});
    }
  }, [open]);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.customer) next.customer = "Select a customer to continue.";
    if (!form.statementDate) next.statementDate = "Statement date is required.";
    if (!form.fromDate) next.fromDate = "From date is required.";
    if (!form.toDate) next.toDate = "To date is required.";
    if (form.fromDate && form.toDate && form.fromDate.isAfter(form.toDate)) {
      next.toDate = "To date must be on or after the from date.";
    }
    if (form.customer?.blocked === "True") {
      next.customer = "This customer is blocked in Business Central.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (
      !validate() ||
      !form.customer ||
      !form.statementDate ||
      !form.fromDate ||
      !form.toDate
    ) {
      return;
    }

    const payload: CustomerStatementRequest = {
      customerNo: form.customer.no,
      statementDate: form.statementDate.format("YYYY-MM-DD"),
      fromDate: form.fromDate.format("YYYY-MM-DD"),
      toDate: form.toDate.format("YYYY-MM-DD"),
      includeOpenEntries: form.includeOpenEntries,
      includeClosedEntries: form.includeClosedEntries,
      includeReversedEntries: form.includeReversedEntries,
      output: form.output,
    };

    setSubmitting(true);
    try {
      const result = await generateCustomerStatement(payload);
      if (result.output === "email") {
        showSnackbar(
          `Statement for ${form.customer.name} is on its way by email.`,
          "success",
        );
      } else {
        showSnackbar(
          `Statement for ${form.customer.name} downloaded.`,
          "success",
        );
      }
      onClose();
    } catch (err) {
      showSnackbar(
        err instanceof Error
          ? err.message
          : "Something went wrong generating the statement.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="md"
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, y: fullScreen ? 0 : 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.2 },
          sx: fullScreen ? {} : { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
        >
          <PictureAsPdf color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Generate Customer Statement
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set the statement details, then generate or email it.
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Autocomplete
              options={customers ?? []}
              loading={customersLoading}
              value={form.customer}
              onChange={(_, customer) => {
                updateForm("customer", customer);
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              getOptionLabel={(option) =>
                option ? `${option.no} - ${option.name}` : ""
              }
              filterOptions={(options, { inputValue }) => {
                const q = inputValue.toLowerCase();

                return options.filter(
                  (c) =>
                    c.name?.toLowerCase().includes(q) ||
                    c.no?.toLowerCase().includes(q),
                );
              }}
              disabled={submitting}
              renderOption={(props, customer) => {
                const { key, ...optionProps } = props;

                return (
                  <Box
                    component="li"
                    key={key}
                    {...optionProps}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      py: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: stringToColor(customer.name),
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(customer.name)}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                        noWrap
                      >
                        {customer.name}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {customer.no} • {customer.city}
                      </Typography>
                    </Box>
                    {customer.blocked === "True" && (
                      <Chip label="Blocked" size="small" color="error" />
                    )}
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Customer *"
                  placeholder="Search customer..."
                  error={!!errors.customer}
                  helperText={errors.customer}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <Search
                          sx={{ fontSize: 18, color: "text.secondary", mr: 1 }}
                        />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {customersLoading && (
                          <CircularProgress color="inherit" size={16} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DatePicker
                label="Statement Date"
                value={form.statementDate}
                onChange={(value) => updateForm("statementDate", value)}
                disabled={submitting}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: Boolean(errors.statementDate),
                    helperText: errors.statementDate,
                  },
                }}
              />
              <DatePicker
                label="From Date"
                value={form.fromDate}
                onChange={(value) => updateForm("fromDate", value)}
                disabled={submitting}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: Boolean(errors.fromDate),
                    helperText: errors.fromDate,
                  },
                }}
              />
              <DatePicker
                label="To Date"
                value={form.toDate}
                onChange={(value) => updateForm("toDate", value)}
                disabled={submitting}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: Boolean(errors.toDate),
                    helperText: errors.toDate,
                  },
                }}
              />
            </Stack>

            <Box>
              <FormLabel
                component="legend"
                sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}
              >
                Options
              </FormLabel>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includeOpenEntries}
                      disabled={submitting}
                      onChange={(e) =>
                        updateForm("includeOpenEntries", e.target.checked)
                      }
                    />
                  }
                  label="Include Open Entries"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includeClosedEntries}
                      disabled={submitting}
                      onChange={(e) =>
                        updateForm("includeClosedEntries", e.target.checked)
                      }
                    />
                  }
                  label="Include Closed Entries"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includeReversedEntries}
                      disabled={submitting}
                      onChange={(e) =>
                        updateForm("includeReversedEntries", e.target.checked)
                      }
                    />
                  }
                  label="Include Reversed Entries"
                />
              </Stack>
            </Box>

            <FormControl>
              <FormLabel sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}>
                Output
              </FormLabel>
              <RadioGroup
                row
                value={form.output}
                onChange={(e) =>
                  updateForm("output", e.target.value as StatementOutput)
                }
              >
                <FormControlLabel
                  value="pdf"
                  control={<Radio disabled={submitting} />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PictureAsPdf fontSize="small" />
                      <span>Download PDF</span>
                    </Stack>
                  }
                />
                <FormControlLabel
                  value="email"
                  control={<Radio disabled={submitting} />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Email fontSize="small" />
                      <span>Send Email</span>
                    </Stack>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit}
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {submitting ? "Generating..." : "Generate Statement"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

// ---------------------------------------------------------------------------
// Main Card
// ---------------------------------------------------------------------------

function CustomerStatementCard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const color = theme.palette.primary.main;
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <Card
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            maxWidth: 640,
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: 140,
              height: 140,
              borderRadius: "0 0 0 140px",
              background: alpha(color, isDark ? 0.1 : 0.06),
            },
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 }, position: "relative" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2.5,
                mb: 2.5,
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  bgcolor: alpha(color, 0.12),
                }}
              >
                <PictureAsPdf sx={{ color, fontSize: 28 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, lineHeight: 1.25 }}
                >
                  Customer Statement Report
                </Typography>
                <Chip
                  icon={<CloudDone sx={{ fontSize: 14 }} />}
                  label="Connected to Business Central"
                  size="small"
                  sx={{
                    mt: 0.75,
                    height: 22,
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                />
              </Box>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.6, maxWidth: 480 }}
            >
              Generate an official customer statement directly from Microsoft
              Dynamics 365 Business Central — choose a customer, a date range,
              and either download the PDF or have it emailed.
            </Typography>

            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward fontSize="small" />}
              onClick={() => setDialogOpen(true)}
              sx={{
                background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.75)})`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${alpha(color, 0.9)}, ${color})`,
                  boxShadow: `0 6px 20px ${alpha(color, 0.4)}`,
                },
              }}
            >
              Generate Statement
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <CustomerStatementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  return (
    <Box
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto", width: "100%" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate customer statements from Microsoft Dynamics 365 Business
            Central.
          </Typography>
        </Box>
      </motion.div>

      {/* Main Card */}
      <CustomerStatementCard />
    </Box>
  );
}
