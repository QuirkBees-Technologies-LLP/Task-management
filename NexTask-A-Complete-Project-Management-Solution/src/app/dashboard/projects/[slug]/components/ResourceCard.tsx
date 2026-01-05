import React, { useState, MouseEvent } from 'react';
import CardHeader from '@/components/CardHeader';
import { AddOutlined, DeleteOutline, EditOutlined, MoreVert } from '@mui/icons-material';
import {
  Avatar,
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  TextField,
} from '@mui/material';
import { projectResources } from '@/utils/data';
import { TeamMember } from '../../types';
import { getRandomColor } from '@/utils/constants';

export default function ResourceCard(): JSX.Element {
  const [team, setTeam] = useState<TeamMember[]>(projectResources);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [newMember, setNewMember] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: '',
  });

  const menuOpen = Boolean(menuAnchorEl);

  // Handlers for the More menu
  const handleOpenMoreMenu = (event: MouseEvent<HTMLElement>, member: TeamMember) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleCloseMoreMenu = () => {
    setMenuAnchorEl(null);
    setSelectedMember(null);
  };

  // Add Member Handlers
  const handleOpenAddModal = () => setAddModalOpen(true);
  const handleCloseAddModal = () => setAddModalOpen(false);

  const handleAddMember = () => {
    if (newMember.name && newMember.role) {
      setTeam((prev) => [...prev, { id: Date.now(), name: newMember.name, role: newMember.role }]);
      setNewMember({ name: '', role: '' });
      setAddModalOpen(false);
    }
  };

  // Edit Member Handlers
  const handleOpenEditModal = () => {
    setEditModalOpen(true);
    handleCloseMoreMenu();
  };

  const handleCloseEditModal = () => setEditModalOpen(false);

  const handleEditMember = () => {
    if (selectedMember && selectedMember.name && selectedMember.role) {
      setTeam((prev) =>
        prev.map((member) => (member.id === selectedMember.id ? selectedMember : member))
      );
      setEditModalOpen(false);
    }
  };

  // Delete Member Handlers
  const handleOpenDeleteModal = () => {
    setDeleteModalOpen(true);
    handleCloseMoreMenu();
  };

  const handleCloseDeleteModal = () => setDeleteModalOpen(false);

  const handleDeleteMember = () => {
    setTeam((prev) => prev.filter((member) => member.id !== selectedMember?.id));
    setDeleteModalOpen(false);
  };

  return (
    <Paper>
      <CardHeader
        title="Team"
        action={
          <Button startIcon={<AddOutlined />} onClick={handleOpenAddModal}>
            Add
          </Button>
        }
      />
      <CardContent sx={{ height: 440, overflow: 'auto' }}>
        <List>
          {team.map((member) => (
            <ListItem
              key={member.id}
              secondaryAction={
                <>
                  <IconButton onClick={(e) => handleOpenMoreMenu(e, member)}>
                    <MoreVert />
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={menuOpen}
                    onClose={handleCloseMoreMenu}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                  >
                    <MenuItem onClick={handleOpenEditModal}>
                      <ListItemIcon>
                        <EditOutlined fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Edit</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleOpenDeleteModal}>
                      <ListItemIcon>
                        <DeleteOutline fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getRandomColor() }}>{member.name.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={member.name} secondary={member.role} />
            </ListItem>
          ))}
        </List>
      </CardContent>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal}>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Role"
            value={newMember.role}
            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancel</Button>
          <Button onClick={handleAddMember} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onClose={handleCloseEditModal}>
        <DialogTitle>Edit Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Name"
            value={selectedMember?.name || ''}
            onChange={(e) =>
              setSelectedMember((prev) => (prev ? { ...prev, name: e.target.value } : null))
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Role"
            value={selectedMember?.role || ''}
            onChange={(e) =>
              setSelectedMember((prev) => (prev ? { ...prev, role: e.target.value } : null))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <Button onClick={handleEditMember} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
        <DialogTitle>Delete Member</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this member?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteModal}>Cancel</Button>
          <Button onClick={handleDeleteMember} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
