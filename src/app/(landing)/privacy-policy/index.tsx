import React from 'react';
import { Typography, Box, Link, Button } from '@mui/material';

const PrivacyPolicy = () => (
  <>
    <Box my={5}>
      <Typography variant="h4" gutterBottom>
        Privacy Policy
      </Typography>

      <Typography variant="body2">
        Welcome to OpsDeck! This Privacy Policy explains how we collect, use, and share your
        personal information when you use our project and task management application built using
        Next.js and Material-UI (MUI).
      </Typography>

      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          1. Information We Collect
        </Typography>
        <Typography component={'div'} variant="body2">
          We collect the following types of information:
          <ul>
            <li>
              <strong>Personal Information:</strong> Information that identifies you, such as your
              name, email address, and payment details.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use our service, such as your
              IP address, browser type, and activity on our site.
            </li>
            <li>
              <strong>Cookies:</strong> We use cookies and similar tracking technologies to track
              the activity on our service and hold certain information.
            </li>
          </ul>
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          2. How We Use Your Information
        </Typography>
        <Typography component={'div'} variant="body2">
          We use your information to:
          <ul>
            <li>Provide and maintain our Service.</li>
            <li>
              Process transactions and send related information, such as purchase confirmations and
              invoices.
            </li>
            <li>
              Send you technical notices, updates, security alerts, and support and administrative
              messages.
            </li>
            <li>
              Monitor and analyze trends, usage, and activities in connection with our Service.
            </li>
            <li>Personalize your experience by providing content that matches your interests.</li>
          </ul>
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          3. How We Share Your Information
        </Typography>
        <Typography component={'div'} variant="body2">
          We may share your personal information in the following ways:
          <ul>
            <li>
              <strong>Service Providers:</strong> We may share your information with third-party
              vendors who provide services on our behalf.
            </li>
            <li>
              <strong>Business Transfers:</strong> We may share or transfer your information in
              connection with, or during negotiations of, any merger, sale of company assets,
              financing, or acquisition of all or a portion of our business to another company.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose your information if required to
              do so by law or in response to valid requests by public authorities.
            </li>
          </ul>
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          4. Security of Your Information
        </Typography>
        <Typography variant="body2">
          We take reasonable measures to help protect your personal information from loss, theft,
          misuse, and unauthorized access, disclosure, alteration, and destruction.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          5. Your Data Protection Rights
        </Typography>
        <Typography component={'div'} variant="body2">
          Depending on your location, you may have the following rights regarding your personal
          information:
          <ul>
            <li>
              The right to access – You have the right to request copies of your personal
              information.
            </li>
            <li>
              The right to rectification – You have the right to request that we correct any
              information you believe is inaccurate or complete information you believe is
              incomplete.
            </li>
            <li>
              The right to erasure – You have the right to request that we erase your personal data,
              under certain conditions.
            </li>
            <li>
              The right to restrict processing – You have the right to request that we restrict the
              processing of your personal data, under certain conditions.
            </li>
            <li>
              The right to object to processing – You have the right to object to our processing of
              your personal data, under certain conditions.
            </li>
            <li>
              The right to data portability – You have the right to request that we transfer the
              data that we have collected to another organization, or directly to you, under certain
              conditions.
            </li>
          </ul>
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          6. Changes to This Privacy Policy
        </Typography>
        <Typography variant="body2">
          We may update our Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page. You are advised to review this Privacy Policy
          periodically for any changes. Changes to this Privacy Policy are effective when they are
          posted on this page.
        </Typography>

        <Typography variant="h6" gutterBottom>
          7. Contact Us
        </Typography>
        <Typography variant="body2">
          If you have any questions about this Privacy Policy, please contact us at{' '}
          <Link href="mailto:husnainakhtar06@gmail.com" underline="none">
            <Button>support@OpsDeck.com</Button>
          </Link>
        </Typography>
      </Box>
    </Box>
  </>
);

export default PrivacyPolicy;
