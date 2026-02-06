import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Button,
  Box,
  Typography,
  IconButton,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";

const PlansFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    plan_name: "",
    description: "",
    plan_type: "",
    trial_type: "",
    price: { monthly: 0, yearly: 0 },
    billing_period: "",
    users_allowed: 1,
    organizations_allowed: 1,
    best_for: "",
    access_level: "",
    features: [],
    status: "active",
    mark_as_popular: false,
  });
  const [errors, setErrors] = useState({});
  const [features, setFeatures] = useState([]);

  // Validation functions (same as Antd rules)
  const validateForm = useCallback((data) => {
    const newErrors = {};

    // Plan name
    if (!data.plan_name?.trim()) {
      newErrors.plan_name = "Plan name is required";
    } else if (!/^[A-Za-z0-9\s]+$/.test(data.plan_name)) {
      newErrors.plan_name = "Only letters and numbers allowed";
    } else if (data.plan_name.length > 50) {
      newErrors.plan_name = "Maximum 50 characters allowed";
    }

    // Description
    if (data.description?.length > 200) {
      newErrors.description = "Max 200 characters";
    }

    // Required fields
    const requiredFields = {
      plan_type: "Plan type is required",
      trial_type: "Trial type is required",
      billing_period: "Billing period is required",
      users_allowed: "Users allowed is required",
      organizations_allowed: "Organizations allowed is required",
      best_for: "Best for is required",
      access_level: "Access level is required",
    };

    Object.entries(requiredFields).forEach(([key, message]) => {
      if (!data[key]?.toString().trim()) {
        newErrors[key] = message;
      }
    });

    // Price validation
    if (data.price?.monthly <= 0) {
      newErrors["price.monthly"] = "Value must be greater than 0";
    }
    if (data.price?.yearly <= 0) {
      newErrors["price.yearly"] = "Value must be greater than 0";
    }

    // Integer validation
    if (!Number.isInteger(Number(data.users_allowed)) || Number(data.users_allowed) <= 0) {
      newErrors.users_allowed = "Only whole numbers greater than 0";
    }
    if (!Number.isInteger(Number(data.organizations_allowed)) || Number(data.organizations_allowed) <= 0) {
      newErrors.organizations_allowed = "Only whole numbers greater than 0";
    }

    // Features validation
    if (!data.features?.length || data.features.some(f => !f?.trim())) {
      newErrors.features = "At least one feature is required";
    }

    return newErrors;
  }, []);

  // Set initial values
  useEffect(() => {
    if (!open) {
      setFormData({
        plan_name: "",
        description: "",
        plan_type: "",
        trial_type: "",
        price: { monthly: 0, yearly: 0 },
        billing_period: "",
        users_allowed: 1,
        organizations_allowed: 1,
        best_for: "",
        access_level: "",
        features: [],
        status: "active",
        mark_as_popular: false,
      });
      setFeatures([]);
      setErrors({});
      return;
    }

    if (initialValues) {
      const billingPeriod = Array.isArray(initialValues.billing_period)
        ? initialValues.billing_period[0]
        : initialValues.billing_period;

      const newData = {
        ...initialValues,
        price: {
          monthly: billingPeriod === "monthly" ? initialValues.price?.monthly || 0 : 0,
          yearly: billingPeriod === "yearly" ? initialValues.price?.yearly || 0 : 0,
        },
        features: initialValues.features ?? [],
        mark_as_popular: Boolean(initialValues.mark_as_popular),
        status: initialValues.status ?? "active",
      };
      setFormData(newData);
      setFeatures(initialValues.features ?? []);
    }
  }, [open, initialValues]);

  // Input handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handlePriceChange = useCallback((period, value) => {
    setFormData(prev => ({
      ...prev,
      price: { ...prev.price, [period]: Number(value) || 0 }
    }));
    if (errors[`price.${period}`]) {
      setErrors(prev => ({ ...prev, [`price.${period}`]: "" }));
    }
  }, [errors]);

  // Feature handlers
  const addFeature = useCallback(() => {
    const newFeatures = [...features, ""];
    setFeatures(newFeatures);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  }, [features]);

  const removeFeature = useCallback((index) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  }, [features]);

  const updateFeature = useCallback((index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  }, [features]);

  const handleSubmit = useCallback(() => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const billingPeriod = Array.isArray(formData.billing_period)
      ? formData.billing_period[0]
      : formData.billing_period;

    const payload = {
      ...formData,
      billing_period: billingPeriod ? [billingPeriod] : [],
      price: {
        monthly: billingPeriod === "monthly" ? Number(formData.price?.monthly || 0) : 0,
        yearly: billingPeriod === "yearly" ? Number(formData.price?.yearly || 0) : 0,
      },
    };

    onSubmit(payload, { 
      resetFields: () => {
        setFormData({
          plan_name: "",
          description: "",
          plan_type: "",
          trial_type: "",
          price: { monthly: 0, yearly: 0 },
          billing_period: "",
          users_allowed: 1,
          organizations_allowed: 1,
          best_for: "",
          access_level: "",
          features: [],
          status: "active",
          mark_as_popular: false,
        });
        setFeatures([]);
      } 
    });
  }, [formData, validateForm, onSubmit]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>{initialValues ? "Edit Plan" : "Create Plan"}</DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mt: 1 }}>
          {/* Plan Name */}
          <TextField
            value={formData.plan_name}
            onChange={(e) => handleInputChange("plan_name", e.target.value)}
            label="Plan Name"
            fullWidth
            margin="normal"
            error={!!errors.plan_name}
            helperText={errors.plan_name}
            placeholder="Enter plan name"
            required
          />

          {/* Description */}
          <TextField
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            error={!!errors.description}
            helperText={errors.description}
            placeholder="Enter description"
          />

          {/* Plan Type */}
          <FormControl fullWidth margin="normal" error={!!errors.plan_type}>
            <InputLabel>Plan Type</InputLabel>
            <Select
              value={formData.plan_type}
              onChange={(e) => handleInputChange("plan_type", e.target.value)}
              label="Plan Type"
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
            </Select>
            {errors.plan_type && (
              <Typography variant="caption" color="error">
                {errors.plan_type}
              </Typography>
            )}
          </FormControl>

          {/* Trial Type */}
          <FormControl fullWidth margin="normal" error={!!errors.trial_type}>
            <InputLabel>Trial Type</InputLabel>
            <Select
              value={formData.trial_type}
              onChange={(e) => handleInputChange("trial_type", e.target.value)}
              label="Trial Type"
            >
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
            {errors.trial_type && (
              <Typography variant="caption" color="error">
                {errors.trial_type}
              </Typography>
            )}
          </FormControl>

          {/* Price */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'red' }}>
              * Price
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  value={formData.price.monthly}
                  onChange={(e) => handlePriceChange("monthly", e.target.value)}
                  label="Monthly Price"
                  type="number"
                  fullWidth
                  error={!!errors["price.monthly"]}
                  helperText={errors["price.monthly"]}
                  inputProps={{ min: 1, step: "1" }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  value={formData.price.yearly}
                  onChange={(e) => handlePriceChange("yearly", e.target.value)}
                  label="Yearly Price"
                  type="number"
                  fullWidth
                  error={!!errors["price.yearly"]}
                  helperText={errors["price.yearly"]}
                  inputProps={{ min: 1, step: "1" }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Billing Period */}
          <FormControl fullWidth margin="normal" error={!!errors.billing_period}>
            <InputLabel>Billing Period</InputLabel>
            <Select
              value={formData.billing_period}
              onChange={(e) => handleInputChange("billing_period", e.target.value)}
              label="Billing Period"
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
            {errors.billing_period && (
              <Typography variant="caption" color="error">
                {errors.billing_period}
              </Typography>
            )}
          </FormControl>

          {/* Users Allowed */}
          <TextField
            value={formData.users_allowed}
            onChange={(e) => handleInputChange("users_allowed", Number(e.target.value))}
            label="Users Allowed"
            type="number"
            fullWidth
            margin="normal"
            error={!!errors.users_allowed}
            helperText={errors.users_allowed}
            inputProps={{ min: 1, step: "1" }}
          />

          {/* Organizations Allowed */}
          <TextField
            value={formData.organizations_allowed}
            onChange={(e) => handleInputChange("organizations_allowed", Number(e.target.value))}
            label="Organizations Allowed"
            type="number"
            fullWidth
            margin="normal"
            error={!!errors.organizations_allowed}
            helperText={errors.organizations_allowed}
            inputProps={{ min: 1, step: "1" }}
          />

          {/* Best For */}
          <TextField
            value={formData.best_for}
            onChange={(e) => handleInputChange("best_for", e.target.value)}
            label="Best For"
            fullWidth
            margin="normal"
            error={!!errors.best_for}
            helperText={errors.best_for}
            placeholder="e.g. Startups / Teams / 10 users"
          />

          {/* Access Level */}
          <FormControl fullWidth margin="normal" error={!!errors.access_level}>
            <InputLabel>Access Level</InputLabel>
            <Select
              value={formData.access_level}
              onChange={(e) => handleInputChange("access_level", e.target.value)}
              label="Access Level"
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="core">Core</MenuItem>
            </Select>
            {errors.access_level && (
              <Typography variant="caption" color="error">
                {errors.access_level}
              </Typography>
            )}
          </FormControl>

          {/* Features */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'red' }}>
              * Features
            </Typography>
            {features.map((feature, index) => (
              <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-end" }}>
                <TextField
                  fullWidth
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="Enter feature"
                  error={!!errors.features}
                  helperText={errors.features}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeFeature(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addFeature}
              fullWidth
              sx={{ mt: 1 }}
            >
              Add Feature
            </Button>
          </Box>

          {/* Status */}
          <FormControl fullWidth margin="normal" error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
            {errors.status && (
              <Typography variant="caption" color="error">
                {errors.status}
              </Typography>
            )}
          </FormControl>

          {/* Mark as Popular */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.mark_as_popular}
                onChange={(e) => handleInputChange("mark_as_popular", e.target.checked)}
              />
            }
            label="Mark as Popular"
            sx={{ mt: 2 }}
          />

          {/* Submit Buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : initialValues ? "Update Plan" : "Create Plan"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PlansFormModal;
