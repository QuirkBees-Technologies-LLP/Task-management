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
  Input,
} from "antd";

import { PlusOutlined } from "@ant-design/icons";
import { Pencil, Trash } from "lucide-react";
import { organizationAPI } from "../services/api";
import OrganizationFormModal from "../components/OrganizationFormModal";
import DebouncedSearch from "../components/debouncedSearch";

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
  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });

  /* -------------------- Fetch -------------------- */
  const fetchOrganizations = useCallback(
    async (page = 1, pageSize = PAGE_SIZE, searchTerm = "") => {
      try {
        setLoading(true);
        const res = await organizationAPI.list({
          page,
          limit: pageSize,
          search: searchTerm,
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
      fetchOrganizations(1, paginationState.pageSize, value); // always fetch from first page
    },
    [fetchOrganizations]
  );

  // ✅ Table pagination handler
  const handleTableChange = useCallback(
    (pagination) => {
      fetchOrganizations(pagination.current, pagination.pageSize, searchTerm); // use current search
    },
    [fetchOrganizations, searchTerm]
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

        fetchOrganizations(paginationState.current, paginationState.pageSize);
      } catch (error) {
        message.error(error.response?.data?.message || "Operation failed");
      } finally {
        setSubmitLoading(false);
      }
    },
    [isEditing, editInitialValues, fetchOrganizations, paginationState]
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
      firstName: record.ownerFirstName,
      lastName: record.ownerLastName,
      email: record.ownerEmail,
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
            {`${record.ownerFirstName || ""} ${
              record.ownerLastName || ""
            }`.trim()}
          </span>
        ),
      },

      {
        title: "Owner Email",
        dataIndex: "ownerEmail",
        render: (text) => <a href={`mailto:${text}`}>{text}</a>,
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
        <Col span={24}>
          <DebouncedSearch
            placeholder="Search by organization name"
            onSearch={handleSearch} // ✅ Pass the handler
            className="search_data"
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
