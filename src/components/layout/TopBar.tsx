"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import { DarkMode, LightMode, Logout } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";

import { APP_NAME, ROUTES } from "@/constants";

export function TopBar() {
  const { mode, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const { showSnackbar } = useAppStore();

  const router = useRouter();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleLogout = () => {
    logout();
    showSnackbar("Logged out successfully", "success");
    router.replace(ROUTES.LOGIN);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer - 1,
        paddingTop: "env(safe-area-inset-top)",
        backgroundColor: "background.paper",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 2, sm: 3 },
          height: {
            xs: `calc(15% + env(safe-area-inset-top))`,
            sm: `calc(64px + env(safe-area-inset-top))`,
          },
          minHeight: {
            xs: `calc(56px + env(safe-area-inset-top)) !important`,
            sm: `calc(64px + env(safe-area-inset-top)) !important`,
          },
        }}
      >
        {/* Logo + App Name */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 28, sm: 34 },
              height: { xs: 28, sm: 34 },
              borderRadius: 2,
              background: "linear-gradient(135deg, #D32F2F, #B71C1C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(211,47,47,0.5)",
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.85rem",
                },
              }}
            >
              S
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: {
                  xs: "1rem",
                  sm: "1.1rem",
                },
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {APP_NAME}
            </Typography>

            {!isMobile && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1,
                  display: "block",
                }}
              >
                Business Central
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
            flexShrink: 0,
          }}
        >
          <Tooltip
            title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
          >
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                color: "text.secondary",
              }}
            >
              <motion.div
                key={mode}
                initial={{
                  rotate: -90,
                  opacity: 0,
                }}
                animate={{
                  rotate: 0,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                {mode === "dark" ? (
                  <LightMode fontSize="small" />
                ) : (
                  <DarkMode fontSize="small" />
                )}
              </motion.div>
            </IconButton>
          </Tooltip>

          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: "error.main",
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
