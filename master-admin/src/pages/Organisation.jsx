import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  Button,
  Box,
  Typography,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { organizationAPI } from "../services/api";
import OrganizationFormModal from "../components/OrganizationFormModal";
import DebouncedSearch from "../components/debouncedSearch";
import CommonSelect from "../components/CommonSelect";
import { plansAPI } from "../services/api";

const PAGE_SIZE = 10;

const Organisation = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanName, setSelectedPlanName] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [plansMap, setPlansMap] = useState({});
  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* -------------------- Fetch -------------------- */
  const fetchOrganizations = useCallback(
    async (
      page = 1,
      pageSize = PAGE_SIZE,
      searchTerm = "",
      plan = "",
      status = "",
    ) => {
      try {
        setLoading(true);
        const res = await organizationAPI.list({
          page,
          limit: pageSize,
          search: searchTerm,
          plan,
          status,
        });
        // Transform data for DataGrid with safe owner access
        const transformedData = (res.data?.organizations ?? []).map((org) => ({
          id: org._id,
          _id: org._id,
          name: org.name || "",
          ownerName:
            `${org.owner?.firstName || ""} ${org.owner?.lastName || ""}`.trim() ||
            "N/A",
          ownerEmail: org.owner?.email || "N/A",
          status: org.status || "inactive", // ✅ Always define status
          planId: org.planId || null,
          slug: org.slug || "",
          owner: org.owner || {},
          ...org,
        }));

        setData(transformedData);
        setPaginationState((prev) => ({
          ...prev,
          current: res.data?.pagination?.page ?? page,
          pageSize: res.data?.pagination?.limit ?? pageSize,
          total: res.data?.pagination?.total ?? 0,
        }));
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to load organizations",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Search handler
  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      fetchOrganizations(
        1,
        paginationState.pageSize,
        value,
        selectedPlanName,
        selectedStatus,
      );
    },
    [
      fetchOrganizations,
      paginationState.pageSize,
      selectedPlanName,
      selectedStatus,
    ],
  );

  // Plan filter handler
  const handlePlanFilter = useCallback(
    (planId) => {
      const planName = planId ? plansMap[planId] : null;
      setSelectedPlanId(planId);
      setSelectedPlanName(planName);
      fetchOrganizations(
        1,
        paginationState.pageSize,
        searchTerm,
        planName,
        selectedStatus,
      );
    },
    [
      plansMap,
      fetchOrganizations,
      paginationState.pageSize,
      searchTerm,
      selectedStatus,
    ],
  );

  // Status filter handler
  const handleStatusFilter = useCallback(
    (status) => {
      setSelectedStatus(status);
      fetchOrganizations(
        1,
        paginationState.pageSize,
        searchTerm,
        selectedPlanName,
        status,
      );
    },
    [
      fetchOrganizations,
      paginationState.pageSize,
      searchTerm,
      selectedPlanName,
    ],
  );

  /* -------------------- Load Plans Map -------------------- */
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await plansAPI.list();
        const plans = res.data?.plans ?? [];
        const map = {};
        plans.forEach((p) => {
          map[p._id] = p.plan_name;
        });
        setPlansMap(map);
      } catch (err) {
        console.error("Failed to load plans for mapping", err);
      }
    };
    loadPlans();
  }, []);

  // Table pagination handler
  const handlePaginationModelChange = useCallback(
    (newPaginationModel) => {
      fetchOrganizations(
        newPaginationModel.page + 1, // DataGrid is 0-indexed
        newPaginationModel.pageSize,
        searchTerm,
        selectedPlanName,
        selectedStatus,
      );
    },
    [fetchOrganizations, searchTerm, selectedPlanName, selectedStatus],
  );

  /* -------------------- Submit, Delete, Edit handlers (same as before) -------------------- */
  const handleSubmit = useCallback(
    async (values, form) => {
      try {
        setSubmitLoading(true);
        const payload = {
          name: values.name,
          slug: values.slug,
          planId: values.planId,
          owner: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            ...(isEditing ? {} : { password: values.ownerPassword }),
          },
        };

        if (isEditing) {
          await organizationAPI.update(editInitialValues._id, payload);
          setSnackbar({
            open: true,
            message: "Organization updated successfully",
            severity: "success",
          });
        } else {
          await organizationAPI.create(payload);
          setSnackbar({
            open: true,
            message: "Organization created successfully",
            severity: "success",
          });
        }

        form.resetFields?.();
        setOpen(false);
        setEditInitialValues(null);
        fetchOrganizations(
          paginationState.current,
          paginationState.pageSize,
          searchTerm,
          selectedPlanName,
        );
      } catch (error) {
        const backendError = error?.response?.data?.error;
        if (backendError === "Organization with this slug already exists") {
          form.setFields?.([
            {
              name: "slug",
              errors: [
                "This slug is already in use. Please enter a unique slug.",
              ],
            },
          ]);
        } else {
          setSnackbar({
            open: true,
            message: error?.response?.data?.message || "Operation failed",
            severity: "error",
          });
        }
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      isEditing,
      editInitialValues,
      fetchOrganizations,
      paginationState,
      searchTerm,
      selectedPlanName,
    ],
  );

  const openCreateModal = () => {
    setIsEditing(false);
    setEditInitialValues(null);
    setOpen(true);
  };

  const openEditModal = useCallback((row) => {
    setIsEditing(true);
    setEditInitialValues({
      _id: row._id,
      name: row.name,
      slug: row.slug,
      firstName: row.owner?.firstName || "",
      lastName: row.owner?.lastName || "",
      email: row.owner?.email || "",
      planId: row.planId,
    });
    setOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (row) => {
      try {
        await organizationAPI.delete(row._id);
        setSnackbar({
          open: true,
          message: "Organization deleted successfully",
          severity: "success",
        });
        fetchOrganizations(paginationState.current, paginationState.pageSize);
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to delete organization",
          severity: "error",
        });
      }
    },
    [fetchOrganizations, paginationState],
  );

  const handleStatusToggle = useCallback(
    async (row) => {
      try {
        setToggleLoading(true);
        const newStatus = row.status === "active" ? "inactive" : "active";
        await organizationAPI.updateStatus(row._id, { status: newStatus });
        setSnackbar({
          open: true,
          message: `Organization ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
          severity: "success",
        });
        fetchOrganizations(paginationState.current, paginationState.pageSize);
      } catch {
        setSnackbar({
          open: true,
          message: "Failed to update status",
          severity: "error",
        });
      } finally {
        setToggleLoading(false);
      }
    },
    [fetchOrganizations, paginationState],
  );

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // DataGrid Columns with safe access
  // Replace the columns useMemo with this corrected version:

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Organization Name",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "ownerName",
        headerName: "Owner Name",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Typography sx={{ color: "text.secondary" }}>
            {params.value || "N/A"}
          </Typography>
        ),
      },
      {
        field: "ownerEmail",
        headerName: "Owner Email",
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
          <Typography
            component="a"
            href={`mailto:${params.value}`}
            sx={{
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {params.value || "N/A"}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        sortable: false,
        renderCell: (params) => {
          // Safe status access in renderCell
          const status = params.row.status || "inactive";
          return (
            <Switch
              checked={status === "active"}
              onChange={() => handleStatusToggle(params.row)}
              disabled={toggleLoading}
              size="small"
            />
          );
        },
        // REMOVED valueGetter - not needed with renderCell
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEditModal(params.row)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [toggleLoading, handleStatusToggle, openEditModal, handleDelete],
  );

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }

  return (
    <Box sx={{ height: 700, width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          pb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Organization Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateModal}
        >
          Add Organization
        </Button>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <DebouncedSearch placeholder="Search" onSearch={handleSearch} />
        <CommonSelect
          value={selectedPlanId}
          onChange={handlePlanFilter}
          placeholder="Filter by plan"
          allowClear
          fetcher={async () => {
            const res = await plansAPI.list();
            return res.data?.plans || [];
          }}
          mapOption={(plan) => ({
            label: plan.plan_name,
            value: plan._id,
          })}
          filterFn={(plan) => plan.status === "active"}
        />
        <CommonSelect
          value={selectedStatus}
          onChange={handleStatusFilter}
          placeholder="Filter by status"
          allowClear
          showSearch={false}
          fetcher={async () => [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          mapOption={(item) => item}
        />
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        paginationMode="server"
        paginationModel={{
          page: paginationState.current - 1,
          pageSize: paginationState.pageSize,
        }}
        paginationNavigationTimeout={0}
        pageSizeOptions={[5, 10, 20, 50]}
        rowCount={paginationState.total}
        onPaginationModelChange={handlePaginationModelChange}
        slots={{ toolbar: CustomToolbar }}
        sx={{
          boxShadow: 2,
          border: 1,
          borderColor: "grey.400",
          "& .MuiDataGrid-cell:hover": {
            color: "primary.main",
          },
        }}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
      />

      {/* Modal */}
      <OrganizationFormModal
        open={open}
        loading={submitLoading}
        initialValues={editInitialValues}
        onCancel={() => setOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Organisation;
