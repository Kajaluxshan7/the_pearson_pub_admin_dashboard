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
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Add, Search, LocalOffer, AttachMoney } from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  specialsService,
  specialsDayService,
  itemService,
  categoryService,
  type Special,
  type SpecialsDay,
  type Item,
  type Category,
} from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

interface SpecialsFormData {
  special_type: "daily" | "seasonal" | "latenight" | "";
  specialsDayId: string;
  name: string;
  description: string;
  price: string;
  from_menu: boolean;
  menuItemId: string;
  categoryId: string;
  seasonal_start_date: string;
  seasonal_end_date: string;
  lastEditedByAdminId: string;
}

const SPECIAL_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "seasonal", label: "Seasonal" },
  { value: "latenight", label: "Late Night" },
];

export const SpecialsView: React.FC = () => {
  const theme = useTheme();
  const [specials, setSpecials] = useState<Special[]>([]);
  const [specialsDays, setSpecialsDays] = useState<SpecialsDay[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [formData, setFormData] = useState<SpecialsFormData>({
    special_type: "",
    specialsDayId: "",
    name: "",
    description: "",
    price: "",
    from_menu: false,
    menuItemId: "",
    categoryId: "",
    seasonal_start_date: "",
    seasonal_end_date: "",
    lastEditedByAdminId: "",
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
    fetchSpecials();
    fetchSpecialsDays();
    fetchItems();
    fetchCategories();
  }, [page, pageSize, searchQuery, typeFilter]);

  const fetchSpecials = async () => {
    try {
      setLoading(true);
      const response = await specialsService.getAll(
        page + 1,
        pageSize,
        searchQuery,
        typeFilter === "all" ? undefined : typeFilter
      );
      setSpecials(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching specials:", error);
      showSnackbar("Error fetching specials", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialsDays = async () => {
    try {
      const response = await specialsDayService.getAll(1, 100);
      setSpecialsDays(response.data);
    } catch (error) {
      console.error("Error fetching specials days:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemService.getAll(1, 100);
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll(1, 100);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
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

  const handleEdit = (special: Special) => {
    setSelectedSpecial(special);
    setFormData({
      special_type: special.special_type,
      specialsDayId: special.specialsDayId || "",
      name: special.name,
      description: special.description || "",
      price: special.price.toString(),
      from_menu: special.from_menu,
      menuItemId: special.menuItemId || "",
      categoryId: special.categoryId || "",
      seasonal_start_date: special.seasonal_start_date
        ? special.seasonal_start_date.split("T")[0]
        : "",
      seasonal_end_date: special.seasonal_end_date
        ? special.seasonal_end_date.split("T")[0]
        : "",
      lastEditedByAdminId: special.lastEditedByAdminId,
    });
    setEditDialogOpen(true);
  };
  const handleView = (special: Special) => {
    setSelectedSpecial(special);
    // For now, just use edit dialog for viewing
    setFormData({
      special_type: special.special_type,
      specialsDayId: special.specialsDayId || "",
      name: special.name,
      description: special.description || "",
      price: special.price.toString(),
      from_menu: special.from_menu,
      menuItemId: special.menuItemId || "",
      categoryId: special.categoryId || "",
      seasonal_start_date: special.seasonal_start_date
        ? special.seasonal_start_date.split("T")[0]
        : "",
      seasonal_end_date: special.seasonal_end_date
        ? special.seasonal_end_date.split("T")[0]
        : "",
      lastEditedByAdminId: special.lastEditedByAdminId,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (special: Special) => {
    setConfirmDialog({
      open: true,
      title: "Delete Special",
      message: `Are you sure you want to delete "${special.name}"? This action cannot be undone.`,
      onConfirm: () => confirmDelete(special.id),
    });
  };

  const confirmDelete = async (id: string) => {
    try {
      await specialsService.delete(id);
      showSnackbar("Special deleted successfully", "success");
      fetchSpecials();
    } catch (error) {
      console.error("Error deleting special:", error);
      showSnackbar("Error deleting special", "error");
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };
  const handleSaveSpecial = async () => {
    try {
      const saveData = {
        ...formData,
        price: parseFloat(formData.price),
        seasonal_start_date: formData.seasonal_start_date || undefined,
        seasonal_end_date: formData.seasonal_end_date || undefined,
        specialsDayId: formData.specialsDayId || undefined,
        menuItemId: formData.menuItemId || undefined,
        categoryId: formData.categoryId || undefined,
        special_type: formData.special_type as
          | "daily"
          | "seasonal"
          | "latenight",
      };

      if (selectedSpecial) {
        await specialsService.update(selectedSpecial.id, saveData);
        showSnackbar("Special updated successfully", "success");
      } else {
        await specialsService.create(saveData);
        showSnackbar("Special added successfully", "success");
      }

      setAddDialogOpen(false);
      setEditDialogOpen(false);
      resetForm();
      fetchSpecials();
    } catch (error) {
      console.error("Error saving special:", error);
      showSnackbar("Error saving special", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      special_type: "",
      specialsDayId: "",
      name: "",
      description: "",
      price: "",
      from_menu: false,
      menuItemId: "",
      categoryId: "",
      seasonal_start_date: "",
      seasonal_end_date: "",
      lastEditedByAdminId: "",
    });
    setSelectedSpecial(null);
  };

  const getSpecialTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "primary";
      case "seasonal":
        return "success";
      case "latenight":
        return "warning";
      default:
        return "default";
    }
  };

  const columns = [
    {
      id: "name",
      label: "Special Name",
      minWidth: 200,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalOffer sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "special_type",
      label: "Type",
      minWidth: 120,
      format: (value: any) => (
        <Chip
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="small"
          color={getSpecialTypeColor(value) as any}
          sx={{ borderRadius: 2 }}
        />
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
      id: "from_menu",
      label: "From Menu",
      minWidth: 100,
      format: (value: any) => (
        <Chip
          label={value ? "Yes" : "No"}
          size="small"
          variant={value ? "filled" : "outlined"}
          color={value ? "success" : "default"}
          sx={{ borderRadius: 2 }}
        />
      ),
    },
    {
      id: "created_at",
      label: "Created Date",
      minWidth: 150,
      format: (value: any) => new Date(value).toLocaleDateString(),
    },
  ];

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

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
            Specials Management
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
            Add Special
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search specials..."
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
                <InputLabel>Type Filter</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type Filter"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {SPECIAL_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Data Table */}
        <ModernTable
          columns={columns}
          data={specials}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          title="Specials"
          emptyMessage="No specials found"
        />

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
            sx: { borderRadius: 3 },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              {selectedSpecial ? "Edit Special" : "Add New Special"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Special Type *</InputLabel>
                  <Select
                    value={formData.special_type}
                    label="Special Type *"
                    onChange={(e) =>
                      setFormData({ ...formData, special_type: e.target.value })
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {SPECIAL_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {formData.special_type === "daily" && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Specials Day *</InputLabel>
                    <Select
                      value={formData.specialsDayId}
                      label="Specials Day *"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialsDayId: e.target.value,
                        })
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {specialsDays.map((day) => (
                        <MenuItem key={day.id} value={day.id}>
                          {day.day_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Special Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
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
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.from_menu}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          from_menu: e.target.checked,
                        })
                      }
                    />
                  }
                  label="From Menu"
                />
              </Grid>

              {formData.from_menu ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Menu Item</InputLabel>
                    <Select
                      value={formData.menuItemId}
                      label="Menu Item"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          menuItemId: e.target.value,
                          categoryId: "",
                        })
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
              ) : (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.categoryId}
                      label="Category"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                          menuItemId: "",
                        })
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {(formData.special_type === "seasonal" ||
                formData.special_type === "latenight") && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date *"
                      type="date"
                      value={formData.seasonal_start_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seasonal_start_date: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={formData.seasonal_end_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seasonal_end_date: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                </>
              )}
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
              onClick={handleSaveSpecial}
              variant="contained"
              disabled={
                !formData.name || !formData.price || !formData.special_type
              }
              sx={{ borderRadius: 2, px: 3 }}
            >
              {selectedSpecial ? "Update Special" : "Add Special"}
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

export default SpecialsView;
