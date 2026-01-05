import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Spin,
  Popconfirm,
  Space,
} from "antd";
import { busAPI } from "../services/api";
import ApiTest from "../components/ApiTest";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Pencil, Trash } from "lucide-react";
import { driverAPI } from "../services/api";
import { Grid } from "antd";

const { Option } = Select;
const { useBreakpoint } = Grid;

const Buses = () => {
  const screens = useBreakpoint();

  const [buses, setBuses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const response = await busAPI.getBuses();
      const busesWithKeys = response.data.map((bus, index) => ({
        ...bus,
        key: bus._id || index,
      }));
      setBuses(busesWithKeys);
    } catch (error) {
      message.error(
        "Failed to load buses: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDrivers = async () => {
    try {
      const res = await driverAPI.getAvailableDrivers();
      setAvailableDrivers(res.data || []);
    } catch (e) {
      console.error("Failed to load available drivers", e);
    }
  };

  const showModal = async () => {
    setIsModalOpen(true);
    setEditingBus(null);
    form.resetFields();
    await loadAvailableDrivers();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingBus(null);
    form.resetFields();
  };

  const handleAddBus = async (values) => {
    try {
      setLoading(true);

      if (editingBus) {
        await busAPI.updateBus(editingBus._id, values);
        message.success("Bus updated successfully!");
        setBuses(
          buses.map((b) => (b._id === editingBus._id ? { ...b, ...values } : b))
        );
      } else {
        const response = await busAPI.createBus(values);
        const newBus = { ...response.data, key: response.data._id };
        setBuses([...buses, newBus]);
        message.success("Bus added successfully!");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingBus(null);
    } catch (error) {
      message.error(
        "Failed to save bus: " + (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (bus) => {
    setEditingBus(bus);
    form.setFieldsValue(bus);
    setIsModalOpen(true);
    await loadAvailableDrivers();
  };

  const handleDelete = async (busId) => {
    try {
      setLoading(true);
      await busAPI.deleteBus(busId);
      setBuses(buses.filter((b) => b._id !== busId));
      message.success("Bus deleted successfully!");
    } catch (error) {
      message.error(
        "Failed to delete bus: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Bus Number", dataIndex: "busNumber", key: "busNumber" },
    {
      title: "Registration Number",
      dataIndex: "registrationNumber",
      key: "registrationNumber",
    },
    { title: "Capacity", dataIndex: "capacity", key: "capacity" },
    { title: "Bus Type", dataIndex: "busType", key: "busType" },
    {
      title: "Driver Assignment",
      dataIndex: "driver",
      key: "driver",
      render: (text) => text || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<Pencil size={18} />}
            type="link"
            onClick={() => handleEdit(record)}
            style={{ color: "#1890ff" }}
          ></Button>
          <Popconfirm
            title="Are you sure to delete this bus?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<Trash size={18} />} type="link" danger></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="add_bus">
      <ApiTest />
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: screens.sm ? "flex" : "block",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ marginBottom: 20, marginTop: 0 }}>Bus Management</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            style={{ marginBottom: 20 }}
          >
            Add Bus
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            dataSource={buses}
            columns={columns}
            pagination={{ pageSize: 5 }}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 1000 }}
            responsive
            style={{ width: "100%", overflowX: "auto" }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingBus ? "Edit Bus" : "Add New Bus"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddBus}>
          <Form.Item
            label="Bus Number"
            name="busNumber"
            rules={[
              { required: true, message: "Please input the Bus Number!" },
            ]}
          >
            <Input placeholder="Enter Bus Number" />
          </Form.Item>

          <Form.Item
            label="Registration Number"
            name="registrationNumber"
            rules={[
              { required: true, message: "Please input Registration Number!" },
            ]}
          >
            <Input placeholder="Enter Registration Number" />
          </Form.Item>

          <Form.Item
            label="Capacity"
            name="capacity"
            rules={[{ required: true, message: "Please input Capacity!" }]}
          >
            <Input type="number" placeholder="Enter Capacity" />
          </Form.Item>

          <Form.Item
            label="Bus Type"
            name="busType"
            rules={[{ required: true, message: "Please select Bus Type!" }]}
          >
            <Select placeholder="Select Bus Type">
              <Option value="AC">AC</Option>
              <Option value="Non-AC">Non-AC</Option>
              <Option value="Sleeper">Sleeper</Option>
              <Option value="Seater">Seater</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Driver Assignment" name="driver">
            <Select
              placeholder="Select driver (optional)"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {availableDrivers.map((d) => (
                <Option key={d._id} value={d.fullName}>
                  {d.fullName} - {d.availabilityStatus}{" "}
                  {d.assignedBus ? `(${d.assignedBus})` : ""}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            style={{ marginTop: 20, marginBottom: 0, textAlign: "right" }}
          >
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginRight: 10 }}
            >
              {editingBus ? "Update" : "Save"}
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Buses;
