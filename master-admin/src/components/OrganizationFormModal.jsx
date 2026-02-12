import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import CommonSelect from "./CommonSelect";
import { plansAPI, organizationAPI } from "../services/api";

const OrganizationFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const isEditing = Boolean(initialValues?._id);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    firstName: "",
    lastName: "",
    email: "",
    planId: "",
    ownerPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [slugStatus, setSlugStatus] = useState(null);
  const [slugHelp, setSlugHelp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  /* -------------------- Slug Validation (MOVED FIRST) -------------------- */
  const handleSlugChange = useCallback(async (value) => {
    setSlugStatus(null);
    setSlugHelp("");

    if (!value) return;

    try {
      await organizationAPI.checkSlug(value);
      setSlugStatus("success");
      setSlugHelp("Slug is available");
    } catch (err) {
      if (
        err?.response?.data?.error ===
        "Organization with this slug already exists"
      ) {
        setSlugStatus("error");
        setSlugHelp("This slug is already in use");
      }
    }
  }, []);

  /* -------------------- Populate Form -------------------- */
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        slug: "",
        firstName: "",
        lastName: "",
        email: "",
        planId: "",
        ownerPassword: "",
      });
      setErrors({});
      setSlugStatus(null);
      setSlugHelp("");
      setTouched({});
      return;
    }

    if (isEditing && initialValues) {
      setFormData({
        name: initialValues.name || "",
        slug: initialValues.slug || "",
        firstName: initialValues.firstName || "",
        lastName: initialValues.lastName || "",
        email: initialValues.email || "",
        planId: initialValues.planId || "",
        ownerPassword: "",
      });
    }
  }, [open, isEditing, initialValues]);

  /* -------------------- Validation -------------------- */
  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    // No numbers rule
    const noNumberRule = /^[A-Za-z\s]+$/;
    if (["name", "slug", "firstName", "lastName"].includes(name)) {
      if (!value) {
        newErrors[name] = `${name.replace(/([A-Z])/g, ' $1').trim()} is required`;
      } else if (!noNumberRule.test(value)) {
        newErrors[name] = "This field must not contain numbers";
      } else {
        delete newErrors[name];
      }
    }
    
    // Email validation
    if (name === "email") {
      if (!value) {
        newErrors[name] = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[name] = "Invalid email";
      } else {
        delete newErrors[name];
      }
    }
    
    // Plan validation
    if (name === "planId") {
      if (!value) {
        newErrors[name] = "Please select a plan";
      } else {
        delete newErrors[name];
      }
    }
    
    // Password validation (create only)
    if (name === "ownerPassword" && !isEditing) {
      if (!value) {
        newErrors[name] = "Password is required";
      } else {
        delete newErrors[name];
      }
    }

    setErrors(newErrors);
  }, [errors, isEditing]);

  const handleInputChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    validateField(field, value);
    
    // Slug validation - NOW SAFE
    if (field === "slug") {
      handleSlugChange(value);
    }
  }, [validateField, handleSlugChange]); // ✅ Dependencies in correct order

  /* -------------------- Form Submit -------------------- */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (!isEditing && key === "ownerPassword") {
        validateField(key, formData[key]);
      } else if (key !== "ownerPassword" || !isEditing) {
        validateField(key, formData[key]);
      }
    });

    // Check for errors
    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit(formData, {
      resetFields: () => {
        setFormData({
          name: "",
          slug: "",
          firstName: "",
          lastName: "",
          email: "",
          planId: "",
          ownerPassword: "",
        });
        setErrors({});
        setTouched({});
      },
      setFields: () => {},
    });
  }, [formData, onSubmit, validateField, isEditing]);

  const handleCancel = useCallback(() => {
    setFormData({
      name: "",
      slug: "",
      firstName: "",
      lastName: "",
      email: "",
      planId: "",
      ownerPassword: "",
    });
    setErrors({});
    setTouched({});
    setSlugStatus(null);
    setSlugHelp("");
    onCancel();
  }, [onCancel]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? "Edit Organization" : "Add Organization"}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* Company Name - Label + Input */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
              Company Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              value={formData.name}
              onChange={handleInputChange("name")}
              fullWidth
              size="small"
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
              sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }}
            />
          </Box>

          {/* Company Slug - Label + Input */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
              Company Slug <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              value={formData.slug}
              onChange={handleInputChange("slug")}
              fullWidth
              size="small"
              error={(touched.slug && !!errors.slug) || slugStatus === "error"}
              helperText={
                slugStatus === "success"
                  ? slugHelp
                  : slugStatus === "error"
                  ? slugHelp
                  : touched.slug && errors.slug
              }
              sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }}
              InputProps={{
                endAdornment: slugStatus && (
                  <InputAdornment position="end">
                    <CircularProgress size={16} color={slugStatus} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Owner First Name - Label + Input */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
              Owner First Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              value={formData.firstName}
              onChange={handleInputChange("firstName")}
              fullWidth
              size="small"
              error={touched.firstName && !!errors.firstName}
              helperText={touched.firstName && errors.firstName}
              sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }}
            />
          </Box>

          {/* Owner Last Name - Label + Input */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
              Owner Last Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              value={formData.lastName}
              onChange={handleInputChange("lastName")}
              fullWidth
              size="small"
              error={touched.lastName && !!errors.lastName}
              helperText={touched.lastName && errors.lastName}
              sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }}
            />
          </Box>

          {/* Owner Email - Label + Input */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
              Owner Email <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              fullWidth
              size="small"
              error={touched.email && !!errors.email}
              helperText={touched.email && errors.email}
              sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }}
            />
          </Box>

          {/* Owner Password (Create only) - Label + Input */}
          {!isEditing && (
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
                Owner Password <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                type={showPassword ? "text" : "password"}
                value={formData.ownerPassword}
                onChange={handleInputChange("ownerPassword")}
                fullWidth
                size="small"
                error={touched.ownerPassword && !!errors.ownerPassword}
                helperText={touched.ownerPassword && errors.ownerPassword}
                sx={{ "& .MuiInputBase-root": { borderRadius: 1 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {/* Plan Select - Label + Input */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
              Select Plan <span style={{ color: "red" }}>*</span>
            </Typography>
            <CommonSelect
              value={formData.planId}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, planId: value }));
                validateField("planId", value);
              }}
              placeholder="Select a plan"
              fetcher={async () => {
                const res = await plansAPI.list();
                return res.data?.plans || [];
              }}
              filterFn={(plan) => plan.status === "active"}
              mapOption={(plan) => ({
                label: plan.plan_name,
                value: plan._id,
              })}
            />
            {touched.planId && errors.planId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                {errors.planId}
              </Typography>
            )}
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 140 }}
              startIcon={loading && <CircularProgress size={16} />}
            >
              {loading
                ? isEditing
                  ? "Update Organization"
                  : "Create Organization"
                : isEditing
                ? "Update Company"
                : "Add Company"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationFormModal;
