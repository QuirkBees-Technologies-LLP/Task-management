// 'use client';
// import React, { useState } from 'react';
// import { TextField, Button, Box, Grid2, CircularProgress, Typography } from '@mui/material';
// import { MailOutline, AttachFile } from '@mui/icons-material';
// import { useDispatch, useSelector } from 'react-redux';
// import { submitFeedback } from '@/redux/slices';
// import { selectFeedback } from '@/redux/selectors';
// import { enqueueSnackbar } from 'notistack';

// const MIN_LENGTH = 250;
// const initialValues = {
//   firstName: '',
//   lastName: '',
//   email: '',
//   feedback: '',
// };

// const FeedbackForm = () => {
//   const dispatch = useDispatch();
//   const [values, setValues] = useState<any>(initialValues);
//   const [error, setError] = useState(false);
//   const [attachment, setAttachment] = useState<File | null>(null);

//   const { saving } = useSelector(selectFeedback);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setValues((prev: any) => ({ ...prev, [name]: value }));
//     if (name === 'feedback' && value.length >= MIN_LENGTH) {
//       setError(false);
//     }
//   };

//   const ALLOWED_TYPES = [
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'text/plain',
//     'image/png',
//     'image/jpeg',
//     'image/jpg',
//     'image/gif',
//     'image/webp',
//   ];
//   const MAX_FILE_SIZE_MB = 50;

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       if (!ALLOWED_TYPES.includes(file.type)) {
//         enqueueSnackbar({
//           variant: 'error',
//           message: 'Unsupported file type. Please upload a valid document or image.',
//         });
//         return;
//       }
//       if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
//         enqueueSnackbar({
//           variant: 'error',
//           message: 'File size exceeds 5MB limit.',
//         });
//         return;
//       }
//       setAttachment(file);
//     }
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (values?.feedback?.length < MIN_LENGTH) {
//       setError(true);
//       return;
//     }

//     // Combine all form data including the file
//     const formData = new FormData();
//     Object.entries(values).forEach(([key, value]) => {
//       // Ensure value is a string before appending
//       formData.append(key, String(value));
//     });
//     if (attachment) {
//       formData.append('attachment', attachment);
//     }

//     dispatch(submitFeedback({ formData, setValues, setAttachment }));
//   };

//   return (
//     <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
//       <Grid2 container spacing={2}>
//         <Grid2 size={{ md: 8, lg: 6, sm: 12, xs: 12 }}>
//           <Grid2 container spacing={2}>
//             <Grid2 size={6}>
//               <TextField
//                 name="firstName"
//                 type="text"
//                 label="First Name"
//                 required
//                 fullWidth
//                 margin="dense"
//                 value={values?.firstName}
//                 onChange={handleInputChange}
//                 disabled={saving}
//               />
//             </Grid2>
//             <Grid2 size={6}>
//               <TextField
//                 name="lastName"
//                 type="text"
//                 label="Last Name"
//                 required
//                 fullWidth
//                 margin="dense"
//                 value={values?.lastName}
//                 onChange={handleInputChange}
//                 disabled={saving}
//               />
//             </Grid2>
//             <Grid2 size={12}>
//               <TextField
//                 name="email"
//                 type="email"
//                 label="Your Email"
//                 required
//                 fullWidth
//                 margin="dense"
//                 value={values?.email}
//                 onChange={handleInputChange}
//                 disabled={saving}
//               />
//             </Grid2>
//             <Grid2 size={12}>
//               <TextField
//                 label="Your Feedback"
//                 variant="outlined"
//                 name="feedback"
//                 fullWidth
//                 multiline
//                 minRows={4}
//                 value={values?.feedback}
//                 onChange={handleInputChange}
//                 required
//                 error={error}
//                 helperText={error ? 'Feedback must be at least 250 characters' : ''}
//                 disabled={saving}
//               />
//             </Grid2>
//             <Grid2 size={12}>
//               <Button
//                 variant="outlined"
//                 component="label"
//                 startIcon={<AttachFile />}
//                 disabled={saving}
//               >
//                 Upload Attachment
//                 <input
//                   type="file"
//                   hidden
//                   onChange={handleFileChange}
//                   accept=".pdf,.png,.jpg,.jpeg,.docx"
//                 />
//               </Button>
//               {attachment && (
//                 <Typography variant="body2" sx={{ mt: 1 }}>
//                   Selected file: {attachment.name}
//                 </Typography>
//               )}
//             </Grid2>
//           </Grid2>
//         </Grid2>
//       </Grid2>

//       <Button
//         startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <MailOutline />}
//         type="submit"
//         variant="contained"
//         color="primary"
//         sx={{ mt: 2 }}
//       >
//         Submit
//       </Button>
//     </Box>
//   );
// };

// export default FeedbackForm;
"use client";

import {
  Card,
  Avatar,
  Chip,
  Box,
  Typography,
  Dialog,
  IconButton,
  Button,
  Select, MenuItem, FormControl
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

interface FeedbackFormProps {
  name: string;
  time: string;
  message: string;
  avatar: string;
  status?: string;
  newticket?: string;
  priority?: string;
  lowpriority?: string;
  mediumpriority?: string;
  department?: string;
}

const FeedbackForm = ({
  name,
  time,
  message,
  avatar,
  status,
  newticket,
  priority,
  lowpriority,
  mediumpriority,
  department,
}: FeedbackFormProps) => {
  const [active, setActive] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const handleOpen = () => {
    setActive(true);
    setOpenModal(true);
  };

  const handleClose = () => {
    setActive(false);
    setOpenModal(false);
  };
  const [action, setAction] = useState("");

  const handleChange = (event) => {
    setAction(event.target.value);
  };

  return (
    <>
      {/* ================= CARD ================= */}
      <Card
        onClick={handleOpen}
        sx={(theme) => ({
          borderRadius: 1,
          border: "1.5px solid",
          borderColor: active
            ? theme.palette.mode === "dark"
              ? "#60A5FA" // light blue (dark bg)
              : "#3B82F6"
            : theme.palette.mode === "dark"
              ? "#2A2F3A"
              : "#ECEDF0",

          backgroundColor: active
            ? theme.palette.mode === "dark"
              ? "#0F1A2A" // dark blue tint
              : "#EFF4FB"
            : theme.palette.mode === "dark"
              ? "#0B0F1A"
              : "#fff",

          cursor: "pointer",
          transition: "all 0.25s ease",
          p: 2,
        })}
      >
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" gap={2} alignItems="center">
              <Avatar src={avatar} sx={{ width: 44, height: 44, borderRadius: 1 }} />
              <Typography fontWeight={600}>{name}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {time}
            </Typography>
          </Box>

          {/* Message */}
          <Typography variant="body2" mt={2} noWrap color="text.secondary">
            {message}
          </Typography>

          {/* Chips */}
          <Box display="flex" gap={1} mt={2} flexWrap="wrap">
            {newticket && <StatusChip label={newticket} bg="rgba(34, 197, 94, 0.2)" color="#22C55E" />}
            {status && <StatusChip label={status} bg="rgba(59, 130, 246, 0.2)" color="#3B82F6" />}
            {priority && <StatusChip label={priority} bg="rgba(255, 0, 0, 0.2)" color="#FF0000" />}
            {mediumpriority && <StatusChip label={mediumpriority} bg="rgba(129, 8, 234, 0.2)" color="#8108EA" />}
            {lowpriority && <StatusChip label={lowpriority} bg="rgba(67, 185, 178, 0.2)" color="#43B9B2" />}
          </Box>
        </Box>
      </Card>

      {/* ================= MODAL ================= */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, p: 3 },
        }}
      >
        {/* Modal Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={600} fontSize={18}>
            Help Needed For Payment Failure
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Tags */}
        <Box display="flex" gap={1} mt={2}>
          {newticket && <StatusChip label={newticket} bg="rgba(34, 197, 94, 0.2)" color="#22C55E" />}
          {status && <StatusChip label={status} bg="rgba(59, 130, 246, 0.2)" color="#3B82F6" />}
          {priority && <StatusChip label={priority} bg="rgba(255, 0, 0, 0.2)" color="#FF0000" />}
          {mediumpriority && <StatusChip label={mediumpriority} bg="rgba(129, 8, 234, 0.2)" color="#8108EA" />}
          {lowpriority && <StatusChip label={lowpriority} bg="rgba(67, 185, 178, 0.2)" color="#43B9B2" />}
        </Box>

        {/* User Info */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mt={3}>
          <Box display="flex" gap={2}>
            <Avatar src={avatar} sx={{ width: 44, height: 44, borderRadius: 1 }} />
            <Box>
              <Typography fontWeight={600}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {time}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="flex-end">
            <FormControl size="small">
              <Select
                value={action}
                onChange={handleChange}
                displayEmpty
                sx={{
                  minWidth: 160,
                  borderRadius: 1,
                  // backgroundColor: "#F3F4F6",
                  "& .MuiSelect-select": {
                    padding: "8px 12px",
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Ticket Action
                </MenuItem>
                <MenuItem value="progress">Mark as In Progress</MenuItem>
                <MenuItem value="resolve">Resolve Ticket</MenuItem>
                <MenuItem value="close">Close Ticket</MenuItem>
              </Select>
            </FormControl>
          </Box>

        </Box>

        {/* Message */}
        <Typography mt={2} color="text.secondary">
          {message}
        </Typography>
      </Dialog>
    </>
  );
};

/* ================= REUSABLE CHIP ================= */
const StatusChip = ({ label, bg, color }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      backgroundColor: bg,
      color,
      borderRadius: "4px",
      px: 1,
      fontSize: "14px",
      minWidth: 'fit-content !important',
      padding: '8px 10px',
      '& .MuiChip-label': { fontSize: '14px', padding: 0, }
    }}
  />
);

export default FeedbackForm;
