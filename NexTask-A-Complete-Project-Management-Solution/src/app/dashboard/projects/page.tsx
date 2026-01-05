'use client';
import React, { useState } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AddOutlined, DeleteOutline, EditOutlined, MoreVert } from '@mui/icons-material';
import ProjectModal from './components/ProjectModal';
import PageHeader from '@/components/PageHeader';
import ResponsiveTable from '@/components/Table';
import ProjectDeleteDialog from './components/DeleteProject';
import { enqueueSnackbar } from 'notistack';
import { projectColumns, projectListKeys } from './helpers';
import { Project } from './types';
import { mockData } from '@/utils/constants';

const projects: Project[] | any[] = mockData.projects;

export default function Projects() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [dataSource] = useState<Project[]>(projects);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  const [projectModalVisible, setProjectModalVisible] = useState<boolean>(false);

  const [selectedProject, setSelectedProject] = useState<Project>({
    name: '',
    description: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const handleOpenMoreMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteProject = () => {
    enqueueSnackbar('Project delete successful!', { variant: 'success' });
    setDeleteOpen(false);
  };

  return (
    <>
      <PageHeader
        title={'Projects'}
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setProjectModalVisible(true)}
          >
            Add New
          </Button>
        }
      />

      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          data={dataSource}
          columns={projectColumns}
          listKeys={projectListKeys}
          renderActions={(item) => (
            <>
              {isSmallScreen ? (
                <>
                  <IconButton onClick={handleOpenMoreMenu} size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={isMenuOpen}
                    onClose={handleCloseMenu}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        setProjectModalVisible(true);
                        setSelectedProject(item);
                      }}
                    >
                      <ListItemIcon>
                        <EditOutlined fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Edit</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => setDeleteOpen(true)}>
                      <ListItemIcon>
                        <DeleteOutline fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Stack direction={'row'}>
                  <IconButton
                    onClick={() => {
                      setProjectModalVisible(true);
                      setSelectedProject(item);
                    }}
                  >
                    <EditOutlined color="primary" />
                  </IconButton>
                  <IconButton onClick={() => setDeleteOpen(true)}>
                    <DeleteOutline color="warning" />
                  </IconButton>
                </Stack>
              )}
            </>
          )}
        />
      </Paper>

      <ProjectModal
        visible={projectModalVisible}
        setVisible={setProjectModalVisible}
        mode={selectedProject.name ? 'edit' : 'add'}
        initialValues={selectedProject}
        setInitialValues={setSelectedProject}
      />

      <ProjectDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={handleDeleteProject}
      />
    </>
  );
}
