import AnimatedComponent from '@/components/Animated';
import {
  Box,
  Button,
  CardContent,
  Divider,
  Grid2,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { enqueueSnackbar } from 'notistack';
import React from 'react';

const mandatoryMark = <span style={{ color: 'red' }}>*</span>;

export default function ContactForm({ isPage = false }) {
  return (
    <Box component="section" py={8} id="contact-form">
      {!isPage && (
        <Grid2 container justifyContent="center">
          <Grid2 size={{ xs: 12, sm: 10, md: 7 }}>
            <Typography variant="h5" textAlign="center" gutterBottom>
              Contact us
            </Typography>
            <Divider>
              <Typography textAlign="center" variant="body2">
                Need Support? Reach out to us!
              </Typography>
            </Divider>
          </Grid2>
        </Grid2>
      )}

      <Box sx={{ pt: { xs: isPage ? 0 : 6, md: isPage ? 0 : 8 } }}>
        <Grid2 container alignItems={'center'}>
          <Grid2 size={{ md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <AnimatedComponent>
              <Image src={'/images/contact.png'} alt="contact" height={400} width={400} />
            </AnimatedComponent>
          </Grid2>
          <Grid2 size={{ md: 6 }}>
            <AnimatedComponent>
              <Paper>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      enqueueSnackbar({
                        message: 'Message sent!',
                        variant: 'success',
                      });
                    }}
                  >
                    <Grid2 container>
                      <Grid2 size={{ xs: 12, sm: 6, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Name {mandatoryMark}
                        </Typography>
                        <TextField
                          variant="outlined"
                          type="text"
                          placeholder="Enter name"
                          fullWidth
                          required
                        />
                      </Grid2>
                      <Grid2 size={{ xs: 12, sm: 6, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Email {mandatoryMark}
                        </Typography>

                        <TextField
                          variant="outlined"
                          placeholder="Enter email"
                          type="email"
                          fullWidth
                          required
                        />
                      </Grid2>
                      <Grid2 size={{ xs: 12, md: 12 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Subject {mandatoryMark}
                        </Typography>
                        <TextField
                          type="text"
                          placeholder="Enter title"
                          variant="outlined"
                          fullWidth
                          required
                        />
                      </Grid2>
                      <Grid2 size={{ xs: 12, md: 12 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Message {mandatoryMark}
                        </Typography>

                        <TextField
                          type="text"
                          placeholder="Enter your message here..."
                          variant="outlined"
                          fullWidth
                          required
                          multiline
                          rows={4}
                        />
                      </Grid2>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ marginLeft: 'auto' ,  background:"linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)" , borderRadius: '5px !important' , py: '10px', }}
                      >
                        Send
                      </Button>
                    </Grid2>
                  </form>
                </CardContent>
              </Paper>
            </AnimatedComponent>
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
}
