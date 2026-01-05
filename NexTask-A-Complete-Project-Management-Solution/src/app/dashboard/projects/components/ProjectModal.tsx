'use client';
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { ErrorMessage, Field, Form, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(100, 'Name must be at most 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .max(500, 'Description must be at most 500 characters'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  status: Yup.string().required('Status is required'),
});

function ProjectModalWithFields({ content, mode, visible, onClose }) {
  const { submitForm } = useFormikContext();

  return (
    <Dialog open={visible} onClose={onClose}>
      <DialogTitle>{mode === 'add' ? 'Add Project' : 'Edit Project'}</DialogTitle>
      <DialogContent style={{ paddingTop: 10 }}>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => submitForm()} type="submit" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProjectModal({
  visible,
  setVisible,
  mode,
  initialValues,
  setInitialValues,
}) {
  const handleClose = () => {
    setVisible(false);
    setInitialValues({
      name: '',
      description: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={() => {
        enqueueSnackbar(`Project ${mode} successful!`, {
          variant: 'success',
        });
        setVisible(false);
      }}
      enableReinitialize
    >
      {({ errors, touched, values, handleChange, handleBlur }) => (
        <ProjectModalWithFields
          mode={mode}
          visible={visible}
          onClose={handleClose}
          content={
            <Form>
              <Grid2 container spacing={2}>
                <Grid2 size={6}>
                  <Field
                    as={TextField}
                    name="name"
                    label="Project Name"
                    variant="outlined"
                    fullWidth
                    error={touched.name && errors.name}
                    helperText={<ErrorMessage name="name" />}
                  />
                </Grid2>
                <Grid2 size={6}>
                  <FormControl fullWidth error={Boolean(touched.status && errors.status)}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Field
                      as={Select}
                      name="status"
                      labelId="status-label"
                      label="Status"
                      value={values.status}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value="">
                        <em>Select status</em>
                      </MenuItem>
                      <MenuItem value="Planning">Planning</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Field>
                    <ErrorMessage name="status" component={Typography} />
                  </FormControl>
                </Grid2>
                <Grid2 size={6}>
                  <Field
                    as={TextField}
                    name="startDate"
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    error={touched.startDate && errors.startDate}
                    helperText={<ErrorMessage name="startDate" />}
                  />
                </Grid2>
                <Grid2 size={6}>
                  <Field
                    as={TextField}
                    name="endDate"
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    error={touched.endDate && errors.endDate}
                    helperText={<ErrorMessage name="endDate" />}
                  />
                </Grid2>
                <Grid2 size={12}>
                  <Field
                    as={TextField}
                    name="description"
                    label="Description"
                    variant="outlined"
                    multiline
                    rows={4}
                    fullWidth
                    error={touched.description && errors.description}
                    helperText={<ErrorMessage name="description" />}
                  />
                </Grid2>
              </Grid2>
            </Form>
          }
        />
      )}
    </Formik>
  );
}
