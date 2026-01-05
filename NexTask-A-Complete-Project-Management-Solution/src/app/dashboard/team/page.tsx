'use client';
import React, { useState, useEffect } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Pagination,
  Stack,
  Paper,
  useTheme,
  useMediaQuery,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  EditOutlined,
  DeleteOutline,
  MoreVert,
} from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import { getRandomColor, mockData } from '@/utils/constants';
import PageHeader from '@/components/PageHeader';
import ResourceModal from './components/ResourceModal';
import { TeamMember } from './types';
import { roleColors } from './helpers';

export default function TeamManagement() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockData.teams);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const itemsPerPage = 5;
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const filtered = teamMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
    setPage(1);
  }, [teamMembers, searchTerm]);

  const handleOpenDialog = (member: TeamMember | null = null) => {
    setCurrentMember(
      member || {
        id: Date.now(),
        name: '',
        email: '',
        role: '',
        department: '',
        joinDate: '',
        skills: [],
      }
    );
    setResourceDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setResourceDialogOpen(false);
    setCurrentMember(null);
  };

  const handleOpenMoreMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleSaveMember = () => {
    if (currentMember) {
      if (currentMember.id) {
        setTeamMembers(teamMembers.map((m) => (m.id === currentMember.id ? currentMember : m)));
        enqueueSnackbar({
          message: 'Team member updated successfully',
          variant: 'success',
        });
      } else {
        setTeamMembers([...teamMembers, { ...currentMember, id: Date.now() }]);
        enqueueSnackbar({
          message: 'Team member added successfully',
          variant: 'success',
        });
      }
      handleCloseDialog();
    }
  };

  const handleDeleteMember = (id: number) => {
    setCurrentMember(teamMembers.find((m) => m.id === id) || null);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentMember) {
      setTeamMembers(teamMembers.filter((member) => member.id !== currentMember.id));
      enqueueSnackbar({
        message: 'Team member removed successfully',
        variant: 'success',
      });
      setDeleteConfirmOpen(false);
      setCurrentMember(null);
    }
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <>
      <PageHeader
        title="Team Management"
        action={
          isSmallScreen ? (
            <Button variant="contained" onClick={() => handleOpenDialog()}>
              <AddIcon />
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Member
            </Button>
          )
        }
      />

      <Paper sx={{ p: 2 }}>
        <Stack alignItems={'end'} mb={2}>
          <TextField
            variant={'outlined'}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              },
            }}
            fullWidth={isSmallScreen}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
          />
        </Stack>

        <List>
          {filteredMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((member) => (
            <ListItem
              key={member.id}
              sx={{ bgcolor: 'background.paper', mb: 1 }}
              secondaryAction={
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
                        <MenuItem onClick={() => handleOpenDialog(member)}>
                          <ListItemIcon>
                            <EditOutlined fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Edit</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleDeleteMember(member.id)}>
                          <ListItemIcon>
                            <DeleteOutline fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <Stack direction={'row'}>
                      <IconButton onClick={() => handleOpenDialog(member)}>
                        <EditOutlined color="primary" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteMember(member.id)}>
                        <DeleteOutline color="warning" />
                      </IconButton>
                    </Stack>
                  )}
                </>
              }
              component={Paper}
            >
              <Avatar sx={{ bgcolor: roleColors[member.role] || 'grey', mr: 2 }}>
                {member.name[0]}
              </Avatar>
              <ListItemText
                primary={member.name}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {member.email}
                    </Typography>
                    {` — ${member.role}, ${member.department}`}
                    <br />
                    <Stack direction={'row'} alignItems={'center'} spacing={0.2} flexWrap={'wrap'}>
                      {member.skills.slice(0, 2).map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          sx={{
                            backgroundColor: getRandomColor(),
                            color: '#fff',
                            minWidth: isSmallScreen ? 70 : 100,
                          }}
                        />
                      ))}
                      {member.skills.length - member.skills.slice(0, 2).length > 0 && (
                        <Chip
                          label={`+${member.skills.length - member.skills.slice(0, 2).length}`}
                          style={{ minWidth: 40 }}
                        />
                      )}
                    </Stack>
                  </React.Fragment>
                }
                secondaryTypographyProps={{
                  component: 'div',
                }}
              />
            </ListItem>
          ))}
        </List>

        <Stack alignItems={'end'}>
          <Pagination
            count={Math.ceil(filteredMembers.length / itemsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
          />
        </Stack>
      </Paper>

      {/* Add/Edit Resource */}
      <ResourceModal
        open={resourceDialogOpen}
        setOpen={setResourceDialogOpen}
        currentMember={currentMember}
        setCurrentMember={setCurrentMember}
        handleSaveMember={handleSaveMember}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {currentMember?.name} from the team?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="secondary" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
