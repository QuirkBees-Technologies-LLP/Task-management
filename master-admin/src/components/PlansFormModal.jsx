import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  InputNumber,
  Row,
  Col,
} from "antd";
import { useEffect } from "react";
import {
  DeleteOutlined,
  PlusOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

const PlansFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  /* ---------------- Validation Rules ---------------- */
  const nameRule = {
    pattern: /^[A-Za-z0-9\s]+$/,
    message: "Only letters and numbers allowed",
  };

  const positiveNumberRule = {
    type: "number",
    min: 1,
    message: "Value must be greater than 0",
  };

  const integerRule = {
    validator: (_, value) => {
      if (value === undefined || value === null) {
        return Promise.reject(new Error("This field is required"));
      }
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return Promise.reject(new Error("Only whole numbers are allowed"));
      }
      if (value <= 0) {
        return Promise.reject(new Error("Value must be greater than 0"));
      }
      return Promise.resolve();
    },
  };

  /* ---------------- Effect ---------------- */
  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      const billingPeriod = Array.isArray(initialValues.billing_period)
        ? initialValues.billing_period[0]
        : initialValues.billing_period;

      form.setFieldsValue({
        ...initialValues,
        price: {
          monthly:
            billingPeriod === "monthly" ? initialValues.price?.monthly || 0 : 0,
          yearly:
            billingPeriod === "yearly" ? initialValues.price?.yearly || 0 : 0,
        },
        features: initialValues.features ?? [],
        mark_as_popular: Boolean(initialValues.mark_as_popular),
        status: initialValues.status ?? "active",
      });
    }
  }, [open, initialValues, form]);

  return (
    <Modal
      open={open}
      title={initialValues ? "Edit Plan" : "Create Plan"}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ features: [] }}
        onFinish={(values) => {
          const billingPeriod = Array.isArray(values.billing_period)
            ? values.billing_period[0]
            : values.billing_period;

          const payload = {
            ...values,
            billing_period: billingPeriod ? [billingPeriod] : [],
            price: {
              monthly:
                billingPeriod === "monthly"
                  ? Number(values.price?.monthly || 0)
                  : 0,
              yearly:
                billingPeriod === "yearly"
                  ? Number(values.price?.yearly || 0)
                  : 0,
            },
          };

          onSubmit(payload, form);
        }}
      >
        {/* Plan Name */}
        <Form.Item
          name="plan_name"
          label="Plan Name"
          rules={[
            { required: true, message: "Plan name is required" },
            nameRule,
            { max: 50, message: "Maximum 50 characters allowed" },
          ]}
        >
          <Input placeholder="Enter plan name" />
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Description"
          rules={[{ max: 200, message: "Max 200 characters" }]}
        >
          <TextArea rows={3} placeholder="Enter description" />
        </Form.Item>

        {/* Plan Type */}
        <Form.Item
          name="plan_type"
          label="Plan Type"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="Select plan type"
            options={[
              { label: "Basic", value: "basic" },
              { label: "Pro", value: "pro" },
            ]}
          />
        </Form.Item>

        {/* Trial Type */}
        <Form.Item
          name="trial_type"
          label="Trial Type"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="Select trial type"
            options={[
              { label: "Free", value: "free" },
              { label: "Paid", value: "paid" },
            ]}
          />
        </Form.Item>

        {/* Price */}
        <Form.Item label="Price" required>
          <Form.Item noStyle>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["price", "monthly"]}
                  label="Monthly Price"
                  rules={[{ required: true }, positiveNumberRule]}
                >
                  <InputNumber
                    min={1}
                    addonBefore={<DollarOutlined />}
                    placeholder="Monthly price"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name={["price", "yearly"]}
                  label="Yearly Price"
                  rules={[{ required: true }, positiveNumberRule]}
                >
                  <InputNumber
                    min={1}
                    addonBefore={<DollarOutlined />}
                    placeholder="Yearly price"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </Form.Item>

        {/* Billing Period */}
        <Form.Item
          name="billing_period"
          label="Billing Period"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
            ]}
          />
        </Form.Item>

        {/* Users Allowed */}
        <Form.Item
          name="users_allowed"
          label="Users Allowed"
          rules={[{ required: true }, positiveNumberRule, integerRule]}
        >
          <InputNumber min={1} style={{ width: "100%" }}   precision={0} />
        </Form.Item>

        {/* Organizations Allowed */}
        <Form.Item
          name="organizations_allowed"
          label="Organizations Allowed"
          rules={[{ required: true }, positiveNumberRule, integerRule]}
        >
          <InputNumber min={1} style={{ width: "100%" }}    precision={0} />
        </Form.Item>

        {/* Best For */}
        <Form.Item
          name="best_for"
          label="Best For"
          rules={[
            { required: true },
            {
              validator: (_, value) =>
                typeof value === "number" ||
                (typeof value === "string" && value.trim())
                  ? Promise.resolve()
                  : Promise.reject(new Error("Invalid value")),
            },
          ]}
        >
          <Input placeholder="e.g. Startups / Teams / 10 users" />
        </Form.Item>

        {/* Access Level */}
        <Form.Item
          name="access_level"
          label="Access Level"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: "Basic", value: "basic" },
              { label: "Core", value: "core" },
            ]}
          />
        </Form.Item>

        {/* Features */}
        <Form.List
          name="features"
          rules={[
            {
              validator: async (_, features) => {
                if (!features || features.length < 1) {
                  return Promise.reject(
                    new Error("At least one feature is required"),
                  );
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }) => (
            <>
              <label>Features</label>
              {fields.map((field) => (
                <Form.Item
                  key={field.key}
                  {...field}
                  rules={[
                    {
                      validator: (_, value) =>
                        value?.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Feature cannot be empty"),
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter feature"
                    suffix={
                      <DeleteOutlined
                        onClick={() => remove(field.name)}
                        style={{ color: "red", cursor: "pointer" }}
                      />
                    }
                  />
                </Form.Item>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add()}
              >
                Add Feature
              </Button>
            </>
          )}
        </Form.List>

        {/* Status */}
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </Form.Item>

        {/* Popular */}
        <Form.Item
          name="mark_as_popular"
          label="Mark as Popular"
          valuePropName="checked"
        >
          <Switch />
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
