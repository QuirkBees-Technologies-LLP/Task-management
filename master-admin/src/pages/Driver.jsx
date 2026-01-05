import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  Space,
  Popconfirm,
  Avatar,
  Descriptions,
  Card,
  Tag,
  Row,
  Col,
  Spin,
  App,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  DeleteOutlined as DeleteIcon,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Eye, Pencil, Trash } from "lucide-react";
import { driverAPI } from "../services/api";

import { Grid } from "antd";
const { Option } = Select;
const { useBreakpoint } = Grid;
const Driver = () => {
  const screens = useBreakpoint();

  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewDriver, setViewDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [expiredDrivers, setExpiredDrivers] = useState([]);
  const [validating, setValidating] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  // Load drivers on component mount
  useEffect(() => {
    loadDrivers();
  }, []);

  // Load drivers from backend
  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await driverAPI.getDrivers();
      setDrivers(response.data);
    } catch (error) {
      message.error("Failed to load drivers");
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open Add/Edit modal
  const showModal = (driver = null) => {
    setEditingDriver(driver);
    if (driver) {
      // Normalize profile photo URL for preview
      let photoUrl = driver.profilePhoto || "";
      if (photoUrl) {
        if (photoUrl.startsWith("/uploads/")) {
          photoUrl = `http://localhost:5000${photoUrl}`;
        } else if (photoUrl.startsWith("uploads/")) {
          photoUrl = `http://localhost:5000/${photoUrl}`;
        }
      }

      form.setFieldsValue({
        ...driver,
        licenseExpiry: driver.licenseExpiry
          ? dayjs(driver.licenseExpiry)
          : null,
      });
      setProfilePhotoUrl(photoUrl);
    } else {
      form.resetFields();
      setProfilePhotoUrl("");
    }
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setProfilePhotoUrl("");
    setUploadedFile(null);
    form.resetFields();
  };

  // Add or Edit driver
  const handleFinish = async (values) => {
    try {
      setLoading(true);
      const driverData = {
        ...values,
        licenseExpiry: values.licenseExpiry
          ? values.licenseExpiry.toDate()
          : null,
        experience: values.experience ? parseInt(values.experience) : 0,
      };

      console.log("Sending driver data:", driverData);

      let createdDriver;
      if (editingDriver) {
        await driverAPI.updateDriver(editingDriver._id, driverData);
        message.success("Driver updated successfully!");
      } else {
        const response = await driverAPI.createDriver(driverData);
        createdDriver = response.data;
        message.success("Driver added successfully!");

        // If there's an uploaded file for new driver, upload it now
        if (uploadedFile && createdDriver) {
          try {
            await driverAPI.uploadDriverPhoto(createdDriver._id, uploadedFile);
            // Preview will update from list reload
          } catch (uploadError) {
            console.error("Error uploading photo:", uploadError);
            // Don't fail the entire operation if photo upload fails
          }
        }
      }

      setIsModalOpen(false);
      setEditingDriver(null);
      setProfilePhotoUrl("");
      setUploadedFile(null);
      form.resetFields();
      loadDrivers(); // Reload drivers
    } catch (error) {
      console.error("Error saving driver:", error);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to save driver";

      if (error.response?.data?.error) {
        const backendError = error.response.data.error;

        // Check for specific validation errors
        if (
          backendError.includes("contact number") &&
          backendError.includes("already exists")
        ) {
          errorMessage = `❌ Contact Number Already Exists!\n\nThis contact number is already registered with another driver. Please use a different contact number.`;
        } else if (
          backendError.includes("license number") &&
          backendError.includes("already exists")
        ) {
          errorMessage = `❌ License Number Already Exists!\n\nThis license number is already registered. Please use a different license number.`;
        } else if (
          backendError.includes("email") &&
          backendError.includes("already exists")
        ) {
          errorMessage = `❌ Email Already Exists!\n\nThis email is already registered. Please use a different email address.`;
        } else if (backendError.includes("validation")) {
          errorMessage = `❌ Validation Error!\n\n${backendError}`;
        } else {
          errorMessage = `❌ Error!\n\n${backendError}`;
        }
      } else if (error.message) {
        errorMessage = `❌ Error!\n\n${error.message}`;
      }

      // Show error message with longer duration for better readability
      message.error({
        content: errorMessage,
        duration: 6,
        style: { whiteSpace: "pre-line" },
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete driver
  const deleteDriver = async (id) => {
    try {
      await driverAPI.deleteDriver(id);
      message.success("Driver deleted successfully!");
      loadDrivers(); // Reload drivers
    } catch (error) {
      message.error("Failed to delete driver");
      console.error("Error deleting driver:", error);
    }
  };

  // View driver details
  const handleView = (driver) => {
    setViewDriver(driver);
    setIsViewModalOpen(true);
  };

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setViewDriver(null);
  };

  // Check expired licenses
  const checkExpiredLicenses = async () => {
    try {
      setLoading(true);
      const response = await driverAPI.checkExpiredLicenses();
      const expiredCount = response.data.expiredCount || 0;
      const totalExpiredDrivers = response.data.totalExpiredDrivers || 0;
      const restoredCount = response.data.restoredCount || 0;

      // Populate and open the expired list modal
      const list = response.data.expiredDrivers || [];
      setExpiredDrivers(list);
      setIsExpiredModalOpen(true);

      message.success(
        `License check completed. Total Expired: ${totalExpiredDrivers}, Updated: ${expiredCount}, Restored: ${restoredCount} drivers.`
      );
      loadDrivers(); // Reload drivers to see updated status
    } catch (error) {
      message.error("Failed to check expired licenses");
      console.error("Error checking expired licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (driverId, file) => {
    try {
      setUploading(true);
      const response = await driverAPI.uploadDriverPhoto(driverId, file);
      message.success("Photo uploaded successfully!");

      // Update preview only; data persists server-side
      const serverUrl = `http://localhost:5000${response.data.photoUrl}`;
      setProfilePhotoUrl(serverUrl);

      // Clear the uploaded file since it's now saved to server
      setUploadedFile(null);

      loadDrivers(); // Reload drivers to show updated photo
      return response.data.photoUrl;
    } catch (error) {
      message.error("Failed to upload photo");
      console.error("Error uploading photo:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async (driverId) => {
    try {
      setUploading(true);
      await driverAPI.deleteDriverPhoto(driverId);
      message.success("Photo deleted successfully!");

      // Clear the form field and reset to default
      setProfilePhotoUrl("https://i.pravatar.cc/150");
      form.setFieldValue("profilePhoto", "https://i.pravatar.cc/150");

      loadDrivers(); // Reload drivers to show updated photo
    } catch (error) {
      message.error("Failed to delete photo");
      console.error("Error deleting photo:", error);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: "Profile",
      dataIndex: "profilePhoto",
      key: "profilePhoto",
      render: (photo) => {
        let src = photo || "";
        if (src) {
          if (src.startsWith("/uploads/")) {
            src = `http://localhost:5000${src}`;
          } else if (src.startsWith("uploads/")) {
            src = `http://localhost:5000/${src}`;
          }
        }
        return <Avatar src={src} size="large" />;
      },
      responsive: ["xs", "sm", "md", "lg"],
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      ellipsis: true,
    },
    {
      title: "License Number",
      dataIndex: "licenseNumber",
      key: "licenseNumber",
    },
    {
      title: "License Expiry",
      dataIndex: "licenseExpiry",
      key: "licenseExpiry",
      ellipsis: true,
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Contact Number",
      dataIndex: "contactNumber",
      key: "contactNumber",
    },
    {
      title: "Experience",
      dataIndex: "experience",
      key: "experience",
      render: (exp) => `${exp || 0} Years`,
    },
    {
      title: "Assigned Bus",
      dataIndex: "assignedBus",
      key: "assignedBus",
      ellipsis: true,
      render: (bus) => bus || "-",
    },
    {
      title: "Status",
      dataIndex: "availabilityStatus",
      key: "availabilityStatus",
      render: (status) => {
        let color = "default";
        switch (status) {
          case "Available":
            color = "green";
            break;
          case "Busy":
            color = "blue";
            break;
          case "On Leave":
            color = "orange";
            break;
          case "Suspended":
            color = "red";
            break;
          default:
            color = "default";
        }
        return (
          <Tag color={color} style={{ marginRight: 0 }}>
            {status?.toUpperCase() || "-"}
          </Tag>
        );
      },
      responsive: ["xs", "sm", "md", "lg"],
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<Eye size={18} />}
            type="link"
            onClick={() => handleView(record)}
            style={{ color: "#ff781e" }}
          />
          <Button
            icon={<Pencil size={18} />}
            type="link"
            onClick={() => showModal(record)}
            style={{ color: "#1890ff" }}
          />
          <Popconfirm
            title="Are you sure to delete this driver?"
            onConfirm={() => deleteDriver(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<Trash size={18} />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
      responsive: ["xs", "sm", "md", "lg"],
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ marginBottom: 20, marginTop: 0 }}>Driver Management</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              type="default"
              onClick={checkExpiredLicenses}
              loading={loading}
            >
              Check Expired Licenses
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              style={{ marginBottom: 20 }}
            >
              Add Driver
            </Button>
          </div>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={drivers}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 1000 }} // enables horizontal scroll for small screens
            responsive // ensures columns respond to screen size
            style={{ width: "100%", overflowX: "auto" }}
            rowKey="_id"
          />
        </Spin>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingDriver ? "Edit Driver" : "Add Driver"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[
              { required: true, message: "Please enter full name" },
              { min: 2, message: "Full name must be at least 2 characters" },
              { max: 100, message: "Full name cannot exceed 100 characters" },
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="License Number"
                name="licenseNumber"
                rules={[
                  { required: true, message: "Please enter license number" },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const trimmedValue = value.trim().toUpperCase();
                      if (
                        trimmedValue.length < 10 ||
                        trimmedValue.length > 16
                      ) {
                        return Promise.reject(
                          new Error("License must be 10-16 characters")
                        );
                      }
                      if (!/^[A-Z0-9]+$/.test(trimmedValue)) {
                        return Promise.reject(
                          new Error(
                            "License must contain only uppercase letters and digits"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                  {
                    validator: async (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }

                      // Check if this license number already exists
                      try {
                        const response = await driverAPI.getDrivers();
                        const existingDrivers = response.data || [];
                        const isDuplicate = existingDrivers.some(
                          (driver) =>
                            driver.licenseNumber ===
                              value.trim().toUpperCase() &&
                            (!editingDriver || driver._id !== editingDriver._id)
                        );

                        if (isDuplicate) {
                          return Promise.reject(
                            new Error(
                              "This license number is already registered with another driver"
                            )
                          );
                        }
                        return Promise.resolve();
                      } catch (error) {
                        // If API call fails, don't block the form
                        return Promise.resolve();
                      }
                    },
                  },
                ]}
              >
                <Input
                  placeholder="e.g., GJ07DL8932"
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="License Expiry"
                name="licenseExpiry"
                rules={[
                  {
                    required: true,
                    message: "Please select license expiry date",
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const selectedDate = value.toDate();
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      selectedDate.setHours(0, 0, 0, 0);
                      if (selectedDate < today) {
                        return Promise.reject(
                          new Error(
                            "License expiry must be today or a future date"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  placeholder="Select future date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contact Number"
                name="contactNumber"
                rules={[
                  { required: true, message: "Please enter contact number" },
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Contact number must be exactly 10 digits",
                  },
                  {
                    validator: async (_, value) => {
                      if (!value || value.length !== 10) {
                        return Promise.resolve();
                      }

                      // Check if this contact number already exists
                      try {
                        setValidating(true);
                        const response =
                          await driverAPI.getExistingContactNumbers();
                        const existingNumbers = response.data || [];
                        const isDuplicate = existingNumbers.some(
                          (driver) =>
                            driver.contactNumber === value &&
                            (!editingDriver ||
                              driver.fullName !== editingDriver.fullName)
                        );

                        if (isDuplicate) {
                          return Promise.reject(
                            new Error(
                              "This contact number is already registered with another driver"
                            )
                          );
                        }
                        return Promise.resolve();
                      } catch (error) {
                        // If API call fails, don't block the form
                        return Promise.resolve();
                      } finally {
                        setValidating(false);
                      }
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Experience (Years)"
                name="experience"
                rules={[
                  {
                    required: true,
                    message: "Please enter years of experience",
                  },
                  {
                    validator: (_, value) => {
                      if (
                        value === undefined ||
                        value === null ||
                        value === ""
                      ) {
                        return Promise.resolve();
                      }
                      const numValue = Number(value);
                      if (isNaN(numValue)) {
                        return Promise.reject(
                          new Error("Please enter a valid number")
                        );
                      }
                      if (numValue < 0) {
                        return Promise.reject(
                          new Error("Experience cannot be negative")
                        );
                      }
                      if (numValue > 50) {
                        return Promise.reject(
                          new Error("Experience cannot exceed 50 years")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="Enter years of experience"
                  min={0}
                  max={50}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Assigned Bus" name="assignedBus">
                <Input placeholder="Enter Bus ID or Number (optional)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Availability Status"
            name="availabilityStatus"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select placeholder="Select status">
              <Option value="Available">Available</Option>
              <Option value="Busy">Busy</Option>
              <Option value="On Leave">On Leave</Option>
              <Option value="Suspended">Suspended</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[
              { required: true, message: "Please enter address" },
              {
                min: 10,
                message: "Address must be at least 10 characters long",
              },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Enter complete address" />
          </Form.Item>

          <Form.Item label="Profile Photo (Optional)">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <Avatar
                  size={64}
                  src={profilePhotoUrl}
                  style={{ border: "2px solid #d9d9d9" }}
                >
                  {!profilePhotoUrl && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "50%",
                      }}
                    >
                      <UploadOutlined
                        style={{ fontSize: "24px", color: "#999" }}
                      />
                    </div>
                  )}
                </Avatar>
                <Upload
                  showUploadList={false}
                  beforeUpload={async (file) => {
                    const isImage = file.type.startsWith("image/");
                    if (!isImage) {
                      message.error("You can only upload image files!");
                      return false;
                    }
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error("Image must be smaller than 5MB!");
                      return false;
                    }

                    // If editing existing driver, upload immediately and get server URL
                    if (editingDriver) {
                      try {
                        const response = await driverAPI.uploadDriverPhoto(
                          editingDriver._id,
                          file
                        );
                        const serverUrl = `http://localhost:5000${response.data.photoUrl}`;
                        setProfilePhotoUrl(serverUrl);
                        form.setFieldValue("profilePhoto", serverUrl);
                        setUploadedFile(null); // Clear since it's uploaded
                        loadDrivers(); // Reload to show updated photo
                        message.success("Photo uploaded successfully!");
                      } catch (error) {
                        message.error("Failed to upload photo");
                        console.error("Error uploading photo:", error);
                      }
                    } else {
                      // For new drivers, create preview URL and store file for later upload
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setProfilePhotoUrl(e.target.result);
                      };
                      reader.readAsDataURL(file);
                      setUploadedFile(file);
                    }

                    return false;
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: "100%", height: "100%" }} />
                </Upload>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
                >
                  Click on the circle to upload from device (PNG/JPG/JPEG)
                </div>
              </div>
            </div>
          </Form.Item>

          <Form.Item
            style={{ marginTop: 20, marginBottom: 0, textAlign: "right" }}
          >
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || validating}
              disabled={validating}
            >
              {validating
                ? "Validating..."
                : editingDriver
                ? "Update Driver"
                : "Add Driver"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Driver Modal */}
      <Modal
        title="Driver Details"
        open={isViewModalOpen}
        onCancel={handleViewCancel}
        footer={null}
        width={600}
      >
        {viewDriver && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Full Name">
              {viewDriver.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="License Number">
              {viewDriver.licenseNumber}
            </Descriptions.Item>
            <Descriptions.Item label="License Expiry">
              {viewDriver.licenseExpiry
                ? dayjs(viewDriver.licenseExpiry).format("YYYY-MM-DD")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Number">
              {viewDriver.contactNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Experience">
              {viewDriver.experience || 0} Years
            </Descriptions.Item>
            <Descriptions.Item label="Assigned Bus">
              {viewDriver.assignedBus || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {viewDriver.availabilityStatus}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {viewDriver.address}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Expired Licenses Modal */}
      <Modal
        title="Expired Licenses"
        open={isExpiredModalOpen}
        onCancel={() => setIsExpiredModalOpen(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={expiredDrivers}
          rowKey={(row, idx) => row.licenseNumber || row._id || idx}
          pagination={{ pageSize: 5 }}
          columns={[
            {
              title: "Full Name",
              dataIndex: "name",
              key: "name",
              render: (v, r) => v || r.fullName || "-",
            },
            {
              title: "License Number",
              dataIndex: "licenseNumber",
              key: "licenseNumber",
            },
            {
              title: "Expiry Date",
              dataIndex: "expiryDate",
              key: "expiryDate",
              render: (d, r) => {
                const val = d || r.licenseExpiry;
                return val ? dayjs(val).format("YYYY-MM-DD") : "-";
              },
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (s, r) => {
                const status = s || r.availabilityStatus || "-";
                let color = "default";
                switch (status) {
                  case "Available":
                    color = "green";
                    break;
                  case "Busy":
                    color = "blue";
                    break;
                  case "On Leave":
                    color = "orange";
                    break;
                  case "Suspended":
                    color = "red";
                    break;
                  case "Inactive":
                    color = "red";
                    break;
                  default:
                    color = "default";
                }
                return <Tag color={color}>{status}</Tag>;
              },
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default Driver;
