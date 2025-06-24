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
  Alert,
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

interface EventsViewModernProps {
  userRole: "admin" | "superadmin";
}

const EventsViewModern: React.FC<EventsViewModernProps> = ({ userRole }) => {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  // Feedback states
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [paginationModel, searchTerm, startDate, endDate]);

  useEffect(() => {
    fetchEventCount();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const dateRange =
        startDate && endDate ? { startDate, endDate } : undefined;
      const response: PaginatedResponse<Event> = await eventService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize,
        dateRange
      );
      setEvents(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Error fetching events:", error);
      showAlert("error", "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventCount = async () => {
    try {
      const count = await eventService.getCount();
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching event count:", error);
    }
  };

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAddEvent = async () => {
    try {
      await eventService.create({
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        images: formData.images,
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchEvents();
      fetchEventCount();
      showAlert("success", "Event created successfully");
    } catch (error) {
      console.error("Error creating event:", error);
      showAlert("error", "Failed to create event");
    }
  };

  const handleEditEvent = async () => {
    if (!selectedEvent) return;
    try {
      await eventService.update(selectedEvent.id, {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        images: formData.images,
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchEvents();
      showAlert("success", "Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      showAlert("error", "Failed to update event");
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
      showAlert("success", "Event deleted successfully");
      setConfirmDeleteOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      showAlert("error", "Failed to delete event");
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
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description || "",
      start_date: event.start_date.split("T")[0], // Format for date input
      end_date: event.end_date.split("T")[0],
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
      format: (value: any) => (
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
      format: (value: any) => (
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
      format: (value: any) => (
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
      format: (value: any) => (
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
      format: (_: any, row: any) => {
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
      format: (value: any) => (
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
      format: (value: any) => new Date(value).toLocaleDateString(),
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
      showAlert("success", `Event "${event.name}" has been started`);
      fetchEvents();
    } catch (error) {
      console.error("Error starting event:", error);
      showAlert("error", "Failed to start event");
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
      showAlert("success", `Event "${event.name}" has been ended`);
      fetchEvents();
    } catch (error) {
      console.error("Error ending event:", error);
      showAlert("error", "Failed to end event");
    }
  };

  const handleScheduleEvent = async (event: Event) => {
    try {
      // Reset event to future status by setting start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const updatedEvent = {
        ...event,
        start_date: tomorrow.toISOString(),
        end_date: new Date(
          tomorrow.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // 1 day duration
      };

      await eventService.update(event.id, updatedEvent);
      showAlert("success", `Event "${event.name}" has been rescheduled`);
      fetchEvents();
    } catch (error) {
      console.error("Error rescheduling event:", error);
      showAlert("error", "Failed to reschedule event");
    }
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

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Images (Enter URLs, one per line)
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={formData.images.join("\n")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    images: e.target.value
                      .split("\n")
                      .filter((url) => url.trim()),
                  })
                }
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
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
                          {new Date(
                            selectedEvent.start_date
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
                          End Date
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          color="secondary.main"
                        >
                          {new Date(selectedEvent.end_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
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
      </Paper>
    </motion.div>
  );
};

export default EventsViewModern;
