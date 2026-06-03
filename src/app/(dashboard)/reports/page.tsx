'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Skeleton,
  CircularProgress,
  Divider,
  Avatar,
  useTheme,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Download,
  Assessment,
  PeopleAlt,
  BarChart,
  Inventory2,
  AccountBalance,
  TrendingUp,
  CreditScore,
  PersonSearch,
  Warehouse,
  Schedule,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useReports, useGenerateReport } from '@/hooks/useQueries';
import { Report } from '@/types';
import { useAppStore } from '@/store/appStore';
import { formatDate } from '@/utils';
import { alpha } from '@mui/material/styles';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  sales: BarChart,
  finance: AccountBalance,
  inventory: Warehouse,
  customers: PeopleAlt,
};

const CATEGORY_COLORS: Record<string, string> = {
  sales: '#D32F2F',
  finance: '#2196F3',
  inventory: '#FF9800',
  customers: '#9C27B0',
};

const REPORT_ICONS: Record<string, React.ComponentType<any>> = {
  PeopleAlt,
  BarChart,
  Inventory2,
  AccountBalance,
  TrendingUp,
  CreditScore,
  PersonSearch,
  Warehouse,
};

const TABS = ['All', 'Sales', 'Finance', 'Customers', 'Inventory'];

interface ReportCardProps {
  report: Report;
  index: number;
}

function ReportCard({ report, index }: ReportCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showSnackbar } = useAppStore();
  const { mutate: generate, isPending } = useGenerateReport();
  const [generating, setGenerating] = useState(false);

  const Icon = REPORT_ICONS[report.icon] || BarChart;
  const color = CATEGORY_COLORS[report.category];

  const handleGenerate = () => {
    setGenerating(true);
    generate(report.id, {
      onSuccess: () => {
        setGenerating(false);
        showSnackbar(`"${report.title}" generated successfully`, 'success');
      },
      onError: () => {
        setGenerating(false);
        showSnackbar('Failed to generate report', 'error');
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.06 }}
      layout
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: 80,
            height: 80,
            borderRadius: '0 0 0 80px',
            background: alpha(color, isDark ? 0.08 : 0.05),
          },
        }}
      >
        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2.5 } }}>
          {/* Icon & Category */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(color, 0.12),
                borderRadius: 2.5,
              }}
            >
              <Icon sx={{ color, fontSize: 24 }} />
            </Avatar>
            <Chip
              label={report.category}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                bgcolor: alpha(color, 0.1),
                color,
                border: 'none',
              }}
            />
          </Box>

          {/* Title & Description */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700,  mb: 0.75, lineHeight: 1.3 }}>
            {report.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, flex: 1, lineHeight: 1.5, fontSize: '0.82rem' }}
          >
            {report.description}
          </Typography>

          {/* Last Generated */}
          {report.lastGenerated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
              <Schedule sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                Last: {formatDate(report.lastGenerated)}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <Download fontSize="small" />}
              onClick={handleGenerate}
              disabled={generating}
              sx={{
                background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.75)})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(color, 0.9)}, ${color})`,
                  boxShadow: `0 6px 20px ${alpha(color, 0.4)}`,
                },
                '&:disabled': { background: 'action.disabledBackground' },
              }}
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ReportCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width={70} height={22} />
        </Box>
        <Skeleton width="80%" height={24} sx={{ mb: 1 }} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="70%" height={16} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={36} />
      </CardContent>
    </Card>
  );
}

// Summary Stats Bar
function ReportSummaryBar() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const stats = [
    { label: 'Reports Available', value: '8', color: '#D32F2F' },
    { label: 'Generated Today', value: '3', color: '#4CAF50' },
    { label: 'Scheduled', value: '2', color: '#FF9800' },
    { label: 'Categories', value: '4', color: '#2196F3' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container>
            {stats.map((stat, idx) => (
              <Grid size={{ xs: 3 }} key={stat.label}>
                <Box
                  sx={{
                    textAlign: 'center',
                    px: 1,
                    borderRight: idx < stats.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800,  color: stat.color, letterSpacing: '-0.02em' }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', lineHeight: 1.2, display: 'block' }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { data: reports, isLoading } = useReports();

  const filteredReports = reports?.filter((r) => {
    if (activeTab === 0) return true;
    return r.category === TABS[activeTab].toLowerCase();
  }) || [];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{  fontWeight: 800, letterSpacing: "-0.02em" }} >
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate and download business reports
          </Typography>
        </Box>
      </motion.div>

      {/* Summary Stats */}
      <ReportSummaryBar />

      {/* Category Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: 3,
            '& .MuiTabs-indicator': { height: 2.5, borderRadius: 2 },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minWidth: 'auto',
              px: { xs: 1.5, sm: 2.5 },
            },
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((tab) => (
            <Tab key={tab} label={tab} />
          ))}
        </Tabs>
      </motion.div>

      {/* Reports Grid */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}>
          <Grid container spacing={2}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                    <ReportCardSkeleton />
                  </Grid>
                ))
              : filteredReports.map((report, idx) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={report.id}>
                    <ReportCard report={report} index={idx} />
                  </Grid>
                ))}
          </Grid>
        </motion.div>
      </AnimatePresence>

      {!isLoading && filteredReports.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Assessment sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No reports in this category</Typography>
          </Box>
        </motion.div>
      )}

      {/* Future Expansion Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card
          sx={{
            mt: 3,
            background: 'linear-gradient(135deg, rgba(211,47,47,0.08), rgba(211,47,47,0.03))',
            border: '1px dashed',
            borderColor: 'primary.main',
            opacity: 0.85,
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Assessment sx={{ color: 'primary.main', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  More Reports Coming in Phase 2
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Custom report builder, scheduled delivery, Excel/PDF export, and Power BI integration planned for next release.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
