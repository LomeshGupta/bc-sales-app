"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Autocomplete,
  InputAdornment,
  Divider,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  Delete,
  Search,
  Person,
  CalendarToday,
  Receipt,
  LocalShipping,
  ShoppingCart,
  CheckCircle,
  AttachMoney,
  Inventory2,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useAllCustomers,
  useItems,
  useCreateSalesOrder,
} from "@/hooks/useQueries";

import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
  COMPANY_NAME,
} from "@/constants";

const MotionTableRow = motion(TableRow);
import { Customer, BCItem, CreateSalesOrderLine } from "@/types";
import { formatCurrency, getInitials, stringToColor } from "@/utils";
import { ROUTES } from "@/constants";
import { alpha } from "@mui/material/styles";
import { useAuthStore } from "@/store/authStore";
import { getOAuthToken } from "@/services/auth/tokenService";

interface BCProcessResponse {
  "@odata.context": string;
  value: string;
}

interface BCProcessResult {
  success: boolean;
  message: string;
}

export async function processSalesOrders(): Promise<BCProcessResult> {
  const tokenData = await getOAuthToken();

  const url =
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
    `/ODataV4/Velvotix_ProcessHeader?Company=${COMPANY_NAME}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `ProcessHeader failed (${response.status} ${response.statusText})`,
    );
  }

  const data: BCProcessResponse = await response.json();

  try {
    return JSON.parse(data.value) as BCProcessResult;
  } catch {
    throw new Error("Invalid response received from Business Central");
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderLine extends CreateSalesOrderLine {
  _key: string;
  item?: BCItem;
  total: number;
}

interface OrderForm {
  customer: Customer | null;
  orderDate: string;
  requestedDeliveryDate: string;
  externalDocumentNo: string;
  yourReference: string;
  locationCode: string;
  paymentTermsCode: string;
  salespersonCode: string;
  shipToName: string;
  shipToAddress: string;
  shipToCity: string;
  shipToCountry: string;
}

const STEPS = ["Customer", "Order Info", "Line Items", "Review"];
const PAYMENT_TERMS = [
  "NET30",
  "NET15",
  "NET60",
  "COD",
  "2/10 NET30",
  "IMMEDIATE",
];
const LOCATIONS = ["MAIN", "EAST", "WEST", "NORTH", "SOUTH"];

// ─── Line Item Row ────────────────────────────────────────────────────────────
function LineItemRow({
  line,
  items,
  onUpdate,
  onRemove,
  index,
}: {
  line: OrderLine;
  items: BCItem[];
  onUpdate: (key: string, updates: Partial<OrderLine>) => void;
  onRemove: (key: string) => void;
  index: number;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  // const [itemSearch, setItemSearch] = useState(line.item?.description || "");

  const updateField = (field: keyof OrderLine, value: any) => {
    const updates: Partial<OrderLine> = { [field]: value };
    const qty = field === "quantity" ? value : line.quantity;
    const price = field === "unitPrice" ? value : line.unitPrice;
    const disc =
      field === "discountPercent" ? value : line.discountPercent || 0;
    updates.total = qty * price * (1 - disc / 100);
    onUpdate(line._key, updates);
  };

  return (
    <MotionTableRow
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      layout
    >
      <TableCell
        sx={{ pl: 1, width: 40, color: "text.disabled", fontSize: "0.75rem" }}
      >
        {index + 1}
      </TableCell>
      <TableCell sx={{ minWidth: 260 }}>
        <Autocomplete
          size="small"
          options={items}
          getOptionLabel={(o) => `${o.no} – ${o.description}`}
          value={line.item || null}
          // inputValue={itemSearch}
          // onInputChange={(_, v) => setItemSearch(v)}
          onChange={(_, item) => {
            if (item) {
              onUpdate(line._key, {
                item,
                itemNo: item.no,
                description: item.description,
                unitPrice: item.unitPrice,
                unitOfMeasureCode: item.unitOfMeasureCode,
                total: item.unitPrice * line.quantity,
              });
              // setItemSearch(item.description);
            }
          }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;

            return (
              <Box component="li" key={key} {...optionProps} sx={{ gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.no}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.description}
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(option.unitPrice)}
                </Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search item..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                },
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <Search
                      sx={{
                        fontSize: 16,
                        color: "text.disabled",
                        mr: 0.5,
                      }}
                    />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {line.itemNo && !line.item && (
          <TextField
            size="small"
            value={line.description}
            placeholder="Description"
            onChange={(e) => updateField("description", e.target.value)}
            fullWidth
            sx={{ mt: 0.5 }}
          />
        )}
      </TableCell>
      <TableCell sx={{ width: 90 }}>
        <TextField
          size="small"
          type="number"
          value={line.quantity}
          onChange={(e) => {
            const value = e.target.value;

            updateField("quantity", value === "" ? 0 : Number(value));
          }}
          slotProps={{ input: { inputProps: { min: 0 } } }}
          sx={{ width: 80 }}
        />
      </TableCell>
      <TableCell sx={{ width: 90 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 0.25 }}
        >
          {line.unitOfMeasureCode || "—"}
        </Typography>
      </TableCell>
      <TableCell sx={{ width: 120 }}>
        <TextField
          size="small"
          type="number"
          value={line.unitPrice}
          onChange={(e) => updateField("unitPrice", Number(e.target.value))}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
              inputProps: { min: 0, step: 0.01 },
            },
          }}
          sx={{ width: 110 }}
        />
      </TableCell>
      <TableCell sx={{ width: 80 }}>
        <TextField
          size="small"
          type="number"
          value={line.discountPercent || 0}
          onChange={(e) =>
            updateField(
              "discountPercent",
              Math.min(100, Math.max(0, Number(e.target.value))),
            )
          }
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              inputProps: { min: 0, max: 100 },
            },
          }}
          sx={{ width: 80 }}
        />
      </TableCell>
      <TableCell sx={{ width: 110, textAlign: "right" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatCurrency(line.total)}
        </Typography>
      </TableCell>
      <TableCell sx={{ width: 40, pr: 1 }}>
        <Tooltip title="Remove line">
          <IconButton
            size="small"
            onClick={() => onRemove(line._key)}
            sx={{ color: "error.main" }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </MotionTableRow>
  );
}

// ─── Mobile Line Card ─────────────────────────────────────────────────────────
function MobileLineCard({
  line,
  items,
  onUpdate,
  onRemove,
  index,
}: {
  line: OrderLine;
  items: BCItem[];
  onUpdate: (k: string, u: Partial<OrderLine>) => void;
  onRemove: (k: string) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(!line.itemNo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <Card sx={{ mb: 1.5, border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: expanded ? 1.5 : 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={index + 1}
                size="small"
                sx={{ width: 28, height: 24, fontSize: "0.7rem" }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {line.item?.description ||
                    line.description ||
                    "Select item..."}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {line.quantity} × {formatCurrency(line.unitPrice)} ={" "}
                  {formatCurrency(line.total)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? (
                  <ExpandLess fontSize="small" />
                ) : (
                  <ExpandMore fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onRemove(line._key)}
                sx={{ color: "error.main" }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Collapse in={expanded}>
            <Grid container spacing={1.5}>
              <Grid size={12}>
                <Autocomplete
                  size="small"
                  options={items}
                  getOptionLabel={(o) => `${o.no} – ${o.description}`}
                  value={line.item || null}
                  onChange={(_, item) => {
                    if (item) {
                      const total = item.unitPrice * line.quantity;
                      onUpdate(line._key, {
                        item,
                        itemNo: item.no,
                        description: item.description,
                        unitPrice: item.unitPrice,
                        unitOfMeasureCode: item.unitOfMeasureCode,
                        total,
                      });
                    }
                  }}
                  renderInput={(p) => <TextField {...p} label="Item" />}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Qty"
                  type="number"
                  value={line.quantity}
                  onChange={(e) => {
                    const q =
                      e.target.value === "" ? 0 : Number(e.target.value);
                    onUpdate(line._key, {
                      quantity: q,
                      total:
                        q *
                        line.unitPrice *
                        (1 - (line.discountPercent || 0) / 100),
                    });
                  }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    onUpdate(line._key, {
                      unitPrice: p,
                      total:
                        line.quantity *
                        p *
                        (1 - (line.discountPercent || 0) / 100),
                    });
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Discount %"
                  type="number"
                  value={line.discountPercent || 0}
                  onChange={(e) => {
                    const d = Math.min(
                      100,
                      Math.max(0, Number(e.target.value)),
                    );
                    onUpdate(line._key, {
                      discountPercent: d,
                      total: line.quantity * line.unitPrice * (1 - d / 100),
                    });
                  }}
                />
              </Grid>
              <Grid size={6}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Line Total
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatCurrency(line.total)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewSalesOrderPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDark = theme.palette.mode === "dark";

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  const { data: customers = [], isLoading: customersLoading } =
    useAllCustomers();
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { mutate: submitOrder, isPending: submitting } = useCreateSalesOrder();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<OrderForm>({
    customer: null,
    orderDate: today,
    requestedDeliveryDate: "",
    externalDocumentNo: "",
    yourReference: "",
    locationCode: user?.location || "",
    paymentTermsCode: "NET30",
    salespersonCode: "",
    shipToName: "",
    shipToAddress: "",
    shipToCity: "",
    shipToCountry: "",
  });

  const [lines, setLines] = useState<OrderLine[]>([
    {
      _key: "1",
      lineNo: 10000,
      itemNo: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      total: 0,
      type: "Item",
    },
  ]);

  // Auto-fill ship-to from customer
  useEffect(() => {
    if (form.customer) {
      setForm((f) => ({
        ...f,
        shipToName: form.customer!.name,
        shipToAddress: form.customer!.address || "",
        shipToCity: form.customer!.city || "",
        shipToCountry: form.customer!.country || "",
        salespersonCode: form.customer!.salesperson || "",
        paymentTermsCode: f.paymentTermsCode,
      }));
    }
  }, [form.customer]);

  const updateForm = (field: keyof OrderForm, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addLine = () => {
    const maxLine = lines.reduce((m, l) => Math.max(m, l.lineNo), 0);
    setLines((ls) => [
      ...ls,
      {
        _key: Date.now().toString(),
        lineNo: maxLine + 10000,
        itemNo: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        total: 0,
        type: "Item",
      },
    ]);
  };

  const updateLine = useCallback((key: string, updates: Partial<OrderLine>) => {
    setLines((ls) =>
      ls.map((l) => (l._key === key ? { ...l, ...updates } : l)),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((ls) => ls.filter((l) => l._key !== key));
  }, []);

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const totalDiscount = lines.reduce(
    (s, l) => s + (l.quantity * l.unitPrice * (l.discountPercent || 0)) / 100,
    0,
  );
  const validLines = lines.filter((l) => l.itemNo);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 0) {
      if (!form.customer) errs.customer = "Please select a customer";
    }
    if (currentStep === 1) {
      if (!form.orderDate) errs.orderDate = "Order date is required";
    }
    if (currentStep === 2) {
      if (validLines.length === 0)
        errs.lines = "At least one line item is required";
      lines.forEach((l, i) => {
        if (l.itemNo && l.quantity <= 0)
          errs[`line_${i}`] = "Quantity must be > 0";
        if (l.itemNo && l.unitPrice <= 0)
          errs[`price_${i}`] = "Price must be > 0";
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate(step)) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!validate(2) || !form.customer) return;

    submitOrder(
      {
        customerNo: form.customer.no,
        orderDate: form.orderDate,
        requestedDeliveryDate: form.requestedDeliveryDate || undefined,
        externalDocumentNo: form.externalDocumentNo || undefined,
        yourReference: form.yourReference || undefined,
        locationCode: form.locationCode,
        salespersonCode: form.salespersonCode || undefined,
        paymentTermsCode: form.paymentTermsCode,
        shipToName: form.shipToName || undefined,
        shipToAddress: form.shipToAddress || undefined,
        shipToCity: form.shipToCity || undefined,
        shipToCountry: form.shipToCountry || undefined,
        lines: validLines.map((l) => ({
          lineNo: l.lineNo,
          type: "Item" as const,
          itemNo: l.itemNo,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent,
          unitOfMeasureCode: l.unitOfMeasureCode,
        })),
      },
      {
        onSuccess: async (order) => {
          await processSalesOrders();

          setSuccessOrder(order.orderNo);
          setStep(4);
        },
      },
    );
  };

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (successOrder) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          maxWidth: 600,
          mx: "auto",
          textAlign: "center",
          pt: { xs: 4, sm: 8 },
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: alpha("#4CAF50", 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <CheckCircle sx={{ fontSize: 48, color: "#4CAF50" }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Order Created!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
            Sales order has been submitted to Business Central
          </Typography>
          <Chip
            label={successOrder}
            sx={{
              fontWeight: 700,
              fontSize: "1rem",
              px: 2,
              py: 0.5,
              mb: 4,
              bgcolor: alpha("#4CAF50", 0.1),
              color: "#4CAF50",
            }}
          />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push(ROUTES.SALES_ORDERS)}
            >
              View All Orders
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setForm({
                  customer: null,
                  orderDate: today,
                  requestedDeliveryDate: "",
                  externalDocumentNo: "",
                  yourReference: "",
                  locationCode: "MAIN",
                  paymentTermsCode: "NET30",
                  salespersonCode: "",
                  shipToName: "",
                  shipToAddress: "",
                  shipToCity: "",
                  shipToCountry: "",
                });
                setLines([
                  {
                    _key: "1",
                    lineNo: 10000,
                    itemNo: "",
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                    discountPercent: 0,
                    total: 0,
                    type: "Item",
                  },
                ]);
                setStep(0);
                setSuccessOrder(null);
              }}
            >
              New Order
            </Button>
          </Box>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1200, mx: "auto", width: "100%" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton
            onClick={() => router.push(ROUTES.SALES_ORDERS)}
            size="small"
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}
            >
              New Sales Order
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create and submit to Business Central
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Stepper activeStep={step} alternativeLabel={!isMobile}>
              {STEPS.map((label, idx) => (
                <Step key={label} completed={idx < step}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        fontWeight: idx === step ? 700 : 400,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── Step 0: Customer ──────────────────────────────────────────────── */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: alpha("#D32F2F", 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Person sx={{ color: "primary.main" }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, lineHeight: 1 }}
                    >
                      Select Customer
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choose the customer from Business Central
                    </Typography>
                  </Box>
                </Box>

                <Autocomplete
                  options={customers ?? []}
                  loading={customersLoading}
                  value={form.customer}
                  onChange={(_, customer) => {
                    updateForm("customer", customer);
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
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

                        {customer.blocked && (
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
                              sx={{
                                fontSize: 18,
                                color: "text.secondary",
                                mr: 1,
                              }}
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

                {/* Customer preview card */}
                <AnimatePresence>
                  {form.customer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Paper
                        sx={{
                          mt: 2.5,
                          p: 2,
                          borderRadius: 3,
                          bgcolor: isDark
                            ? "rgba(211,47,47,0.06)"
                            : "rgba(211,47,47,0.03)",
                          border: "1px solid",
                          borderColor: alpha("#D32F2F", 0.15),
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "flex-start",
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 52,
                              height: 52,
                              bgcolor: stringToColor(form.customer.name),
                              fontWeight: 700,
                              fontSize: "1.1rem",
                            }}
                          >
                            {getInitials(form.customer.name)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700 }}
                            >
                              {form.customer.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {form.customer.no}
                            </Typography>
                            {form.customer.address && (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ display: "block" }}
                              >
                                {[
                                  form.customer.address,
                                  form.customer.city,
                                  form.customer.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Credit Limit
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {formatCurrency(
                                form.customer.creditLimit,
                                form.customer.currency,
                              )}
                            </Typography>
                            <Chip
                              label={form.customer.customerGroup || "General"}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Box>
                      </Paper>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 1: Order Info ────────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Grid container spacing={2}>
              {/* Order Header */}
              <Grid size={12}>
                <Card>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha("#2196F3", 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Receipt sx={{ color: "#2196F3" }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Order Details
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Order Date *"
                          type="date"
                          value={form.orderDate}
                          onChange={(e) =>
                            updateForm("orderDate", e.target.value)
                          }
                          error={!!errors.orderDate}
                          helperText={errors.orderDate}
                          slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarToday
                                    fontSize="small"
                                    sx={{ color: "text.secondary" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Requested Delivery Date"
                          type="date"
                          value={form.requestedDeliveryDate}
                          onChange={(e) =>
                            updateForm("requestedDeliveryDate", e.target.value)
                          }
                          slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocalShipping
                                    fontSize="small"
                                    sx={{ color: "text.secondary" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="External Document No."
                          placeholder="Customer's PO number"
                          value={form.externalDocumentNo}
                          onChange={(e) =>
                            updateForm("externalDocumentNo", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Your Reference"
                          placeholder="Internal reference"
                          value={form.yourReference}
                          onChange={(e) =>
                            updateForm("yourReference", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Autocomplete
                          freeSolo
                          options={PAYMENT_TERMS}
                          value={form.paymentTermsCode}
                          onInputChange={(_, v) =>
                            updateForm("paymentTermsCode", v)
                          }
                          renderInput={(params) => (
                            <TextField {...params} label="Payment Terms" />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Autocomplete
                          freeSolo
                          options={LOCATIONS}
                          value={form.locationCode}
                          onInputChange={(_, v) =>
                            updateForm("locationCode", v)
                          }
                          disabled
                          renderInput={(params) => (
                            <TextField {...params} label="Location Code" />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Salesperson Code"
                          value={form.salespersonCode}
                          onChange={(e) =>
                            updateForm("salespersonCode", e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Ship To */}
              <Grid size={12}>
                <Card>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha("#4CAF50", 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LocalShipping sx={{ color: "#4CAF50" }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Ship To
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Ship-To Name"
                          value={form.shipToName}
                          onChange={(e) =>
                            updateForm("shipToName", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          value={form.shipToAddress}
                          onChange={(e) =>
                            updateForm("shipToAddress", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="City"
                          value={form.shipToCity}
                          onChange={(e) =>
                            updateForm("shipToCity", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Country"
                          value={form.shipToCountry}
                          onChange={(e) =>
                            updateForm("shipToCountry", e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* ── Step 2: Line Items ────────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha("#FF9800", 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Inventory2 sx={{ color: "#FF9800" }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, lineHeight: 1 }}
                      >
                        Line Items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {validLines.length} of {lines.length} items added
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={addLine}
                  >
                    Add Line
                  </Button>
                </Box>

                {errors.lines && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {errors.lines}
                  </Alert>
                )}

                {/* Desktop table */}
                {!isMobile ? (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {[
                            "#",
                            "Item",
                            "Qty",
                            "UOM",
                            "Unit Price",
                            "Disc %",
                            "Total",
                            "",
                          ].map((h) => (
                            <TableCell
                              key={h}
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.72rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "text.secondary",
                                pb: 1,
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {lines.map((line, idx) => (
                            <LineItemRow
                              key={line._key}
                              line={line}
                              items={items}
                              onUpdate={updateLine}
                              onRemove={removeLine}
                              index={idx}
                            />
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  /* Mobile cards */
                  <Box>
                    <AnimatePresence>
                      {lines.map((line, idx) => (
                        <MobileLineCard
                          key={line._key}
                          line={line}
                          items={items}
                          onUpdate={updateLine}
                          onRemove={removeLine}
                          index={idx}
                        />
                      ))}
                    </AnimatePresence>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={addLine}
                      startIcon={<Add />}
                      sx={{
                        mt: 1,
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 3,
                        py: 1.5,
                        color: "text.secondary",
                      }}
                    >
                      Add Line Item
                    </Button>
                  </Box>
                )}

                {/* Order totals */}
                <Divider sx={{ my: 2, opacity: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Box sx={{ minWidth: { xs: "100%", sm: 280 } }}>
                    {[
                      { label: "Subtotal", value: subtotal + totalDiscount },
                      {
                        label: "Total Discount",
                        value: -totalDiscount,
                        color: "#4CAF50",
                      },
                    ].map((row) => (
                      <Box
                        key={row.label}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {row.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: row.color || "text.primary",
                          }}
                        >
                          {formatCurrency(Math.abs(row.value))}
                          {row.color && row.value < 0 ? " off" : ""}
                        </Typography>
                      </Box>
                    ))}
                    <Divider sx={{ my: 1, opacity: 0.5 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Order Total
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: "primary.main",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {formatCurrency(subtotal)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3: Review & Submit ───────────────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Grid container spacing={2}>
              {/* Summary cards */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        mb: 2,
                      }}
                    >
                      Customer
                    </Typography>
                    {form.customer && (
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: stringToColor(form.customer.name),
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(form.customer.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {form.customer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {form.customer.no}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ display: "block" }}
                          >
                            {[form.customer.city, form.customer.country]
                              .filter(Boolean)
                              .join(", ")}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        mb: 2,
                      }}
                    >
                      Order Info
                    </Typography>
                    {[
                      { label: "Order Date", value: form.orderDate },
                      {
                        label: "Delivery Date",
                        value: form.requestedDeliveryDate || "—",
                      },
                      { label: "Payment Terms", value: form.paymentTermsCode },
                      { label: "Location", value: form.locationCode },
                      ...(form.externalDocumentNo
                        ? [
                            {
                              label: "PO Number",
                              value: form.externalDocumentNo,
                            },
                          ]
                        : []),
                    ].map((row) => (
                      <Box
                        key={row.label}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {row.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {row.value}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: isDark
                      ? alpha("#D32F2F", 0.06)
                      : alpha("#D32F2F", 0.03),
                    borderColor: alpha("#D32F2F", 0.15),
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        mb: 2,
                      }}
                    >
                      Order Total
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: "primary.main",
                        letterSpacing: "-0.03em",
                        mb: 0.5,
                      }}
                    >
                      {formatCurrency(subtotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {validLines.length} line
                      {validLines.length !== 1 ? "s" : ""} ·{" "}
                      {form.customer?.currency || "USD"}
                    </Typography>
                    {totalDiscount > 0 && (
                      <Chip
                        label={`${formatCurrency(totalDiscount)} discount applied`}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: alpha("#4CAF50", 0.1),
                          color: "#4CAF50",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Line items summary */}
              <Grid size={12}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "0.72rem",
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        mb: 2,
                      }}
                    >
                      Line Items ({validLines.length})
                    </Typography>
                    {validLines.map((line, idx) => (
                      <Box
                        key={line._key}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 1,
                          borderBottom:
                            idx < validLines.length - 1 ? "1px solid" : "none",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.5,
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={line.itemNo}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {line.description}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {line.quantity} × {formatCurrency(line.unitPrice)}
                              {(line.discountPercent || 0) > 0
                                ? ` (${line.discountPercent}% off)`
                                : ""}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, flexShrink: 0 }}
                        >
                          {formatCurrency(line.total)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 3,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            variant="outlined"
            onClick={
              step === 0 ? () => router.push(ROUTES.SALES_ORDERS) : handleBack
            }
            startIcon={<ArrowBack />}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {step < 3 && subtotal > 0 && (
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {formatCurrency(subtotal)}
              </Typography>
            )}
            {step < 3 ? (
              <Button variant="contained" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={
                  submitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ShoppingCart />
                  )
                }
                sx={{ px: 4 }}
              >
                {submitting ? "Submitting..." : "Submit to Business Central"}
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
