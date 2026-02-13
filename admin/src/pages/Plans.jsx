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
  Tag,
  Tooltip,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Pencil, Trash } from "lucide-react";
import { plansAPI } from "../services/api";
import PlansFormModal from "../components/PlansFormModal";
import DebouncedSearch from "../components/debouncedSearch";

const PAGE_SIZE = 10;

const Plans = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [data, setData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [search, setSearch] = useState("");

  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  const fetchPlans = useCallback(
    async (page = 1, pageSize = PAGE_SIZE, searchTerm = search) => {
      try {
        setLoading(true);
        const res = await plansAPI.list({
          page,
          limit: pageSize,
          search: searchTerm,
        });

        setData(res?.data?.plans ?? []);
        setPaginationState({
          current: res?.data?.pagination?.page ?? page,
          pageSize: res?.data?.pagination?.limit ?? pageSize,
          total: res?.data?.pagination?.total ?? 0,
        });
      } catch {
        message.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchPlans(1, PAGE_SIZE, search);
  }, [search]);
  /* -------------------- Search -------------------- */
  const handleSearch = useCallback((value) => {
    setSearch(value || "");
  }, []);
  /* -------------------- Submit -------------------- */
  const handleSubmit = useCallback(
    async (values, form) => {
      try {
        setSubmitLoading(true);

        const normalizeArray = (val) =>
          Array.isArray(val) ? val : val ? [val] : [];

        const payload = {
          plan_name: values.plan_name,
          description: values.description || "",
          price: {
            monthly: values.price?.monthly ?? null,
            yearly: values.price?.yearly ?? null,
          },
          billing_period: values.billing_period,
          features: normalizeArray(values.features),
          mark_as_popular: Boolean(values.mark_as_popular),
          status: values.status || "active",
        };

        if (values.plan_type)
          payload.plan_type = normalizeArray(values.plan_type);
        if (values.trial_type)
          payload.trial_type = normalizeArray(values.trial_type);
        if (values.users_allowed)
          payload.users_allowed = Number(values.users_allowed);
        if (values.organizations_allowed)
          payload.organizations_allowed = Number(values.organizations_allowed);
        if (values.best_for) payload.best_for = values.best_for;
        if (values.access_level)
          payload.access_level = normalizeArray(values.access_level);

        if (isEditing && editInitialValues?._id) {
          await plansAPI.update(editInitialValues._id, payload);
          message.success("Plan updated successfully");
        } else {
          await plansAPI.create(payload);
          message.success("Plan created successfully");
        }

        form.resetFields();
        setOpen(false);
        setIsEditing(false);
        setEditInitialValues(null);

        fetchPlans(paginationState.current, paginationState.pageSize);
      } catch (err) {
        message.error(err?.response?.data?.message || "Operation failed");
      } finally {
        setSubmitLoading(false);
      }
    },
    [isEditing, editInitialValues, fetchPlans, paginationState],
  );

  const openCreateModal = () => {
    setIsEditing(false);
    setEditInitialValues(null);
    setOpen(true);
  };

  const openEditModal = (record) => {
    setIsEditing(true);

    setEditInitialValues({
      ...record,
      price: {
        monthly: record.price?.monthly ?? 0,
        yearly: record.price?.yearly ?? 0,
      },
    });

    setOpen(true);
  };

  const handleDelete = async (record) => {
    try {
      await plansAPI.delete(record._id);
      message.success("Plan deleted successfully");
      fetchPlans(paginationState.current, paginationState.pageSize);
    } catch {
      message.error("Delete failed");
    }
  };

  const toggleStatus = async (record) => {
    const newStatus = record.status === "active" ? "inactive" : "active";
    try {
      setTogglingId(record._id);
      await plansAPI.update(record._id, { status: newStatus });
      message.success(
        `Plan ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`,
      );
      fetchPlans(paginationState.current, paginationState.pageSize);
    } catch {
      message.error("Failed to update plan status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Plan Name",
        dataIndex: "plan_name",
        key: "plan_name",
      },

      {
        title: "Plan Type",
        dataIndex: "plan_type",
        key: "plan_type",
        render: (v) =>
          v && v.length ? (
            <>
              {v.map((item) => (
                <Tag key={item} color="purple">
                  {item}
                </Tag>
              ))}
            </>
          ) : (
            <Tag>-</Tag>
          ),
      },

      {
        title: "Trial",
        dataIndex: "trial_type",
        key: "trial_type",
        render: (v) =>
          v && v.length ? (
            v.map((item) => (
              <Tag key={item} color={item === "free" ? "green" : "orange"}>
                {item}
              </Tag>
            ))
          ) : (
            <Tag>-</Tag>
          ),
      },

      {
        title: "Price",
        dataIndex: "price",
        render: (price, record) => {
          if (!price) return "-";

          if (typeof price === "number") return price;

          if (typeof price === "object") {
            const period = record.billing_period?.[0] ?? "monthly"; // fallback to monthly
            return price[period] ?? "-";
          }

          return "-";
        },
      },

      {
        title: "Users",
        dataIndex: "users_allowed",
        key: "users_allowed",
        render: (v) => <Tag>{v || 0}</Tag>,
      },

      {
        title: "Access",
        dataIndex: "access_level",
        key: "access_level",
        render: (v) =>
          v && v.length ? (
            v.map((item) => (
              <Tag key={item} color="blue">
                {item}
              </Tag>
            ))
          ) : (
            <Tag>-</Tag>
          ),
      },

      {
        title: "Popular",
        dataIndex: "mark_as_popular",
        key: "popular",
        render: (v) =>
          v ? (
            <Tag color="gold" style={{ fontWeight: 600 }}>
              YES
            </Tag>
          ) : (
            <Tag>NO</Tag>
          ),
      },

      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status, record) => (
          <Switch
            checked={status === "active"}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            loading={togglingId === record._id}
            onClick={() => toggleStatus(record)}
          />
        ),
      },

      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Space>
            <Tooltip title="Edit Plan">
              <Button
                type="text"
                icon={<Pencil size={16} />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>

            <Tooltip title="Delete Plan">
              <Popconfirm
                title="Delete this plan?"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="text" danger icon={<Trash size={16} />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [togglingId],
  );

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <h2 style={{ margin: 0 }}>Plan Management</h2>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add Plan
          </Button>
        </Col>
      </Row>
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <DebouncedSearch
            placeholder="Search by Plan name"
            onSearch={handleSearch} // ✅ Pass the handler
          />
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
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
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
          }}
          onChange={(p) => fetchPlans(p.current, p.pageSize, search)}
          rowClassName={(record) =>
            record.mark_as_popular ? "popular-row" : ""
          }
          style={{ overflowX: "auto" }}
        />
      </Card>

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
