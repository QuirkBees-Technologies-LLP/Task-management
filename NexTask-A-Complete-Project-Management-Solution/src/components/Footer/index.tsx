import { Box, Container, Grid2, Typography, Link, Paper, useTheme, Stack } from '@mui/material';
import NextLink from 'next/link';
import Logo from '../Logo';
import { FacebookOutlined, Instagram, Twitter } from '@mui/icons-material';
import packageJson from '../../../package.json';

const Footer = () => {
  const theme = useTheme();
  return (
    <Box
      component={Paper}
      borderRadius={0}
      sx={{
        pt: 4,
        pb: 1,
        mt: 4,
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0,
      }}
    >
      <Container maxWidth="md">
        <Grid2 container spacing={4}>
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <Box mb={2}>
              <Logo />
            </Box>
            <Typography variant="h6" gutterBottom>
              About Us
            </Typography>
            <Typography variant="body2" color="textDisabled">
              At NexTask, we’re passionate about transforming the way teams collaborate and achieve
              their goals.
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            {[
              { title: 'Home', key: '' },
              { title: 'About', key: '/about' },
              { title: 'Terms & Conditions ', key: '/terms' },
              { title: 'Privacy Policy', key: '/privacy-policy' },
            ].map((item) => (
              <Link key={item.key} component={NextLink} href={item.key}>
                <Typography
                  variant="body2"
                  color="textDisabled"
                  gutterBottom
                  sx={{ ':hover': { color: theme.palette.text.primary } }}
                >
                  {item.title}
                </Typography>
              </Link>
            ))}
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 4 }}>
            <Typography variant="h6" gutterBottom>
              Follow Us
            </Typography>
            {[
              {
                title: 'Facebook',
                key: 'https://facebook.com',
                icon: <FacebookOutlined />,
              },
              {
                title: 'Twitter',
                key: 'https://twitter.com',
                icon: <Twitter />,
              },
              {
                title: 'Instagram',
                key: 'https://intagram.com',
                icon: <Instagram />,
              },
            ].map((item) => (
              <Link
                key={item.key}
                href={item.key}
                rel="noopener noreferrer"
                target="_blank"
                component={NextLink}
              >
                <Typography
                  color="textDisabled"
                  variant="subtitle2"
                  sx={{
                    ':hover': {
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <Stack direction={'row'} spacing={1} alignItems={'center'}>
                    <span>{item.icon}</span>
                    <span style={{ paddingBottom: 3 }}>{item.title}</span>
                  </Stack>
                </Typography>
              </Link>
            ))}
          </Grid2>
        </Grid2>
        <Box textAlign={'center'} pt={2}>
          <Typography variant="caption">
            &copy; {new Date().getFullYear()} NexTask v{packageJson.version}. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
