import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
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

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      form.setFieldsValue({
        plan_name: initialValues.plan_name ?? "",
        description: initialValues.description ?? "",
        price: initialValues.price ?? 0,
        billing_period: initialValues.billing_period ?? undefined,
        features: Array.isArray(initialValues.features)
          ? initialValues.features
          : [],
        mark_as_popular: Boolean(initialValues.mark_as_popular),
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
          name="price"
          label="Price"
          rules={[{ required: true, message: "Price is required" }]}
        >
          <Input
            type="number"
            min={0}
            placeholder="Enter price"
            addonBefore={<DollarOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="billing_period"
          label="Billing Period"
          rules={[{ required: true, message: "Select billing period" }]}
        >
          <Select
            placeholder="Select billing period"
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
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
