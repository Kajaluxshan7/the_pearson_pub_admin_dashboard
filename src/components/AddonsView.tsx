import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Add, Edit, Delete, Visibility } from "@mui/icons-material";
import { motion } from "framer-motion";

export const AddonsView: React.FC = () => {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [addons] = useState([
    {
      id: 1,
      name: "Extra Chips",
      price: 3.99,
      item: "Fish & Chips",
      category_type: "Side",
      created_at: "2024-01-15",
    },
    {
      id: 2,
      name: "Mushy Peas",
      price: 2.5,
      item: "Fish & Chips",
      category_type: "Side",
      created_at: "2024-01-20",
    },
    {
      id: 3,
      name: "Tartar Sauce",
      price: 1.5,
      item: "Fish & Chips",
      category_type: "Sauce",
      created_at: "2024-02-01",
    },
  ]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "name",
      headerName: "Addon Name",
      width: 200,
      flex: 1,
    },
    {
      field: "item",
      headerName: "For Item",
      width: 150,
    },
    {
      field: "category_type",
      headerName: "Type",
      width: 100,
    },
    {
      field: "price",
      headerName: "Price",
      width: 100,
      valueFormatter: (value) => `$${value}`,
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 120,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleView(params.row)}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            sx={{ color: "error.main" }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleView = (addon: any) => {
    setSnackbar({
      open: true,
      message: `Viewing addon: ${addon.name}`,
      severity: "success",
    });
  };

  const handleEdit = (addon: any) => {
    setSnackbar({
      open: true,
      message: `Editing addon: ${addon.name}`,
      severity: "success",
    });
  };

  const handleDelete = (addon: any) => {
    setSnackbar({
      open: true,
      message: `Deleting addon: ${addon.name}`,
      severity: "error",
    });
  };

  const handleAdd = () => {
    setSnackbar({
      open: true,
      message: "Opening add addon dialog",
      severity: "success",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
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
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            Addons Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Add Addon
          </Button>
        </Box>

        <Paper sx={{ width: "100%", mb: 2 }}>
          <DataGrid
            rows={addons}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              border: 0,
              "& .MuiDataGrid-cell:hover": {
                color: theme.palette.primary.main,
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          />
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};
