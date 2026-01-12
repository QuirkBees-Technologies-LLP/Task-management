import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import PlanSelect from "../components/PlanSelect";

const OrganizationFormModal = ({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEditing = Boolean(initialValues?._id);  
  
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
          getValueFromEvent={(value) => value}
          rules={[{ required: true, message: "Please select a plan" }]}
        >
          <PlanSelect />
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
