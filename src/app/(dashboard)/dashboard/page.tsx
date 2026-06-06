"use client";
import React from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Skeleton,
  useMediaQuery,
  useTheme,
  Fab,
  Tooltip,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { KPICard, KPICardSkeleton } from "@/components/cards/KPICard";
import { SalesChart } from "@/components/charts/SalesChart";
import { RecentActivityList } from "@/components/cards/RecentActivityCard";
import {
  useDashboardKPIs,
  useSalesSummary,
  useRecentActivity,
} from "@/hooks/useQueries";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: salesSummary, isLoading: salesLoading } = useSalesSummary();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Box
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto", width: "100%" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}
            >
              {getGreeting()}
              {user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              Refresh
            </Button>
          </Tooltip>
        </Box>
      </motion.div>

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {kpisLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 6, sm: 6, md: 3 }} key={i}>
                <KPICardSkeleton />
              </Grid>
            ))
          : kpis?.map((kpi, idx) => (
              <Grid size={{ xs: 6, sm: 6, md: 3 }} key={kpi.id}>
                <KPICard data={kpi} index={idx} />
              </Grid>
            ))}
      </Grid>

      {/* Charts + Activity */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SalesChart data={salesSummary || []} isLoading={salesLoading} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <RecentActivityList
            data={activity || []}
            isLoading={activityLoading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions Row */}
      {/* <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={1.5}>
            {[
              {
                label: "New Order",
                color: "#D32F2F",
                path: ROUTES.SALES_ORDERS,
              },
              {
                label: "Add Customer",
                color: "#2196F3",
                path: ROUTES.CUSTOMERS,
              },
              { label: "View Reports", color: "#4CAF50", path: ROUTES.REPORTS },
              {
                label: "All Orders",
                color: "#FF9800",
                path: ROUTES.SALES_ORDERS,
              },
            ].map((action, idx) => (
              <Grid size={{ xs: 6, sm: 3 }} key={action.label}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.6 + idx * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    onClick={() => router.push(action.path)}
                    sx={{
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        borderColor: action.color,
                        boxShadow: `0 4px 20px ${action.color}20`,
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 2,
                        "&:last-child": { pb: 2 },
                        textAlign: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: `${action.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 1,
                        }}
                      >
                        <Add sx={{ color: action.color, fontSize: 20 }} />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, display: "block" }}
                      >
                        {action.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div> */}

      {/* FAB for mobile */}
      {/* <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          display: { xs: 'flex', md: 'none' },
          background: 'linear-gradient(135deg, #D32F2F, #B71C1C)',
          boxShadow: '0 8px 24px rgba(211,47,47,0.4)',
        }}
        onClick={() => router.push(ROUTES.SALES_ORDERS)}
      >
        <Add />
      </Fab> */}
    </Box>
  );
}
