import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
} from "@mui/material";
import { Person, AdminPanelSettings, Security } from "@mui/icons-material";
import { authService } from "../services/api";

interface InvitationData {
  email: string;
  role: string;
}

const SetupPassword: React.FC = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    first_name: "",
    phone: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await authService.validateInvitation(token!);
      setInvitation(response.invitation);
      setError(null);
    } catch (error: any) {
      console.error("Error validating token:", error);
      setError(
        error.response?.data?.message ||
          "Invalid or expired invitation token. Please contact your administrator."
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const setupData = {
        token: token!,
        password: formData.password,
        first_name: formData.first_name,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      await authService.setupPassword(setupData);

      setSuccess("Account setup successful! Redirecting to login...");

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up password:", error);
      setError(
        error.response?.data?.message ||
          "Failed to setup account. Please try again or contact support."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !invitation) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Avatar sx={{ mx: "auto", mb: 2, bgcolor: "error.main" }}>
            <Security />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Invalid Invitation
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            sx={{ mt: 3 }}
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Avatar sx={{ mx: "auto", mb: 2, bgcolor: "success.main" }}>
            <Person />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Setup Complete!
          </Typography>
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Avatar
          sx={{
            mx: "auto",
            mb: 2,
            bgcolor: "primary.main",
            width: 64,
            height: 64,
          }}
        >
          <AdminPanelSettings sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h4" gutterBottom>
          Setup Your Admin Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete your account setup to access the admin dashboard
        </Typography>
      </Box>

      {invitation && (
        <Card
          sx={{
            mb: 3,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Welcome to The Pearson Pub!
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              You've been invited as an administrator with the following role:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">Email:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {invitation.email}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Typography variant="body2">Role:</Typography>
              <Chip
                label={invitation.role}
                size="small"
                sx={{
                  bgcolor: "primary.dark",
                  color: "primary.contrastText",
                  fontWeight: "bold",
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleInputChange("first_name", e.target.value)}
            error={!!formErrors.first_name}
            helperText={formErrors.first_name}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Phone (Optional)"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            margin="normal"
            placeholder="+1 (555) 123-4567"
          />

          <TextField
            fullWidth
            label="Address (Optional)"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            margin="normal"
            multiline
            rows={2}
            placeholder="Your address"
          />

          <TextField
            fullWidth
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={!!formErrors.password}
            helperText={formErrors.password || "Must be at least 6 characters"}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ mt: 4, mb: 2, py: 1.5 }}
          >
            {submitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Setting up account...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Button
                variant="text"
                onClick={() => navigate("/login")}
                sx={{ textTransform: "none" }}
              >
                Sign in here
              </Button>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupPassword;
