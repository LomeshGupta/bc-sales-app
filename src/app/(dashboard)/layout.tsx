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

          mt: {
            xs: "calc(25% + env(safe-area-inset-top))",
            sm: "calc(64px + env(safe-area-inset-top))",
          },

          pb: {
            xs: "calc(80px + env(safe-area-inset-bottom))",
            md: 3,
          },

          minHeight: "100dvh",
          overflowX: "hidden",
        }}
      >
        <PageTransition>{children}</PageTransition>
      </Box>

      {/* Fixed bottom nav (mobile only) */}
      <BottomNav />
    </Box>
  );
}
