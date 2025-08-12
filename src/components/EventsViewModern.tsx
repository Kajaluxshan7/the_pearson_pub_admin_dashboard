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
  Chip,
  Skeleton,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Add,
  Search,
  Clear,
  Event as EventIcon,
  CalendarToday,
  PlayArrow,
  Stop,
  Schedule,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { eventService } from "../services/api";
import type { Event, PaginatedResponse } from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";
import { AdminTimeUtil } from "../utils/timezone-luxon";
import { useNotification } from "../hooks/useNotification";

interface EventsViewModernProps {
  userRole: "admin" | "superadmin";
}

const EventsViewModern: React.FC<EventsViewModernProps> = ({ userRole }) => {
  const theme = useTheme();
  const { showError, showSuccess, } = useNotification();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    images: [] as string[],
  });

  // Image upload states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [rescheduleData, setRescheduleData] = useState({
    start_date: "",
    end_date: "",
  });

  // Remove legacy snackbar state - now using useNotification

  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true);
      const dateRange =
        startDate && endDate ? { startDate, endDate } : undefined;
      const response: PaginatedResponse<Event> = await eventService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize,
        dateRange,
        searchTerm || undefined
      );
      setEvents(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Error fetching events:", error);
      showError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, searchTerm, startDate, endDate, showError]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchEventCount = React.useCallback(async () => {
    try {
      const count = await eventService.getCount();
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching event count:", error);
      showError(error as Error);
    }
  }, [showError]);

  useEffect(() => {
    fetchEventCount();
  }, [fetchEventCount]);

  // Remove legacy showAlert function - now using useNotification exclusively

  const handleAddEvent = async () => {
    try {
      let uploadedImageUrls: string[] = [];

      // Upload new images if any
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages(imageFiles);
      }

      // Combine existing URLs with uploaded URLs
      const allImageUrls = [...formData.images, ...uploadedImageUrls];

      await eventService.create({
        name: formData.name,
        description: formData.description,
        start_date: AdminTimeUtil.parseFromDateTimeInput(formData.start_date),
        end_date: AdminTimeUtil.parseFromDateTimeInput(formData.end_date),
        images: allImageUrls,
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchEvents();
      fetchEventCount();
      showSuccess("Event created successfully");
    } catch (error) {
      console.error("Error creating event:", error);
      showError(error as Error);
    }
  };

  const handleEditEvent = async () => {
    if (!selectedEvent) return;
    try {
      let uploadedImageUrls: string[] = [];

      // Upload new images if any
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages(imageFiles);
      }

      // Combine existing URLs with uploaded URLs
      const allImageUrls = [...formData.images, ...uploadedImageUrls];

      await eventService.update(selectedEvent.id, {
        name: formData.name,
        description: formData.description,
        start_date: AdminTimeUtil.parseFromDateTimeInput(formData.start_date),
        end_date: AdminTimeUtil.parseFromDateTimeInput(formData.end_date),
        images: allImageUrls,
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchEvents();
      showSuccess("Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      showError(error as Error);
    }
  };
  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await eventService.delete(eventToDelete.id);
      fetchEvents();
      fetchEventCount();
      showSuccess("Event deleted successfully");
      setConfirmDeleteOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      showError(error as Error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      images: [],
    });
    setSelectedEvent(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    // Validate total number of images (existing + new)
    if (imageFiles.length + newFiles.length > 5) {
      showError(new Error("Maximum 5 images allowed"));
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      // Check file size (1MB max)
      if (file.size > 1024 * 1024) {
        errors.push(`${file.name} exceeds 1MB limit`);
        continue;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        errors.push(
          `${file.name} is not a valid image type (allowed: JPEG, PNG, GIF, WebP)`
        );
        continue;
      }

      validFiles.push(file);
    }

    // Show validation errors if any
    if (errors.length > 0) {
      showError(new Error(errors.join(", ")));
    }

    // Process valid files
    if (validFiles.length > 0) {
      const newPreviews: string[] = [];
      let processedCount = 0;

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string);
          processedCount++;

          if (processedCount === validFiles.length) {
            setImageFiles((prev) => [...prev, ...validFiles]);
            setImagePreviews((prev) => [...prev, ...newPreviews]);

            if (validFiles.length > 0) {
              showSuccess(`${validFiles.length} image(s) selected successfully`);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Clear the input
    event.target.value = "";
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    // Validate number of files
    if (files.length > 5) {
      throw new Error("Maximum 5 images allowed");
    }

    // Validate each file
    for (const file of files) {
      // Check file size (1MB max)
      if (file.size > 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds 1MB limit`);
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File ${file.name} is not a valid image type`);
      }
    }

    try {
      const result = await eventService.uploadImages(files);
      // Use signed URLs if available for better security
      return result.signedUrls || result.imageUrls || [];
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  };

  const removeImagePreview = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageUrl: string, index: number) => {
    try {
      await eventService.deleteImage(imageUrl);
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
      showSuccess("Image removed successfully");
    } catch (error) {
      console.error("Error removing image:", error);
      showError(error as Error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    console.log("📝 Opening edit modal for event:", event);
    setSelectedEvent(event);

    // Convert UTC dates from API to Toronto timezone for datetime-local inputs
    const startDateTime = AdminTimeUtil.formatForDateTimeInput(
      event.start_date
    );
    const endDateTime = AdminTimeUtil.formatForDateTimeInput(event.end_date);

    setFormData({
      name: event.name,
      description: event.description || "",
      start_date: startDateTime,
      end_date: endDateTime,
      images: event.images || [],
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    openEditModal(event);
  };
  const handleDelete = (event: Event) => {
    handleDeleteEvent(event);
  };
  const handleView = (event: Event) => {
    setSelectedEvent(event);
    setViewDialogOpen(true);
  };

  const handleReschedule = (event: Event) => {
    console.log("📅 Opening reschedule modal for event:", event);
    setSelectedEvent(event);
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
    const startDateTime = event.start_date.includes("T")
      ? event.start_date.substring(0, 16)
      : event.start_date + "T00:00";
    const endDateTime = event.end_date.includes("T")
      ? event.end_date.substring(0, 16)
      : event.end_date + "T00:00";

    setRescheduleData({
      start_date: startDateTime,
      end_date: endDateTime,
    });
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleEvent = async () => {
    if (!selectedEvent) return;

    try {
      await eventService.update(selectedEvent.id, {
        start_date: rescheduleData.start_date,
        end_date: rescheduleData.end_date,
      });
      showSuccess(`Event "${selectedEvent.name}" has been rescheduled`);
      setIsRescheduleModalOpen(false);
      setSelectedEvent(null);
      setRescheduleData({ start_date: "", end_date: "" });
      fetchEvents();
    } catch (error) {
      console.error("Error rescheduling event:", error);
      showError(error as Error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: "Upcoming", color: "info" as const };
    } else if (now >= start && now <= end) {
      return { label: "Active", color: "success" as const };
    } else {
      return { label: "Ended", color: "default" as const };
    }
  };
  const columns = [
    {
      id: "name",
      label: "Event Name",
      minWidth: 200,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EventIcon sx={{ fontSize: 20, color: "primary.main" }} />
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
            maxWidth: 300,
            display: "block",
          }}
          title={value || "No description"}
        >
          {value || "No description"}
        </Typography>
      ),
    },
    {
      id: "start_date",
      label: "Start Date",
      minWidth: 150,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CalendarToday sx={{ fontSize: 16, color: "success.main" }} />
          <Typography variant="body2">
            {new Date(value).toLocaleDateString()}
          </Typography>
        </Box>
      ),
    },
    {
      id: "end_date",
      label: "End Date",
      minWidth: 150,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CalendarToday sx={{ fontSize: 16, color: "error.main" }} />
          <Typography variant="body2">
            {new Date(value).toLocaleDateString()}
          </Typography>
        </Box>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 120,
      format: (_: string, row: Event) => {
        const status = getEventStatus(row.start_date, row.end_date);
        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      id: "images",
      label: "Images",
      minWidth: 100,
      format: (value: string[] | undefined) => (
        <Chip
          label={`${value?.length || 0} images`}
          size="small"
          variant="outlined"
          color="secondary"
        />
      ),
    },
    {
      id: "created_at",
      label: "Created",
      minWidth: 150,
      format: (value: string | number | Date) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleStartEvent = async (event: Event) => {
    try {
      // Update event start date to now if it's in the future
      const now = new Date();
      const updatedEvent = {
        ...event,
        start_date: now.toISOString(),
      };

      await eventService.update(event.id, updatedEvent);
      showSuccess(`Event "${event.name}" has been started`);
      fetchEvents();
    } catch (error) {
      console.error("Error starting event:", error);
      showError(error as Error);
    }
  };

  const handleEndEvent = async (event: Event) => {
    try {
      // Update event end date to now
      const now = new Date();
      const updatedEvent = {
        ...event,
        end_date: now.toISOString(),
      };

      await eventService.update(event.id, updatedEvent);
      showSuccess(`Event "${event.name}" has been ended`);
      fetchEvents();
    } catch (error) {
      console.error("Error ending event:", error);
      showError(error as Error);
    }
  };

  const handleScheduleEvent = (event: Event) => {
    handleReschedule(event);
  };

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
              <EventIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Events Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total events: {totalCount}
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
              Add Event
            </Button>
          )}
        </Box>
        {/* Filters */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : theme.palette.grey[50],
          }}
        >
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                label="Search events"
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

              <TextField
                label="Start Date"
                type="date"
                variant="outlined"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />

              <TextField
                label="End Date"
                type="date"
                variant="outlined"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />

              {(searchTerm || startDate || endDate) && (
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
              data={events}
              loading={loading}
              total={totalCount}
              page={paginationModel.page}
              pageSize={paginationModel.pageSize}
              onPageChange={(page) =>
                setPaginationModel((prev) => ({ ...prev, page }))
              }
              onPageSizeChange={(pageSize) =>
                setPaginationModel((prev) => ({ ...prev, pageSize }))
              }
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              customActions={[
                {
                  id: "start-event",
                  label: "Start Event",
                  icon: <PlayArrow />,
                  onClick: handleStartEvent,
                  color: "success",
                  hidden: (event) => {
                    const now = new Date();
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    return startDate <= now || endDate <= now; // Hide if already started or ended
                  },
                },
                {
                  id: "end-event",
                  label: "End Event",
                  icon: <Stop />,
                  onClick: handleEndEvent,
                  color: "error",
                  hidden: (event) => {
                    const now = new Date();
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    return startDate > now || endDate <= now; // Hide if not started or already ended
                  },
                },
                {
                  id: "reschedule-event",
                  label: "Reschedule",
                  icon: <Schedule />,
                  onClick: handleScheduleEvent,
                  color: "warning",
                },
              ]}
              canEdit={() => userRole === "admin" || userRole === "superadmin"}
              canDelete={() =>
                userRole === "admin" || userRole === "superadmin"
              }
              title="Events"
              emptyMessage="No events found"
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
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isAddModalOpen ? "Add New Event" : "Edit Event"}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Event Name"
                variant="outlined"
                fullWidth
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <Box display="flex" gap={2}>
                <TextField
                  label="Start Date"
                  type="datetime-local"
                  variant="outlined"
                  fullWidth
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />

                <TextField
                  label="End Date"
                  type="datetime-local"
                  variant="outlined"
                  fullWidth
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, fontStyle: "italic" }}
              >
                All times are in America/Toronto timezone (automatically handles
                DST)
              </Typography>

              {/* Image Upload Section */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Images
                </Typography>

                {/* File Upload */}
                <Box sx={{ mb: 2 }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Select Images (Max 5, 1MB each)
                    </Button>
                  </label>
                </Box>

                {/* Image Previews for New Files */}
                {imagePreviews.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      New Images ({imagePreviews.length}):
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {imagePreviews.map((preview, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 80,
                            height: 80,
                            border: "1px solid #ddd",
                            borderRadius: 1,
                          }}
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                          />
                          <Button
                            onClick={() => removeImagePreview(index)}
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              minWidth: 20,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "error.main",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "error.dark",
                              },
                            }}
                          >
                            ×
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Existing Images */}
                {formData.images.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Current Images ({formData.images.length}):
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {formData.images.map((imageUrl, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 80,
                            height: 80,
                            border: "1px solid #ddd",
                            borderRadius: 1,
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Event image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-image.png";
                            }}
                          />
                          <Button
                            onClick={() => removeExistingImage(imageUrl, index)}
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              minWidth: 20,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "error.main",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "error.dark",
                              },
                            }}
                          >
                            ×
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
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
              onClick={isAddModalOpen ? handleAddEvent : handleEditEvent}
              disabled={
                !formData.name || !formData.start_date || !formData.end_date
              }
            >
              {isAddModalOpen ? "Add" : "Update"}
            </Button>{" "}
          </DialogActions>
        </Dialog>{" "}
        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Delete Event"
          message={`Are you sure you want to delete the event "${eventToDelete?.name}"? This action cannot be undone.`}
          onConfirm={confirmDeleteEvent}
          onCancel={() => {
            setConfirmDeleteOpen(false);
            setEventToDelete(null);
          }}
        />
        {/* View Event Details Dialog */}
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
          {selectedEvent && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    <EventIcon fontSize="large" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {selectedEvent.name}
                    </Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      <Chip
                        label={`${new Date(
                          selectedEvent.start_date
                        ).toLocaleDateString()} - ${new Date(
                          selectedEvent.end_date
                        ).toLocaleDateString()}`}
                        color="primary"
                        size="small"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ px: 3, pb: 3 }}>
                <Grid container spacing={3}>
                  {/* Left Column - Event Info */}
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
                        sx={{ mb: 2, fontWeight: 600, color: "secondary.main" }}
                      >
                        Event Information
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Event Name
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedEvent.name}
                        </Typography>
                      </Box>

                      {selectedEvent.description && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={500}
                            mb={1}
                          >
                            Description
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {selectedEvent.description}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Start Date
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          color="primary.main"
                        >
                          {AdminTimeUtil.formatToronto(
                            selectedEvent.start_date,
                            "MMMM d, yyyy h:mm a"
                          )}{" "}
                          (
                          {
                            AdminTimeUtil.getTimezoneInfo(
                              selectedEvent.start_date
                            ).abbreviation
                          }
                          )
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          End Date
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          color="secondary.main"
                        >
                          {AdminTimeUtil.formatToronto(
                            selectedEvent.end_date,
                            "MMMM d, yyyy h:mm a"
                          )}{" "}
                          (
                          {
                            AdminTimeUtil.getTimezoneInfo(
                              selectedEvent.end_date
                            ).abbreviation
                          }
                          )
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Right Column - Additional Details */}
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
                        sx={{ mb: 2, fontWeight: 600, color: "secondary.main" }}
                      >
                        Event Details
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Duration
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {(() => {
                            const start = new Date(selectedEvent.start_date);
                            const end = new Date(selectedEvent.end_date);
                            const diffTime = Math.abs(
                              end.getTime() - start.getTime()
                            );
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24)
                            );
                            return diffDays === 1
                              ? "1 day"
                              : `${diffDays} days`;
                          })()}
                        </Typography>
                      </Box>

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
                            selectedEvent.created_at
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
                            selectedEvent.updated_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={500}
                          mb={1}
                        >
                          Last Edited By
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedEvent.lastEditedByAdmin?.email || "System"}
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
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        {/* Reschedule Dialog */}
        <Dialog
          open={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Reschedule Event: {selectedEvent?.name}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date & Time"
                    type="datetime-local"
                    value={rescheduleData.start_date}
                    onChange={(e) =>
                      setRescheduleData((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date & Time"
                    type="datetime-local"
                    value={rescheduleData.end_date}
                    onChange={(e) =>
                      setRescheduleData((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setIsRescheduleModalOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleEvent}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              Reschedule
            </Button>
          </DialogActions>
        </Dialog>
        {/* Snackbar removed: now using notification system via useNotification */}
      </Paper>
    </motion.div>
  );
};

export default EventsViewModern;
