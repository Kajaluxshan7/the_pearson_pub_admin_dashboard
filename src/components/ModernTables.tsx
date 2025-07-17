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
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit,
  Delete,
  Visibility,
} from "@mui/icons-material";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: "0.875rem",
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    cursor: "pointer",
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
  format?: (value: any, row?: any) => string | React.ReactNode;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  onClick: (item: any) => void;
  hidden?: (item: any) => boolean;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
}

interface ModernTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  customActions?: ActionItem[];
  canEdit?: (item: any) => boolean;
  canDelete?: (item: any) => boolean;
  showActions?: boolean;
  hideRowNumbers?: boolean;
  title?: string;
  emptyMessage?: string;
}

export const ModernTable: React.FC<ModernTableProps> = ({
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
  showActions = true,
  hideRowNumbers = false,
  title,
  emptyMessage = "No data available",
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleActionClick = (
    event: React.MouseEvent<HTMLElement>,
    item: any
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    handleActionClose();
  };
  const renderLoadingRows = () => {
    return Array.from({ length: pageSize }).map((_, index) => (
      <StyledTableRow key={index}>
        {!hideRowNumbers && (
          <TableCell>
            <Skeleton variant="text" width="30px" height={20} />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell key={column.id} style={{ minWidth: column.minWidth }}>
            <Skeleton
              variant="rectangular"
              width="85%"
              height={16}
              sx={{
                borderRadius: 1,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.08)",
              }}
            />
          </TableCell>
        ))}
        {showActions && (
          <TableCell align="center" sx={{ width: 60 }}>
            <Skeleton variant="circular" width={32} height={32} />
          </TableCell>
        )}
      </StyledTableRow>
    ));
  };

  const renderActionCell = (row: any) => {
    const actions = [];

    // Add standard actions
    if (onView) {
      actions.push({
        id: "view",
        label: "View Details",
        icon: <Visibility fontSize="small" />,
        onClick: () => onView(row),
        color: "info" as const,
      });
    }

    if (onEdit && canEdit(row)) {
      actions.push({
        id: "edit",
        label: "Edit",
        icon: <Edit fontSize="small" />,
        onClick: () => onEdit(row),
        color: "primary" as const,
      });
    }

    if (onDelete && canDelete(row)) {
      actions.push({
        id: "delete",
        label: "Delete",
        icon: <Delete fontSize="small" />,
        onClick: () => onDelete(row),
        color: "error" as const,
      });
    }

    // Add custom actions
    customActions.forEach((action) => {
      if (!action.hidden || !action.hidden(row)) {
        actions.push(action);
      }
    });

    if (actions.length === 0) return null;

    return (
      <TableCell align="center" sx={{ width: 60 }}>
        <IconButton
          size="small"
          onClick={(e) => handleActionClick(e, row)}
          sx={{
            color: theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </TableCell>
    );
  };

  const getMenuActions = () => {
    if (!selectedItem) return [];

    const actions = [];

    // Add standard actions
    if (onView) {
      actions.push({
        id: "view",
        label: "View Details",
        icon: <Visibility fontSize="small" />,
        onClick: () => handleMenuAction(() => onView(selectedItem)),
        color: "info" as const,
      });
    }

    if (onEdit && canEdit(selectedItem)) {
      actions.push({
        id: "edit",
        label: "Edit",
        icon: <Edit fontSize="small" />,
        onClick: () => handleMenuAction(() => onEdit(selectedItem)),
        color: "primary" as const,
      });
    }

    if (onDelete && canDelete(selectedItem)) {
      actions.push({
        id: "delete",
        label: "Delete",
        icon: <Delete fontSize="small" />,
        onClick: () => handleMenuAction(() => onDelete(selectedItem)),
        color: "error" as const,
      });
    }

    // Add custom actions
    customActions.forEach((action) => {
      if (!action.hidden || !action.hidden(selectedItem)) {
        actions.push({
          ...action,
          onClick: () => handleMenuAction(() => action.onClick(selectedItem)),
        });
      }
    });

    return actions;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {title && (
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TableContainer
          sx={{
            flex: 1,
            maxHeight: 400,
            minHeight: 200,
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: theme.palette.grey[100],
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[400],
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: theme.palette.grey[600],
              },
            },
            // Hide horizontal scrollbar to prevent side scrolling
            overflowX: "auto",
            overflowY: "auto",
            scrollbarGutter: "stable",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {!hideRowNumbers && (
                  <StyledTableCell align="center" style={{ width: 60 }}>
                    No.
                  </StyledTableCell>
                )}
                {columns.map((column) => (
                  <StyledTableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </StyledTableCell>
                ))}
                {showActions && (
                  <StyledTableCell align="center" style={{ width: 60 }}>
                    Actions
                  </StyledTableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                renderLoadingRows()
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length +
                      (!hideRowNumbers ? 1 : 0) +
                      (showActions ? 1 : 0)
                    }
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <StyledTableRow key={row.id || index}>
                    {!hideRowNumbers && (
                      <TableCell
                        align="center"
                        sx={{ width: 60, color: "text.secondary" }}
                      >
                        {page * pageSize + index + 1}
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {column.format
                          ? column.format(row[column.id], row)
                          : row[column.id]}
                      </TableCell>
                    ))}
                    {showActions && renderActionCell(row)}
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(event) =>
            onPageSizeChange(parseInt(event.target.value, 10))
          }
          sx={{
            borderTop: 1,
            borderColor: "divider",
            "& .MuiTablePagination-toolbar": {
              paddingX: 2,
            },
          }}
        />
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 180,
            mt: 1,
            borderRadius: 2,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              "&:last-child": {
                mb: 1,
              },
            },
          },
        }}
      >
        {" "}
        {getMenuActions().map((action) => (
          <MenuItem
            key={action.id}
            onClick={action.onClick}
            sx={{
              color: action.color
                ? theme.palette[action.color].main
                : theme.palette.text.primary,
              "&:hover": {
                backgroundColor: action.color
                  ? theme.palette[action.color].light + "20"
                  : theme.palette.action.hover,
                color: action.color
                  ? theme.palette[action.color].main
                  : theme.palette.text.primary,
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText
              primary={action.label}
              primaryTypographyProps={{
                sx: {
                  color: "inherit",
                  fontWeight: 500,
                },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};
