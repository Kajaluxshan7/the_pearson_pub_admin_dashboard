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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Add,
  Search,
  FilterList,
  Extension,
  AttachMoney,
  CheckCircle,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  addonService,
  itemService,
  type Addon,
  type Item,
  type PaginatedResponse,
} from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface AddonsViewModernProps {
  userRole: "admin" | "superadmin";
}

export const AddonsViewModern: React.FC<AddonsViewModernProps> = () => {
  const theme = useTheme();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_type: "",
    itemId: "",
  });

  useEffect(() => {
    fetchAddons();
    fetchItems();
  }, [page, pageSize, categoryFilter]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchAddons();
      } else {
        setPage(0); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchItems = async () => {
    try {
      const response = await itemService.getAll(1, 100); // Get all items for dropdown
      const itemsData = Array.isArray(response.data) ? response.data : [];
      setItems(itemsData);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      // Only add filters if they have values
      if (searchQuery && searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      if (categoryFilter && categoryFilter !== "all") {
        filters.category_type = categoryFilter;
      }

      const response: PaginatedResponse<Addon> = await addonService.getAll(
        page + 1,
        pageSize,
        filters
      );

      // Ensure we have valid data
      const addonsData = Array.isArray(response.data) ? response.data : [];
      const totalCount =
        typeof response.total === "number" ? response.total : 0;

      setAddons(addonsData);
      setTotal(totalCount);
    } catch (error) {
      console.error("Error fetching addons:", error);
      showSnackbar("Error fetching addons", "error");
      setAddons([]);
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

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description || "",
      price: (addon.price || 0).toString(),
      category_type: addon.category_type || "",
      itemId: addon.itemId || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (addon: Addon) => {
    setAddonToDelete(addon);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!addonToDelete) return;

    try {
      await addonService.delete(addonToDelete.id);
      showSnackbar("Addon deleted successfully", "success");
      setConfirmDialogOpen(false);
      setAddonToDelete(null);
      fetchAddons();
    } catch (error: any) {
      console.error("Error deleting addon:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error deleting addon";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleView = (addon: Addon) => {
    setSelectedAddon(addon);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        showSnackbar("Addon name is required", "error");
        return;
      }

      if (!formData.category_type) {
        showSnackbar("Category type is required", "error");
        return;
      }

      if (!formData.itemId) {
        showSnackbar("Item selection is required", "error");
        return;
      }

      const addonData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        category_type: formData.category_type,
        itemId: formData.itemId,
      };

      if (selectedAddon) {
        // Update existing addon
        await addonService.update(selectedAddon.id, addonData);
        showSnackbar("Addon updated successfully", "success");
        setEditDialogOpen(false);
      } else {
        // Create new addon
        await addonService.create(addonData);
        showSnackbar("Addon created successfully", "success");
        setAddDialogOpen(false);
      }

      resetForm();
      fetchAddons();
    } catch (error) {
      console.error("Error saving addon:", error);
      showSnackbar("Error saving addon", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_type: "",
      itemId: "",
    });
    setSelectedAddon(null);
  };

  const handleToggleAvailability = async (addon: Addon) => {
    try {
      // This functionality would need an availability field in the Addon interface
      console.log("Toggle availability for addon:", addon.name);
      showSnackbar(
        "Feature not available - addon availability field not implemented",
        "info"
      );
    } catch (error) {
      console.error("Error toggling availability:", error);
      showSnackbar("Error updating addon", "error");
    }
  };

  const getCategoryColor = (categoryType: string) => {
    const colors: { [key: string]: string } = {
      sauce: "#ef4444",
      herb: "#22c55e",
      cheese: "#f59e0b",
      side: "#3b82f6",
      spice: "#dc2626",
      protein: "#8b5cf6",
      topping: "#f97316",
    };
    return colors[categoryType] || theme.palette.primary.main;
  };

  const columns = [
    {
      id: "name",
      label: "Addon Name",
      minWidth: 200,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Extension sx={{ fontSize: 20, color: "primary.main" }} />
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
      format: (value: any) => {
        const price =
          typeof value === "number" ? value : parseFloat(value) || 0;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AttachMoney sx={{ fontSize: 16, color: "success.main" }} />
            <Typography variant="body2" fontWeight={600} color="success.main">
              {price.toFixed(2)}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "description",
      label: "Description",
      minWidth: 250,
      format: (value: any) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 250,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || "No description"}
        </Typography>
      ),
    },
    {
      id: "category_type",
      label: "Category Type",
      minWidth: 130,
      format: (value: any) => (
        <Chip
          label={value || "Unknown"}
          size="small"
          sx={{
            backgroundColor: getCategoryColor(value || "") + "22",
            color: getCategoryColor(value || ""),
            fontWeight: 600,
            borderRadius: 2,
            textTransform: "capitalize",
          }}
        />
      ),
    },
    {
      id: "created_at",
      label: "Created",
      minWidth: 120,
      format: (value: any) => (
        <Typography variant="caption" color="text.secondary">
          {new Date(value).toLocaleDateString()}
        </Typography>
      ),
    },
  ];

  const clearFilters = () => {
    setCategoryFilter("all");
    setSearchQuery("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: "100%", overflowX: "hidden" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
            >
              Addons
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage restaurant addons and enhancements
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setAddDialogOpen(true);
            }}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              boxShadow: 2,
              minWidth: { xs: "100%", sm: "auto" },
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            Add Addon
          </Button>
        </Box>

        {/* Filters */}
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search addons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category Type</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category Type"
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="sauce">Sauce</MenuItem>
                  <MenuItem value="herb">Herb</MenuItem>
                  <MenuItem value="cheese">Cheese</MenuItem>
                  <MenuItem value="side">Side</MenuItem>
                  <MenuItem value="spice">Spice</MenuItem>
                  <MenuItem value="protein">Protein</MenuItem>
                  <MenuItem value="topping">Topping</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: "divider",
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "primary.50",
                    color: "primary.main",
                  },
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Data Table */}
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: 1,
            border: 1,
            borderColor: "divider",
          }}
        >
          <ModernTable
            columns={columns}
            data={addons}
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
                id: "toggle-availability",
                label: "Toggle Availability",
                icon: <CheckCircle />,
                onClick: handleToggleAvailability,
                color: "success",
              },
            ]}
            title="Addons"
            emptyMessage="No addons found. Try adjusting your search criteria."
          />
        </Box>

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

        {/* Add/Edit Dialog */}
        <Dialog
          open={addDialogOpen || editDialogOpen}
          onClose={() => {
            setAddDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              pb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {selectedAddon ? "Edit Addon" : "Add New Addon"}
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Addon Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  sx={{ borderRadius: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price"
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
                  required
                  sx={{ borderRadius: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Item</InputLabel>
                  <Select
                    value={formData.itemId}
                    label="Item"
                    onChange={(e) =>
                      setFormData({ ...formData, itemId: e.target.value })
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {items.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category Type</InputLabel>
                  <Select
                    value={formData.category_type}
                    label="Category Type"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category_type: e.target.value,
                      })
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="sauce">Sauce</MenuItem>
                    <MenuItem value="herb">Herb</MenuItem>
                    <MenuItem value="cheese">Cheese</MenuItem>
                    <MenuItem value="side">Side</MenuItem>
                    <MenuItem value="spice">Spice</MenuItem>
                    <MenuItem value="protein">Protein</MenuItem>
                    <MenuItem value="topping">Topping</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: "divider" }}>
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
              variant="contained"
              onClick={handleSave}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {selectedAddon ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              pb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Addon Details
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {selectedAddon && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedAddon.name}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="success.main"
                  >
                    $
                    {(typeof selectedAddon.price === "number"
                      ? selectedAddon.price
                      : parseFloat(selectedAddon.price) || 0
                    ).toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category Type
                  </Typography>
                  <Chip
                    label={selectedAddon.category_type || "Unknown"}
                    size="small"
                    sx={{
                      backgroundColor:
                        getCategoryColor(selectedAddon.category_type || "") +
                        "22",
                      color: getCategoryColor(
                        selectedAddon.category_type || ""
                      ),
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: "capitalize",
                      mt: 0.5,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedAddon.description || "No description provided"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedAddon.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={() => setViewDialogOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDialogOpen}
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Addon"
          message={`Are you sure you want to delete "${addonToDelete?.name}"? This action cannot be undone.`}
        />
      </Box>
    </motion.div>
  );
};

export default AddonsViewModern;
