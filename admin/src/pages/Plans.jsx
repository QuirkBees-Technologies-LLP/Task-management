import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Box,
  Switch,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
  Stack,
  Typography,
  Popover,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { plansAPI } from "../services/api";
import PlansFormModal from "../components/PlansFormModal";
import DebouncedSearch from "../components/debouncedSearch";

const PAGE_SIZE = 10;

const Plans = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [data, setData] = useState([]);
  const [rowCount, setRowCount] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [search, setSearch] = useState("");

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: PAGE_SIZE,
  });

  /* ---------------- Snackbar ---------------- */
  const [toast, setToast] = useState({
    open: false,
    text: "",
    type: "success",
  });

  const notify = (text, type = "success") =>
    setToast({ open: true, text, type });

  /* ---------------- Delete Popover ---------------- */
  const [deleteAnchorEl, setDeleteAnchorEl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------------- Fetch Plans ---------------- */
  const fetchPlans = useCallback(
    async (page = 1, limit = PAGE_SIZE, searchTerm = "") => {
      try {
        setLoading(true);
        const res = await plansAPI.list({ page, limit, search: searchTerm });
        setData(res?.data?.plans ?? []);
        setRowCount(res?.data?.total ?? 0);
      } catch {
        notify("Failed to load plans", "error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPlans(
      paginationModel.page + 1,
      paginationModel.pageSize,
      search,
    );
  }, [fetchPlans, paginationModel, search]);

  /* ---------------- Search ---------------- */
  const handleSearch = useCallback((value) => {
    setSearch(value || "");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  /* ---------------- Toggle Status ---------------- */
  const toggleStatus = useCallback(async (row) => {
    try {
      setTogglingId(row._id);
      const newStatus = row.status === "active" ? "inactive" : "active";
      await plansAPI.update(row._id, { status: newStatus });
      notify(`Plan ${newStatus}d successfully`);
      fetchPlans(paginationModel.page + 1, paginationModel.pageSize, search);
    } catch {
      notify("Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  }, [fetchPlans, paginationModel, search]);

  /* ---------------- Edit Modal ---------------- */
  const openEditModal = useCallback((row) => {
    setIsEditing(true);
    setEditInitialValues(row);
    setOpen(true);
  }, []);

  /* ---------------- Delete Handler ---------------- */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget?._id) return;
    try {
      await plansAPI.delete(deleteTarget._id);
      notify("Plan deleted successfully");
      setDeleteAnchorEl(null);
      setDeleteTarget(null);
      fetchPlans(paginationModel.page + 1, paginationModel.pageSize, search);
    } catch {
      notify("Failed to delete plan", "error");
    }
  }, [deleteTarget, fetchPlans, paginationModel, search]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteAnchorEl(null);
    setDeleteTarget(null);
  }, []);

  /* ---------------- Submit ---------------- */
  const handleSubmit = useCallback(
    async (values, form) => {
      try {
        setSubmitLoading(true);

        const normalize = (v) =>
          Array.isArray(v) ? v : v ? [v] : [];

        const payload = {
          plan_name: values.plan_name,
          type: values.type || "normal", // Add type field
          description: values.description || "",
          price: {
            monthly: values.price?.monthly ?? null,
            yearly: values.price?.yearly ?? null,
          },
          billing_period: values.billing_period,
          features: normalize(values.features),
          mark_as_popular: Boolean(values.mark_as_popular),
          status: values.status || "active",
          plan_type: normalize(values.plan_type),
          trial_type: normalize(values.trial_type),
          access_level: normalize(values.access_level),
          users_allowed: Number(values.users_allowed || 0),
          organizations_allowed: Number(
            values.organizations_allowed || 0,
          ),
          best_for: values.best_for || "",
        };

        if (isEditing && editInitialValues?._id) {
          await plansAPI.update(editInitialValues._id, payload);
          notify("Plan updated successfully");
        } else {
          await plansAPI.create(payload);
          notify("Plan created successfully");
        }

        setOpen(false);
        setIsEditing(false);
        setEditInitialValues(null);
        fetchPlans(
          paginationModel.page + 1,
          paginationModel.pageSize,
          search,
        );
        form?.resetFields?.();
      } catch (err) {
        notify(
          err?.response?.data?.message || "Operation failed",
          "error",
        );
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      isEditing,
      editInitialValues,
      fetchPlans,
      paginationModel,
      search,
    ],
  );

  /* ---------------- Columns ---------------- */
  const columns = useMemo(
    () => [
      {
        field: "plan_name",
        headerName: "Plan Name",
        flex: 1.6,
        minWidth: 160,
      },
      {
        field: "type",
        headerName: "Type",
        flex: 0.8,
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
            <Chip 
                label={value === 'add-on' ? 'Add-on' : 'Normal'} 
                color={value === 'add-on' ? 'secondary' : 'primary'} 
                size="small" 
                variant="outlined" 
            />
        )
      },
      {
        field: "plan_type",
        headerName: "Classification",
        flex: 1,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="center"
            flexWrap="wrap"
          >
            {value?.length
              ? value.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    size="small"
                    sx={{
                      bgcolor: "#f3e5f5",
                      color: "#7b1fa2",
                      height: 22,
                      fontSize: "0.75rem",
                    }}
                  />
                ))
              : <Chip label="-" size="small" />}
          </Stack>
        ),
      },
      {
        field: "trial_type",
        headerName: "Trial",
        flex: 1,
        minWidth: 110,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            {value?.length
              ? value.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    size="small"
                    sx={{
                      bgcolor:
                        v === "free" ? "#e8f5e9" : "#fff3e0",
                      color:
                        v === "free" ? "#2e7d32" : "#ef6c00",
                      height: 22,
                      fontSize: "0.75rem",
                    }}
                  />
                ))
              : <Chip label="-" size="small" />}
          </Stack>
        ),
      },
      {
        field: "price",
        headerName: "Price",
        flex: 0.8,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => {
          const period = Array.isArray(row.billing_period)
            ? row.billing_period[0]
            : row.billing_period || "monthly";
          return row.price?.[period]
            ? `$${row.price[period]}`
            : "-";
        },
      },
      {
        field: "users_allowed",
        headerName: "Users",
        flex: 0.6,
        minWidth: 70,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row, value }) => (
          <Chip label={row.type === 'add-on' ? `+${value}` : value} size="small" />
        ),
      },
      {
        field: "access_level",
        headerName: "Access",
        flex: 1,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="center"
            flexWrap="wrap"
          >
            {value?.length
              ? value.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    size="small"
                    sx={{
                      bgcolor: "#e3f2fd",
                      color: "#1976d2",
                      height: 22,
                      fontSize: "0.75rem",
                    }}
                  />
                ))
              : <Chip label="-" size="small" />}
          </Stack>
        ),
      },
      {
        field: "mark_as_popular",
        headerName: "Popular",
        flex: 0.7,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <Chip
            label={value ? "YES" : "NO"}
            size="small"
            sx={{
              bgcolor: value ? "#fff8e1" : "#eeeeee",
              color: value ? "#f57c00" : "#616161",
              fontWeight: 600,
              height: 22,
            }}
          />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.7,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Switch
            checked={row.status === "active"}
            disabled={togglingId === row._id}
            onChange={() => toggleStatus(row)}
            size="small"
          />
        ),
      },
      {
        field: "action",
        headerName: "Action",
        flex: 0.8,
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <IconButton size="small" onClick={() => openEditModal(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                setDeleteAnchorEl(e.currentTarget);
                setDeleteTarget(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [togglingId, toggleStatus, openEditModal], // Fixed dependencies
  );

  return (
    <>
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Typography variant="h4">Plan Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Plan
        </Button>
      </Stack>

      <DebouncedSearch
        placeholder="Search by Plan name"
        onSearch={handleSearch}
      />

      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <Box sx={{ height: 650 }}>
          <DataGrid
            rows={data}
            columns={columns}
            getRowId={(row) => row._id}
            loading={loading}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": {
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#fafafa",
                fontWeight: 600,
              },
            }}
          />
        </Box>
      </Card>

      {/* Delete Confirmation Popover */}
      <Popover
        open={Boolean(deleteAnchorEl)}
        anchorEl={deleteAnchorEl}
        onClose={handleDeleteCancel}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box p={3} sx={{ minWidth: 300 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DeleteIcon color="error" />
              <Typography variant="h6" color="error">
                Confirm Delete
              </Typography>
            </Stack>
            <Typography variant="body1">
              Are you sure you want to delete "
              <strong>{deleteTarget?.plan_name}</strong>"? This action cannot
              be undone.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleDeleteCancel}
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteConfirm}
              >
                Delete Plan
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>

      {/* Snackbar */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.type} variant="filled">
          {toast.text}
        </Alert>
      </Snackbar>

      <PlansFormModal
        open={open}
        loading={submitLoading}
        initialValues={editInitialValues}
        onCancel={() => {
          setOpen(false);
          setIsEditing(false);
          setEditInitialValues(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default Plans;
