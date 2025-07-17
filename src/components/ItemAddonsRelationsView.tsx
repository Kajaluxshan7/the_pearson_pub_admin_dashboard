import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  Paper,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { motion } from "framer-motion";
import { ModernTable } from "./ModernTable";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ItemAddonsRelation, Item, Addon } from "../services/api";
import {
  itemAddonsRelationService,
  itemService,
  addonService,
} from "../services/api";

interface ItemAddonsRelationsViewProps {}

interface CreateItemAddonsRelationForm {
  itemId: string;
  addonId: string;
}

const ItemAddonsRelationsView: React.FC<ItemAddonsRelationsViewProps> = () => {
  const [relations, setRelations] = useState<ItemAddonsRelation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (severity: "success" | "error", message: string) => {
    setSnackbar({ open: true, message, severity });
  };

  // Form states
  const [createForm, setCreateForm] = useState<CreateItemAddonsRelationForm>({
    itemId: "",
    addonId: "",
  });
  // Fetch data
  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchTerm]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [relationsData, itemsData, addonsData] = await Promise.all([
        itemAddonsRelationService.getAll(page, pageSize), // Get relations with pagination
        itemService.getAll(1, 1000), // Get all items
        addonService.getAll(1, 1000), // Get all addons
      ]);

      let filteredRelations = relationsData.data;
      let filteredTotal = relationsData.total;

      // Apply client-side search if searchTerm exists
      if (searchTerm) {
        filteredRelations = relationsData.data.filter((relation) => {
          const itemName = getItemName(relation.itemId, relation).toLowerCase();
          const addonName = getAddonName(
            relation.addonId,
            relation
          ).toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          return (
            itemName.includes(searchLower) || addonName.includes(searchLower)
          );
        });
        filteredTotal = filteredRelations.length;
      }

      setRelations(filteredRelations);
      setTotal(filteredTotal);
      setItems(itemsData.data);
      setAddons(addonsData.data);
    } catch (err) {
      showAlert("error", "Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getItemName = (itemId: string, relation?: ItemAddonsRelation) => {
    // First check if the relation has the full item object
    if (relation?.item?.name) {
      return relation.item.name;
    }
    // Fallback to searching in items array
    const item = items.find((i) => i.id === itemId);
    return item ? item.name : `Item #${itemId}`;
  };

  const getAddonName = (addonId: string, relation?: ItemAddonsRelation) => {
    // First check if the relation has the full addon object
    if (relation?.addon?.name) {
      return relation.addon.name;
    }
    // Fallback to searching in addons array
    const addon = addons.find((a) => a.id === addonId);
    return addon ? addon.name : `Addon #${addonId}`;
  };

  // CRUD operations
  const handleCreate = async () => {
    try {
      const newRelation = await itemAddonsRelationService.create(createForm);
      setRelations([...relations, newRelation]);
      setIsCreateDialogOpen(false);
      setCreateForm({
        itemId: "",
        addonId: "",
      });
      showAlert("success", "Item-addon relation created successfully");
    } catch (err) {
      showAlert("error", "Failed to create item-addon relation");
      console.error("Error creating relation:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await itemAddonsRelationService.delete(id);
      setRelations(relations.filter((r) => r.id !== id));
      setConfirmDialog({ ...confirmDialog, open: false });
      showAlert("success", "Item-addon relation deleted successfully");
    } catch (err) {
      showAlert("error", "Failed to delete item-addon relation");
      console.error("Error deleting relation:", err);
    }
  };

  // Event handlers
  const openDeleteConfirm = (relation: ItemAddonsRelation) => {
    setConfirmDialog({
      open: true,
      title: "Delete Item-Addon Relation",
      message: `Are you sure you want to delete the relation between "${getItemName(
        relation.itemId
      )}" and "${getAddonName(relation.addonId)}"?`,
      onConfirm: () => handleDelete(relation.id),
    });
  };

  // Table configuration
  const columns = [
    {
      id: "rowNumber",
      key: "rowNumber",
      label: "#",
      sortable: false,
      render: (_: any, index: number) => index + 1,
    },
    {
      id: "itemId",
      key: "itemId",
      label: "Item",
      sortable: true,
      render: (value: any, _index: number, rowData: ItemAddonsRelation) => (
        <Typography variant="body2" fontWeight={600}>
          {getItemName(value, rowData)}
        </Typography>
      ),
    },
    {
      id: "addonId",
      key: "addonId",
      label: "Addon",
      sortable: true,
      render: (value: any, _index: number, rowData: ItemAddonsRelation) => (
        <Typography variant="body2" fontWeight={600}>
          {getAddonName(value, rowData)}
        </Typography>
      ),
    },
    {
      id: "lastEditedByAdmin",
      key: "lastEditedByAdmin",
      label: "Last Edited By",
      sortable: false,
      render: (value: any) => (
        <Typography variant="body2" color="text.secondary">
          {value?.email || "System"}
        </Typography>
      ),
    },
    {
      id: "createdAt",
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Loading item-addon relations...</Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            Item-Addon Relations
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Add Relation
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by item or addon name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        </Paper>

        {/* Table */}
        <ModernTable
          data={relations}
          columns={columns}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onDelete={openDeleteConfirm}
          emptyMessage="No item-addon relations found"
        />
        {/* Create Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Item-Addon Relation</DialogTitle>
          <DialogContent>
            <Box
              sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>Item</InputLabel>
                <Select
                  value={createForm.itemId}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      itemId: e.target.value as string,
                    })
                  }
                  label="Item"
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Addon</InputLabel>
                <Select
                  value={createForm.addonId}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      addonId: e.target.value as string,
                    })
                  }
                  label="Addon"
                >
                  {addons.map((addon) => (
                    <MenuItem key={addon.id} value={addon.id}>
                      {addon.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              variant="contained"
              disabled={!createForm.itemId || !createForm.addonId}
            >
              Create
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
      </Box>
    </motion.div>
  );
};

export default ItemAddonsRelationsView;
