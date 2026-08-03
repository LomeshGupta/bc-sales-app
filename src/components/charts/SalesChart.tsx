"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SalesSummary } from "@/types";
import { formatCurrencyCompact } from "@/utils";
import { motion } from "framer-motion";

interface SalesChartProps {
  data: SalesSummary[];
  isLoading?: boolean;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const COLORS = ["#D32F2F", "#1976D2", "#2E7D32", "#ED6C02", "#7B1FA2"];

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
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25,
        boxShadow: 4,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      {payload.map((entry) => (
        <Typography
          key={entry.dataKey}
          variant="caption"
          sx={{ display: "block", fontWeight: 600 }}
          color={entry.color}
        >
          {entry.dataKey}: {formatCurrencyCompact(entry.value)}
        </Typography>
      ))}
    </Box>
  );
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const years = useMemo(
    () => [...new Set(data.map((d) => d.postingYear))].sort((a, b) => a - b),
    [data],
  );

  const displayedYears = isMobile ? years.slice(-2) : years;

  const chartData = useMemo(() => {
    return MONTHS.map((month, index) => {
      const row: Record<string, any> = { month };

      displayedYears.forEach((year) => {
        const sale = data.find(
          (d) => d.postingYear === year && d.postingDate === index + 1,
        );

        row[year] = sale?.amount ?? 0;
      });

      return row;
    });
  }, [data, displayedYears]);

  if (isLoading) {
    return (
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width={160} height={28} />
          <Skeleton
            variant="rounded"
            height={isMobile ? 180 : 250}
            sx={{ mt: 2 }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Sales Performance
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Monthly Sales by Year
            </Typography>
          </Box>

          <ResponsiveContainer width="100%" height={isMobile ? 180 : 260}>
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: isMobile ? 5 : 20,
                left: isMobile ? -30 : -10,
                bottom: 5,
              }}
            >
              <defs>
                {displayedYears.map((year, index) => (
                  <linearGradient
                    key={year}
                    id={`gradient-${year}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS[index % COLORS.length]}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS[index % COLORS.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                interval={isMobile ? 1 : 0}
                tick={{
                  fontSize: isMobile ? 10 : 11,
                  fill: theme.palette.text.secondary,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{
                  fontSize: isMobile ? 10 : 11,
                  fill: theme.palette.text.secondary,
                }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 45 : 60}
              />

              <Tooltip content={<CustomTooltip />} />

              {!isMobile && <Legend />}

              {displayedYears.map((year, index) => (
                <Area
                  key={year}
                  type="monotone"
                  dataKey={year.toString()}
                  stroke={COLORS[index % COLORS.length]}
                  fill={`url(#gradient-${year})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: isMobile ? 3 : 5,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
