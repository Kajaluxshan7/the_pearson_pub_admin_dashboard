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
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Add, Search, Fastfood, AttachMoney } from "@mui/icons-material";
import { motion } from "framer-motion";
import { substituteSideService, type SubstituteSide } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface SubstituteSideFormData {
  name: string;
  price: string;
  description: string;
}

export const SubstituteSidesView: React.FC = () => {
  const theme = useTheme();
  const [substituteSides, setSubstituteSides] = useState<SubstituteSide[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubstituteSide, setSelectedSubstituteSide] =
    useState<SubstituteSide | null>(null);
  const [formData, setFormData] = useState<SubstituteSideFormData>({
    name: "",
    price: "",
    description: "",
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
    fetchSubstituteSides();
  }, [page, pageSize, searchQuery]);

  const fetchSubstituteSides = async () => {
    try {
      setLoading(true);
      const response = await substituteSideService.getAll(
        page + 1,
        pageSize,
        searchQuery
      );
      setSubstituteSides(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching substitute sides:", error);
      showSnackbar("Error fetching substitute sides", "error");
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

  const handleEdit = (substituteSide: SubstituteSide) => {
    setSelectedSubstituteSide(substituteSide);
    setFormData({
      name: substituteSide.name,
      price: substituteSide.price.toString(),
      description: substituteSide.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleView = (substituteSide: SubstituteSide) => {
    setSelectedSubstituteSide(substituteSide);
    setFormData({
      name: substituteSide.name,
      price: substituteSide.price.toString(),
      description: substituteSide.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (substituteSide: SubstituteSide) => {
    setConfirmDialog({
      open: true,
      title: "Delete Substitute Side",
      message: `Are you sure you want to delete "${substituteSide.name}"? This action cannot be undone.`,
      onConfirm: () => confirmDelete(substituteSide.id),
    });
  };

  const confirmDelete = async (id: string) => {
    try {
      await substituteSideService.delete(id);
      showSnackbar("Substitute side deleted successfully", "success");
      fetchSubstituteSides();
    } catch (error) {
      console.error("Error deleting substitute side:", error);
      showSnackbar("Error deleting substitute side", "error");
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleSaveSubstituteSide = async () => {
    try {
      const saveData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (selectedSubstituteSide) {
        await substituteSideService.update(selectedSubstituteSide.id, saveData);
        showSnackbar("Substitute side updated successfully", "success");
      } else {
        await substituteSideService.create(saveData);
        showSnackbar("Substitute side added successfully", "success");
      }

      setAddDialogOpen(false);
      setEditDialogOpen(false);
      resetForm();
      fetchSubstituteSides();
    } catch (error) {
      console.error("Error saving substitute side:", error);
      showSnackbar("Error saving substitute side", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
    });
    setSelectedSubstituteSide(null);
  };

  const columns = [
    {
      id: "name",
      label: "Side Name",
      minWidth: 200,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Fastfood sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "price",
      label: "Price",
      minWidth: 100,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AttachMoney sx={{ fontSize: 16, color: "success.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {parseFloat(value).toFixed(2)}
          </Typography>
        </Box>
      ),
    },
    {
      id: "description",
      label: "Description",
      minWidth: 250,
      format: (value: any) => (
        <Typography variant="body2" color="text.secondary">
          {value || "No description"}
        </Typography>
      ),
    },
    {
      id: "created_at",
      label: "Created Date",
      minWidth: 150,
      format: (value: any) => new Date(value).toLocaleDateString(),
    },
    {
      id: "lastEditedByAdmin",
      label: "Last Edited By",
      minWidth: 180,
      format: (value: any) => (
        <Typography variant="body2" color="text.secondary">
          {value?.email || "System"}
        </Typography>
      ),
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
            Substitute Sides Management
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
            Add Substitute Side
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search substitute sides..."
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
          data={substituteSides}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          title="Substitute Sides"
          emptyMessage="No substitute sides found"
        />

        {/* Add/Edit Dialog */}
        <Dialog
          open={addDialogOpen || editDialogOpen}
          onClose={() => {
            setAddDialogOpen(false);
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
              {selectedSubstituteSide
                ? "Edit Substitute Side"
                : "Add New Substitute Side"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Side Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Fastfood />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Price *"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setAddDialogOpen(false);
                setEditDialogOpen(false);
                resetForm();
              }}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubstituteSide}
              variant="contained"
              disabled={!formData.name || !formData.price}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {selectedSubstituteSide
                ? "Update Substitute Side"
                : "Add Substitute Side"}
            </Button>
          </DialogActions>
        </Dialog>

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

export default SubstituteSidesView;
