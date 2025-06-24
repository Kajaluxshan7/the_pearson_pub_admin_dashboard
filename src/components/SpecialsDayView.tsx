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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Add, Search, CalendarToday } from "@mui/icons-material";
import { motion } from "framer-motion";
import { specialsDayService, type SpecialsDay } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface SpecialsDayFormData {
  day_name: string;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const SpecialsDayView: React.FC = () => {
  const theme = useTheme();
  const [specialsDays, setSpecialsDays] = useState<SpecialsDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSpecialsDay, setSelectedSpecialsDay] =
    useState<SpecialsDay | null>(null);
  const [formData, setFormData] = useState<SpecialsDayFormData>({
    day_name: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchSpecialsDays();
  }, [page, pageSize, searchQuery]);

  const fetchSpecialsDays = async () => {
    try {
      setLoading(true);
      const response = await specialsDayService.getAll(
        page + 1,
        pageSize,
        searchQuery
      );
      setSpecialsDays(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching specials days:", error);
      showSnackbar("Error fetching specials days", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAdd = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleEdit = (specialsDay: SpecialsDay) => {
    setSelectedSpecialsDay(specialsDay);
    setFormData({
      day_name: specialsDay.day_name,
    });
    setEditDialogOpen(true);
  };

  const handleView = (specialsDay: SpecialsDay) => {
    setSelectedSpecialsDay(specialsDay);
    setViewDialogOpen(true);
  };

  const handleDelete = (specialsDay: SpecialsDay) => {
    setConfirmDialog({
      open: true,
      title: "Delete Specials Day",
      message: `Are you sure you want to delete "${specialsDay.day_name}"? This action cannot be undone.`,
      onConfirm: () => confirmDelete(specialsDay.id),
    });
  };

  const confirmDelete = async (id: string) => {
    try {
      await specialsDayService.delete(id);
      showSnackbar("Specials day deleted successfully", "success");
      fetchSpecialsDays();
    } catch (error) {
      console.error("Error deleting specials day:", error);
      showSnackbar("Error deleting specials day", "error");
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleAddSpecialsDay = async () => {
    try {
      await specialsDayService.create(formData);
      showSnackbar("Specials day added successfully", "success");
      setAddDialogOpen(false);
      resetForm();
      fetchSpecialsDays();
    } catch (error) {
      console.error("Error adding specials day:", error);
      showSnackbar("Error adding specials day", "error");
    }
  };

  const handleUpdateSpecialsDay = async () => {
    if (!selectedSpecialsDay) return;

    try {
      await specialsDayService.update(selectedSpecialsDay.id, formData);
      showSnackbar("Specials day updated successfully", "success");
      setEditDialogOpen(false);
      resetForm();
      fetchSpecialsDays();
    } catch (error) {
      console.error("Error updating specials day:", error);
      showSnackbar("Error updating specials day", "error");
    }
  };

  const resetForm = () => {
    setFormData({ day_name: "" });
    setSelectedSpecialsDay(null);
  };

  const columns = [
    {
      id: "day_name",
      label: "Day Name",
      minWidth: 200,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarToday sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "created_at",
      label: "Created Date",
      minWidth: 150,
      format: (value: any) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
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
            Specials Days Management
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
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
            Add Specials Day
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search specials days..."
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
          </Grid>
        </Paper>

        {/* Data Table */}
        <ModernTable
          columns={columns}
          data={specialsDays}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          title="Specials Days"
          emptyMessage="No specials days found"
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

        {/* Add Dialog */}
        <Dialog
          open={addDialogOpen}
          onClose={() => {
            setAddDialogOpen(false);
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
              Add New Specials Day
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Day Name</InputLabel>
                  <Select
                    value={formData.day_name}
                    label="Day Name"
                    onChange={(e) =>
                      setFormData({ ...formData, day_name: e.target.value })
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setAddDialogOpen(false);
                resetForm();
              }}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSpecialsDay}
              variant="contained"
              disabled={!formData.day_name}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Add Specials Day
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
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
              Edit Specials Day
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Day Name</InputLabel>
                  <Select
                    value={formData.day_name}
                    label="Day Name"
                    onChange={(e) =>
                      setFormData({ ...formData, day_name: e.target.value })
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
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
              onClick={handleUpdateSpecialsDay}
              variant="contained"
              disabled={!formData.day_name}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Update Specials Day
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              Specials Day Details
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedSpecialsDay && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "grey.50" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Day Name
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {selectedSpecialsDay.day_name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Created Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(
                            selectedSpecialsDay.created_at
                          ).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setViewDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        />
      </Box>
    </motion.div>
  );
};

export default SpecialsDayView;
