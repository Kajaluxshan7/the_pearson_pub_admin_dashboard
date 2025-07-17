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
import { Add, Search, LocalDining } from "@mui/icons-material";
import { motion } from "framer-motion";
import { wingSauceService, type WingSauce } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface WingSauceFormData {
  name: string;
  description: string;
}

export const WingSaucesView: React.FC = () => {
  const theme = useTheme();
  const [wingSauces, setWingSauces] = useState<WingSauce[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWingSauce, setSelectedWingSauce] = useState<WingSauce | null>(
    null
  );
  const [formData, setFormData] = useState<WingSauceFormData>({
    name: "",
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
    fetchWingSauces();
  }, [page, pageSize, searchQuery]);

  const fetchWingSauces = async () => {
    try {
      setLoading(true);
      const response = await wingSauceService.getAll(
        page + 1,
        pageSize,
        searchQuery
      );
      setWingSauces(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching wing sauces:", error);
      showSnackbar("Error fetching wing sauces", "error");
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

  const handleEdit = (wingSauce: WingSauce) => {
    setSelectedWingSauce(wingSauce);
    setFormData({
      name: wingSauce.name,
      description: wingSauce.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleView = (wingSauce: WingSauce) => {
    setSelectedWingSauce(wingSauce);
    setFormData({
      name: wingSauce.name,
      description: wingSauce.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (wingSauce: WingSauce) => {
    setConfirmDialog({
      open: true,
      title: "Delete Wing Sauce",
      message: `Are you sure you want to delete "${wingSauce.name}"? This action cannot be undone.`,
      onConfirm: () => confirmDelete(wingSauce.id),
    });
  };

  const confirmDelete = async (id: string) => {
    try {
      await wingSauceService.delete(id);
      showSnackbar("Wing sauce deleted successfully", "success");
      fetchWingSauces();
    } catch (error) {
      console.error("Error deleting wing sauce:", error);
      showSnackbar("Error deleting wing sauce", "error");
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleSaveWingSauce = async () => {
    try {
      // Only send the required fields (exclude lastEditedByAdminId)
      const saveData = {
        name: formData.name,
        description: formData.description,
      };

      if (selectedWingSauce) {
        await wingSauceService.update(selectedWingSauce.id, saveData);
        showSnackbar("Wing sauce updated successfully", "success");
      } else {
        await wingSauceService.create(saveData);
        showSnackbar("Wing sauce added successfully", "success");
      }

      setAddDialogOpen(false);
      setEditDialogOpen(false);
      resetForm();
      fetchWingSauces();
    } catch (error) {
      console.error("Error saving wing sauce:", error);
      showSnackbar("Error saving wing sauce", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setSelectedWingSauce(null);
  };

  const columns = [
    {
      id: "name",
      label: "Sauce Name",
      minWidth: 200,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalDining sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
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
            Wing Sauces Management
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
            Add Wing Sauce
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search wing sauces..."
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
          data={wingSauces}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          title="Wing Sauces"
          emptyMessage="No wing sauces found"
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
              {selectedWingSauce ? "Edit Wing Sauce" : "Add New Wing Sauce"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sauce Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalDining />
                      </InputAdornment>
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
              onClick={handleSaveWingSauce}
              variant="contained"
              disabled={!formData.name}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {selectedWingSauce ? "Update Wing Sauce" : "Add Wing Sauce"}
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

export default WingSaucesView;
