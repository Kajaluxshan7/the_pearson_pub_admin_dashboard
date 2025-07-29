import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  Alert,
  Snackbar,
  alpha,
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  AdminPanelSettings,
  Security,
  LightMode,
  DarkMode,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { authService } from "../services/api";
import Logo from "../assets/logo.png";

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  isDarkMode,
  toggleTheme,
}) => {
  const theme = useTheme();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("auth") === "success") {
      // Google OAuth was successful, user should now be authenticated via cookies
      // Remove the auth parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Try to get user profile to confirm authentication
      authService
        .getProfile()
        .then((profile) => {
          if (profile) {
            onLogin("cookie-auth", profile);
          }
        })
        .catch((error) => {
          console.error("Failed to get profile after Google auth:", error);
          setError("Authentication completed but failed to load profile");
        });
    }
  }, [onLogin]);

  const handleInputChange =
    (field: keyof LoginForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      // Clear error when user starts typing
      if (error) setError("");
    };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        email: form.email,
        password: form.password,
      });

      // Store token and user data
      const token = (response as any).token || (response as any).access_token;
      const adminData = (response as any).admin || (response as any).user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(adminData));

      onLogin(token, adminData);
    } catch (error: any) {
      console.error("Login error:", error);

      // Extract meaningful error message
      let errorMessage = "Login failed. Please try again.";

      if (error.response?.status === 401) {
        errorMessage =
          error.response?.data?.message || "Invalid email or password.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Please check your input and try again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      // Redirect to Google OAuth endpoint
      const backendUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";
      window.location.href = `${backendUrl}/auth/google`;
    } catch (error: any) {
      console.error("Google login error:", error);
      setError("Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      >
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              backgroundColor: alpha("#ffffff", 0.1),
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </Box>

      {/* Theme Toggle Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={toggleTheme}
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.1),
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha("#ffffff", 0.2)}`,
            color: "#ffffff",
            "&:hover": {
              backgroundColor: alpha(theme.palette.background.paper, 0.2),
              transform: "scale(1.1)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {isDarkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
      </motion.div>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          style={{ width: "100%", maxWidth: 480 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: 4,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha("#ffffff", 0.1)}`,
              boxShadow: `0 20px 60px ${alpha("#000000", 0.3)}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Logo Section */}
            <motion.div variants={itemVariants}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      mb: 3,
                      boxShadow: `0 8px 32px ${alpha("#d9a419", 0.3)}`,
                    }}
                  >
                    <img
                      src={Logo}
                      alt="Logo"
                      style={{
                        width: "100px",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                </motion.div>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  gutterBottom
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, #d9a419)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    textShadow: "none",
                  }}
                >
                  THE PEARSON PUB
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Admin Portal
                </Typography>
              </Box>
            </motion.div>

            {/* Welcome Message */}
            <motion.div variants={itemVariants}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to manage your restaurant operations
                </Typography>
              </Box>
            </motion.div>

            {/* Login Form */}
            <motion.div variants={itemVariants}>
              <Box component="form" onSubmit={handleLogin} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange("email")}
                  disabled={loading || googleLoading}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 16px ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
                      },
                      "&.Mui-focused": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 16px ${alpha(
                          theme.palette.primary.main,
                          0.25
                        )}`,
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleInputChange("password")}
                  disabled={loading || googleLoading}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading || googleLoading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 16px ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
                      },
                      "&.Mui-focused": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 16px ${alpha(
                          theme.palette.primary.main,
                          0.25
                        )}`,
                      },
                    },
                  }}
                />

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || googleLoading}
                    startIcon={loading ? undefined : <AdminPanelSettings />}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: "1rem",
                      fontWeight: 600,
                      textTransform: "none",
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, #d9a419)`,
                      boxShadow: `0 8px 32px ${alpha(
                        theme.palette.primary.main,
                        0.3
                      )}`,
                      "&:hover": {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, #b8941a)`,
                        boxShadow: `0 12px 40px ${alpha(
                          theme.palette.primary.main,
                          0.4
                        )}`,
                        transform: "translateY(-2px)",
                      },
                      "&:disabled": {
                        background: alpha(theme.palette.action.disabled, 0.12),
                      },
                    }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Security />
                      </motion.div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </motion.div>
              </Box>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ px: 2, fontWeight: 500 }}
                >
                  or
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>
            </motion.div>

            {/* Google Login Button */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                startIcon={
                  googleLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Google />
                    </motion.div>
                  ) : (
                    <Google />
                  )
                }
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  borderColor: alpha(theme.palette.divider, 0.3),
                  color: theme.palette.text.primary,
                  "&:hover": {
                    borderColor: "#4285f4",
                    backgroundColor: alpha("#4285f4", 0.05),
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 24px ${alpha("#4285f4", 0.2)}`,
                  },
                }}
              >
                Continue with Google
              </Button>
            </motion.div>

            {/* Footer */}
            <motion.div variants={itemVariants}>
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Secure admin access • Protected by advanced security
                </Typography>
              </Box>
            </motion.div>

            {/* Decorative Elements */}
            <Box
              sx={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )}, ${alpha("#d9a419", 0.1)})`,
                filter: "blur(40px)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -30,
                left: -30,
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.secondary.main,
                  0.1
                )}, ${alpha("#d9a419", 0.1)})`,
                filter: "blur(30px)",
              }}
            />
          </Paper>
        </motion.div>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: `0 8px 32px ${alpha("#f44336", 0.3)}`,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};
