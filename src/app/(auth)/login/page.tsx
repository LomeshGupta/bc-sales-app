"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Person } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth/authService";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { ROUTES, APP_NAME } from "@/constants";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { showSnackbar } = useAppStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.replace(ROUTES.DASHBOARD);
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await loginUser({ username: username.trim(), password });
      showSnackbar("Welcome back!", "success");
      router.replace(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "radial-gradient(ellipse at 20% 50%, rgba(211,47,47,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(211,47,47,0.05) 0%, transparent 50%), #0A0A0A"
          : "radial-gradient(ellipse at 20% 50%, rgba(211,47,47,0.06) 0%, transparent 50%), #F5F5F5",
        p: 3,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(211,47,47,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -150,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(211,47,47,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        style={{ width: "100%", maxWidth: 400, zIndex: 1 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 4,
                background: "linear-gradient(135deg, #D32F2F, #B71C1C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.5,
                boxShadow: "0 12px 40px rgba(211,47,47,0.4)",
              }}
            >
              <Box
                component="span"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "2.5rem",
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                S
              </Box>
            </Box>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {APP_NAME}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Business Central Sales Portal
            </Typography>
          </motion.div>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.25,
            type: "spring",
            stiffness: 200,
            damping: 25,
          }}
        >
          <Card
            sx={{
              border: "1px solid",
              borderColor: "divider",
              boxShadow: isDark
                ? "0 24px 80px rgba(0,0,0,0.6)"
                : "0 24px 80px rgba(0,0,0,0.12)",
            }}
          >
            <CardContent sx={{ p: 3.5, "&:last-child": { pb: 3.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your Business Central credentials
              </Typography>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleLogin} noValidate>
                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  sx={{ mb: 3 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => setShowPassword(!showPassword)}
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ py: 1.5, fontSize: "1rem" }}
                >
                  {isLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={18} color="inherit" />
                      <span>Signing in...</span>
                    </Box>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: "block", textAlign: "center", mt: 3 }}
          >
            Secured by Microsoft Dynamics 365 Business Central
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
}
