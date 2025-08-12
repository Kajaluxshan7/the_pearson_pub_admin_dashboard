import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Typography,
  IconButton,
  useTheme,
  styled,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Sort,
} from "@mui/icons-material";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[50],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    cursor: "pointer",
    transform: "translateY(-1px)",
    boxShadow: theme.shadows[2],
    transition: "all 0.2s ease-in-out",
  },
  "& .MuiTableCell-root": {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5),
  },
}));

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "left" | "center";
  format?: (value: any, row?: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface CustomAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  color?:
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning";
  hidden?: (row: any) => boolean;
}

interface EnhancedModernTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  customActions?: CustomAction[];
  canEdit?: (row: any) => boolean;
  canDelete?: (row: any) => boolean;
  canView?: (row: any) => boolean;
  title?: string;
  emptyMessage?: string;
  showFilters?: boolean;
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

export const EnhancedModernTable: React.FC<EnhancedModernTableProps> = ({
  columns,
  data,
  loading = false,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  customActions = [],
  canEdit = () => true,
  canDelete = () => true,
  canView = () => true,
  title,
  emptyMessage = "No data available",
  showFilters = false,
  onSort,
  sortColumn,
  sortDirection = "asc",
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleAction = (action: string) => {
    if (!selectedRow) return;

    switch (action) {
      case "edit":
        onEdit?.(selectedRow);
        break;
      case "delete":
        onDelete?.(selectedRow);
        break;
      case "view":
        onView?.(selectedRow);
        break;
    }
    handleMenuClose();
  };

  const handleCustomAction = (customAction: CustomAction) => {
    if (!selectedRow) return;
    customAction.onClick(selectedRow);
    handleMenuClose();
  };

  const handleSort = (columnId: string) => {
    if (onSort) {
      const newDirection =
        sortColumn === columnId && sortDirection === "asc" ? "desc" : "asc";
      onSort(columnId, newDirection);
    }
  };

  const getAvailableActions = (row: any) => {
    const actions = [];

    if (onView && canView(row)) {
      actions.push({
        id: "view",
        label: "View Details",
        icon: <Visibility />,
        color: "primary",
      });
    }

    if (onEdit && canEdit(row)) {
      actions.push({
        id: "edit",
        label: "Edit",
        icon: <Edit />,
        color: "primary",
      });
    }

    if (onDelete && canDelete(row)) {
      actions.push({
        id: "delete",
        label: "Delete",
        icon: <Delete />,
        color: "error",
      });
    }

    // Add custom actions that are not hidden
    customActions.forEach((action) => {
      if (!action.hidden || !action.hidden(row)) {
        actions.push(action);
      }
    });

    return actions;
  };

  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: pageSize }).map((_, index) => (
        <StyledTableRow key={index}>
          {columns.map((column) => (
            <TableCell key={column.id}>
              <Skeleton variant="text" height={20} />
            </TableCell>
          ))}
          <TableCell>
            <Skeleton variant="circular" width={24} height={24} />
          </TableCell>
        </StyledTableRow>
      ))}
    </>
  );

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading data..."
              : "Try adjusting your filters or adding new items."}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        background: theme.palette.background.paper,
      }}
    >
      {title && (
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`${total} total`}
                size="small"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              {showFilters && (
                <Tooltip title="Filters">
                  <IconButton size="small">
                    <FilterList />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <StyledTableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    {column.label}
                    {column.sortable && onSort && (
                      <IconButton
                        size="small"
                        onClick={() => handleSort(column.id)}
                        sx={{
                          opacity: sortColumn === column.id ? 1 : 0.5,
                          transform:
                            sortColumn === column.id && sortDirection === "desc"
                              ? "rotate(180deg)"
                              : "none",
                        }}
                      >
                        <Sort fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </StyledTableCell>
              ))}
              <StyledTableCell align="center" style={{ width: 60 }}>
                Actions
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : data.length === 0 ? (
              <EmptyState />
            ) : (
              data.map((row, index) => {
                const availableActions = getAvailableActions(row);
                return (
                  <StyledTableRow hover key={row.id || index}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      {availableActions.length > 0 && (
                        <>
                          <Badge
                            badgeContent={availableActions.length}
                            color="primary"
                            invisible={availableActions.length <= 1}
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, row)}
                              sx={{
                                "&:hover": {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Badge>
                        </>
                      )}
                    </TableCell>
                  </StyledTableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 15, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(event) => onPageSizeChange(+event.target.value)}
        sx={{
          borderTop: 1,
          borderColor: "divider",
          backgroundColor: theme.palette.background.default,
        }}
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 160,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        {selectedRow &&
          getAvailableActions(selectedRow).map((action) => (
            <MenuItem
              key={action.id}
              onClick={() => {
                if (["edit", "delete", "view"].includes(action.id)) {
                  handleAction(action.id);
                } else {
                  handleCustomAction(action as CustomAction);
                }
              }}
              sx={{
                color: action.color === "error" ? "error.main" : "inherit",
                "&:hover": {
                  backgroundColor:
                    action.color === "error" ? "error.light" : "action.hover",
                  color:
                    action.color === "error" ? "error.contrastText" : "inherit",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: action.color === "error" ? "error.main" : "inherit",
                }}
              >
                {action.icon}
              </ListItemIcon>
              <ListItemText primary={action.label} />
            </MenuItem>
          ))}
      </Menu>
    </Paper>
  );
};
