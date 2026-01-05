import React, { useEffect, useMemo, useState } from "react";
import { routesAPI } from "../services/api";
import {
  Button,
  Card,
  Flex,
  Modal,
  Form,
  Input,
  Checkbox,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const WEEKDAYS = [
  { key: "S", label: "S" },
  { key: "M", label: "M" },
  { key: "T", label: "T" },
  { key: "W", label: "W" },
  { key: "Th", label: "T" },
  { key: "F", label: "F" },
  { key: "Sa", label: "S" },
];

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // route doc or null
  const [form] = Form.useForm();

  const load = async () => {
    const { data } = await routesAPI.list();
    setRoutes(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ from: "", to: "", weekdays: [] });
    setOpen(true);
  };

  const onEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      from: record.from,
      to: record.to,
      weekdays: record.weekdays || [],
    });
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await routesAPI.update(editing._id, values);
        message.success("Route updated");
      } else {
        await routesAPI.create(values);
        message.success("Route created");
      }
      setOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      // validation or api error already surfaced via antd
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    await routesAPI.remove(id);
    message.success("Route deleted");
    await load();
  };

  const columns = useMemo(
    () => [
      {
        title: "From",
        dataIndex: "from",
        key: "from",
      },
      {
        title: "To",
        dataIndex: "to",
        key: "to",
      },
      {
        title: "Runs on",
        key: "weekdays",
        render: (_, record) => (
          <Space size={4}>
            {WEEKDAYS.map((w) => (
              <Tag
                key={w.key}
                color={record.weekdays?.includes(w.key) ? "blue" : "default"}
              >
                {w.label}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
            <Popconfirm
              title="Delete route?"
              onConfirm={() => onDelete(record._id)}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [routes]
  );

  return (
    <Card
      title={
        <Flex align="center" justify="space-between">
          <span>Routes</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            Add Route
          </Button>
        </Flex>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={routes}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? "Edit Route" : "Add Route"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={onSave}
        confirmLoading={saving}
        okText={editing ? "Update" : "Save"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="From"
            name="from"
            rules={[{ required: true, message: "Please enter starting point" }]}
          >
            <Input placeholder="Starting point" />
          </Form.Item>
          <Form.Item
            label="To"
            name="to"
            rules={[{ required: true, message: "Please enter destination" }]}
          >
            <Input placeholder="Destination" />
          </Form.Item>
          <Form.Item label="Weekdays" name="weekdays">
            <Checkbox.Group>
              <Space>
                {WEEKDAYS.map((w) => (
                  <Checkbox key={w.key} value={w.key}>
                    {w.label}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
