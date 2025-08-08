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
  IconButton,
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
  Restaurant,
  AttachMoney,
  Favorite,
  VisibilityOff,
  Visibility,
  CheckCircle,
  Delete as DeleteIcon,
  PhotoCamera,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  itemService,
  categoryService,
  type Item,
  type Category,
  type PaginatedResponse,
} from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";

export const ItemsView: React.FC = () => {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [favouriteFilter, setFavouriteFilter] = useState<string>("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    discount: "", // Add discount field
    categoryId: "",
    availability: true,
    visibility: true,
    is_favourite: false,
    images: [] as string[],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [
    page,
    pageSize,
    searchQuery,
    categoryFilter,
    availabilityFilter,
    visibilityFilter,
    favouriteFilter,
  ]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll(1, 100); // Get all categories
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (searchQuery) filters.search = searchQuery;
      if (categoryFilter !== "all") filters.categoryId = categoryFilter;
      if (availabilityFilter !== "all")
        filters.availability = availabilityFilter === "available";
      if (visibilityFilter !== "all")
        filters.visibility = visibilityFilter === "visible";
      if (favouriteFilter !== "all")
        filters.is_favourite = favouriteFilter === "favourite";

      const response: PaginatedResponse<Item> = await itemService.getAll(
        page + 1,
        pageSize,
        filters
      );
      setItems(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching items:", error);
      showSnackbar("Error fetching items", "error");
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };
  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    // Calculate discount percentage from original_price and current price
    const discountPercent =
      item.original_price && item.original_price > 0
        ? Math.round(
            ((item.original_price - item.price) / item.original_price) * 100
          )
        : 0;

    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price ? item.price.toString() : "",
      original_price: item.original_price ? item.original_price.toString() : "",
      discount: discountPercent > 0 ? discountPercent.toString() : "",
      categoryId: item.categoryId,
      availability: item.availability,
      visibility: item.visibility,
      is_favourite: item.is_favourite,
      images: item.images || [],
    });
    setEditDialogOpen(true);
  };
  const handleDelete = (item: Item) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await itemService.delete(itemToDelete.id);
      showSnackbar("Item deleted successfully", "success");
      setConfirmDialogOpen(false);
      setItemToDelete(null);
      fetchItems(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting item:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error deleting item";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleView = (item: Item) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  // Calculate price based on original price and discount percentage
  const calculatePriceFromDiscount = (
    originalPrice: number,
    discount: number
  ): number => {
    if (discount < 0 || discount > 100) return originalPrice;
    return originalPrice * (1 - discount / 100);
  };

  // Handle discount change and auto-calculate price
  const handleDiscountChange = (discountValue: string) => {
    const discount = parseFloat(discountValue) || 0;
    const originalPrice = parseFloat(formData.original_price) || 0;

    // Calculate price only if both original price and discount are provided
    if (
      formData.original_price &&
      originalPrice > 0 &&
      discount >= 0 &&
      discount <= 100
    ) {
      const newPrice = calculatePriceFromDiscount(originalPrice, discount);
      setFormData((prev) => ({
        ...prev,
        discount: discountValue,
        price: newPrice.toFixed(2),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        discount: discountValue,
      }));
    }
  };

  // Handle original price change and recalculate price if discount exists
  const handleOriginalPriceChange = (originalPriceValue: string) => {
    const originalPrice = parseFloat(originalPriceValue) || 0;
    const discount = parseFloat(formData.discount) || 0;

    // Calculate price only if original price is provided
    if (originalPriceValue && originalPrice > 0) {
      const newPrice = calculatePriceFromDiscount(originalPrice, discount);
      setFormData((prev) => ({
        ...prev,
        original_price: originalPriceValue,
        price: newPrice.toFixed(2),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        original_price: originalPriceValue,
        price: "",
      }));
    }
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.name.trim()) {
        showSnackbar("Item name is required", "error");
        return;
      }

      if (!formData.categoryId) {
        showSnackbar("Category is required", "error");
        return;
      }

      // Only validate price if original_price is provided
      if (formData.original_price && parseFloat(formData.original_price) <= 0) {
        showSnackbar(
          "Original price must be greater than 0 if provided",
          "error"
        );
        return;
      }

      // Only validate discount if provided
      if (
        formData.discount &&
        (parseFloat(formData.discount) < 0 ||
          parseFloat(formData.discount) > 100)
      ) {
        showSnackbar("Discount must be between 0 and 100 if provided", "error");
        return;
      }

      // First upload any new images
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages(imageFiles);
      }

      // Combine existing images with newly uploaded images
      const allImages = [...formData.images, ...uploadedImageUrls];

      const saveData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price ? parseFloat(formData.price) : 0,
        original_price: formData.original_price
          ? parseFloat(formData.original_price)
          : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        categoryId: formData.categoryId,
        availability: formData.availability,
        visibility: formData.visibility,
        is_favourite: formData.is_favourite,
        images: allImages,
      };

      if (addDialogOpen) {
        await itemService.create(saveData);
        showSnackbar("Item created successfully", "success");
      } else if (editDialogOpen && selectedItem) {
        if (!selectedItem.id) {
          showSnackbar("Invalid item ID", "error");
          return;
        }
        await itemService.update(selectedItem.id, saveData);
        showSnackbar("Item updated successfully", "success");
      }

      setAddDialogOpen(false);
      setEditDialogOpen(false);
      resetForm();
      fetchItems(); // Refresh the list
    } catch (error) {
      console.error("Error saving item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error saving item";
      showSnackbar(errorMessage, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      original_price: "",
      discount: "",
      categoryId: "",
      availability: true,
      visibility: true,
      is_favourite: false,
      images: [],
    });
    setSelectedItem(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate file count (max 5 total including existing)
    if (files.length + formData.images.length + imageFiles.length > 5) {
      showSnackbar("Maximum 5 images allowed", "error");
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > 1024 * 1024) {
        showSnackbar(`File ${file.name} exceeds 1MB limit`, "error");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        showSnackbar(`File ${file.name} is not a valid image type`, "error");
        return;
      }
    }

    // Add files and create previews
    setImageFiles((prev) => [...prev, ...files]);

    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImagePreview = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageUrl: string, index: number) => {
    try {
      // Remove from the backend (this will delete from S3)
      await itemService.deleteImage(imageUrl);

      // Remove from form data
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));

      showSnackbar("Image removed successfully", "success");
    } catch (error) {
      console.error("Error removing image:", error);
      showSnackbar("Error removing image", "error");
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
      const result = await itemService.uploadImages(files);
      return result.imageUrls || [];
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Failed to upload images");
    }
  };
  const columns = [
    {
      id: "name",
      label: "Item Name",
      minWidth: 200,
      format: (value: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Restaurant sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "images",
      label: "Image",
      minWidth: 80,
      format: (value: any) => (
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid " + theme.palette.divider,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.grey[100],
          }}
        >
          {value && value.length > 0 ? (
            <img
              src={value[0]}
              alt="Item"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Restaurant sx={{ color: theme.palette.grey[400] }} />
          )}
        </Box>
      ),
    },
    {
      id: "categoryId",
      label: "Category",
      minWidth: 150,
      format: (value: any) => (
        <Chip
          label={getCategoryName(value)}
          size="small"
          sx={{
            backgroundColor: theme.palette.primary.light + "22",
            color: theme.palette.primary.main,
            fontWeight: 600,
            borderRadius: 2,
          }}
        />
      ),
    },
    {
      id: "price",
      label: "Price",
      minWidth: 100,
      format: (value: any) =>
        value !== null && value !== undefined ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AttachMoney sx={{ fontSize: 16, color: "success.main" }} />
            <Typography variant="body2" fontWeight={600} color="success.main">
              {value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      id: "original_price",
      label: "Original Price",
      minWidth: 120,
      format: (value: any, row: any) =>
        value !== null && value !== undefined ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textDecoration: value !== row.price ? "line-through" : "none",
            }}
          >
            ${value}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      id: "discount",
      label: "Discount",
      minWidth: 100,
      format: (_: any, row: any) => {
        const originalPrice = parseFloat(row.original_price) || 0;
        const currentPrice = parseFloat(row.price) || 0;
        const discountPercent =
          originalPrice > 0
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        return discountPercent > 0 ? (
          <Chip
            label={`${discountPercent}% OFF`}
            size="small"
            sx={{
              backgroundColor: theme.palette.error.light + "22",
              color: theme.palette.error.main,
              fontWeight: 600,
              borderRadius: 2,
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No discount
          </Typography>
        );
      },
    },
    {
      id: "availability",
      label: "Available",
      minWidth: 100,
      format: (value: any) => (
        <Chip
          label={value ? "Available" : "Unavailable"}
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
      id: "visibility",
      label: "Visible",
      minWidth: 100,
      format: (value: any) => (
        <Chip
          icon={
            value ? (
              <Visibility sx={{ fontSize: 16 }} />
            ) : (
              <VisibilityOff sx={{ fontSize: 16 }} />
            )
          }
          label={value ? "Public" : "Hidden"}
          size="small"
          variant={value ? "filled" : "outlined"}
          color={value ? "info" : "default"}
          sx={{ borderRadius: 2 }}
        />
      ),
    },
    {
      id: "is_favourite",
      label: "Favourite",
      minWidth: 100,
      format: (value: any) => (
        <IconButton size="small" disabled>
          <Favorite
            sx={{
              fontSize: 20,
              color: value ? "#ef4444" : "#d1d5db",
            }}
          />
        </IconButton>
      ),
    },
  ];
  const clearFilters = () => {
    setCategoryFilter("all");
    setAvailabilityFilter("all");
    setVisibilityFilter("all");
    setFavouriteFilter("all");
    setSearchQuery("");
  };

  const handleToggleAvailability = async (item: Item) => {
    try {
      console.log(
        "🔄 Toggling availability for item:",
        item.id,
        "Current:",
        item.availability
      );
      const updatedData = {
        availability: !item.availability,
      };
      await itemService.update(item.id, updatedData);
      showSnackbar(
        `Item ${
          item.availability ? "marked as unavailable" : "marked as available"
        }`,
        "success"
      );
      fetchItems();
    } catch (error) {
      console.error("❌ Error toggling availability:", error);
      showSnackbar("Error updating item availability", "error");
    }
  };

  const handleToggleVisibility = async (item: Item) => {
    try {
      console.log(
        "🔄 Toggling visibility for item:",
        item.id,
        "Current:",
        item.visibility
      );
      const updatedData = {
        visibility: !item.visibility,
      };
      await itemService.update(item.id, updatedData);
      showSnackbar(
        `Item ${item.visibility ? "hidden" : "made visible"}`,
        "success"
      );
      fetchItems();
    } catch (error) {
      console.error("❌ Error toggling visibility:", error);
      showSnackbar("Error updating item visibility", "error");
    }
  };

  const handleToggleFavourite = async (item: Item) => {
    try {
      console.log(
        "🔄 Toggling favourite for item:",
        item.id,
        "Current:",
        item.is_favourite
      );
      const updatedData = {
        is_favourite: !item.is_favourite,
      };
      await itemService.update(item.id, updatedData);
      showSnackbar(
        `Item ${
          item.is_favourite ? "removed from favourites" : "added to favourites"
        }`,
        "success"
      );
      fetchItems();
    } catch (error) {
      console.error("❌ Error toggling favourite:", error);
      showSnackbar("Error updating item favourite status", "error");
    }
  };

  // ...existing code...

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
            Menu Items Management
          </Typography>{" "}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setAddDialogOpen(true);
            }}
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
            Add Item
          </Button>
        </Box>
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items..."
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
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  label="Availability"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="unavailable">Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  label="Visibility"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="visible">Visible</MenuItem>
                  <MenuItem value="hidden">Hidden</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Favourites</InputLabel>
                <Select
                  value={favouriteFilter}
                  onChange={(e) => setFavouriteFilter(e.target.value)}
                  label="Favourites"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="favourite">Favourites</MenuItem>
                  <MenuItem value="regular">Regular</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>{" "}
        {/* Data Table */}{" "}
        <ModernTable
          columns={columns}
          data={items}
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
            {
              id: "toggle-visibility",
              label: "Toggle Visibility",
              icon: <Visibility />,
              onClick: handleToggleVisibility,
              color: "primary",
            },
            {
              id: "toggle-favourite",
              label: "Toggle Favourite",
              icon: <Favorite />,
              onClick: handleToggleFavourite,
              color: "secondary",
            },
          ]}
          title="Items"
          emptyMessage="No items found"
        />{" "}
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
        >
          <DialogTitle>
            {addDialogOpen ? "Add New Item" : "Edit Item"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Original Price (Optional)"
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  helperText="Leave empty if no pricing needed"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Discount % (Optional)"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                  helperText="Final price will be calculated automatically if original price is provided"
                />
              </Grid>
              {/* Price field is hidden - calculated automatically from original_price and discount */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                  Images
                </Typography>
                <input
                  accept="image/*"
                  id="image-upload"
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleImageSelect}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    sx={{
                      borderRadius: 2,
                      mr: 2,
                      py: 1.5,
                      width: "auto",
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                    }}
                  >
                    Upload Images
                  </Button>
                </label>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {imagePreviews.map((preview, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: "relative",
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid " + theme.palette.divider,
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          bgcolor: "white",
                          "&:hover": {
                            bgcolor: theme.palette.error.main + " !important",
                            color: "white",
                          },
                        }}
                        onClick={() => removeImagePreview(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                {editDialogOpen && (
                  <Box sx={{ mt: 2 }}>
                    {formData.images.map((image, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          overflow: "hidden",
                          border: "1px solid " + theme.palette.divider,
                        }}
                      >
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "white",
                            "&:hover": {
                              bgcolor: theme.palette.error.main + " !important",
                              color: "white",
                            },
                          }}
                          onClick={() => removeExistingImage(image, index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAddDialogOpen(false);
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>{" "}
            <Button variant="contained" onClick={handleSave}>
              {addDialogOpen ? "Add" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => {
            setViewDialogOpen(false);
            setSelectedItem(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Item Details</DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedItem.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedItem.description}
                </Typography>
                <Typography variant="body1">
                  <strong>Category:</strong>{" "}
                  {getCategoryName(selectedItem.categoryId)}
                </Typography>
                <Typography variant="body1">
                  <strong>Price:</strong> ${selectedItem.price}
                </Typography>
                <Typography variant="body1">
                  <strong>Original Price:</strong> $
                  {selectedItem.original_price}
                </Typography>
                <Typography variant="body1">
                  <strong>Available:</strong>{" "}
                  {selectedItem.availability ? "Yes" : "No"}
                </Typography>
                <Typography variant="body1">
                  <strong>Visible:</strong>{" "}
                  {selectedItem.visibility ? "Yes" : "No"}
                </Typography>
                <Typography variant="body1">
                  <strong>Favourite:</strong>{" "}
                  {selectedItem.is_favourite ? "Yes" : "No"}
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>Last Edited By:</strong>{" "}
                  {selectedItem.lastEditedByAdmin?.email || "System"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Created:</strong>{" "}
                  {new Date(selectedItem.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Last Updated:</strong>{" "}
                  {new Date(selectedItem.updated_at).toLocaleString()}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setViewDialogOpen(false);
                setSelectedItem(null);
              }}
            >
              Close
            </Button>{" "}
          </DialogActions>
        </Dialog>
        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDialogOpen}
          title="Delete Item"
          message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setConfirmDialogOpen(false);
            setItemToDelete(null);
          }}
        />
      </Box>
    </motion.div>
  );
};
