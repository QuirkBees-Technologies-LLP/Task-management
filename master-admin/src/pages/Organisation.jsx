import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  message,
  Space,
  Popconfirm,
  Switch,
  Typography,
} from "antd";

import { PlusOutlined } from "@ant-design/icons";
import { Pencil, Trash } from "lucide-react";
import { organizationAPI } from "../services/api";
import OrganizationFormModal from "../components/OrganizationFormModal";
import DebouncedSearch from "../components/debouncedSearch";
import PlanSelect from "../components/PlanSelect";
import { plansAPI } from "../services/api";

const { Title } = Typography;
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
  const [plansMap, setPlansMap] = useState({});
  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  /* -------------------- Fetch -------------------- */
  const fetchOrganizations = useCallback(
    async (page = 1, pageSize = PAGE_SIZE, searchTerm = "", plan = "") => {
      try {
        setLoading(true);
        const res = await organizationAPI.list({
          page,
          limit: pageSize,
          search: searchTerm,
          plan,
        });
        setData(res.data?.organizations ?? []);
        setPaginationState((prev) => ({
          ...prev,
          current: res.data?.pagination?.page ?? page,
          pageSize: res.data?.pagination?.limit ?? pageSize,
          total: res.data?.pagination?.total ?? 0,
        }));
      } catch {
        message.error("Failed to load organizations");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // ✅ Search handler
  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value); // store for pagination
      fetchOrganizations(1, paginationState.pageSize, value, selectedPlanName); // always fetch from first page
    },
    [fetchOrganizations, paginationState.pageSize, selectedPlanName]
  );

  // ✅ Plan filter handler
  const handlePlanFilter = useCallback(
    (planId) => {
      const planName = planId ? plansMap[planId] : null;

      setSelectedPlanId(planId); // for Select
      setSelectedPlanName(planName); // for API

      fetchOrganizations(1, paginationState.pageSize, searchTerm, planName);
    },
    [plansMap, fetchOrganizations, paginationState.pageSize, searchTerm]
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

  // ✅ Table pagination handler
  const handleTableChange = useCallback(
    (pagination) => {
      fetchOrganizations(
        pagination.current,
        pagination.pageSize,
        searchTerm,
        selectedPlanName
      ); // use current search
    },
    [fetchOrganizations, searchTerm, selectedPlanName]
  );
  /* -------------------- Submit -------------------- */
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
          message.success("Organization updated successfully");
        } else {
          await organizationAPI.create(payload);
          message.success("Organization created successfully");
        }

        form.resetFields();
        setOpen(false);
        setEditInitialValues(null);

        fetchOrganizations(
          paginationState.current,
          paginationState.pageSize,
          searchTerm,
          selectedPlanName
        );
      } catch (error) {
        message.error(error.response?.data?.message || "Operation failed");
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
    ]
  );

  /* -------------------- Modals -------------------- */
  const openCreateModal = () => {
    setIsEditing(false);
    setEditInitialValues(null);
    setOpen(true);
  };

  const openEditModal = (record) => {
    setIsEditing(true);
    setEditInitialValues({
      _id: record._id,
      name: record.name,
      slug: record.slug,
      firstName: record.owner.firstName,
      lastName: record.owner.lastName,
      email: record.owner.email,
      planId: record.planId,
    });
    setOpen(true);
  };

  /* -------------------- Delete -------------------- */
  const handleDelete = async (record) => {
    try {
      await organizationAPI.delete(record._id);
      message.success("Organization deleted successfully");
      fetchOrganizations(paginationState.current, paginationState.pageSize);
    } catch {
      message.error("Failed to delete organization");
    }
  };

  /* -------------------- Columns -------------------- */
  const columns = useMemo(
    () => [
      {
        title: "Organization Name",
        dataIndex: "name",
        render: (text) => <span>{text}</span>, // normal font
      },

      {
        title: "Owner Name",
        key: "ownerName",
        render: (_, record) => (
          <span style={{ color: "#595959" }}>
            {`${record.owner.firstName || ""} ${
              record.owner.lastName || ""
            }`.trim()}
          </span>
        ),
      },

      {
        title: "Owner Email",
        dataIndex: "ownerEmail",
        render: (_, record) => <a href={`mailto:${record.owner.email}`}>{record.owner.email}</a>,
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (status, record) => (
          <Switch
            checked={status === "active"}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            loading={toggleLoading}
            onClick={async () => {
              try {
                setToggleLoading(true);
                const newStatus = status === "active" ? "inactive" : "active";
                await organizationAPI.updateStatus(record._id, {
                  status: newStatus,
                });
                message.success(
                  `Organization ${
                    newStatus === "active" ? "activated" : "deactivated"
                  } successfully`
                );
                fetchOrganizations(
                  paginationState.current,
                  paginationState.pageSize
                );
              } catch {
                message.error("Failed to update status");
              } finally {
                setToggleLoading(false);
              }
            }}
          />
        ),
      },
      {
        title: "Actions",
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="text"
              icon={<Pencil size={18} />}
              onClick={() => openEditModal(record)}
            />
            <Popconfirm
              title="Delete this organization?"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="text" icon={<Trash size={18} />} danger />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [toggleLoading, fetchOrganizations, paginationState]
  );

  return (
    <div>
      {/* Header */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, gap: "10px" }}
      >
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Organization Management
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add Organization
          </Button>
        </Col>
      </Row>
      {/* Search Bar */}
      <Row style={{ marginBottom: 16 }}>
        <Col>
          <DebouncedSearch
            placeholder="Search by organization name"
            onSearch={handleSearch}
            className="search_data"
          />
        </Col>
        <Col>
          <PlanSelect
            value={selectedPlanId}
            onChange={handlePlanFilter}
            placeholder="Filter by plan"
            allowClear
          />
        </Col>
      </Row>

      {/* Table */}
      <Card variant={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: paginationState.current,
            pageSize: paginationState.pageSize,
            total: paginationState.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
            pageSizeOptions: ["5", "10", "20", "50"],
          }}
          onChange={handleTableChange}
          bordered
          scroll={{ x: 800 }}
          rowClassName={() => "hover-row"} // for hover effect
        />
      </Card>

      {/* Modal */}
      <OrganizationFormModal
        open={open}
        loading={submitLoading}
        initialValues={editInitialValues}
        onCancel={() => setOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Optional: Add hover effect via style */}
      <style>{`
        .hover-row:hover {
          background-color: #f5f5f5;
          transition: background-color 0.2s;
        }
      `}</style>
    </div>
  );
};

export default Organisation;
