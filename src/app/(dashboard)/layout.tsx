"use client";
import React from "react";
import { Box } from "@mui/material";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { PageTransition } from "@/components/common/PageTransition";

const DRAWER_WIDTH = 240;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      {/* Fixed top bar */}
      <TopBar />

      {/* Fixed sidebar (desktop only) */}
      <Sidebar />

      {/* Main content area — pushed right of sidebar and below top bar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: 2 },

          mt: {
            xs: "calc(56px + env(safe-area-inset-top))",
            sm: "calc(64px + env(safe-area-inset-top))",
          },

          pb: {
            xs: "calc(75px + env(safe-area-inset-bottom))",
            md: "24px",
          },

          minHeight: "100dvh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <PageTransition>{children}</PageTransition>
      </Box>

      {/* Fixed bottom nav (mobile only) */}
      <BottomNav />
    </Box>
  );
}
