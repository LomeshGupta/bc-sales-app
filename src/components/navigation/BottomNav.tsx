 "use client";

import React, { useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import {
  Dashboard,
  ShoppingCart,
  PeopleAlt,
  MoreHoriz,
  Assessment,
  Inventory2,
  ReceiptLong,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants";

const NAV_ITEMS = [
  { label: "Dashboard", value: ROUTES.DASHBOARD, icon: <Dashboard /> },
  { label: "Orders", value: ROUTES.SALES_ORDERS, icon: <ShoppingCart /> },
  { label: "Customers", value: ROUTES.CUSTOMERS, icon: <PeopleAlt /> },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const currentValue =
    NAV_ITEMS.find((item) => pathname.startsWith(item.value))?.value || "";

  const isMoreActive =
    pathname.startsWith(ROUTES.REPORTS) || pathname.startsWith(ROUTES.INVENTORY);

  const navigate = (path: string) => {
    setMoreOpen(false);
    router.push(path);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          display: { xs: "block", md: "none" },
          borderTop: "1px solid",
          borderColor: "divider",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "transparent",
        }}
      >
        <BottomNavigation
          value={currentValue}
          onChange={(_, newValue) => {
            // "More" is an action, not a route. Never let MUI navigate to
            // the sentinel value (which previously caused /__more__/404 and
            // the hydration error shown by Next.js).
            if (newValue === "__more__") {
              setMoreOpen(true);
              return;
            }
            if (newValue) navigate(newValue);
          }}
          showLabels
          sx={{ background: "transparent" }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentValue === item.value;
            return (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={
                  <Box sx={{ position: "relative" }}>
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        style={{
                          position: "absolute",
                          top: -8,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#D32F2F",
                        }}
                      />
                    )}
                    <motion.div
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {item.icon}
                    </motion.div>
                  </Box>
                }
              />
            );
          })}

          <BottomNavigationAction
            label="More"
            value="__more__"
            onClick={() => setMoreOpen(true)}
            icon={
              <Box sx={{ position: "relative" }}>
                {isMoreActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    style={{
                      position: "absolute",
                      top: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#D32F2F",
                    }}
                  />
                )}
                <MoreHoriz />
              </Box>
            }
          />
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            pb: "env(safe-area-inset-bottom)",
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 10,
              bgcolor: "action.disabledBackground",
              mx: "auto",
              mb: 2,
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            More
          </Typography>
        </Box>

        <Divider />

        <List sx={{ p: 1.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={pathname.startsWith(ROUTES.REPORTS)}
              onClick={() => navigate(ROUTES.REPORTS)}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              <ListItemIcon>
                <Assessment color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Reports"
                secondary="Customer statements and reports"
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              disabled
              sx={{ borderRadius: 2, py: 1.5, mt: 0.5 }}
            >
              <ListItemIcon>
                <ReceiptLong />
              </ListItemIcon>
              <ListItemText
                primary="Invoices"
                secondary="Coming soon"
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              selected={pathname.startsWith(ROUTES.INVENTORY)}
              onClick={() => navigate(ROUTES.INVENTORY)}
              sx={{ borderRadius: 2, py: 1.5, mt: 0.5 }}
            >
              <ListItemIcon>
                <Inventory2 color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Inventory"
                secondary="Check stock by location"
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
