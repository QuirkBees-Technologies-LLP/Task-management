import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem'; // Ensure SortableItem is correctly defined
import { Typography, Paper, Box, Stack, useTheme, useMediaQuery } from '@mui/material';
import { TaskBoardProps, ColumnsType, Task } from '../types';

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onEditTask, onDeleteTask }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [columns, setColumns] = useState<ColumnsType>({
    Todo: [],
    'In Progress': [],
    Done: [],
  });

  // Update columns state when tasks prop changes
  useEffect(() => {
    setColumns({
      Todo: tasks.filter((task: Task) => task.status === 'Todo'),
      'In Progress': tasks.filter((task: Task) => task.status === 'In Progress'),
      Done: tasks.filter((task: Task) => task.status === 'Done'),
    });
  }, [tasks]);

  // Handle the drag end event to move tasks between columns
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over }: any = event;

    // If there is no target to drop on, return
    if (!over) return;

    const [fromColumn, fromIndex] = active.id.split('-');
    const [toColumn, toIndex] = over.id.split('-');

    // If the item is dropped back in the same place, return
    if (fromColumn === toColumn && fromIndex === toIndex) return;

    const fromList = [...columns[fromColumn]];
    const toList = [...columns[toColumn]];

    // Move the item to the new list
    const [movedItem] = fromList.splice(parseInt(fromIndex), 1);
    toList.splice(parseInt(toIndex), 0, movedItem);

    // Update columns state with the moved item
    setColumns({
      ...columns,
      [fromColumn]: fromList,
      [toColumn]: toList,
    });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Box
        sx={{
          maxWidth: isSmallScreen ? '90vw' : '100%',
          overflowX: isSmallScreen ? 'scroll' : 'auto',
        }}
      >
        <Stack direction="row" spacing={3} flexWrap="nowrap">
          {Object.keys(columns).map((columnKey) => (
            <Paper
              key={columnKey}
              sx={{
                padding: '16px',
                minWidth: 300,
              }}
            >
              <Typography variant="h6" textAlign="center" gutterBottom>
                {columnKey}
              </Typography>
              <SortableContext
                items={columns[columnKey].map((_, index) => `${columnKey}-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                {columns[columnKey].length ? (
                  columns[columnKey].map((item, index) => (
                    <SortableItem
                      key={`${columnKey}-${index}`}
                      id={`${columnKey}-${index}`}
                      item={item}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))
                ) : (
                  <SortableItem key={`${columnKey}-0`} id={`${columnKey}-0`} item={null} />
                )}
              </SortableContext>
            </Paper>
          ))}
        </Stack>
      </Box>
    </DndContext>
  );
};

export default TaskBoard;
