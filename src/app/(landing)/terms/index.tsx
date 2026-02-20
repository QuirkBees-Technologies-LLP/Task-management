import React from 'react';
import { Typography, Box, Link, Button } from '@mui/material';

const TermsAndConditions = () => (
  <>
    <Box py={5}>
      <Typography variant="h4" gutterBottom>
        Terms and Conditions
      </Typography>

      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          1. Introduction
        </Typography>
        <Typography variant="body2" gutterBottom>
          {` Welcome to OpsDeck, a project and task management application built
          using Next.js and Material-UI (MUI). These Terms and Conditions
          ("Terms") govern your use of our services ("Service"). By accessing or
          using OpsDeck, you agree to be bound by these Terms.`}
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          2. Use of the Service
        </Typography>
        <Typography variant="subtitle1">a. Eligibility</Typography>
        <Typography variant="body2" gutterBottom>
          You must be at least 18 years old to use our Service. By using OpsDeck, you represent and
          warrant that you meet this age requirement.
        </Typography>
        <Typography variant="subtitle1">b. Account Registration</Typography>
        <Typography variant="body2" gutterBottom>
          To use certain features of our Service, you must register for an account. You agree to
          provide accurate and complete information during the registration process and to update
          such information as necessary to keep it accurate and complete.
        </Typography>
        <Typography variant="subtitle1">c. Acceptable Use</Typography>
        <Typography component={'div'} gutterBottom>
          You agree to use the Service only for lawful purposes and in accordance with these Terms.
          You shall not:
          <ul>
            <li>Violate any applicable laws or regulations.</li>
            <li>Infringe the intellectual property rights of others.</li>
            <li>
              {`Use the Service in a way that could harm the Service or impair
              anyone else's use of it.`}
            </li>
          </ul>
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          3. Subscription and Payment
        </Typography>
        <Typography variant="subtitle1">a. Subscription Plans</Typography>
        <Typography variant="body2" gutterBottom>
          We offer various subscription plans for our Service. Details of the plans and pricing can
          be found on our website.
        </Typography>
        <Typography variant="subtitle1">b. Billing and Payment</Typography>
        <Typography variant="body2" gutterBottom>
          You agree to pay all fees in accordance with your chosen subscription plan. Payments are
          billed on a recurring basis, and you authorize us to charge your payment method for the
          applicable fees.
        </Typography>
        <Typography variant="subtitle1">c. Cancellations and Refunds</Typography>
        <Typography variant="body2" gutterBottom>
          You may cancel your subscription at any time. Upon cancellation, you will continue to have
          access to the Service until the end of your billing period. We do not offer refunds for
          partial billing periods.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          4. User Content
        </Typography>
        <Typography variant="subtitle1">a. Responsibility for User Content</Typography>
        <Typography variant="body2" gutterBottom>
          {` You are solely responsible for the content you upload, post, or
          otherwise make available through the Service ("User Content"). You
          retain all rights to your User Content.`}
        </Typography>
        <Typography variant="subtitle1">b. License to Use User Content</Typography>
        <Typography variant="body2" gutterBottom>
          By uploading User Content to the Service, you grant us a non-exclusive, worldwide,
          royalty-free license to use, display, and distribute your User Content for the purpose of
          operating the Service.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          5. Intellectual Property
        </Typography>
        <Typography variant="body2" gutterBottom>
          The Service and its original content, features, and functionality are and will remain the
          exclusive property of OpsDeck and its licensors. The Service is protected by copyright,
          trademark, and other laws of both the United States and foreign countries.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          6. Termination
        </Typography>
        <Typography variant="body2" gutterBottom>
          We may terminate or suspend your account and access to the Service immediately, without
          prior notice or liability, for any reason whatsoever, including without limitation if you
          breach the Terms.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          7. Limitation of Liability
        </Typography>
        <Typography variant="body2" gutterBottom>
          In no event shall OpsDeck, nor its directors, employees, partners, agents, suppliers, or
          affiliates, be liable for any indirect, incidental, special, consequential or punitive
          damages, including without limitation, loss of profits, data, use, goodwill, or other
          intangible losses, resulting from (i) your use or inability to use the Service; (ii) any
          unauthorized access to or use of our servers and/or any personal information stored
          therein; (iii) any interruption or cessation of transmission to or from the Service; (iv)
          any bugs, viruses, trojan horses, or the like that may be transmitted to or through our
          Service by any third party; (v) any errors or omissions in any content or for any loss or
          damage incurred as a result of the use of any content posted, emailed, transmitted, or
          otherwise made available through the Service.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          8. Governing Law
        </Typography>
        <Typography variant="body2" gutterBottom>
          These Terms shall be governed and construed in accordance with the laws of Pakistan,
          without regard to its conflict of law provisions.
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          9. Changes to Terms
        </Typography>
        <Typography variant="body2" gutterBottom>
          {`We reserve the right to modify or replace these Terms at any time. If
          a revision is material, we will provide at least 30 days' notice prior
          to any new terms taking effect. What constitutes a material change
          will be determined at our sole discretion.`}
        </Typography>
      </Box>
      <Box py={2}>
        <Typography variant="h6" gutterBottom>
          10. Contact Us
        </Typography>
        <Typography variant="body2" gutterBottom>
          If you have any questions about these Terms, please contact us at{' '}
          <Link href="mailto:husnainakhtar06@gmail.com" underline="none">
            <Button>supprt@OpsDeck.com</Button>
          </Link>
          .
        </Typography>
      </Box>
    </Box>
  </>
);

export default TermsAndConditions;
