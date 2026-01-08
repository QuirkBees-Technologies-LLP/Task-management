import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import { plansAPI } from "../services/api";

const OrganizationFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEditing = Boolean(initialValues?._id);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  /* -------------------- Populate Form -------------------- */
  useEffect(() => {
    if (!open) return;

    if (isEditing && initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        slug: initialValues.slug,
        firstName: initialValues.firstName,
        lastName: initialValues.lastName,
        email: initialValues.email,
        planId: initialValues.planId,
      });
    } else {
      form.resetFields();
    }
  }, [open, isEditing, initialValues, form]);

  /* -------------------- Plan Selection -------------------- */
  useEffect(() => {
    if (!open) return;

    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const res = await plansAPI.list();

        console.log("Plans API response:", res.data);

        setPlans(Array.isArray(res.data?.plans) ? res.data.plans : []);
      } catch (err) {
        console.error("Failed to load plans", err);
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, [open]);

  const planOptions = useMemo(
    () =>
      plans
        .filter((plan) => plan.status === "active")
        .map((plan) => ({
          value: plan._id,
          label: `${plan.plan_name} - ₹${plan.price}/${plan.billing_period}`,
        })),
    [plans]
  );

  /* -------------------- Handlers -------------------- */
  const handleFinish = useCallback(
    (values) => {
      onSubmit(values, form);
    },
    [onSubmit, form]
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    onCancel();
  }, [form, onCancel]);

  return (
    <Modal
      title={isEditing ? "Edit Organization" : "Add Organization"}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      className="org-modal"
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          label="Company Name"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Company Slug"
          name="slug"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Owner First Name"
          name="firstName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Owner Last Name"
          name="lastName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Owner Email"
          name="email"
          rules={[{ required: true }, { type: "email" }]}
        >
          <Input />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            label="Owner Password"
            name="ownerPassword"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
        )}
        <Form.Item
          label="Select Plan"
          name="planId"
          rules={[{ required: true, message: "Please select a plan" }]}
        >
          <Select
            showSearch
            placeholder="Search & select a plan"
            loading={plansLoading}
            optionFilterProp="label"
            filterSort={(a, b) =>
              a.label.toLowerCase().localeCompare(b.label.toLowerCase())
            }
            options={planOptions}
          />
        </Form.Item>

        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ width: "fit-content" }}
          >
            {loading
              ? isEditing
                ? "Update Organization"
                : "Create Organization"
              : isEditing
              ? "Update Company"
              : "Add Company"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OrganizationFormModal;
