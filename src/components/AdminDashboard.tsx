import React, { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  Drawer,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  Divider,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import {
  Dashboard,
  People,
  Category,
  Restaurant,
  Extension,
  Event,
  Schedule,
  Settings,
  Logout,
  DarkMode,
  LightMode,
  Menu as MenuIcon,
  CalendarToday,
  LocalOffer,
  Fastfood,
  SwapHoriz,
  AccountTree,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardView } from "./DashboardView";
import { AdminsView } from "./AdminsView";
import { CategoriesView } from "./CategoriesViewModern";
import { ItemsView } from "./ItemsViewModern";
import AddonsViewModern from "./AddonsViewModern";
import EventsViewModern from "./EventsViewModern";
import OperationHoursViewModern from "./OperationHoursViewModern";
import { SettingsView } from "./SettingsView";
import { SpecialsDayView } from "./SpecialsDayView";
import { SpecialsView } from "./SpecialsView";
import { WingSaucesView } from "./WingSaucesView";
import { SubstituteSidesView } from "./SubstituteSidesView";
import ItemAddonsRelationsView from "./ItemAddonsRelationsView";
import { authService } from "../services/api";

const drawerWidth = 280;

interface AdminDashboardProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  // Accepts any component type, including those with required props
  component: React.ComponentType<any>;
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  avatar_url?: string;
  role: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Dashboard />,
    component: DashboardView,
  },
  { id: "admins", label: "Admins", icon: <People />, component: AdminsView },
  {
    id: "categories",
    label: "Categories",
    icon: <Category />,
    component: CategoriesView,
  },
  {
    id: "items",
    label: "Items",
    icon: <Restaurant />,
    component: ItemsView,
  },
  {
    id: "addons",
    label: "Addons",
    icon: <Extension />,
    component: AddonsViewModern,
  },
  {
    id: "item-addons-relations",
    label: "Item-Addon Relations",
    icon: <AccountTree />,
    component: ItemAddonsRelationsView,
  },
  {
    id: "specials-days",
    label: "Specials Days",
    icon: <CalendarToday />,
    component: SpecialsDayView,
  },
  {
    id: "specials",
    label: "Specials",
    icon: <LocalOffer />,
    component: SpecialsView,
  },
  {
    id: "wing-sauces",
    label: "Wing Sauces",
    icon: <Fastfood />,
    component: WingSaucesView,
  },
  {
    id: "substitute-sides",
    label: "Substitute Sides",
    icon: <SwapHoriz />,
    component: SubstituteSidesView,
  },
  {
    id: "events",
    label: "Events",
    icon: <Event />,
    component: EventsViewModern,
  },
  {
    id: "operation-hours",
    label: "Operation Hours",
    icon: <Schedule />,
    component: OperationHoursViewModern,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings />,
    component: SettingsView,
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isDarkMode,
  toggleTheme,
  onLogout,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedView, setSelectedView] = useState("dashboard");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await authService.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    setSelectedView("settings");
    setAnchorEl(null);
  };
  const handleLogoutClick = () => {
    setAnchorEl(null);
    onLogout();
  };

  // Render the current view with appropriate props
  const renderCurrentView = () => {
    const userRole = userProfile?.role as "admin" | "superadmin";

    switch (selectedView) {
      case "dashboard":
        return <DashboardView />;
      case "admins":
        return <AdminsView />;
      case "categories":
        return <CategoriesView />;
      case "items":
        return <ItemsView />;
      case "addons":
        return <AddonsViewModern userRole={userRole} />;
      case "item-addons-relations":
        return <ItemAddonsRelationsView />;
      case "specials-days":
        return userRole === "superadmin" ? <SpecialsDayView /> : null;
      case "specials":
        return <SpecialsView />;
      case "wing-sauces":
        return <WingSaucesView />;
      case "substitute-sides":
        return <SubstituteSidesView />;
      case "events":
        return <EventsViewModern userRole={userRole} />;
      case "operation-hours":
        return <OperationHoursViewModern userRole={userRole} />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };
  // Sidebar content component
  const SidebarContent = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo at top */}
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "white",
            letterSpacing: 1,
            textShadow: "0 1px 0 #d9a419",
            textTransform: "uppercase",
          }}
        >
          THE PEARSON PUB
        </Typography>
        {/* <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Admin Portal
        </Typography> */}
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowX: "hidden",
          py: 2,
          scrollbarWidth: "thin", // for Firefox
          scrollbarColor: "#d9a419 transparent", // for Firefox
          backgroundColor: "transparent",
        }}
      >
        <List>
          {sidebarItems
            .slice(0, -1)
            .filter((item) => {
              // Only show "specials-days" to superadmin
              if (item.id === "specials-days") {
                return userProfile?.role === "superadmin";
              }
              return true;
            })
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItem
                  component="div"
                  onClick={() => {
                    setSelectedView(item.id);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  sx={{
                    mx: 2,
                    mb: 0.5,
                    borderRadius: 3,
                    backgroundColor:
                      selectedView === item.id ? "#d9a419" : "transparent",
                    color: selectedView === item.id ? "#111827" : "white",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor:
                        selectedView === item.id
                          ? "#d9a419"
                          : "rgba(217, 164, 25, 0.15)",
                      color: selectedView === item.id ? "#111827" : "#d9a419",
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: selectedView === item.id ? "#111827" : "white",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      "& .MuiTypography-root": {
                        fontWeight: selectedView === item.id ? 600 : 400,
                        fontSize: "0.95rem",
                      },
                    }}
                  />
                </ListItem>
              </motion.div>
            ))}
        </List>
      </Box>

      {/* Bottom section - Settings and Logout */}
      <Box
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          p: 2,
        }}
      >
        <List>
          <ListItem
            component="div"
            onClick={() => {
              setSelectedView("settings");
              if (isMobile) setMobileMenuOpen(false);
            }}
            sx={{
              mb: 1,
              borderRadius: 3,
              backgroundColor:
                selectedView === "settings" ? "#d9a419" : "transparent",
              color: selectedView === "settings" ? "#111827" : "white",
              cursor: "pointer",
              "&:hover": {
                backgroundColor:
                  selectedView === "settings"
                    ? "#d9a419"
                    : "rgba(217, 164, 25, 0.15)",
                color: selectedView === "settings" ? "#111827" : "#d9a419",
                transform: "translateX(4px)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <ListItemIcon
              sx={{
                color: selectedView === "settings" ? "#111827" : "white",
                minWidth: 40,
              }}
            >
              <Settings />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              sx={{
                "& .MuiTypography-root": {
                  fontWeight: selectedView === "settings" ? 600 : 400,
                  fontSize: "0.95rem",
                },
              }}
            />
          </ListItem>
          <ListItem
            component="div"
            onClick={() => {
              onLogout();
              if (isMobile) setMobileMenuOpen(false);
            }}
            sx={{
              borderRadius: 3,
              color: "white",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                transform: "translateX(4px)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{
                "& .MuiTypography-root": {
                  fontSize: "0.95rem",
                },
              }}
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#111827",
              color: "white",
              borderRight: "none",
              boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              backgroundColor: "#111827",
              color: "white",
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
          overflow: "hidden",
          padding: { xs: 1, sm: 2 }, // Responsive padding
        }}
      >
        {/* App Bar - Inside main content */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            backdropFilter: "blur(20px)",
            border: `0.5px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            // Responsive padding
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {/* Mobile menu button */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Current page title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                textTransform: "capitalize",
              }}
            ></Typography>

            {/* Right side - Theme toggle and Profile */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>

              {/* Profile Avatar */}
              <IconButton
                onClick={handleProfileMenuOpen}
                size="large"
                edge="end"
                sx={{
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {profileLoading ? (
                  <Skeleton variant="circular" width={40} height={40} />
                ) : (
                  <Avatar
                    src={userProfile?.avatar_url}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: theme.palette.primary.main,
                      border: `2px solid ${theme.palette.primary.main}`,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {userProfile?.first_name?.charAt(0) ||
                      userProfile?.email?.charAt(0)?.toUpperCase() ||
                      "A"}
                  </Avatar>
                )}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 220,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            },
          }}
        >
          {/* Profile Info */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {profileLoading ? (
              <>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" />
              </>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {userProfile?.first_name || "Admin User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile?.email}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  {userProfile?.role}
                </Typography>
              </>
            )}{" "}
          </Box>

          <MenuItem onClick={handleSettingsClick} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleLogoutClick}
            sx={{ py: 1.5, color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: "auto",
            position: "relative",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{ height: "100%" }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};
