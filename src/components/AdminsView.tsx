import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  Snackbar,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Chip,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Search,
  FilterList,
  PersonAdd,
  Email,
  Phone,
  LocationOn,
  CheckCircleOutline,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  adminService,
  authService,
  type Admin,
  type PaginatedResponse,
} from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface AdminFormData {
  email: string;
  role: "admin" | "superadmin";
  first_name?: string;
  phone?: string;
  address?: string;
}

export const AdminsView: React.FC = () => {
  const theme = useTheme();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Current user info for role-based permissions
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<AdminFormData>({
    email: "",
    role: "admin",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchAdmins();
  }, [page, pageSize, searchQuery, roleFilter, statusFilter]);
  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true);
      const user = await authService.getProfile();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      showSnackbar("Error fetching user profile", "error");
    } finally {
      setUserLoading(false);
    }
  };
  const fetchAdmins = async () => {
    try {
      setLoading(true);

      // Build query parameters for backend filtering
      const params: any = {
        page: page + 1,
        limit: pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (roleFilter !== "all") {
        params.role = roleFilter;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter === "active";
      }
      const response: PaginatedResponse<Admin> =
        await adminService.getAllWithFilters(params);

      setAdmins(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Error fetching admins:", error);
      showSnackbar("Error fetching admins", "error");
      setAdmins([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const canEditAdmin = (admin: Admin) => {
    if (!currentUser) return false;

    // Superadmins can edit all admins except other superadmins
    if (currentUser.role === "superadmin") {
      return admin.role !== "superadmin" || admin.id === currentUser.id;
    }

    // Regular admins can only edit themselves
    return admin.id === currentUser.id;
  };

  const canDeleteAdmin = (admin: Admin) => {
    if (!currentUser) return false;

    // Only superadmins can delete, and they cannot delete other superadmins
    return (
      currentUser.role === "superadmin" &&
      admin.role !== "superadmin" &&
      admin.id !== currentUser.id
    );
  };
  const columns = [
    {
      id: "email",
      label: "Email",
      minWidth: 220,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Email sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
    },
    {
      id: "first_name",
      label: "Name",
      minWidth: 150,
      format: (value: any) => (
        <Typography variant="body2" fontWeight={500}>
          {value || "Not set"}
        </Typography>
      ),
    },
    {
      id: "phone",
      label: "Phone",
      minWidth: 140,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {value ? (
            <>
              <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2">{value}</Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not set
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "role",
      label: "Role",
      minWidth: 120,
      format: (value: any) => (
        <Chip
          label={value}
          size="small"
          sx={{
            backgroundColor: value === "superadmin" ? "#fef3c7" : "#dbeafe",
            color: value === "superadmin" ? "#92400e" : "#1e40af",
            fontWeight: 600,
            textTransform: "capitalize",
            borderRadius: 2,
          }}
        />
      ),
    },
    {
      id: "is_active",
      label: "Status",
      minWidth: 100,
      format: (value: any) => (
        <Chip
          label={value ? "Active" : "Inactive"}
          size="small"
          sx={{
            backgroundColor: value ? "#dcfce7" : "#fee2e2",
            color: value ? "#166534" : "#dc2626",
            fontWeight: 600,
            borderRadius: 2,
          }}
        />
      ),
    },
    {
      id: "is_verified",
      label: "Verified",
      minWidth: 100,
      format: (value: any) => (
        <Chip
          label={value ? "Yes" : "No"}
          size="small"
          variant={value ? "filled" : "outlined"}
          color={value ? "success" : "warning"}
          sx={{ borderRadius: 2 }}
        />
      ),
    },
  ];
  const handleView = (admin: Admin) => {
    setSelectedAdmin(admin);
    setViewDialogOpen(true);
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      role: admin.role,
      first_name: admin.first_name || "",
      phone: admin.phone || "",
      address: admin.address || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (admin: Admin) => {
    // Validate admin ID
    if (!admin?.id) {
      showSnackbar("Invalid admin ID", "error");
      return;
    }
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete?.id) {
      showSnackbar("Invalid admin ID", "error");
      return;
    }

    try {
      await adminService.delete(adminToDelete.id);
      showSnackbar(
        `Admin ${adminToDelete.email} deleted successfully`,
        "success"
      );
      fetchAdmins();
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      const message = error.response?.data?.message || "Error deleting admin";
      showSnackbar(message, "error");
      setDeleteDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAdminToDelete(null);
  };

  const handleInviteAdmin = async () => {
    try {
      await authService.inviteAdmin({
        email: formData.email,
        role: formData.role,
      });
      showSnackbar(`Invitation sent to ${formData.email}`, "success");
      setInviteDialogOpen(false);
      setFormData({ email: "", role: "admin" });
      fetchAdmins();
    } catch (error) {
      console.error("Error inviting admin:", error);
      showSnackbar("Error sending invitation", "error");
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      await adminService.update(selectedAdmin.id, {
        first_name: formData.first_name,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
      });
      showSnackbar(
        `Admin ${selectedAdmin.email} updated successfully`,
        "success"
      );
      setEditDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error updating admin:", error);
      showSnackbar("Error updating admin", "error");
    }
  };
  const handleToggleStatus = async (admin: Admin) => {
    try {
      // Validate admin ID
      if (!admin?.id) {
        showSnackbar("Invalid admin ID", "error");
        return;
      }

      await adminService.toggleStatus(admin.id);
      showSnackbar(
        `Admin ${admin.email} ${
          admin.is_active ? "deactivated" : "activated"
        } successfully`,
        "success"
      );
      fetchAdmins(); // Refresh the list
    } catch (error: any) {
      console.error("Error toggling admin status:", error);
      const message =
        error.response?.data?.message || "Error updating admin status";
      showSnackbar(message, "error");
    }
  };
  const resetForm = () => {
    setFormData({ email: "", role: "admin" });
    setSelectedAdmin(null);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
        {/* Show loading skeleton while user profile is loading */}
        {userLoading ? (
          <Box>
            <Skeleton
              variant="rectangular"
              height={60}
              sx={{ mb: 3, borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              height={400}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Admin Management
              </Typography>

              {currentUser?.role === "superadmin" && (
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setInviteDialogOpen(true)}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[8],
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Invite Admin
                </Button>
              )}
            </Box>
            {/* Filters */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: theme.palette.background.paper,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search admins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Role Filter</InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      label="Role Filter"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="superadmin">Superadmin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status Filter"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={fetchAdmins}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                    }}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </Paper>{" "}
            {/* Data Table */}
            <Paper
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                "& .MuiDataGrid-root": {
                  border: "none",
                  fontFamily: theme.typography.fontFamily,
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[800]
                      : theme.palette.grey[50],
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  "& .MuiDataGrid-columnHeader": {
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: theme.palette.text.primary,
                  },
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  fontSize: "0.875rem",
                  "&:focus": {
                    outline: "none",
                  },
                },
                "& .MuiDataGrid-row": {
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    cursor: "pointer",
                  },
                  "&:last-child .MuiDataGrid-cell": {
                    borderBottom: "none",
                  },
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[800]
                      : theme.palette.grey[50],
                },
                "& .MuiDataGrid-selectedRowCount": {
                  color: theme.palette.text.secondary,
                },
              }}
            >
              {" "}
              <ModernTable
                columns={columns}
                data={admins}
                loading={loading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                customActions={[
                  {
                    id: "toggle-status",
                    label: "Toggle Status",
                    icon: <CheckCircleOutline />,
                    onClick: handleToggleStatus,
                    hidden: (admin: Admin) => {
                      // Hide if not superadmin or if trying to change own status or superadmin status
                      return (
                        currentUser?.role !== "superadmin" ||
                        admin.role === "superadmin" ||
                        admin.id === currentUser?.id
                      );
                    },
                    color: "primary",
                  },
                ]}
                canEdit={canEditAdmin}
                canDelete={canDeleteAdmin}
                title="Administrators"
                emptyMessage="No administrators found"
              />
            </Paper>
            {/* Invite Admin Dialog */}
            <Dialog
              open={inviteDialogOpen}
              onClose={() => {
                setInviteDialogOpen(false);
                resetForm();
              }}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: { borderRadius: 3 },
              }}
            >
              <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" fontWeight={600}>
                  Invite New Admin
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as "admin" | "superadmin",
                          })
                        }
                        label="Role"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="superadmin">Superadmin</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                  onClick={() => {
                    setInviteDialogOpen(false);
                    resetForm();
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteAdmin}
                  variant="contained"
                  disabled={!formData.email}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Send Invitation
                </Button>
              </DialogActions>
            </Dialog>
            {/* Edit Admin Dialog */}
            <Dialog
              open={editDialogOpen}
              onClose={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: { borderRadius: 3 },
              }}
            >
              <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" fontWeight={600}>
                  Edit Admin: {selectedAdmin?.email}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                  {currentUser?.role === "superadmin" &&
                    selectedAdmin?.role !== "superadmin" && (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Role</InputLabel>
                          <Select
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                role: e.target.value as "admin" | "superadmin",
                              })
                            }
                            label="Role"
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="superadmin">Superadmin</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                  onClick={() => {
                    setEditDialogOpen(false);
                    resetForm();
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAdmin}
                  variant="contained"
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Update Admin
                </Button>
              </DialogActions>{" "}
            </Dialog>
            {/* End of conditional content */}
          </>
        )}

        {/* Admin View Details Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
            },
          }}
        >
          {selectedAdmin && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    {selectedAdmin.first_name
                      ? selectedAdmin.first_name.charAt(0).toUpperCase()
                      : selectedAdmin.email.charAt(0).toUpperCase()}
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {selectedAdmin.first_name || "Admin Profile"}
                    </Typography>
                    <Chip
                      label={selectedAdmin.role.toUpperCase()}
                      color={
                        selectedAdmin.role === "superadmin"
                          ? "secondary"
                          : "primary"
                      }
                      size="small"
                      sx={{
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                      }}
                    />
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ px: 3, pb: 3 }}>
                <Grid container spacing={3}>
                  {/* Left Column - Contact Info */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: 1,
                        borderColor: "divider",
                        background: theme.palette.background.paper,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
                      >
                        Contact Information
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Email color="primary" fontSize="small" />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            Email
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedAdmin.email}
                        </Typography>
                      </Box>

                      {selectedAdmin.phone && (
                        <Box sx={{ mb: 2 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1}
                          >
                            <Phone color="primary" fontSize="small" />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight={500}
                            >
                              Phone
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={500}>
                            {selectedAdmin.phone}
                          </Typography>
                        </Box>
                      )}

                      {selectedAdmin.address && (
                        <Box>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1}
                          >
                            <LocationOn color="primary" fontSize="small" />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight={500}
                            >
                              Address
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={500}>
                            {selectedAdmin.address}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Right Column - Status & Details */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: 1,
                        borderColor: "divider",
                        background: theme.palette.background.paper,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
                      >
                        Account Details
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Status
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip
                            icon={<CheckCircleOutline />}
                            label={
                              selectedAdmin.is_active ? "Active" : "Inactive"
                            }
                            color={
                              selectedAdmin.is_active ? "success" : "error"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                          <Chip
                            label={
                              selectedAdmin.is_verified
                                ? "Verified"
                                : "Pending Verification"
                            }
                            color={
                              selectedAdmin.is_verified ? "info" : "warning"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Account Created
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {new Date(
                            selectedAdmin.created_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Last Updated
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {new Date(
                            selectedAdmin.updated_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Admin"
          message={`Are you sure you want to delete admin: ${adminToDelete?.email}? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          severity="error"
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};
