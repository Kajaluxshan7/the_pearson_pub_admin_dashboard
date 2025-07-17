import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Avatar,
  useTheme,
  Alert,
  Snackbar,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Person,
  Notifications,
  Palette,
  Save,
  PhotoCamera,
  Edit,
  Security,
  DarkMode,
  LightMode,
  Email,
  Phone,
  LocationOn,
  Cancel,
  Brightness6,
  NotificationsActive,
  Shield,
  AccountCircle,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../services/api";

interface SettingsViewProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  security: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: boolean;
}

interface AppearanceSettings {
  theme: "light" | "dark" | "auto";
  language: string;
  compactMode: boolean;
  animations: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box>{children}</Box>
        </motion.div>
      )}
    </div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode = false,
  toggleTheme,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [originalProfileForm, setOriginalProfileForm] = useState<
    Partial<UserProfile>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    security: true,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: true,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: isDarkMode ? "dark" : "light",
    language: "en",
    compactMode: false,
    animations: true,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
  }, []);

  // Update theme when isDarkMode changes
  useEffect(() => {
    setAppearance((prev) => ({
      ...prev,
      theme: isDarkMode ? "dark" : "light",
    }));
  }, [isDarkMode]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      setProfile(response);
      const formData = {
        first_name: response.first_name || "",
        phone: response.phone || "",
        address: response.address || "",
      };
      setProfileForm(formData);
      setOriginalProfileForm(formData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showSnackbar("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Check if there are changes in the profile form
  const hasProfileChanges = () => {
    return (
      profileForm.first_name !== originalProfileForm.first_name ||
      profileForm.phone !== originalProfileForm.phone ||
      profileForm.address !== originalProfileForm.address
    );
  };

  const handleProfileUpdate = async () => {
    if (!hasProfileChanges()) {
      showSnackbar("No changes to save", "info");
      return;
    }

    setSaving(true);
    try {
      const response = await authService.updateProfile({
        first_name: profileForm.first_name,
        phone: profileForm.phone,
        address: profileForm.address,
      });
      setProfile(response);
      setIsEditing(false);
      setOriginalProfileForm({
        first_name: profileForm.first_name,
        phone: profileForm.phone,
        address: profileForm.address,
      });
      showSnackbar("Profile updated successfully", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    const formData = {
      first_name: profile?.first_name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    };
    setOriginalProfileForm(formData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileForm({
      first_name: profile?.first_name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("File size must be less than 5MB", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showSnackbar("Please select an image file", "error");
      return;
    }

    setUploading(true);
    try {
      const result = await authService.uploadAvatar(file);
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: result.avatar_url } : null
      );
      showSnackbar("Avatar uploaded successfully", "success");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showSnackbar("Failed to upload avatar", "error");
    } finally {
      setUploading(false);
    }
  };

  // Profile Tab Component
  const ProfileTab = () => (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.05
        )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AccountCircle color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Profile Information
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        {/* Avatar Section */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profile?.avatar_url}
              sx={{
                width: 120,
                height: 120,
                mr: 3,
                border: `4px solid ${theme.palette.primary.main}`,
                boxShadow: `0 8px 32px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
              }}
            >
              {profile?.first_name?.charAt(0) ||
                profile?.email?.charAt(0)?.toUpperCase()}
            </Avatar>
            <IconButton
              sx={{
                position: "absolute",
                bottom: 0,
                right: 20,
                backgroundColor: theme.palette.primary.main,
                color: "white",
                boxShadow: `0 4px 16px ${alpha(
                  theme.palette.primary.main,
                  0.4
                )}`,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                  transform: "scale(1.1)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PhotoCamera />
              )}
            </IconButton>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {profile?.first_name || "Admin User"}
            </Typography>
            <Chip
              label={profile?.role?.toUpperCase()}
              color="primary"
              variant="filled"
              sx={{
                mb: 1,
                fontWeight: 600,
                boxShadow: `0 2px 8px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Click the camera icon to upload a new profile picture
            </Typography>
          </Box>
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          accept="image/*"
          style={{ display: "none" }}
        />

        {/* Profile Form */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={profileForm?.first_name || ""}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              disabled={!isEditing}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Person sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: isEditing ? "translateY(-2px)" : "none",
                    boxShadow: isEditing
                      ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                      : "none",
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              value={profile?.email || ""}
              disabled
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Email sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profileForm?.phone || ""}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              disabled={!isEditing}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Phone sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: isEditing ? "translateY(-2px)" : "none",
                    boxShadow: isEditing
                      ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                      : "none",
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Role"
              value={profile?.role || ""}
              disabled
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Shield sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={profileForm?.address || ""}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, address: e.target.value }))
              }
              disabled={!isEditing}
              multiline
              rows={3}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <LocationOn
                    sx={{
                      mr: 1,
                      color: "text.secondary",
                      alignSelf: "flex-start",
                      mt: 1,
                    }}
                  />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: isEditing ? "translateY(-2px)" : "none",
                    boxShadow: isEditing
                      ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                      : "none",
                  },
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box
          sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}
        >
          <AnimatePresence>
            {isEditing ? (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    variant="contained"
                    startIcon={
                      saving ? <CircularProgress size={20} /> : <Save />
                    }
                    onClick={handleProfileUpdate}
                    disabled={saving || !hasProfileChanges()}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: `0 4px 16px ${alpha(
                        theme.palette.primary.main,
                        0.3
                      )}`,
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.primary.main,
                          0.4
                        )}`,
                      },
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={handleEditClick}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: `0 4px 16px ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 24px ${alpha(
                        theme.palette.primary.main,
                        0.4
                      )}`,
                    },
                  }}
                >
                  Edit Profile
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </CardContent>
    </Card>
  );

  // Notifications Tab Component
  const NotificationsTab = () => (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.warning.main,
          0.05
        )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <NotificationsActive color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Notification Preferences
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Grid container spacing={3}>
          {Object.entries(notifications).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.7),
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 24px ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                  },
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {key === "email" && "Receive notifications via email"}
                        {key === "push" && "Browser push notifications"}
                        {key === "sms" && "SMS text message alerts"}
                        {key === "marketing" &&
                          "Marketing and promotional content"}
                        {key === "security" && "Security alerts and warnings"}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  // Security Tab Component
  const SecurityTab = () => (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.error.main,
          0.05
        )} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Security color="error" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Security Settings
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={security.twoFactorAuth}
                    onChange={(e) =>
                      setSecurity((prev) => ({
                        ...prev,
                        twoFactorAuth: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Two-Factor Authentication
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add an extra layer of security to your account
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Session Timeout
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={security.sessionTimeout}
                  onChange={(e) =>
                    setSecurity((prev) => ({
                      ...prev,
                      sessionTimeout: e.target.value as number,
                    }))
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                  <MenuItem value={480}>8 hours</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={security.passwordExpiry}
                    onChange={(e) =>
                      setSecurity((prev) => ({
                        ...prev,
                        passwordExpiry: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Password Expiry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Require password change every 90 days
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
              />
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Appearance Tab Component
  const AppearanceTab = () => (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.info.main,
          0.05
        )} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Brightness6 color="info" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Appearance & Preferences
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Theme Preference
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={appearance.theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as
                      | "light"
                      | "dark"
                      | "auto";
                    setAppearance((prev) => ({ ...prev, theme: newTheme }));
                    if (toggleTheme && newTheme !== "auto") {
                      const shouldBeDark = newTheme === "dark";
                      if (isDarkMode !== shouldBeDark) {
                        toggleTheme();
                      }
                    }
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="light">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LightMode /> Light Mode
                    </Box>
                  </MenuItem>
                  <MenuItem value="dark">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DarkMode /> Dark Mode
                    </Box>
                  </MenuItem>
                  <MenuItem value="auto">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Brightness6 /> Auto (System)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Language
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={appearance.language}
                  onChange={(e) =>
                    setAppearance((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={appearance.compactMode}
                    onChange={(e) =>
                      setAppearance((prev) => ({
                        ...prev,
                        compactMode: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Compact Mode
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reduce spacing for more content
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={appearance.animations}
                    onChange={(e) =>
                      setAppearance((prev) => ({
                        ...prev,
                        animations: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Animations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable smooth transitions and effects
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
              />
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const tabs = [
    { label: "Profile", icon: <Person />, component: ProfileTab },
    {
      label: "Notifications",
      icon: <Notifications />,
      component: NotificationsTab,
    },
    { label: "Security", icon: <Security />, component: SecurityTab },
    { label: "Appearance", icon: <Palette />, component: AppearanceTab },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account preferences and security settings
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                minHeight: 72,
                gap: 1,
                "&.Mui-selected": {
                  color: theme.palette.primary.main,
                },
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>

          {/* Tab Panels */}
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              <tab.component />
            </TabPanel>
          ))}
        </Paper>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};
