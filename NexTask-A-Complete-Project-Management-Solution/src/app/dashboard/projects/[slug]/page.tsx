'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import DetailsCard from './components/DetailsCard';
import ProjectModal from '../components/ProjectModal';
import ProjectDeleteDialog from '../components/DeleteProject';
import { enqueueSnackbar } from 'notistack';
import TaskCard from './components/TaskCard';
import { projectDetail } from '@/utils/data';
import ResourceCard from './components/ResourceCard';
import { Grid2 } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';

export default function ProjectDetails() {
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  const [editOpen, setEditOpen] = useState(false); // For edit modal
  const [deleteOpen, setDeleteOpen] = useState(false); // For delete confirmation dialog

  // Handle opening the edit modal
  const handleEdit = () => {
    setEditOpen(true);
  };

  // Handle deleting the project
  const handleDeleteProject = () => {
    enqueueSnackbar('Project deleted successfully!', { variant: 'success' });
    setDeleteOpen(false);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    setDeleteOpen(true);
  };

  return (
    <>
      {/* Page Header */}
      <PageHeader title="Project 1: Design UI/UX" />

      {/* Project Details Card */}
      <DetailsCard
        project={projectDetail}
        handleEdit={isAdmin ? handleEdit : undefined}
        setDeleteOpen={isAdmin ? openDeleteDialog : undefined}
      />

      {/* Task and Resource Cards */}
      <Grid2 container spacing={3} sx={{ mt: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TaskCard />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <ResourceCard />
        </Grid2>
      </Grid2>

      {/* Project Edit Modal */}
      <ProjectModal
        mode={'edit'}
        initialValues={projectDetail}
        setInitialValues={() => setEditOpen(false)}
        visible={editOpen}
        setVisible={setEditOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ProjectDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={handleDeleteProject}
      />
    </>
  );
}
