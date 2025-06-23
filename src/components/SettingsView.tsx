import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Avatar,
  Divider,
  useTheme,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Grid  from "@mui/material/GridLegacy";
import {
  Person,
  Security,
  Notifications,
  Palette,
  Upload,
  Save,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import api from "../services/api";

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role: string;
}

interface SettingsState {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "auto";
    language: string;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
}

export const SettingsView: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    appearance: {
      theme: "light",
      language: "en",
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to load profile",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    setSaving(true);
    try {
      // Note: This endpoint might need to be created in the backend
      const response = await api.patch(
        `/admins/${profile?.id}`,
        updatedProfile
      );
      setProfile(response.data);
      setSnackbar({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const ProfileTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Person color="primary" />
          Profile Information
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Avatar
            src={profile?.avatar_url}
            sx={{
              width: 120,
              height: 120,
              mr: 3,
              border: `3px solid ${theme.palette.primary.main}`,
            }}
          >
            {profile?.first_name?.charAt(0) ||
              profile?.email?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Button variant="outlined" startIcon={<Upload />} sx={{ mb: 1 }}>
              Upload Photo
            </Button>
            <Typography variant="body2" color="text.secondary">
              Recommended: Square image, at least 400x400px
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={profile?.first_name || ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, first_name: e.target.value } : null
                )
              }
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              value={profile?.email || ""}
              disabled
              variant="outlined"
              helperText="Email cannot be changed"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={profile?.phone || ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, phone: e.target.value } : null
                )
              }
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Role"
              value={profile?.role || ""}
              disabled
              variant="outlined"
              helperText="Role is managed by administrators"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={profile?.address || ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, address: e.target.value } : null
                )
              }
              variant="outlined"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => handleProfileUpdate(profile || {})}
            disabled={saving}
            sx={{ mr: 2 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outlined" onClick={fetchProfile}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );

  const AppearanceTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Palette color="primary" />
          Appearance & Preferences
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.appearance.theme}
                label="Theme"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: {
                      ...prev.appearance,
                      theme: e.target.value as any,
                    },
                  }))
                }
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto (System)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.appearance.language}
                label="Language"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: {
                      ...prev.appearance,
                      language: e.target.value,
                    },
                  }))
                }
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  );

  const NotificationsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Notifications color="primary" />
          Notification Preferences
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications.email}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      email: e.target.checked,
                    },
                  }))
                }
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications.push}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      push: e.target.checked,
                    },
                  }))
                }
              />
            }
            label="Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications.sms}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      sms: e.target.checked,
                    },
                  }))
                }
              />
            }
            label="SMS Notifications"
          />
        </Box>
      </Paper>
    </motion.div>
  );

  const PrivacyTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Security color="primary" />
          Privacy & Security
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.privacy.profileVisible}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    privacy: {
                      ...prev.privacy,
                      profileVisible: e.target.checked,
                    },
                  }))
                }
              />
            }
            label="Make profile visible to other admins"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.privacy.activityVisible}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    privacy: {
                      ...prev.privacy,
                      activityVisible: e.target.checked,
                    },
                  }))
                }
              />
            }
            label="Show activity status"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Security Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" color="warning">
            Change Password
          </Button>
          <Button variant="outlined" color="error">
            Download Data
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );

  const tabs = [
    { id: "profile", label: "Profile", component: ProfileTab },
    { id: "appearance", label: "Appearance", component: AppearanceTab },
    {
      id: "notifications",
      label: "Notifications",
      component: NotificationsTab,
    },
    { id: "privacy", label: "Privacy", component: PrivacyTab },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Settings
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Settings
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Sidebar */}
        <Paper
          sx={{
            width: { xs: "100%", md: 280 },
            height: "fit-content",
            p: 2,
          }}
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              fullWidth
              variant={activeTab === tab.id ? "contained" : "text"}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                justifyContent: "flex-start",
                mb: 1,
                py: 1.5,
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Paper>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          {tabs.find((tab) => tab.id === activeTab)?.component() || (
            <ProfileTab />
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
