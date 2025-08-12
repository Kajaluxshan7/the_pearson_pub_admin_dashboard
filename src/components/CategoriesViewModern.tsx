import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Add,
  Search,
  Category as CategoryIcon,
  Description,
  FilterList,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { categoryService, type Category } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";
import { useNotification } from "../hooks/useNotification";

interface CategoryFormData {
  name: string;
  description: string;
}

export const CategoriesView: React.FC = () => {
  const theme = useTheme();
  const { showError, showSuccess, showWarning } = useNotification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Remove legacy snackbar state

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll(
        page + 1,
        pageSize,
        searchQuery
      );
      setCategories(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, showError]);

  useEffect(() => {
    fetchCategories();
  }, [page, pageSize, searchQuery, fetchCategories]);

  // Removed legacy showSnackbar function, now using useNotification exclusively
  const columns = [
    {
      id: "name",
      label: "Category Name",
      minWidth: 200,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CategoryIcon sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "description",
      label: "Description",
      minWidth: 300,
      format: (value: string | undefined) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
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
      id: "lastEditedByAdmin",
      label: "Last Edited By",
      minWidth: 180,
      format: (value: { email?: string } | null | undefined) => (
        <Typography variant="body2" color="text.secondary">
          {value?.email || "System"}
        </Typography>
      ),
    },
    {
      id: "updated_at",
      label: "Last Updated",
      minWidth: 130,
      format: (value: string | number | Date) => new Date(value).toLocaleDateString(),
    },
  ];
  const handleView = (category: Category) => {
    setSelectedCategory(category);
    setViewDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setEditDialogOpen(true);
  };
  const handleDelete = (category: Category) => {
    setConfirmDialog({
      open: true,
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      onConfirm: () => confirmDelete(category),
    });
  };

  const confirmDelete = async (category: Category) => {
    try {
      await categoryService.delete(category.id);
      showSuccess(`Category "${category.name}" deleted successfully`);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      showError(error as Error);
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!formData.name.trim()) {
        showWarning("Category name is required");
        return;
      }
      
      await categoryService.create({
        name: formData.name,
        description: formData.description,
      });
      showSuccess(`Category "${formData.name}" created successfully`);
      setAddDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      showError(error as Error);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      if (!selectedCategory?.id) {
        showWarning("No category selected for update");
        return;
      }
      
      if (!formData.name.trim()) {
        showWarning("Category name is required");
        return;
      }
      
      await categoryService.update(selectedCategory.id, {
        name: formData.name,
        description: formData.description,
      });
      showSuccess(`Category "${formData.name}" updated successfully`);
      setEditDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      showError(error as Error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setSelectedCategory(null);
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
            Category Management
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
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
            Add Category
          </Button>
        </Box>
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search categories by name or description..."
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
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setSearchQuery("")}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                Clear
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "right" }}
              >
                Total: {total}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        {/* Data Table */}{" "}
        <ModernTable
          columns={columns}
          data={categories}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          title="Categories"
          emptyMessage="No categories found"
        />
        {/* Add Category Dialog */}
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
              Add New Category
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CategoryIcon />
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
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
              onClick={handleAddCategory}
              variant="contained"
              disabled={!formData.name}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Add Category
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Category Dialog */}
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
              Edit Category: {selectedCategory?.name}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CategoryIcon />
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
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
              onClick={handleUpdateCategory}
              variant="contained"
              disabled={!formData.name}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Update Category
            </Button>
          </DialogActions>
        </Dialog>{" "}
  {/* Snackbar removed: now using notification system via useNotification */}
        {/* View Category Dialog */}
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
              Category Details
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedCategory && (
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
                          Category Name
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {selectedCategory.name}
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
                            selectedCategory.created_at
                          ).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedCategory.description ||
                            "No description provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {new Date(
                            selectedCategory.updated_at
                          ).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setViewDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>{" "}
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
