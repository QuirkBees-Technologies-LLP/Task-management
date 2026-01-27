import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Row,
  Col,
} from "antd";
import { useEffect } from "react";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const PlansFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      form.setFieldsValue({
        plan_name: initialValues.plan_name ?? "",
        description: initialValues.description ?? "",
        plan_type: Array.isArray(initialValues.plan_type)
          ? initialValues.plan_type
          : [],
        trial_type: Array.isArray(initialValues.trial_type)
          ? initialValues.trial_type
          : [],
        price_monthly: initialValues.price?.monthly ?? 0,
        price_yearly: initialValues.price?.yearly ?? 0,
        billing_period: Array.isArray(initialValues.billing_period)
          ? initialValues.billing_period
          : [],
        users_allowed: initialValues.users_allowed ?? 0,
        organizations_allowed: initialValues.organizations_allowed ?? 0,
        best_for: initialValues.best_for ?? "",
        access_level: Array.isArray(initialValues.access_level)
          ? initialValues.access_level
          : [],
        features: Array.isArray(initialValues.features)
          ? initialValues.features
          : [],
        mark_as_popular: Boolean(initialValues.mark_as_popular),
        status: initialValues.status ?? "active",
      });
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  return (
    <Modal
      open={open}
      title={initialValues ? "Edit Plan" : "Create Plan"}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      maskClosable={false}
      className="org-modal"
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) => onSubmit(values, form)}
      >
        <Form.Item
          name="plan_name"
          label="Plan Name"
          rules={[{ required: true, message: "Plan name is required" }]}
        >
          <Input placeholder="Enter plan name" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Short description (optional)" />
        </Form.Item>

        <Form.Item
          name="plan_type"
          label="Plan Type"
          rules={[{ required: true, message: "Select at least one plan type" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select plan types"
            options={[
              { label: "Pro", value: "pro" },
              { label: "Basic", value: "basic" },
              { label: "Enterprise", value: "enterprise" },
              { label: "Free", value: "free" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="trial_type"
          label="Trial Type"
          rules={[{ required: true, message: "Select at least one trial type" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select trial types"
            options={[
              { label: "Free", value: "free" },
              { label: "Paid", value: "paid" },
            ]}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="price_monthly"
              label="Monthly Price"
              rules={[
                { required: true, message: "Monthly price is required" },
                { type: "number", min: 0, message: "Price must be 0 or greater" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={2}
                step={0.01}
                placeholder="Enter monthly price"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="price_yearly"
              label="Yearly Price"
              rules={[
                { required: true, message: "Yearly price is required" },
                { type: "number", min: 0, message: "Price must be 0 or greater" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={2}
                step={0.01}
                placeholder="Enter yearly price"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="billing_period"
          label="Billing Period"
          rules={[{ required: true, message: "Select at least one billing period" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select billing periods"
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
            ]}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="users_allowed"
              label="Users Allowed"
              rules={[
                { required: true, message: "Users allowed is required" },
                { type: "number", min: 0, message: "Must be 0 or greater" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={0}
                step={1}
                placeholder="Enter number of users"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="organizations_allowed"
              label="Organizations Allowed"
              rules={[
                { required: true, message: "Organizations allowed is required" },
                { type: "number", min: 0, message: "Must be 0 or greater" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={0}
                step={1}
                placeholder="Enter number of organizations"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="best_for" label="Best For">
          <Input placeholder="Enter target audience (e.g., 'Growing teams', 'Small businesses')" />
        </Form.Item>

        <Form.Item
          name="access_level"
          label="Access Level"
          rules={[{ required: true, message: "Select at least one access level" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select access levels"
            options={[
              { label: "Core", value: "core" },
              { label: "Basic", value: "basic" },
              { label: "Advanced", value: "advanced" },
              { label: "Premium", value: "premium" },
            ]}
          />
        </Form.Item>

        {/* ---------------- Features List ---------------- */}
        <Form.List name="features">
          {(fields, { add, remove }) => (
            <>
              <label>Features</label>
              {fields.map((field) => (
                <Form.Item
                  key={field.key}
                  {...field}
                  style={{ marginBottom: 8, width: "100%" }}
                  rules={[
                    { required: true, message: "Feature cannot be empty" },
                  ]}
                >
                  <Input
                    placeholder="Enter feature"
                    suffix={
                      <DeleteOutlined
                        style={{
                          color: "red",
                          fontSize: 18,
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          remove(field.name);
                        }}
                      />
                    }
                  />
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Feature
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item
          name="mark_as_popular"
          label="Mark as Popular"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Status is required" }]}
        >
          <Select
            placeholder="Select status"
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </Form.Item>

        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={loading}
            block
            style={{ width: "fit-content" }}
          >
            {initialValues ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PlansFormModal;
