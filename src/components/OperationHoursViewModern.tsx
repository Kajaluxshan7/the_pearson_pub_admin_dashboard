import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Skeleton,
  Card,
  CardContent,
  useTheme,
  Switch,
  FormControlLabel,
  Snackbar,
} from "@mui/material";
import {
  Add,
  Clear,
  Schedule,
  AccessTime,
  ToggleOn,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { operationHourService } from "../services/api";
import type { OperationHour, PaginatedResponse } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface OperationHoursViewModernProps {
  userRole: "admin" | "superadmin";
}

const DAYS_OF_WEEK = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

const OperationHoursViewModern: React.FC<OperationHoursViewModernProps> = ({
  userRole,
}) => {
  const theme = useTheme();
  const [operationHours, setOperationHours] = useState<OperationHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  // Filters and search
  const [selectedDay, setSelectedDay] = useState<string>("");
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOperationHour, setSelectedOperationHour] =
    useState<OperationHour | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [hourToDelete, setHourToDelete] = useState<OperationHour | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    day: "",
    open_time: "",
    close_time: "",
    status: true,
  });

  // Feedback states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchOperationHours();
  }, [paginationModel, selectedDay]);

  useEffect(() => {
    fetchOperationHourCount();
  }, []);

  // Auto-refresh every minute to update "Open Now" status
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh the table data, not the counts
      if (!loading) {
        fetchOperationHours();
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [loading, paginationModel, selectedDay]);

  const fetchOperationHours = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<OperationHour> =
        await operationHourService.getAll(
          paginationModel.page + 1,
          paginationModel.pageSize,
          selectedDay || undefined
        );
      setOperationHours(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Error fetching operation hours:", error);
      showAlert("error", "Failed to fetch operation hours");
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationHourCount = async () => {
    try {
      const count = await operationHourService.getCount();
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching operation hour count:", error);
    }
  };

  const showAlert = (severity: "success" | "error", message: string) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddOperationHour = async () => {
    try {
      await operationHourService.create({
        day: formData.day,
        open_time: formData.open_time,
        close_time: formData.close_time,
        status: formData.status,
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchOperationHours();
      fetchOperationHourCount();
      showAlert("success", "Operation hour created successfully");
    } catch (error) {
      console.error("Error creating operation hour:", error);
      showAlert("error", "Failed to create operation hour");
    }
  };

  const handleEditOperationHour = async () => {
    if (!selectedOperationHour) return;
    try {
      await operationHourService.update(selectedOperationHour.id, {
        day: formData.day,
        open_time: formData.open_time,
        close_time: formData.close_time,
        status: formData.status,
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchOperationHours();
      showAlert("success", "Operation hour updated successfully");
    } catch (error) {
      console.error("Error updating operation hour:", error);
      showAlert("error", "Failed to update operation hour");
    }
  };
  const handleDeleteOperationHour = (hour: OperationHour) => {
    setHourToDelete(hour);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteOperationHour = async () => {
    if (!hourToDelete) return;

    try {
      await operationHourService.delete(hourToDelete.id);
      fetchOperationHours();
      fetchOperationHourCount();
      showAlert("success", "Operation hour deleted successfully");
      setConfirmDeleteOpen(false);
      setHourToDelete(null);
    } catch (error) {
      console.error("Error deleting operation hour:", error);
      showAlert("error", "Failed to delete operation hour");
    }
  };

  const handleToggleStatus = async (hour: OperationHour) => {
    try {
      const updatedHour = {
        ...hour,
        status: !hour.status,
      };

      await operationHourService.update(hour.id, updatedHour);
      showAlert(
        "success",
        `Operation hours for ${hour.day} ${hour.status ? "closed" : "opened"}`
      );
      fetchOperationHours();
    } catch (error) {
      console.error("Error toggling operation hour status:", error);
      showAlert("error", "Failed to update operation hour status");
    }
  };

  const resetForm = () => {
    setFormData({
      day: "",
      open_time: "",
      close_time: "",
      status: true,
    });
    setSelectedOperationHour(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (hour: OperationHour) => {
    setSelectedOperationHour(hour);
    setFormData({
      day: hour.day,
      open_time: hour.open_time,
      close_time: hour.close_time,
      status: hour.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (hour: OperationHour) => {
    openEditModal(hour);
  };
  const handleDelete = (hour: OperationHour) => {
    handleDeleteOperationHour(hour);
  };
  const handleView = (hour: OperationHour) => {
    setSelectedOperationHour(hour);
    setViewDialogOpen(true);
  };

  const clearFilters = () => {
    setSelectedDay("");
  };

  const formatTime = (time: string) => {
    if (!time) return "Not set";
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;

      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return time;
    }
  };

  // Utility function to check if currently open using Toronto timezone
  const isCurrentlyOpen = (
    day: string,
    openTime: string,
    closeTime: string
  ) => {
    const now = new Date();
    // Get current time in Toronto timezone
    const torontoTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Toronto" })
    );
    const currentTime = torontoTime.toTimeString().slice(0, 5); // HH:MM format

    // Map JavaScript day to our day format
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayDay = days[torontoTime.getDay()];

    // Convert times to minutes for comparison
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const currentMinutes = timeToMinutes(currentTime);
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);

    // Handle overnight hours (e.g., Saturday 8:30 PM to Sunday 11:30 AM)
    if (closeMinutes < openMinutes) {
      // Check if we're on the day that starts the overnight shift
      if (day.toLowerCase() === todayDay && currentMinutes >= openMinutes) {
        return true;
      }

      // Check if we're on the next day before closing time
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayIndex = dayNames.indexOf(day.toLowerCase());
      const nextDayIndex = (dayIndex + 1) % 7;
      const nextDay = dayNames[nextDayIndex];

      if (todayDay === nextDay && currentMinutes <= closeMinutes) {
        return true;
      }

      return false;
    }

    // Regular hours (same day) - check if it's the correct day
    if (day.toLowerCase() !== todayDay) {
      return false;
    }

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  const formatDay = (day: string) => {
    const dayObj = DAYS_OF_WEEK.find((d) => d.value === day);
    return dayObj ? dayObj.label : day;
  };
  const columns = [
    {
      id: "day",
      label: "Day",
      minWidth: 150,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Schedule sx={{ fontSize: 20, color: "primary.main" }} />
          <Chip
            label={formatDay(value)}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      ),
    },
    {
      id: "open_time",
      label: "Opening Time",
      minWidth: 150,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AccessTime sx={{ fontSize: 16, color: "success.main" }} />
          <Typography variant="body2" color="success.main" fontWeight={600}>
            {formatTime(value)}
          </Typography>
        </Box>
      ),
    },
    {
      id: "close_time",
      label: "Closing Time",
      minWidth: 150,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AccessTime sx={{ fontSize: 16, color: "error.main" }} />
          <Typography variant="body2" color="error.main" fontWeight={600}>
            {formatTime(value)}
          </Typography>
        </Box>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 120,
      format: (_value: any, row: any) => {
        const isOpen = isCurrentlyOpen(row.day, row.open_time, row.close_time);
        const isEnabledAndOpen = row.status && isOpen;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={
                isEnabledAndOpen
                  ? "Open Now"
                  : row.status
                  ? "Closed Now"
                  : "Disabled"
              }
              color={
                isEnabledAndOpen ? "success" : row.status ? "warning" : "error"
              }
              size="small"
              sx={{
                fontWeight: 600,
                "& .MuiChip-label": {
                  px: 1.5,
                },
              }}
            />
            {/* Show static enabled/disabled status as secondary info */}
            <Typography variant="caption" color="text.secondary">
              ({row.status ? "Enabled" : "Disabled"})
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "created_at",
      label: "Created",
      minWidth: 150,
      format: (value: any) =>
        new Date(value).toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Toronto",
        }),
    },
    {
      id: "updated_at",
      label: "Last Updated",
      minWidth: 150,
      format: (value: any) =>
        new Date(value).toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Toronto",
        }),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
              Operation Hours Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total operation hours: {totalCount}
            </Typography>
          </Box>
          {(userRole === "admin" || userRole === "superadmin") && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openAddModal}
              sx={{
                backgroundColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
                borderRadius: 2,
                px: 3,
              }}
            >
              Add Hours
            </Button>
          )}
        </Box>
        {/* Filters */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : theme.palette.grey[50],
          }}
        >
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Day</InputLabel>
                <Select
                  value={selectedDay}
                  label="Filter by Day"
                  onChange={(e) => setSelectedDay(e.target.value)}
                >
                  <MenuItem value="">All Days</MenuItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedDay && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
        {/* Data Grid */}
        <Card elevation={0} sx={{ height: 600 }}>
          {loading ? (
            <Box p={3}>
              {[...Array(10)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={52}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          ) : (
            <ModernTable
              columns={columns}
              data={operationHours}
              loading={loading}
              total={totalCount}
              page={paginationModel.page}
              pageSize={paginationModel.pageSize}
              onPageChange={(page: number) =>
                setPaginationModel((prev) => ({ ...prev, page }))
              }
              onPageSizeChange={(pageSize: number) =>
                setPaginationModel((prev) => ({ ...prev, pageSize }))
              }
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              customActions={[
                {
                  id: "toggle-status",
                  label: "Toggle Status",
                  icon: <ToggleOn />,
                  onClick: handleToggleStatus,
                  color: "primary",
                },
              ]}
              canEdit={() => userRole === "admin" || userRole === "superadmin"}
              canDelete={() =>
                userRole === "admin" || userRole === "superadmin"
              }
              title="Operation Hours"
              emptyMessage="No operation hours found"
            />
          )}
        </Card>
        {/* Add/Edit Modal */}
        <Dialog
          open={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AccessTime sx={{ mr: 1 }} />
              {isAddModalOpen ? "Add Operation Hours" : "Edit Operation Hours"}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={formData.day}
                  label="Day of Week"
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display="flex" gap={2}>
                <TextField
                  label="Opening Time"
                  type="time"
                  variant="outlined"
                  fullWidth
                  value={formData.open_time}
                  onChange={(e) =>
                    setFormData({ ...formData, open_time: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />

                <TextField
                  label="Closing Time"
                  type="time"
                  variant="outlined"
                  fullWidth
                  value={formData.close_time}
                  onChange={(e) =>
                    setFormData({ ...formData, close_time: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked })
                    }
                  />
                }
                label={`Status: ${formData.status ? "Open" : "Closed"}`}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={
                isAddModalOpen
                  ? handleAddOperationHour
                  : handleEditOperationHour
              }
              disabled={
                !formData.day || !formData.open_time || !formData.close_time
              }
            >
              {isAddModalOpen ? "Add" : "Update"}
            </Button>{" "}
          </DialogActions>
        </Dialog>{" "}
        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Delete Operation Hour"
          message={`Are you sure you want to delete the operation hour for "${hourToDelete?.day}"? This action cannot be undone.`}
          onConfirm={confirmDeleteOperationHour}
          onCancel={() => {
            setConfirmDeleteOpen(false);
            setHourToDelete(null);
          }}
        />
        {/* View Operation Hour Details Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
            },
          }}
        >
          {selectedOperationHour && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Schedule fontSize="large" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {selectedOperationHour.day}
                    </Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      <Chip
                        label={selectedOperationHour.status ? "Open" : "Closed"}
                        color={
                          selectedOperationHour.status ? "success" : "error"
                        }
                        size="small"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ px: 3, pb: 3 }}>
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
                    sx={{ mb: 2, fontWeight: 600, color: "info.main" }}
                  >
                    Operation Hours
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                      mb={1}
                    >
                      Day of Week
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {selectedOperationHour.day}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                      mb={1}
                    >
                      Opening Time
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="success.main"
                    >
                      {formatTime(selectedOperationHour.open_time)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                      mb={1}
                    >
                      Closing Time
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="error.main"
                    >
                      {formatTime(selectedOperationHour.close_time)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                      mb={1}
                    >
                      Status
                    </Typography>
                    <Chip
                      label={
                        selectedOperationHour.status
                          ? "Open for Business"
                          : "Closed"
                      }
                      color={selectedOperationHour.status ? "success" : "error"}
                      sx={{
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 1,
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                      mb={1}
                    >
                      Created
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {new Date(
                        selectedOperationHour.created_at
                      ).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Toronto",
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
                        selectedOperationHour.updated_at
                      ).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Toronto",
                      })}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                      mb={1}
                    >
                      Last Edited By
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedOperationHour.lastEditedByAdmin?.email ||
                        "System"}
                    </Typography>
                  </Box>
                </Paper>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </motion.div>
  );
};

export default OperationHoursViewModern;
