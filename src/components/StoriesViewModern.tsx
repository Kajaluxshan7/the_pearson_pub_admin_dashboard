import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Add,
  Search,
  FilterList,
  AutoStories,
  PhotoLibrary,
  Delete as DeleteIcon,
  CloudUpload,
  Close,
  Edit,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import apiService from "../services/api";
import { ModernTable } from "./ModernTables";
import { ConfirmDialog } from "./ConfirmDialog";
import { useNotification } from "../hooks/useNotification";

interface Story {
  id: string;
  story_name: string;
  description: string;
  images: string[];
  created_at: string;
  updated_at: string;
  lastEditedByAdmin?: {
    email: string;
  };
}

interface StoriesFormData {
  story_name: string;
  description: string;
  images: string[];
  removeImages: string[]; // Track individual existing images to be removed
  existingImages?: string[]; // Add this property to fix the error
}

interface ImageUploadState {
  files: File[];
  previews: string[];
}

const StoriesViewModern: React.FC = () => {
  const theme = useTheme();
  const { showError, showSuccess, showWarning } = useNotification();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  // Remove legacy snackbar state - now using useNotification

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // Form data
  const [formData, setFormData] = useState<StoriesFormData>({
    story_name: "",
    description: "",
    images: [],
    removeImages: [],
  });

  // Image upload state
  const [imageUpload, setImageUpload] = useState<ImageUploadState>({
    files: [],
    previews: [],
  });

  const fetchStories = React.useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchQuery) filters.search = searchQuery;

      const response = await apiService.get("/stories", {
        params: {
          page: page + 1,
          limit: pageSize,
          ...filters,
        },
      });
      setStories(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching stories:", error);
      showError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, showError]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Remove legacy showSnackbar function - now using useNotification exclusively

  const handleEdit = (story: Story) => {
    console.log("🔄 Edit - Story data:", story);
    setSelectedStory(story);

    // Combine all existing images from the story
    const existingImages: string[] = [];

    // Add images from the images array
    if (story.images && Array.isArray(story.images)) {
      story.images.forEach((imageUrl) => {
        if (imageUrl && !existingImages.includes(imageUrl)) {
          existingImages.push(imageUrl);
        }
      });
    }

    console.log(
      "🔄 Edit - Combined existingImages (no duplicates):",
      existingImages
    );

    setFormData({
      story_name: story.story_name,
      description: story.description || "",
      images: existingImages, // Show existing images
      removeImages: [], // Initialize empty array for images to remove
    });

    // Reset image upload state for new images
    setImageUpload({
      files: [],
      previews: [],
    });

    console.log("✅ Edit mode initialized");
    setEditDialogOpen(true);
  };

  const handleDelete = (story: Story) => {
    setStoryToDelete(story);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;

    try {
      await apiService.delete(`/stories/${storyToDelete.id}`);
      showSuccess("Story deleted successfully");
      setConfirmDialogOpen(false);
      setStoryToDelete(null);
      fetchStories();
    } catch (error: unknown) {
      console.error("Error deleting story:", error);
      showError(error as Error);
    }
  };

  const handleView = (story: Story) => {
    setSelectedStory(story);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.story_name.trim()) {
        showWarning("Story name is required");
        return;
      }

      console.log("🔄 Frontend - Form data before processing:", formData);
      console.log("🔄 Frontend - Image upload state:", imageUpload);

      // For edit mode, always include existing images information
      let removeImages: string[] = [];
      let existingImages: string[] = [];

      if (editDialogOpen && formData.images) {
        // In edit mode, we need to be explicit about which images to keep and remove
        removeImages = formData.removeImages || [];
        existingImages = formData.images.filter(
          (imageUrl) => !removeImages.includes(imageUrl)
        );

        console.log("🔄 Frontend - Edit mode image management:");
        console.log("  - Original images:", formData.images);
        console.log("  - Images to remove:", removeImages);
        console.log("  - Images to keep:", existingImages);
      }

      const baseData: StoriesFormData = {
        story_name: formData.story_name,
        description: formData.description,
        images: formData.images || [],
        removeImages: formData.removeImages || [],
        ...(editDialogOpen && {
          removeImages: removeImages.length > 0 ? removeImages : [],
        }),
      };

      // Get all selected image files for upload (support up to 5 images)
      const imagesToUpload =
        imageUpload.files.length > 0 ? imageUpload.files : undefined;

      console.log("🔄 Frontend - Sending data:", baseData);
      console.log(
        "🔄 Frontend - Images to upload:",
        imagesToUpload ? imagesToUpload.length : 0
      );

      if (addDialogOpen) {
        // For create, use the service method with files
        const newStory = await handleCreateStory(baseData, imagesToUpload);
        console.log("✅ Frontend - Created story received:", newStory);
        showSuccess("Story created successfully");
      } else if (editDialogOpen && selectedStory) {
        if (!selectedStory.id) {
          showError(new Error("Invalid story ID"));
          return;
        }

        // For update, use the service method with advanced image management
        const updatedStory = await handleUpdateStory(
          selectedStory.id,
          baseData,
          imagesToUpload
        );
        console.log("✅ Frontend - Updated story received:", updatedStory);

        // Update the selectedStory state to reflect the changes immediately
        setSelectedStory(updatedStory);

        showSuccess("Story updated successfully");
      }

      setAddDialogOpen(false);
      setEditDialogOpen(false);
      resetForm();
      fetchStories();
    } catch (error) {
      console.error("Error saving story:", error);
      showError(error as Error);
    }
  };

  const handleCreateStory = async (
    data: StoriesFormData,
    imageFiles?: File[]
  ) => {
    const formData = new FormData();
    formData.append("story_name", data.story_name);
    formData.append("description", data.description || "");

    // Add new image files
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });
    }

    const response = await apiService.post("/stories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  };

  const handleUpdateStory = async (
    storyId: string,
    data: StoriesFormData,
    imageFiles?: File[]
  ) => {
    const formData = new FormData();
    formData.append("story_name", data.story_name);
    formData.append("description", data.description || "");

    // Add existing images to keep
    if (data.existingImages && Array.isArray(data.existingImages)) {
      data.existingImages.forEach((imageUrl: string) => {
        formData.append("existingImages[]", imageUrl);
      });
    }

    // Add images to remove
    if (data.removeImages && Array.isArray(data.removeImages)) {
      data.removeImages.forEach((imageUrl: string) => {
        formData.append("removeImages[]", imageUrl);
      });
    }

    // Add new image files
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });
    }

    const response = await apiService.patch(`/stories/${storyId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  };

  const resetForm = () => {
    setFormData({
      story_name: "",
      description: "",
      images: [],
      removeImages: [],
    });
    setSelectedStory(null);

    // Reset image upload state
    setImageUpload({
      files: [],
      previews: [],
    });

    console.log("✅ Form reset completed");
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);

      // Calculate current total image count
      const existingImageCount = formData.images?.length || 0;
      const currentNewImageCount = imageUpload.files.length;
      const totalCurrentImages = existingImageCount + currentNewImageCount;

      if (totalCurrentImages + files.length > 5) {
        showError(
          new Error(
            `Maximum 5 images allowed. You currently have ${totalCurrentImages} images.`
          )
        );
        return;
      }

      // Validate each file
      for (const file of files) {
        if (file.size > 1024 * 1024) {
          showError(new Error(`File ${file.name} exceeds 1MB limit`));
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
          showError(new Error(`File ${file.name} is not a valid image type`));
          return;
        }
      }

      // Update image upload state (primary state)
      setImageUpload((prev) => ({
        files: [...prev.files, ...files],
        previews: [
          ...prev.previews,
          ...files.map((file) => URL.createObjectURL(file)),
        ],
      }));

      console.log("✅ Images added to upload state:", files.length);
    }
    event.target.value = "";
  };

  const removeImagePreview = (index: number) => {
    // Remove from new image upload state (primary state)
    setImageUpload((prev) => ({
      files: prev.files.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index),
    }));

    console.log("✅ Image preview removed at index:", index);
  };

  const removeExistingImage = (imageUrl: string) => {
    // For existing images, toggle individual removal state
    const currentRemoveList = formData.removeImages || [];
    const isAlreadyMarkedForRemoval = currentRemoveList.includes(imageUrl);

    let newRemoveList;
    if (isAlreadyMarkedForRemoval) {
      // Remove from removal list (unmark for removal)
      newRemoveList = currentRemoveList.filter((url) => url !== imageUrl);
      showSuccess("Image unmarked for removal");
    } else {
      // Add to removal list (mark for removal)
      newRemoveList = [...currentRemoveList, imageUrl];
      showWarning(
        "Image marked for removal - click Update to delete permanently"
      );
    }

    setFormData((prevForm) => ({ ...prevForm, removeImages: newRemoveList }));
  };

  const columns = [
    {
      id: "story_name",
      label: "Story Name",
      minWidth: 200,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoStories sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "images",
      label: "Images",
      minWidth: 120,
      format: (value: string[]) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PhotoLibrary sx={{ fontSize: 18, color: "primary.main" }} />
          <Chip
            label={`${value?.length || 0} image${
              value?.length !== 1 ? "s" : ""
            }`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
        </Box>
      ),
    },
    {
      id: "description",
      label: "Description",
      minWidth: 300,
      format: (value: string) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 300,
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
      id: "created_at",
      label: "Created",
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(value).toLocaleDateString()}
        </Typography>
      ),
    },
  ];

  const clearFilters = () => {
    setSearchQuery("");
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
            Stories Management
          </Typography>
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
            Add Story
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search stories..."
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
            <Grid item xs={12} md={4}>
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
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Data Table */}
        <ModernTable
          columns={columns}
          data={stories}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          title="Stories"
          emptyMessage="No stories found"
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={confirmDialogOpen}
          title="Delete Story"
          message={`Are you sure you want to delete "${storyToDelete?.story_name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setConfirmDialogOpen(false);
            setStoryToDelete(null);
          }}
          severity="error"
          confirmText="Delete"
        />

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
            {addDialogOpen ? "Add New Story" : "Edit Story"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Story Name"
                  value={formData.story_name}
                  onChange={(e) =>
                    setFormData({ ...formData, story_name: e.target.value })
                  }
                  required
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

              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Images (Max 5, each max 1MB)
                </Typography>

                {/* Existing Images */}
                {editDialogOpen &&
                  formData.images &&
                  formData.images.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Current Images ({formData.images.length}/5):
                      </Typography>
                      <Grid container spacing={2}>
                        {formData.images.map((imageUrl, index) => {
                          const willBeRemoved =
                            formData.removeImages?.includes(imageUrl) || false;

                          return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
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
                                  src={imageUrl}
                                  alt={`Story image ${index + 1}`}
                                  style={{
                                    width: "100%",
                                    height: 200,
                                    objectFit: "cover",
                                  }}
                                />
                                <IconButton
                                  onClick={() => removeExistingImage(imageUrl)}
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
                                        textShadow:
                                          "1px 1px 2px rgba(0,0,0,0.5)",
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
                      </Grid>
                    </Box>
                  )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                    disabled={(() => {
                      const currentExistingCount = formData.images?.length || 0;
                      const markedForRemovalCount =
                        formData.removeImages?.length || 0;
                      const finalExistingCount =
                        currentExistingCount - markedForRemovalCount;
                      const totalAfterChanges =
                        finalExistingCount + imageUpload.files.length;
                      return totalAfterChanges >= 5;
                    })()}
                  >
                    {(() => {
                      const currentExistingCount = formData.images?.length || 0;
                      const markedForRemovalCount =
                        formData.removeImages?.length || 0;
                      const finalExistingCount =
                        currentExistingCount - markedForRemovalCount;
                      const totalAfterChanges =
                        finalExistingCount + imageUpload.files.length;

                      if (totalAfterChanges >= 5) {
                        return "Maximum 5 images reached";
                      }

                      if (markedForRemovalCount > 0) {
                        return `Select Images (${totalAfterChanges}/5) - ${markedForRemovalCount} marked for removal`;
                      }

                      return `Select Images (${totalAfterChanges}/5)`;
                    })()}
                  </Button>
                </label>
                {/* Image Previews */}
                {imageUpload.previews.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      New Images ({imageUpload.previews.length}/5):
                    </Typography>
                    <Grid container spacing={2}>
                      {imageUpload.previews.map((url, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box sx={{ position: "relative" }}>
                            <Card
                              sx={{
                                border: `2px solid ${theme.palette.success.main}`,
                                borderRadius: 2,
                                overflow: "hidden",
                                transition: "all 0.3s ease",
                              }}
                            >
                              <CardMedia
                                component="img"
                                height="140"
                                image={url}
                                alt={`Preview ${index + 1}`}
                                sx={{ objectFit: "cover" }}
                              />
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => removeImagePreview(index)}
                                  sx={{
                                    backgroundColor: "rgba(244,67,54,0.9)",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "rgba(244,67,54,1)",
                                    },
                                    width: 32,
                                    height: 32,
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 8,
                                  left: 8,
                                  backgroundColor: "rgba(76,175,80,0.9)",
                                  color: "white",
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  typography: "caption",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                }}
                              >
                                New #{index + 1}
                              </Box>
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
                                  typography: "caption",
                                  fontSize: "0.7rem",
                                  fontWeight: 500,
                                  maxWidth: 120,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {imageUpload.files[index]?.name}
                              </Box>
                            </Card>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
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
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!formData.story_name.trim()}
            >
              {addDialogOpen ? "Create" : "Update"}
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
          {selectedStory && (
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
                    {selectedStory.story_name}
                  </Typography>
                  <Chip
                    label={`${selectedStory.images?.length || 0} Image${
                      selectedStory.images?.length !== 1 ? "s" : ""
                    }`}
                    sx={{
                      backgroundColor: `${theme.palette.primary.main}20`,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  {/* Images Section */}
                  {selectedStory.images && selectedStory.images.length > 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{ mb: 2 }}
                        >
                          Images ({selectedStory.images.length})
                        </Typography>
                        <Grid container spacing={2}>
                          {selectedStory.images.map((imageUrl, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Box
                                sx={{
                                  position: "relative",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  border: `1px solid ${theme.palette.divider}`,
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    transform: "scale(1.02)",
                                    boxShadow: theme.shadows[8],
                                  },
                                }}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Story image ${index + 1}`}
                                  style={{
                                    width: "100%",
                                    height: 200,
                                    objectFit: "cover",
                                  }}
                                />
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
                                    typography: "caption",
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  #{index + 1}
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    {selectedStory.description && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{ mb: 1 }}
                        >
                          Description
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {selectedStory.description}
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
                        Created:{" "}
                        {new Date(selectedStory.created_at).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Last Updated:{" "}
                        {new Date(selectedStory.updated_at).toLocaleString()}
                      </Typography>
                      {selectedStory.lastEditedByAdmin && (
                        <Typography variant="body2" color="text.secondary">
                          Last Edited By:{" "}
                          {selectedStory.lastEditedByAdmin.email}
                        </Typography>
                      )}
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
                    handleEdit(selectedStory);
                  }}
                  variant="contained"
                  startIcon={<Edit />}
                  sx={{ borderRadius: 2 }}
                >
                  Edit Story
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default StoriesViewModern;
