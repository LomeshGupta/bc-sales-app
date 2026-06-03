"use client";
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  DarkMode,
  LightMode,
  Notifications,
  Circle,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import { useAppStore } from "@/store/appStore";
import { APP_NAME } from "@/constants";
import { formatRelativeTime } from "@/utils";

export function TopBar() {
  const { mode, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, markAllRead, markNotificationRead } =
    useAppStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [notifOpen, setNotifOpen] = useState(false);

  const notifColors: Record<string, string> = {
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer - 1 }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: { xs: 56, sm: 64 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
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
                sx={{ color: "white", fontWeight: 800, fontSize: "0.85rem" }}
              >
                BC
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip
              title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
            >
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <motion.div
                  key={mode}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === "dark" ? (
                    <LightMode fontSize="small" />
                  ) : (
                    <DarkMode fontSize="small" />
                  )}
                </motion.div>
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                onClick={() => setNotifOpen(true)}
                sx={{ color: "text.secondary" }}
              >
                <Badge badgeContent={unreadCount} color="error" max={9}>
                  <Notifications fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "80%", sm: 360 },
              borderRadius: { xs: "16px 16px 0 0", sm: "16px 0 0 16px" },
            },
          },
        }}
        sx={{ "& .MuiDrawer-paper": { top: { xs: "auto", sm: 0 }, bottom: 0 } }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label="Mark all read"
                size="small"
                onClick={markAllRead}
                sx={{ cursor: "pointer" }}
              />
            )}
          </Box>
          <List disablePadding>
            {notifications.map((n, idx) => (
              <React.Fragment key={n.id}>
                <ListItemButton
                  onClick={() => markNotificationRead(n.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    background: n.read ? "transparent" : "rgba(211,47,47,0.05)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      width: "100%",
                      alignItems: "flex-start",
                    }}
                  >
                    <Circle
                      sx={{
                        fontSize: 8,
                        color: notifColors[n.type],
                        mt: 0.8,
                        flexShrink: 0,
                        opacity: n.read ? 0 : 1,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {n.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.8rem" }}
                      >
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatRelativeTime(n.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItemButton>
                {idx < notifications.length - 1 && (
                  <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
