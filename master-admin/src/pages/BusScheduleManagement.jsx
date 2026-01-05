import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  TimePicker,
  message,
  Space,
  Popconfirm,
  Card,
  Select,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import {
  EditOutlined,
  DeleteOutlined,
  AimOutlined,
  WomanOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { scheduleAPI, busAPI, driverAPI, routesAPI } from "../services/api";
import { Circle, MapPin, Pencil, Trash } from "lucide-react";
import { Grid } from "antd";

const { useBreakpoint } = Grid;

const BusScheduleManagement = () => {
  const screens = useBreakpoint();
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form] = Form.useForm();
  const [routes, setRoutes] = useState([]);

  const [locations, setLocations] = useState([
    { id: 1, type: "start", value: "" },
    { id: 2, type: "end", value: "" },
  ]);
  // Load schedules on component mount
  useEffect(() => {
    loadSchedules();
  }, []);

  // Load schedules from backend
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getSchedules();
      setSchedules(response.data);
    } catch (error) {
      message.error("Failed to load schedules");
      console.error("Error loading schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load buses, drivers, and routes for dropdowns
  const loadBusesAndDrivers = async () => {
    try {
      const [busesResponse, driversResponse, routesResponse] =
        await Promise.all([
          busAPI.getBuses(),
          driverAPI.getAvailableDrivers(),
          routesAPI.list(),
        ]);
      setBuses(busesResponse.data || []);
      setDrivers(driversResponse.data || []);
      setRoutes(
        (routesResponse.data || []).map((r) => ({
          id: r._id,
          label: `${r.from} → ${r.to}`,
        }))
      );
    } catch (error) {
      console.error("Error loading buses and available drivers:", error);
    }
  };

  // Open modal for adding new schedule
  const showModal = async () => {
    setEditingSchedule(null); // Not editing
    setIsModalOpen(true);
    await loadBusesAndDrivers();
    // Reset locations to default state for new schedule
    setLocations([
      { id: 1, type: "start", value: "" },
      { id: 2, type: "end", value: "" },
    ]);
  };

  // Open modal for editing
  const editSchedule = async (record) => {
    setEditingSchedule(record);
    setIsModalOpen(true);
    await loadBusesAndDrivers();

    // Pre-fill form with existing values
    form.setFieldsValue({
      busnumber: record.busNumber,
      departureTime: dayjs(record.departure, "HH:mm"),
      arrivalTime: dayjs(record.arrival, "HH:mm"),
      driver: record.driver,
      fare: record.fare,
    });
    // Try to map existing route to a route option - prefer routeId if available
    if (routes.length > 0) {
      if (record.routeId) {
        // If routeId exists, use it directly
        form.setFieldsValue({ routeId: record.routeId });
      } else if (record.route) {
        // Otherwise try to match by route string
        const match = routes.find((r) => r.label === record.route);
        if (match) form.setFieldsValue({ routeId: match.id });
      }
    }
  };

  // Close modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    form.resetFields();
    // nothing else
  };

  // Delete schedule
  const deleteSchedule = async (id) => {
    try {
      await scheduleAPI.deleteSchedule(id);
      message.success("Schedule deleted successfully!");
      loadSchedules(); // Reload schedules
    } catch (error) {
      message.error("Failed to delete schedule");
      console.error("Error deleting schedule:", error);
    }
  };

  // Handle form submission for add/edit
  const handleAddOrEditSchedule = async (values) => {
    try {
      const selectedRoute = routes.find((r) => r.id === values.routeId);
      if (!selectedRoute) {
        message.error("Please select a Route");
        return;
      }
      const route = selectedRoute.label;
      const scheduleData = {
        busNumber: values.busnumber,
        route: route,
        routeId: values.routeId, // Send routeId to backend
        departure: values.departureTime.format("HH:mm"),
        arrival: values.arrivalTime.format("HH:mm"),
        driver: values.driver || "Not Assigned", // Use a default value if empty
        fare: parseFloat(values.fare),
      };

      if (editingSchedule) {
        await scheduleAPI.updateSchedule(editingSchedule._id, scheduleData);
        message.success("Schedule updated successfully!");
      } else {
        await scheduleAPI.createSchedule(scheduleData);
        message.success("Bus scheduled successfully!");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingSchedule(null);
      loadSchedules(); // Reload schedules
    } catch (error) {
      message.error("Failed to save schedule");
      console.error("Error saving schedule:", error);
    }
  };
  // routes selection only — removed dynamic stops
  // Table columns
  const columns = [
    {
      title: "Bus Number",
      dataIndex: "busNumber",
      key: "busNumber",
    },
    {
      title: "Route",
      dataIndex: "route",
      key: "route",
      ellipsis: true,
    },
    // removed Date column
    {
      title: "Departure",
      dataIndex: "departure",
      key: "departure",
    },
    {
      title: "Arrival",
      dataIndex: "arrival",
      key: "arrival",
    },
    {
      title: "Driver",
      dataIndex: "driver",
      key: "driver",
      render: (text) => text || "-",
      ellipsis: true,
    },
    {
      title: "Fare",
      dataIndex: "fare",
      key: "fare",
      render: (text) => `$${text}`,
    },
    {
      title: "Action",
      key: "action",
      // fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<Pencil size={18} />}
            type="link"
            onClick={() => editSchedule(record)}
            style={{ color: "#1890ff" }}
          />
          <Popconfirm
            title="Are you sure to delete this schedule?"
            onConfirm={() => deleteSchedule(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<Trash size={18} />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
      // responsive: ['xs', 'sm', 'md', 'lg'],
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: screens.sm ? "flex" : "block",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ marginBottom: 20, marginTop: 0 }}>
            Bus Schedule Management
          </h2>
          <Button
            type="primary"
            onClick={showModal}
            style={{ marginBottom: 20 }}
          >
            Schedule Bus
          </Button>
        </div>

        <Table
          dataSource={schedules}
          columns={columns}
          pagination={{ pageSize: 5 }}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1000 }} // enables horizontal scroll for smaller screens
          responsive // makes columns adapt to screen width
          style={{ width: "100%", overflowX: "auto" }}
        />
      </Card>

      <Modal
        title={editingSchedule ? "Edit Bus Schedule" : "Schedule New Bus"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={window.innerWidth < 768 ? "95%" : 700}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrEditSchedule}>
          {/* First Row: Bus Number, Route */}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Bus Number"
                name="busnumber"
                rules={[
                  { required: true, message: "Please select Bus Number!" },
                ]}
              >
                <Select
                  placeholder="Select Bus Number"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {buses.map((bus) => (
                    <Option key={bus._id} value={bus.busNumber}>
                      {bus.busNumber} - {bus.busType} ({bus.capacity} seats)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Route"
                name="routeId"
                rules={[{ required: true, message: "Please select a Route!" }]}
              >
                <Select
                  placeholder="Select Route"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {routes.map((rt) => (
                    <Option key={rt.id} value={rt.id}>
                      {rt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Second Row: Departure Time, Arrival Time */}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Departure Time"
                name="departureTime"
                rules={[
                  { required: true, message: "Please select Departure Time!" },
                ]}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Arrival Time"
                name="arrivalTime"
                rules={[
                  { required: true, message: "Please select Arrival Time!" },
                ]}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          {/* Third Row: Fare, Driver Assignment */}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Fare"
                name="fare"
                rules={[{ required: true, message: "Please input Fare!" }]}
              >
                <Input type="number" placeholder="Enter Fare" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
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
                  {drivers.map((driver) => (
                    <Option key={driver._id} value={driver.fullName}>
                      {driver.fullName} - {driver.availabilityStatus}{" "}
                      {driver.assignedBus ? `(${driver.assignedBus})` : ""}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Route selection handled above. Removed dynamic route fields */}

          <Form.Item
            style={{ marginTop: 20, marginBottom: 0, textAlign: "right" }}
          >
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginRight: 10 }}
            >
              Save
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BusScheduleManagement;
