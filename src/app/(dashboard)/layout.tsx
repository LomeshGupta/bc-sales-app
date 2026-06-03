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
          mt: { xs: "56px", sm: "64px" },
          pb: { xs: "75px", md: "24px" },
          minHeight: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
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
