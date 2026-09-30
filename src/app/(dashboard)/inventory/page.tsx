 "use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Inventory2, LocationOn, Search } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useInventory, useLocations } from "@/hooks/useQueries";

// Keep server and browser output deterministic. Locale-sensitive formatting
// such as toLocaleString() can produce different HTML during hydration.
function formatQuantity(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

function formatAmount(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export default function InventoryPage() {
  const [locationCode, setLocationCode] = useState("");
  const [search, setSearch] = useState("");

  const {
    data: locations,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useLocations();

  const {
    data: inventory,
    isLoading,
    isFetching,
    isError,
  } = useInventory({
    locationCode: locationCode || undefined,
    search: search.trim() || undefined,
  });

  const locationOptions = useMemo(
    () =>
      [...(locations ?? [])].sort((a, b) =>
        `${a.code} ${a.displayName}` < `${b.code} ${b.displayName}` ? -1 :
          `${a.code} ${a.displayName}` > `${b.code} ${b.displayName}` ? 1 : 0,
      ),
    [locations],
  );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1200,
        mx: "auto",
        width: "100%",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View available stock by location.
            </Typography>
          </Box>

          {isFetching && !isLoading && (
            <CircularProgress size={20} thickness={5} />
          )}
        </Stack>
      </motion.div>

      <Card
        sx={{
          mb: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={1.5}>
            <TextField
              select
              fullWidth
              label="Location"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              disabled={locationsLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">All locations</MenuItem>
              {locationOptions.map((location) => (
                <MenuItem key={location.id} value={location.code}>
                  {location.code} - {location.displayName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Search item"
              placeholder="Search by item number or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {locationsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Locations could not be loaded. You can still try the inventory list.
        </Alert>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Unable to load inventory from Business Central.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !inventory?.length ? (
        <Card sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
          <CardContent sx={{ py: 7, textAlign: "center" }}>
            <Inventory2
              sx={{ fontSize: 44, color: "text.disabled", mb: 1 }}
            />
            <Typography sx={{ fontWeight: 700 }}>
              No inventory found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try another location or search term.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {inventory.map((item, index) => (
            <motion.div
              key={`${item.id}-${item.locationCode}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.2) }}
            >
              <Card
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700 }}
                      >
                        {item.no}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1.25,
                          mt: 0.25,
                        }}
                      >
                        {item.description}
                      </Typography>

                      {item.description2 && item.description2 !== item.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.35 }}
                        >
                          {item.description2}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        sx={{ mt: 1 }}
                      >
                        <Chip
                          size="small"
                          icon={<LocationOn />}
                          label={item.locationCode || "No location"}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={item.unitOfMeasureCode}
                          variant="outlined"
                        />
                      </Stack>
                    </Box>

                    <Box sx={{ textAlign: "right", minWidth: 80 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        Available
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color:
                            item.inventory > 0
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {formatQuantity(item.inventory)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.unitOfMeasureCode}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mt: 1.5, mb: 1 }} />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Unit cost
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {formatAmount(item.unitCost)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Stack>
      )}
    </Box>
  );
}
