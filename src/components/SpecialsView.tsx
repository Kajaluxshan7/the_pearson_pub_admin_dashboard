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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Skeleton,
  Stack,
  InputAdornment,
  Switch,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Add,
  PhotoCamera,
  Delete,
  Edit,
  Close,
  CalendarToday,
  LocalOffer,
  Visibility,
  Search,
  FilterList,
  Today,
  Schedule,
  NightsStay,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  specialsService,
  specialsDayService,
  type Special,
  type SpecialsDay,
} from "../services/api";
import { ConfirmDialog } from "./ConfirmDialog";

interface SpecialsFormData {
  special_type: "daily" | "seasonal" | "latenight" | "";
  specialsDayId: string;
  name: string;
  description: string;
  seasonal_start_date: string;
  seasonal_end_date: string;
  images: string[];
  removeImages: string[]; // Track individual existing images to be removed
}

interface ImageUploadState {
  files: File[];
  previews: string[];
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
  const [loading, setLoading] = useState(true);
  const [filteredSpecials, setFilteredSpecials] = useState<Special[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);

  // Image gallery states for view dialog
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoSwapEnabled, setAutoSwapEnabled] = useState(false);
  const [autoSwapInterval, setAutoSwapInterval] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState<SpecialsFormData>({
    special_type: "",
    specialsDayId: "",
    name: "",
    description: "",
    seasonal_start_date: "",
    seasonal_end_date: "",
    images: [],
    removeImages: [],
  });

  // Image upload state
  const [imageUpload, setImageUpload] = useState<ImageUploadState>({
    files: [],
    previews: [],
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
  }, []);

  useEffect(() => {
    let filtered = specials;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (special) =>
          special.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          special.season_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          special.special_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter(
        (special) => special.special_type === selectedTypeFilter
      );
    }

    setFilteredSpecials(filtered);
  }, [specials, searchTerm, selectedTypeFilter]);

  // Auto-swap functionality for image gallery
  useEffect(() => {
    if (
      autoSwapEnabled &&
      selectedSpecial?.image_urls &&
      selectedSpecial.image_urls.length > 1
    ) {
      const interval = setInterval(() => {
        setCurrentImageIndex(
          (prevIndex) =>
            (prevIndex + 1) % (selectedSpecial.image_urls?.length || 1)
        );
      }, 3000); // Change image every 3 seconds

      setAutoSwapInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (autoSwapInterval) {
        clearInterval(autoSwapInterval);
        setAutoSwapInterval(null);
      }
    }
  }, [autoSwapEnabled, selectedSpecial?.image_urls]);

  // Reset image gallery when dialog opens/closes
  useEffect(() => {
    if (viewDialogOpen) {
      setCurrentImageIndex(0);
      setAutoSwapEnabled(false);
    } else {
      // Clean up interval when dialog closes
      if (autoSwapInterval) {
        clearInterval(autoSwapInterval);
        setAutoSwapInterval(null);
      }
    }
  }, [viewDialogOpen]);

  const fetchSpecials = async () => {
    try {
      setLoading(true);
      const response = await specialsService.getAll(1, 100);
      setSpecials(response.data);
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

    // Combine legacy single image and new multiple images, avoiding duplicates
    const existingImages: string[] = [];
    if (special.image_url) {
      existingImages.push(special.image_url);
    }
    if (special.image_urls && special.image_urls.length > 0) {
      // Only add images that aren't already in the array (avoid duplicates)
      special.image_urls.forEach((imageUrl) => {
        if (!existingImages.includes(imageUrl)) {
          existingImages.push(imageUrl);
        }
      });
    }

    console.log("🔄 Edit - Original special.image_url:", special.image_url);
    console.log("🔄 Edit - Original special.image_urls:", special.image_urls);
    console.log(
      "🔄 Edit - Combined existingImages (no duplicates):",
      existingImages
    );

    setFormData({
      special_type: special.special_type,
      specialsDayId: special.specialsDayId || "",
      name: special.season_name || "", // Use season_name for seasonal specials
      description: special.description || "",
      seasonal_start_date: special.seasonal_start_datetime
        ? new Date(special.seasonal_start_datetime).toISOString().slice(0, 16) // datetime-local format
        : "",
      seasonal_end_date: special.seasonal_end_datetime
        ? new Date(special.seasonal_end_datetime).toISOString().slice(0, 16) // datetime-local format
        : "",
      images: existingImages, // Show existing images
      removeImages: [], // Initialize empty array for images to remove
    });

    // If there are existing images, show them in formData only
    // imageUpload.previews should only contain NEW images
    if (existingImages.length > 0) {
      setImageUpload({
        files: [], // No new files initially
        previews: [], // Start with empty previews - only for NEW images
      });
    } else {
      setImageUpload({ files: [], previews: [] });
    }

    setEditDialogOpen(true);
  };

  const handleView = (special: Special) => {
    setSelectedSpecial(special);
    setViewDialogOpen(true);
  };

  const handleDelete = (special: Special) => {
    const specialName =
      special.special_type === "seasonal"
        ? special.season_name || "Seasonal Special"
        : special.special_type === "daily"
        ? "Daily Special"
        : "Late Night Special";

    setConfirmDialog({
      open: true,
      title: "Delete Special",
      message: `Are you sure you want to delete "${specialName}"? This action cannot be undone.`,
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
      console.log("🔄 Frontend - Form data before processing:", formData);
      console.log("🔄 Frontend - Image upload state:", imageUpload);

      // Calculate which existing images to keep (not marked for removal)
      const existingImagesToKeep =
        formData.images?.filter(
          (imageUrl) => !formData.removeImages?.includes(imageUrl)
        ) || [];

      console.log(
        "🔄 Frontend - Existing images to keep:",
        existingImagesToKeep
      );
      console.log("🔄 Frontend - Images to remove:", formData.removeImages);

      const baseData = {
        special_type: formData.special_type as
          | "daily"
          | "seasonal"
          | "latenight",
        description: formData.description,
        removeImages: formData.removeImages, // Include array of images to remove
        existingImages: existingImagesToKeep, // Include array of existing images to keep
      };

      let saveData: any;

      if (formData.special_type === "daily") {
        saveData = {
          ...baseData,
          specialsDayId: formData.specialsDayId,
        };
      } else if (formData.special_type === "seasonal") {
        saveData = {
          ...baseData,
          season_name: formData.name,
          seasonal_start_datetime: formData.seasonal_start_date
            ? new Date(formData.seasonal_start_date).toISOString()
            : undefined,
          seasonal_end_datetime: formData.seasonal_end_date
            ? new Date(formData.seasonal_end_date).toISOString()
            : undefined,
        };
      } else if (formData.special_type === "latenight") {
        saveData = baseData;
      } else {
        throw new Error("Invalid special type");
      }

      // Get all selected image files for upload (support up to 5 images)
      const imagesToUpload =
        imageUpload.files.length > 0 ? imageUpload.files : undefined;

      console.log("🔄 Frontend - Sending data:", saveData);
      console.log(
        "🔄 Frontend - Images to upload:",
        imagesToUpload ? imagesToUpload.length : 0
      );

      if (selectedSpecial) {
        const updatedSpecial = await specialsService.update(
          selectedSpecial.id,
          saveData,
          imagesToUpload
        );
        console.log("✅ Frontend - Updated special received:", updatedSpecial);
        showSnackbar("Special updated successfully", "success");
      } else {
        const newSpecial = await specialsService.create(
          saveData,
          imagesToUpload
        );
        console.log("✅ Frontend - New special created:", newSpecial);
        showSnackbar("Special added successfully", "success");
      }

      setAddDialogOpen(false);
      setEditDialogOpen(false);
      resetForm();
      await fetchSpecials(); // Refresh the specials list
    } catch (error) {
      console.error("❌ Frontend - Error saving special:", error);
      showSnackbar("Error saving special", "error");
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Get the current count of existing images (excluding those marked for removal)
    const existingImageCount = selectedSpecial
      ? formData.images?.length || 0
      : 0;
    const markedForRemovalCount = formData.removeImages?.length || 0;
    const currentNewImageCount = imageUpload.files.length;
    const totalCurrentCount =
      existingImageCount - markedForRemovalCount + currentNewImageCount;
    const totalAfterUpload = totalCurrentCount + files.length;

    console.log("🔄 Image Select - Existing images:", existingImageCount);
    console.log("🔄 Image Select - Marked for removal:", markedForRemovalCount);
    console.log("🔄 Image Select - Current new images:", currentNewImageCount);
    console.log(
      "🔄 Image Select - Total current (after removals):",
      totalCurrentCount
    );
    console.log("🔄 Image Select - Total after upload:", totalAfterUpload);

    if (totalAfterUpload > 5) {
      const canAdd = 5 - totalCurrentCount;
      showSnackbar(
        `Maximum 5 images allowed. You can add ${canAdd} more.`,
        "warning"
      );
      return;
    }

    // Validate file size (max 1MB each)
    const validFiles = files.filter((file) => {
      if (file.size > 1024 * 1024) {
        showSnackbar(
          `File ${file.name} is too large. Maximum size is 1MB`,
          "warning"
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    // Add only new images to the imageUpload.previews (don't mix with existing)
    setImageUpload((prev) => {
      const updatedFiles = [...prev.files, ...validFiles];
      const updatedPreviews = [...prev.previews, ...newPreviews]; // Only new images here

      console.log(
        "🔄 Image Select - New images being added:",
        validFiles.length
      );
      console.log(
        "🔄 Image Select - Total new images after addition:",
        updatedFiles.length
      );

      return {
        files: updatedFiles,
        previews: updatedPreviews, // This contains ONLY new images
      };
    });

    // Don't reset removeImages when new images are selected - keep existing removal selections
  };

  const removeExistingImage = (imageUrl: string) => {
    // For existing images, toggle individual removal state
    const currentRemoveList = formData.removeImages || [];
    const isAlreadyMarkedForRemoval = currentRemoveList.includes(imageUrl);

    let newRemoveList;
    if (isAlreadyMarkedForRemoval) {
      // Remove from removal list (unmark for removal)
      newRemoveList = currentRemoveList.filter((url) => url !== imageUrl);
      showSnackbar("Image unmarked for removal", "success");
    } else {
      // Add to removal list (mark for removal)
      newRemoveList = [...currentRemoveList, imageUrl];
      showSnackbar(
        "Image marked for removal - click Update to delete permanently",
        "warning"
      );
    }

    setFormData((prevForm) => ({ ...prevForm, removeImages: newRemoveList }));
  };

  const removeNewImage = (index: number) => {
    // Remove new uploaded image from preview
    setImageUpload((prev) => {
      const newFiles = prev.files.filter((_, i) => i !== index);
      const newPreviews = prev.previews.filter((_, i) => i !== index);

      showSnackbar("New image removed from upload queue", "info");

      return {
        files: newFiles,
        previews: newPreviews,
      };
    });
  };

  const resetForm = () => {
    setFormData({
      special_type: "",
      specialsDayId: "",
      name: "",
      description: "",
      seasonal_start_date: "",
      seasonal_end_date: "",
      images: [],
      removeImages: [],
    });
    setImageUpload({ files: [], previews: [] });
    setSelectedSpecial(null);
  };

  const getSpecialTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return theme.palette.primary.main;
      case "seasonal":
        return theme.palette.success.main;
      case "latenight":
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDisplayImage = (special: Special): string | undefined => {
    // First priority: legacy single image
    if (special.image_url) {
      return special.image_url;
    }
    // Second priority: first image from multiple images array
    if (special.image_urls && special.image_urls.length > 0) {
      return special.image_urls[0];
    }
    return undefined;
  };

  const groupSpecialsByType = () => {
    return {
      daily: filteredSpecials.filter((s) => s.special_type === "daily"),
      seasonal: filteredSpecials.filter((s) => s.special_type === "seasonal"),
      latenight: filteredSpecials.filter((s) => s.special_type === "latenight"),
    };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "daily":
        return <Today sx={{ mr: 1 }} />;
      case "seasonal":
        return <Schedule sx={{ mr: 1 }} />;
      case "latenight":
        return <NightsStay sx={{ mr: 1 }} />;
      default:
        return <LocalOffer sx={{ mr: 1 }} />;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "daily":
        return "Daily Specials";
      case "seasonal":
        return "Seasonal Specials";
      case "latenight":
        return "Late Night Specials";
      default:
        return "Specials";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Fixed Header */}
        <Box sx={{ flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                <LocalOffer sx={{ mr: 1, verticalAlign: "middle" }} />
                Specials Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage restaurant specials with images and descriptions
              </Typography>
            </Box>

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

          {/* Fixed Search and Filter Controls */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search specials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Type</InputLabel>
                  <Select
                    value={selectedTypeFilter}
                    label="Filter by Type"
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    startAdornment={
                      <FilterList sx={{ mr: 1, color: "text.secondary" }} />
                    }
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="daily">Daily Specials</MenuItem>
                    <MenuItem value="seasonal">Seasonal Specials</MenuItem>
                    <MenuItem value="latenight">Late Night Specials</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {filteredSpecials.length} special
                  {filteredSpecials.length !== 1 ? "s" : ""} found
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Scrollable Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            minHeight: 0, // Important for flex containers
            "&::-webkit-scrollbar": {
              width: 8,
            },
            "&::-webkit-scrollbar-track": {
              background: theme.palette.grey[100],
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              background: theme.palette.grey[300],
              borderRadius: 4,
              "&:hover": {
                background: theme.palette.grey[400],
              },
            },
          }}
        >
          {/* Specials Grid */}
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card elevation={0} sx={{ borderRadius: 3, height: 400 }}>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton height={32} width="60%" sx={{ mb: 1 }} />
                      <Skeleton height={20} width="40%" sx={{ mb: 2 }} />
                      <Skeleton height={60} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : selectedTypeFilter === "all" ? (
            // Group view - show by categories
            <>
              {["daily", "seasonal", "latenight"].map((type) => {
                const groupedSpecials = groupSpecialsByType();
                const typeSpecials =
                  groupedSpecials[type as keyof typeof groupedSpecials];

                if (typeSpecials.length === 0) return null;

                return (
                  <Box key={type} sx={{ mb: 6 }}>
                    {/* Category Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 3,
                        p: 2,
                        backgroundColor: `${getSpecialTypeColor(type)}10`,
                        borderRadius: 3,
                        border: `1px solid ${getSpecialTypeColor(type)}30`,
                      }}
                    >
                      {getTypeIcon(type)}
                      <Typography
                        variant="h5"
                        fontWeight={600}
                        sx={{ color: getSpecialTypeColor(type) }}
                      >
                        {getTypeDisplayName(type)}
                      </Typography>
                      <Chip
                        label={typeSpecials.length}
                        size="small"
                        sx={{
                          ml: 2,
                          backgroundColor: getSpecialTypeColor(type),
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    {/* Cards Grid */}
                    <Grid container spacing={3}>
                      {typeSpecials.map((special) => (
                        <Grid item xs={12} md={6} lg={4} key={special.id}>
                          <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card
                              elevation={0}
                              sx={{
                                borderRadius: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                overflow: "hidden",
                                height: 420, // Fixed height for consistency
                                background: theme.palette.background.paper,
                                display: "flex",
                                flexDirection: "column",
                                "&:hover": {
                                  boxShadow: theme.shadows[8],
                                  borderColor: theme.palette.primary.main,
                                },
                                transition: "all 0.3s ease",
                              }}
                            >
                              {/* Display actual image if available, otherwise placeholder */}
                              <CardMedia
                                sx={{
                                  height: 180, // Fixed height
                                  background: getDisplayImage(special)
                                    ? "transparent"
                                    : `linear-gradient(135deg, ${getSpecialTypeColor(
                                        special.special_type
                                      )}20, ${getSpecialTypeColor(
                                        special.special_type
                                      )}40)`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                }}
                                image={getDisplayImage(special)}
                              >
                                {!getDisplayImage(special) && (
                                  <LocalOffer
                                    sx={{
                                      fontSize: 60,
                                      color: getSpecialTypeColor(
                                        special.special_type
                                      ),
                                      opacity: 0.6,
                                    }}
                                  />
                                )}
                              </CardMedia>

                              <CardContent
                                sx={{
                                  flexGrow: 1,
                                  p: 3,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    mb: 2,
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight={600}
                                    sx={{ flexGrow: 1 }}
                                  >
                                    {special.special_type === "seasonal"
                                      ? special.season_name ||
                                        "Seasonal Special"
                                      : special.special_type === "daily"
                                      ? "Daily Special"
                                      : "Late Night Special"}
                                  </Typography>
                                  <Chip
                                    label={
                                      special.special_type
                                        .charAt(0)
                                        .toUpperCase() +
                                      special.special_type.slice(1)
                                    }
                                    size="small"
                                    sx={{
                                      backgroundColor: `${getSpecialTypeColor(
                                        special.special_type
                                      )}20`,
                                      color: getSpecialTypeColor(
                                        special.special_type
                                      ),
                                      fontWeight: 600,
                                      ml: 1,
                                    }}
                                  />
                                </Box>

                                {special.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      mb: 2,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      flexGrow: 1, // Take up available space
                                    }}
                                  >
                                    {special.description}
                                  </Typography>
                                )}

                                {special.seasonal_start_datetime && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: "auto",
                                    }}
                                  >
                                    <CalendarToday
                                      sx={{
                                        fontSize: 16,
                                        color: "text.secondary",
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {new Date(
                                        special.seasonal_start_datetime
                                      ).toLocaleDateString()}
                                      {special.seasonal_end_datetime &&
                                        ` - ${new Date(
                                          special.seasonal_end_datetime
                                        ).toLocaleDateString()}`}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>

                              <CardActions
                                sx={{
                                  p: 2,
                                  pt: 0,
                                  justifyContent: "space-between",
                                  mt: "auto",
                                }}
                              >
                                <Stack direction="row" spacing={1}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleView(special)}
                                    sx={{
                                      backgroundColor: `${theme.palette.info.main}20`,
                                      "&:hover": {
                                        backgroundColor: `${theme.palette.info.main}30`,
                                      },
                                    }}
                                  >
                                    <Visibility
                                      fontSize="small"
                                      sx={{ color: theme.palette.info.main }}
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEdit(special)}
                                    sx={{
                                      backgroundColor: `${theme.palette.warning.main}20`,
                                      "&:hover": {
                                        backgroundColor: `${theme.palette.warning.main}30`,
                                      },
                                    }}
                                  >
                                    <Edit
                                      fontSize="small"
                                      sx={{ color: theme.palette.warning.main }}
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(special)}
                                    sx={{
                                      backgroundColor: `${theme.palette.error.main}20`,
                                      "&:hover": {
                                        backgroundColor: `${theme.palette.error.main}30`,
                                      },
                                    }}
                                  >
                                    <Delete
                                      fontSize="small"
                                      sx={{ color: theme.palette.error.main }}
                                    />
                                  </IconButton>
                                </Stack>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Created {formatDate(special.created_at)}
                                </Typography>
                              </CardActions>
                            </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </>
          ) : (
            // Filtered view - show all in grid
            <Grid container spacing={3}>
              {filteredSpecials.map((special) => (
                <Grid item xs={12} md={6} lg={4} key={special.id}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        overflow: "hidden",
                        height: 420, // Fixed height for consistency
                        background: theme.palette.background.paper,
                        display: "flex",
                        flexDirection: "column",
                        "&:hover": {
                          boxShadow: theme.shadows[8],
                          borderColor: theme.palette.primary.main,
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Display actual image if available, otherwise placeholder */}
                      <CardMedia
                        sx={{
                          height: 180, // Fixed height
                          background: getDisplayImage(special)
                            ? "transparent"
                            : `linear-gradient(135deg, ${getSpecialTypeColor(
                                special.special_type
                              )}20, ${getSpecialTypeColor(
                                special.special_type
                              )}40)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                        image={getDisplayImage(special)}
                      >
                        {!getDisplayImage(special) && (
                          <LocalOffer
                            sx={{
                              fontSize: 60,
                              color: getSpecialTypeColor(special.special_type),
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </CardMedia>

                      <CardContent
                        sx={{
                          flexGrow: 1,
                          p: 3,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ flexGrow: 1 }}
                          >
                            {special.special_type === "seasonal"
                              ? special.season_name || "Seasonal Special"
                              : special.special_type === "daily"
                              ? "Daily Special"
                              : "Late Night Special"}
                          </Typography>
                          <Chip
                            label={
                              special.special_type.charAt(0).toUpperCase() +
                              special.special_type.slice(1)
                            }
                            size="small"
                            sx={{
                              backgroundColor: `${getSpecialTypeColor(
                                special.special_type
                              )}20`,
                              color: getSpecialTypeColor(special.special_type),
                              fontWeight: 600,
                              ml: 1,
                            }}
                          />
                        </Box>

                        {special.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              flexGrow: 1, // Take up available space
                            }}
                          >
                            {special.description}
                          </Typography>
                        )}

                        {special.seasonal_start_datetime && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: "auto",
                            }}
                          >
                            <CalendarToday
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(
                                special.seasonal_start_datetime
                              ).toLocaleDateString()}
                              {special.seasonal_end_datetime &&
                                ` - ${new Date(
                                  special.seasonal_end_datetime
                                ).toLocaleDateString()}`}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <CardActions
                        sx={{
                          p: 2,
                          pt: 0,
                          justifyContent: "space-between",
                          mt: "auto",
                        }}
                      >
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleView(special)}
                            sx={{
                              backgroundColor: `${theme.palette.info.main}20`,
                              "&:hover": {
                                backgroundColor: `${theme.palette.info.main}30`,
                              },
                            }}
                          >
                            <Visibility
                              fontSize="small"
                              sx={{ color: theme.palette.info.main }}
                            />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(special)}
                            sx={{
                              backgroundColor: `${theme.palette.warning.main}20`,
                              "&:hover": {
                                backgroundColor: `${theme.palette.warning.main}30`,
                              },
                            }}
                          >
                            <Edit
                              fontSize="small"
                              sx={{ color: theme.palette.warning.main }}
                            />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(special)}
                            sx={{
                              backgroundColor: `${theme.palette.error.main}20`,
                              "&:hover": {
                                backgroundColor: `${theme.palette.error.main}30`,
                              },
                            }}
                          >
                            <Delete
                              fontSize="small"
                              sx={{ color: theme.palette.error.main }}
                            />
                          </IconButton>
                        </Stack>

                        <Typography variant="caption" color="text.secondary">
                          Created {formatDate(special.created_at)}
                        </Typography>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}

          {!loading && filteredSpecials.length === 0 && (
            <Paper
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 3,
                border: `2px dashed ${theme.palette.divider}`,
              }}
            >
              <LocalOffer
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No specials found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get started by adding your first special
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Add Special
              </Button>
            </Paper>
          )}
        </Box>

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

              {/* Only show Special Name for seasonal specials */}
              {formData.special_type === "seasonal" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Season Name *"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>

              {/* Only show Start/End dates for seasonal specials */}
              {formData.special_type === "seasonal" && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date & Time *"
                      type="datetime-local"
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
                      label="End Date & Time"
                      type="datetime-local"
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

              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Images (Max 5, 1MB each)
                </Typography>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    fullWidth
                    sx={{ mb: 2, borderRadius: 2 }}
                    disabled={(() => {
                      const existingCount = selectedSpecial
                        ? formData.images?.length || 0
                        : 0;
                      const markedForRemovalCount =
                        formData.removeImages?.length || 0;
                      const newImagesCount = imageUpload.files.length;
                      const totalAfterChanges =
                        existingCount - markedForRemovalCount + newImagesCount;
                      return totalAfterChanges >= 5;
                    })()}
                  >
                    {(() => {
                      const existingCount = selectedSpecial
                        ? formData.images?.length || 0
                        : 0;
                      const markedForRemovalCount =
                        formData.removeImages?.length || 0;
                      const newImagesCount = imageUpload.files.length;
                      const totalAfterChanges =
                        existingCount - markedForRemovalCount + newImagesCount;

                      if (totalAfterChanges >= 5) {
                        return "Maximum 5 images reached";
                      }
                      return `Select Images (${totalAfterChanges}/5)`;
                    })()}
                  </Button>
                </label>

                {/* Image Preview - Show both existing and new images */}
                {((formData.images && formData.images.length > 0) ||
                  imageUpload.previews.length > 0) && (
                  <Grid container spacing={2}>
                    {/* Display existing images first */}
                    {formData.images &&
                      formData.images.map((existingImage, index) => {
                        const willBeRemoved =
                          formData.removeImages?.includes(existingImage) ||
                          false;

                        return (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            key={`existing-${index}`}
                          >
                            <Box
                              sx={{
                                position: "relative",
                                borderRadius: 2,
                                overflow: "hidden",
                                border: `2px solid ${
                                  willBeRemoved
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main
                                }`,
                                opacity: willBeRemoved ? 0.5 : 1,
                                transition: "all 0.3s ease",
                              }}
                            >
                              <img
                                src={existingImage}
                                alt={`Existing image ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: 200,
                                  objectFit: "cover",
                                }}
                              />
                              <IconButton
                                onClick={() =>
                                  removeExistingImage(existingImage)
                                }
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  backgroundColor: willBeRemoved
                                    ? "rgba(76,175,80,0.9)"
                                    : "rgba(244,67,54,0.9)",
                                  color: "white",
                                  "&:hover": {
                                    backgroundColor: willBeRemoved
                                      ? "rgba(76,175,80,1)"
                                      : "rgba(244,67,54,1)",
                                  },
                                  width: 36,
                                  height: 36,
                                  border: "2px solid white",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                }}
                              >
                                {willBeRemoved ? (
                                  <Typography
                                    sx={{
                                      fontSize: "8px",
                                      fontWeight: 700,
                                      textAlign: "center",
                                    }}
                                  >
                                    UNDO
                                  </Typography>
                                ) : (
                                  <Close fontSize="small" />
                                )}
                              </IconButton>
                              {/* Status indicator for existing images */}
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 8,
                                  left: 8,
                                  backgroundColor: willBeRemoved
                                    ? "rgba(244,67,54,0.95)"
                                    : "rgba(25,118,210,0.95)",
                                  color: "white",
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  typography: "caption",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  border: "1px solid white",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                                }}
                              >
                                {willBeRemoved
                                  ? "⚠️ Will be deleted"
                                  : "📷 Existing"}
                              </Box>
                              {willBeRemoved && (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: "rgba(244,67,54,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      color: theme.palette.error.main,
                                      fontWeight: 700,
                                      textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                                    }}
                                  >
                                    MARKED FOR REMOVAL
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        );
                      })}

                    {/* Display new images */}
                    {imageUpload.previews.map((newImagePreview, index) => (
                      <Grid item xs={12} sm={6} md={4} key={`new-${index}`}>
                        <Box
                          sx={{
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: `2px solid ${theme.palette.success.main}`,
                            transition: "all 0.3s ease",
                          }}
                        >
                          <img
                            src={newImagePreview}
                            alt={`New image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: 200,
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            onClick={() => removeNewImage(index)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              backgroundColor: "rgba(244,67,54,0.9)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(244,67,54,1)",
                              },
                              width: 36,
                              height: 36,
                              border: "2px solid white",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                          {/* Status indicator for new images */}
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 8,
                              left: 8,
                              backgroundColor: "rgba(76,175,80,0.95)",
                              color: "white",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              typography: "caption",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              border: "1px solid white",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                            }}
                          >
                            ✨ New
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Changes Summary for Edit Mode */}
                {editDialogOpen && selectedSpecial && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      backgroundColor: theme.palette.background.default,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ mb: 1 }}
                    >
                      📝 Changes Summary:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {imageUpload.files.length > 0 && (
                        <Chip
                          icon={<Add />}
                          label={`${imageUpload.files.length} new image${
                            imageUpload.files.length > 1 ? "s" : ""
                          } to upload`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      )}
                      {formData.removeImages &&
                        formData.removeImages.length > 0 && (
                          <Chip
                            icon={<Close />}
                            label={`${formData.removeImages.length} image${
                              formData.removeImages.length > 1 ? "s" : ""
                            } to delete permanently`}
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        )}
                      {(() => {
                        const existingCount = formData.images?.length || 0;
                        const markedForRemovalCount =
                          formData.removeImages?.length || 0;
                        const newImagesCount = imageUpload.files.length;
                        const finalCount =
                          existingCount -
                          markedForRemovalCount +
                          newImagesCount;
                        return (
                          <Chip
                            label={`Final count: ${finalCount}/5 images`}
                            variant="outlined"
                            size="small"
                            color={finalCount === 0 ? "default" : "primary"}
                          />
                        );
                      })()}
                      {imageUpload.files.length === 0 &&
                        (!formData.removeImages ||
                          formData.removeImages.length === 0) && (
                          <Chip
                            label="No image changes"
                            variant="outlined"
                            size="small"
                          />
                        )}
                    </Box>
                  </Box>
                )}
              </Grid>
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
                !formData.description ||
                !formData.special_type ||
                (formData.special_type === "daily" &&
                  !formData.specialsDayId) ||
                (formData.special_type === "seasonal" &&
                  (!formData.name || !formData.seasonal_start_date))
              }
              sx={{ borderRadius: 2, px: 3 }}
            >
              {selectedSpecial ? "Update Special" : "Add Special"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          {selectedSpecial && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="h5" fontWeight={600}>
                    {selectedSpecial.special_type === "seasonal"
                      ? selectedSpecial.season_name || "Seasonal Special"
                      : selectedSpecial.special_type === "daily"
                      ? "Daily Special"
                      : "Late Night Special"}
                  </Typography>
                  <Chip
                    label={
                      selectedSpecial.special_type.charAt(0).toUpperCase() +
                      selectedSpecial.special_type.slice(1)
                    }
                    sx={{
                      backgroundColor: `${getSpecialTypeColor(
                        selectedSpecial.special_type
                      )}20`,
                      color: getSpecialTypeColor(selectedSpecial.special_type),
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  {/* Image Gallery Section */}
                  {selectedSpecial.image_urls &&
                    selectedSpecial.image_urls.length > 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mb: 2,
                            }}
                          >
                            <Typography variant="h6" fontWeight={600}>
                              Images ({selectedSpecial.image_urls.length})
                            </Typography>
                            {selectedSpecial.image_urls.length > 1 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Auto-swap:
                                </Typography>
                                <Switch
                                  checked={autoSwapEnabled}
                                  onChange={(e) =>
                                    setAutoSwapEnabled(e.target.checked)
                                  }
                                  size="small"
                                />
                              </Box>
                            )}
                          </Box>

                          {/* Main Image Display */}
                          <Box sx={{ position: "relative", mb: 2 }}>
                            <Box
                              component="img"
                              src={
                                selectedSpecial.image_urls[currentImageIndex]
                              }
                              alt={`Special image ${currentImageIndex + 1}`}
                              sx={{
                                width: "100%",
                                height: 300,
                                objectFit: "cover",
                                borderRadius: 2,
                                boxShadow: 2,
                              }}
                            />

                            {/* Navigation Arrows */}
                            {selectedSpecial.image_urls.length > 1 && (
                              <>
                                <IconButton
                                  onClick={() =>
                                    setCurrentImageIndex((prev) =>
                                      prev === 0
                                        ? (selectedSpecial.image_urls?.length ||
                                            1) - 1
                                        : prev - 1
                                    )
                                  }
                                  sx={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "rgba(0,0,0,0.7)",
                                    },
                                  }}
                                >
                                  <ChevronLeft />
                                </IconButton>
                                <IconButton
                                  onClick={() =>
                                    setCurrentImageIndex(
                                      (prev) =>
                                        (prev + 1) %
                                        (selectedSpecial.image_urls?.length ||
                                          1)
                                    )
                                  }
                                  sx={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "rgba(0,0,0,0.7)",
                                    },
                                  }}
                                >
                                  <ChevronRight />
                                </IconButton>

                                {/* Image Counter */}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    bottom: 8,
                                    right: 8,
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {currentImageIndex + 1} /{" "}
                                  {selectedSpecial.image_urls.length}
                                </Box>
                              </>
                            )}
                          </Box>

                          {/* Thumbnail Navigation */}
                          {selectedSpecial.image_urls.length > 1 && (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              {selectedSpecial.image_urls.map(
                                (imageUrl, index) => (
                                  <Box
                                    key={index}
                                    component="img"
                                    src={imageUrl}
                                    alt={`Thumbnail ${index + 1}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                    sx={{
                                      width: 60,
                                      height: 60,
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      cursor: "pointer",
                                      border:
                                        currentImageIndex === index
                                          ? "3px solid"
                                          : "2px solid",
                                      borderColor:
                                        currentImageIndex === index
                                          ? "primary.main"
                                          : "grey.300",
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        borderColor: "primary.main",
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  />
                                )
                              )}
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}

                  <Grid item xs={12}>
                    {selectedSpecial.description && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{ mb: 1 }}
                        >
                          Description
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {selectedSpecial.description}
                        </Typography>
                      </Box>
                    )}

                    {selectedSpecial.seasonal_start_datetime && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{ mb: 1 }}
                        >
                          Duration
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {new Date(
                            selectedSpecial.seasonal_start_datetime
                          ).toLocaleString()}
                          {selectedSpecial.seasonal_end_datetime &&
                            ` - ${new Date(
                              selectedSpecial.seasonal_end_datetime
                            ).toLocaleString()}`}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        Details
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Created: {formatDate(selectedSpecial.created_at)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Last Updated: {formatDate(selectedSpecial.updated_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Edited By:{" "}
                        {selectedSpecial.lastEditedByAdmin?.email || "System"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ borderRadius: 2 }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEdit(selectedSpecial);
                  }}
                  variant="contained"
                  startIcon={<Edit />}
                  sx={{ borderRadius: 2 }}
                >
                  Edit Special
                </Button>
              </DialogActions>
            </>
          )}
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
