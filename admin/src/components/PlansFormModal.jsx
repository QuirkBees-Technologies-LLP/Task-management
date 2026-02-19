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

import { useEffect, useState, useCallback } from "react";

import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const defaultFormState = {
  plan_name: "",
  type: "normal", // 'normal' | 'add-on'
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
};

const PlansFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [features, setFeatures] = useState([]);

  /* -------------------- Validation -------------------- */

  const validateForm = useCallback((data) => {
    const newErrors = {};

    if (!data.plan_name?.trim()) {
      newErrors.plan_name = "Plan name is required";
    } else if (!/^[A-Za-z0-9\s]+$/.test(data.plan_name)) {
      newErrors.plan_name = "Only letters and numbers allowed";
    } else if (data.plan_name.length > 50) {
      newErrors.plan_name = "Maximum 50 characters allowed";
    }

    if (data.description?.length > 200) {
      newErrors.description = "Max 200 characters";
    }

    const requiredFields = {
      plan_type: "Plan classification is required",
      billing_period: "Billing period is required",
      users_allowed: "Users allowed is required",
      organizations_allowed: "Organizations allowed is required",
    };

    if (data.type === 'normal') {
        requiredFields.trial_type = "Trial type is required";
        requiredFields.access_level = "Access level is required";
        requiredFields.best_for = "Best for is required";
    }

    Object.entries(requiredFields).forEach(([key, message]) => {
      if (!data[key]?.toString().trim()) {
        newErrors[key] = message;
      }
    });

    const isMonthly = data.billing_period === "monthly" || data.billing_period === "both";
    const isYearly = data.billing_period === "yearly" || data.billing_period === "both";

    if (isMonthly && data.price?.monthly <= 0) {
      newErrors["price.monthly"] = "Must be greater than 0";
    }

    if (isYearly && data.price?.yearly <= 0) {
      newErrors["price.yearly"] = "Must be greater than 0";
    }

    
    if (!Number.isInteger(Number(data.users_allowed))) {
         newErrors.users_allowed = "Must be a whole number";
    } else if (data.users_allowed === 0) {
         newErrors.users_allowed = "Must be non-zero (-1 for unlimited)";
    }

    if (
      !Number.isInteger(Number(data.organizations_allowed))
    ) {
      newErrors.organizations_allowed = "Must be a whole number";
    }

    if (data.type === "normal" && (!data.features?.length || data.features.some((f) => !f?.trim()))) {
      newErrors.features = "At least one feature is required";
    }

    return newErrors;
  }, []);

  /* -------------------- Effects -------------------- */

  useEffect(() => {
    if (!open) {
      setFormData(defaultFormState);
      setFeatures([]);
      setErrors({});
      return;
    }

    if (initialValues) {
      let bp = "";
      if (
        Array.isArray(initialValues.billing_period) &&
        initialValues.billing_period.length > 0
      ) {
        if (
          initialValues.billing_period.includes("monthly") &&
          initialValues.billing_period.includes("yearly")
        ) {
          bp = "both";
        } else {
          bp = initialValues.billing_period[0];
        }
      }

      setFormData({
        ...defaultFormState,
        ...initialValues,
        type: initialValues.type || "normal",
        best_for: initialValues.best_for || "",
        billing_period: bp,
        price: {
          monthly: initialValues.price?.monthly || 0,
          yearly: initialValues.price?.yearly || 0,
        },
        features: initialValues.features || [],
        status: initialValues.status || "active",
        mark_as_popular: Boolean(initialValues.mark_as_popular),
      });

      setFeatures(initialValues.features || []);
    }
  }, [open, initialValues]);

  /* -------------------- Handlers -------------------- */

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handlePriceChange = useCallback((period, value) => {
    setFormData((prev) => ({
      ...prev,
      price: {
        ...prev.price,
        [period]: Number(value) || 0,
      },
    }));
  }, []);

  const addFeature = () => {
    const updated = [...features, ""];
    setFeatures(updated);
    setFormData((p) => ({ ...p, features: updated }));
  };

  const removeFeature = (index) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated);
    setFormData((p) => ({ ...p, features: updated }));
  };

  const updateFeature = (index, value) => {
    const updated = [...features];
    updated[index] = value;

    setFeatures(updated);
    setFormData((p) => ({ ...p, features: updated }));
  };

  /* -------------------- Submit -------------------- */

  const handleSubmit = useCallback(() => {
    const validationErrors = validateForm(formData);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      ...formData,
      type: formData.type,
      price: {
        monthly: Number(formData.price.monthly || 0),
        yearly: Number(formData.price.yearly || 0),
      },
      ...(formData.type === 'add-on' ? {
          trial_type: [],
          access_level: [],
          best_for: '',
      } : {})
    };

    onSubmit(payload);

  }, [formData, validateForm, onSubmit]);

  /* -------------------- UI -------------------- */

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialValues ? "Edit Plan" : "Create Plan"}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box>

          {/* Plan Name */}
          <TextField
            fullWidth
            margin="normal"
            label="Plan Name"
            value={formData.plan_name}
            onChange={(e) =>
              handleInputChange("plan_name", e.target.value)
            }
            error={!!errors.plan_name}
            helperText={errors.plan_name}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => handleInputChange("type", e.target.value)}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="add-on">Add-on</MenuItem>
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              handleInputChange("description", e.target.value)
            }
            error={!!errors.description}
            helperText={errors.description}
          />

          <FormControl fullWidth margin="normal" error={!!errors.plan_type}>
            <InputLabel>Classification</InputLabel>
            <Select
              value={formData.plan_type}
              label="Classification"
              onChange={(e) =>
                handleInputChange("plan_type", e.target.value)
              }
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
            </Select>
          </FormControl>

          {formData.type === 'normal' && (
              <FormControl fullWidth margin="normal" error={!!errors.trial_type}>
                <InputLabel>Trial Type</InputLabel>
                <Select
                  value={formData.trial_type}
                  label="Trial Type"
                  onChange={(e) =>
                    handleInputChange("trial_type", e.target.value)
                  }
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
          )}

          {/* Price */}
          <Box mt={2}>
            <Typography variant="subtitle2" color="error">
              * Price
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monthly"
                  value={formData.price.monthly}
                  onChange={(e) =>
                    handlePriceChange("monthly", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        $
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Yearly"
                  value={formData.price.yearly}
                  onChange={(e) =>
                    handlePriceChange("yearly", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        $
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Billing Period */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Billing Period</InputLabel>
            <Select
              value={formData.billing_period}
              label="Billing Period"
              onChange={(e) =>
                handleInputChange("billing_period", e.target.value)
              }
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </Select>
          </FormControl>

          {/* Users */}
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label={formData.type === 'add-on' ? "User Limit Increment" : "Users Allowed (-1 for Unlimited)"}
            value={formData.users_allowed}
            onChange={(e) =>
              handleInputChange("users_allowed", Number(e.target.value))
            }
            error={!!errors.users_allowed}
            helperText={errors.users_allowed}
          />

          {/* Organisations */}
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label={formData.type === 'add-on' ? "Org Limit Increment" : "Organizations Allowed (-1 for Unlimited)"}
            value={formData.organizations_allowed}
            onChange={(e) =>
              handleInputChange(
                "organizations_allowed",
                Number(e.target.value)
              )
            }
            error={!!errors.organizations_allowed}
            helperText={errors.organizations_allowed}
          />

          {/* Best For */}
          {formData.type === 'normal' && (
              <TextField
                fullWidth
                margin="normal"
                label="Best For"
                value={formData.best_for}
                onChange={(e) =>
                  handleInputChange("best_for", e.target.value)
                }
              />
          )}

          {/* Access */}
          {formData.type === 'normal' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={formData.access_level}
                  label="Access Level"
                  onChange={(e) =>
                    handleInputChange("access_level", e.target.value)
                  }
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="core">Core</MenuItem>
                </Select>
              </FormControl>
          )}

          {/* Features */}
          <Box mt={2}>
            <Typography variant="subtitle2" color="error">
              * Features
            </Typography>

            {features.map((f, i) => (
              <Box
                key={i}
                display="flex"
                gap={1}
                alignItems="center"
                mb={1}
              >
                <TextField
                  fullWidth
                  value={f}
                  onChange={(e) =>
                    updateFeature(i, e.target.value)
                  }
                />

                <IconButton
                  color="error"
                  onClick={() => removeFeature(i)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addFeature}
            >
              Add Feature
            </Button>
          </Box>

          {/* Status */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) =>
                handleInputChange("status", e.target.value)
              }
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          {/* Popular */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.mark_as_popular}
                onChange={(e) =>
                  handleInputChange(
                    "mark_as_popular",
                    e.target.checked
                  )
                }
              />
            }
            label="Mark as Popular"
          />

          {/* Buttons */}
          <Box
            display="flex"
            justifyContent="flex-end"
            gap={2}
            mt={3}
          >
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : initialValues
                ? "Update Plan"
                : "Create Plan"}
            </Button>
          </Box>

        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PlansFormModal;
