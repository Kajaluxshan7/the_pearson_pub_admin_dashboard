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
} from "@mui/material";
import {
  Add,
  Search,
  Clear,
  LocalOffer,
  AttachMoney,
  ContentCopy,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { addonService, itemService } from "../services/api";
import type { Addon, Item, PaginatedResponse } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";
import Grid from "@mui/material/GridLegacy";

interface AddonsViewModernProps {
  userRole: "admin" | "superadmin";
}

const AddonsViewModern: React.FC<AddonsViewModernProps> = ({ userRole }) => {
  const theme = useTheme();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    itemId: "",
    category_type: "",
  });

  // Feedback states
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchAddons();
    fetchItems();
  }, [paginationModel, searchTerm, selectedItem]);

  useEffect(() => {
    fetchAddonCount();
  }, []);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Addon> = await addonService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize,
        selectedItem || undefined
      );
      setAddons(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Error fetching addons:", error);
      showAlert("error", "Failed to fetch addons");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response: PaginatedResponse<Item> = await itemService.getAll(
        1,
        100
      );
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchAddonCount = async () => {
    try {
      const count = await addonService.getCount();
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching addon count:", error);
    }
  };

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAddAddon = async () => {
    try {
      await addonService.create({
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        itemId: formData.itemId,
        category_type: formData.category_type,
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchAddons();
      fetchAddonCount();
      showAlert("success", "Addon created successfully");
    } catch (error) {
      console.error("Error creating addon:", error);
      showAlert("error", "Failed to create addon");
    }
  };

  const handleEditAddon = async () => {
    if (!selectedAddon) return;
    try {
      await addonService.update(selectedAddon.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        itemId: formData.itemId,
        category_type: formData.category_type,
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchAddons();
      showAlert("success", "Addon updated successfully");
    } catch (error) {
      console.error("Error updating addon:", error);
      showAlert("error", "Failed to update addon");
    }
  };
  const handleDeleteAddon = (addon: Addon) => {
    setAddonToDelete(addon);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteAddon = async () => {
    if (!addonToDelete) return;

    try {
      await addonService.delete(addonToDelete.id);
      fetchAddons();
      fetchAddonCount();
      showAlert("success", "Addon deleted successfully");
      setConfirmDeleteOpen(false);
      setAddonToDelete(null);
    } catch (error) {
      console.error("Error deleting addon:", error);
      showAlert("error", "Failed to delete addon");
    }
  };

  const handleDuplicateAddon = async (addon: Addon) => {
    try {
      const duplicatedAddon = {
        name: `${addon.name} (Copy)`,
        price: addon.price,
        description: addon.description,
        itemId: addon.itemId,
        category_type: addon.category_type,
      };

      await addonService.create(duplicatedAddon);
      showAlert("success", `Addon "${addon.name}" has been duplicated`);
      fetchAddons();
    } catch (error) {
      console.error("Error duplicating addon:", error);
      showAlert("error", "Failed to duplicate addon");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      itemId: "",
      category_type: "",
    });
    setSelectedAddon(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormData({
      name: addon.name,
      price: addon.price.toString(),
      description: addon.description || "",
      category_type: addon.category_type || "",
      itemId: addon.itemId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (addon: Addon) => {
    openEditModal(addon);
  };
  const handleDelete = (addon: Addon) => {
    handleDeleteAddon(addon);
  };
  const handleView = (addon: Addon) => {
    setSelectedAddon(addon);
    setViewDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedItem("");
  };
  const columns = [
    {
      id: "name",
      label: "Name",
      minWidth: 150,
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
      id: "price",
      label: "Price",
      minWidth: 120,
      format: (value: any) => {
        const numValue = typeof value === "number" ? value : parseFloat(value);
        const displayValue = isNaN(numValue)
          ? "$0.00"
          : `$${numValue.toFixed(2)}`;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AttachMoney sx={{ fontSize: 16, color: "success.main" }} />
            <Typography variant="body2" fontWeight={600} color="success.main">
              {displayValue}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "description",
      label: "Description",
      minWidth: 200,
      format: (value: any) => (
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
      id: "category_type",
      label: "Category Type",
      minWidth: 150,
      format: (value: any) =>
        value ? (
          <Chip label={value} size="small" variant="outlined" color="primary" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not set
          </Typography>
        ),
    },
    {
      id: "created_at",
      label: "Created",
      minWidth: 150,
      format: (value: any) => new Date(value).toLocaleDateString(),
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
              <LocalOffer sx={{ mr: 1, verticalAlign: "middle" }} />
              Addons Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total addons: {totalCount}
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
              Add Addon
            </Button>
          )}
        </Box>
        {/* Alert */}
        {alert && (
          <Alert
            severity={alert.type}
            sx={{ mb: 2 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}
        {/* Filters */}
        <Card
          elevation={0}
          sx={{ mb: 3, backgroundColor: theme.palette.grey[50] }}
        >
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                label="Search addons"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "action.active" }} />
                  ),
                }}
                sx={{ minWidth: 250 }}
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Item</InputLabel>
                <Select
                  value={selectedItem}
                  label="Filter by Item"
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  <MenuItem value="">All Items</MenuItem>
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {(searchTerm || selectedItem) && (
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
              data={addons}
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
                  id: "duplicate-addon",
                  label: "Duplicate",
                  icon: <ContentCopy />,
                  onClick: handleDuplicateAddon,
                  color: "secondary",
                },
              ]}
              canEdit={() => userRole === "admin" || userRole === "superadmin"}
              canDelete={() =>
                userRole === "admin" || userRole === "superadmin"
              }
              title="Addons"
              emptyMessage="No addons found"
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
            {isAddModalOpen ? "Add New Addon" : "Edit Addon"}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Name"
                variant="outlined"
                fullWidth
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <TextField
                label="Price"
                variant="outlined"
                fullWidth
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                inputProps={{ step: 0.01, min: 0 }}
              />

              <FormControl fullWidth required>
                <InputLabel>Item</InputLabel>
                <Select
                  value={formData.itemId}
                  label="Item"
                  onChange={(e) =>
                    setFormData({ ...formData, itemId: e.target.value })
                  }
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Category Type"
                variant="outlined"
                fullWidth
                value={formData.category_type}
                onChange={(e) =>
                  setFormData({ ...formData, category_type: e.target.value })
                }
              />

              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
              onClick={isAddModalOpen ? handleAddAddon : handleEditAddon}
              disabled={!formData.name || !formData.price || !formData.itemId}
            >
              {isAddModalOpen ? "Add" : "Update"}
            </Button>{" "}
          </DialogActions>
        </Dialog>{" "}
        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Delete Addon"
          message={`Are you sure you want to delete the addon "${addonToDelete?.name}"? This action cannot be undone.`}
          onConfirm={confirmDeleteAddon}
          onCancel={() => {
            setConfirmDeleteOpen(false);
            setAddonToDelete(null);
          }}
        />
        {/* View Addon Details Dialog */}
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
          {selectedAddon && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    <LocalOffer fontSize="large" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {selectedAddon.name}
                    </Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      <Chip
                        label={`$${selectedAddon.price}`}
                        color="success"
                        size="small"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      />
                      {selectedAddon.itemId &&
                        (() => {
                          const associatedItem = items.find(
                            (item) => item.id === selectedAddon.itemId
                          );
                          return associatedItem ? (
                            <Chip
                              label={associatedItem.name}
                              color="primary"
                              variant="outlined"
                              size="small"
                              sx={{
                                fontWeight: 500,
                                borderRadius: 2,
                              }}
                            />
                          ) : null;
                        })()}
                    </Box>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ px: 3, pb: 3 }}>
                <Grid container spacing={3}>
                  {/* Left Column - Basic Info */}
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
                        Basic Information
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Name
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedAddon.name}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Price
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AttachMoney color="success" fontSize="small" />
                          <Typography
                            variant="h6"
                            color="success.main"
                            fontWeight={700}
                          >
                            ${selectedAddon.price}
                          </Typography>
                        </Box>
                      </Box>

                      {selectedAddon.description && (
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={500}
                            mb={1}
                          >
                            Description
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {selectedAddon.description}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Right Column - Item Association & Details */}
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
                        Association & Details
                      </Typography>

                      {selectedAddon.itemId &&
                        (() => {
                          const associatedItem = items.find(
                            (item) => item.id === selectedAddon.itemId
                          );
                          return associatedItem ? (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight={500}
                                mb={1}
                              >
                                Associated Item
                              </Typography>
                              <Chip
                                label={associatedItem.name}
                                color="primary"
                                sx={{
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  px: 1,
                                }}
                              />
                            </Box>
                          ) : null;
                        })()}

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
                            selectedAddon.created_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
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
                            selectedAddon.updated_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
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
      </Paper>
    </motion.div>
  );
};

export default AddonsViewModern;
