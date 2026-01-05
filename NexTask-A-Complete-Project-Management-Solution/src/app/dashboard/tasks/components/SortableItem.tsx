import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CardHeader from '@/components/CardHeader';
import { DeleteOutline, EditOutlined, InfoOutlined } from '@mui/icons-material';
import { SortableItemProps } from '../types';

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item: task,
  onEditTask = () => {},
  onDeleteTask = () => {},
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '8px',
    padding: '8px',
    cursor: 'grab',
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        key={id}
        sx={{
          mb: 1,
          bgcolor: (theme) => theme.palette.background.default,
          minHeight: 200,
        }}
      >
        {task ? (
          <>
            <CardHeader
              title={task.title}
              action={
                <Stack direction={'row'}>
                  <IconButton onClick={() => onEditTask(task)} color="primary">
                    <EditOutlined />
                  </IconButton>
                  <IconButton onClick={() => onDeleteTask(task.id)} color="error">
                    <DeleteOutline />
                  </IconButton>
                </Stack>
              }
            />
            <CardContent>
              <Typography variant="subtitle1"></Typography>
              <Typography variant="body2" color="text.secondary">
                {task.description}
              </Typography>
            </CardContent>
            <CardActions>
              <Stack direction={'row'} justifyContent={'space-between'} sx={{ width: '100%' }}>
                <Chip
                  label={task.priority}
                  color={
                    task.priority === 'High'
                      ? 'error'
                      : task.priority === 'Medium'
                        ? 'warning'
                        : 'success'
                  }
                  size="small"
                />
                <Typography variant="caption">
                  Due: <b>{task.dueDate}</b>
                </Typography>
              </Stack>
            </CardActions>
          </>
        ) : (
          <Stack
            sx={{
              mb: 1,
              minHeight: 200,
            }}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <CardContent>
              <Stack alignItems={'center'}>
                <InfoOutlined color="action" fontSize="large" sx={{ mb: 1 }} />
                <Typography>No items to display</Typography>
              </Stack>
            </CardContent>
          </Stack>
        )}
      </Card>
    </Box>
  );
};
