'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack, Print, PictureAsPdf } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';

const PageContainer = styled(Box)({
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
  padding: '20px',
});

const ActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: '#fff',
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  maxWidth: '1160px',
  margin: '0 auto 24px auto',
  '@media print': {
    display: 'none !important',
  },
}));

const ButtonContainer = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const InvoiceWrapper = styled(Box)({
  maxWidth: '1160px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden',
});

interface CompanySettings {
  companyName: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  taxNumber: string;
  website: string;
}

interface BankingDetails {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
}

interface Invoice {
  _id?: string;
  invoiceNumber: string;
  clientName?: string;
  clientProject?: string;
  clientEmail?: string;
  status: string;
  dueDate?: string;
  items?: any[];
  amount?: number;
  currency?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  createdAt?: string;
}

const InvoiceViewPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<CompanySettings>({
    companyName: '',
    logoUrl: '',
    address: '',
    email: '',
    phone: '',
    taxNumber: '',
    website: '',
  });
  const [banking, setBanking] = useState<BankingDetails>({
    accountHolder: '',
    accountNumber: '',
    bankName: '',
    accountType: '',
  });

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch invoice (which now includes stored company and banking details)
      const invoiceResponse = await axios.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (invoiceResponse.data.success) {
        const invoiceData = invoiceResponse.data.invoice;
        setInvoice(invoiceData);

        // ALWAYS use company and banking details from invoice (stored at creation time)
        // These details are provided by the API and should never be fetched separately
        // This ensures ALL invoices remain unchanged even when company/banking settings are updated
        // Always set the details, even if empty (for old invoices without stored details)
        setCompany(invoiceData.companyDetails || {
          companyName: '',
          logoUrl: '',
          address: '',
          email: '',
          phone: '',
          taxNumber: '',
          website: '',
        });

        setBanking(invoiceData.bankingDetails || {
          accountHolder: '',
          accountNumber: '',
          bankName: '',
          accountType: '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching invoice data:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to load invoice',
        variant: 'error',
      });
      router.push('/dashboard/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    setPdfGenerating(true);
    try {
      const element = invoiceRef.current;
      const options = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${invoice?.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
      };

      await html2pdf()
        .set(options)
        .from(element)
        .save();

      enqueueSnackbar({
        message: 'PDF downloaded successfully!',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      enqueueSnackbar({
        message: 'Failed to generate PDF',
        variant: 'error',
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress />
          <Typography variant="body2">Loading invoice...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer>
        <Box p={3}>
          <Typography variant="h6" color="error">
            Invoice not found
          </Typography>
          <Button onClick={() => router.push('/dashboard/invoices')} sx={{ mt: 2 }}>
            Back to Invoices
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <>
      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          /* Hide action bar */
          .no-print,
          [class*="ActionBar"] {
            display: none !important;
          }
          
          /* Page container - show only invoice in print */
          [class*="PageContainer"] {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          
          /* Show invoice content */
          #invoice-content {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          
          /* Ensure invoice template is visible and properly formatted */
          #invoice-template {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            background: white !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          
          /* Ensure all content inside invoice is visible */
          #invoice-template,
          #invoice-template * {
            visibility: visible !important;
            color: #000 !important;
            background: white !important;
          }
          
          /* Make sure images are visible */
          #invoice-template img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>

      <PageContainer>
        {/* Action Bar - Hidden in print */}
        <ActionBar className="no-print">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/dashboard/invoices')}
            variant="outlined"
          >
            Back
          </Button>
          <ButtonContainer direction="row">
            <Button
              startIcon={<Print />}
              onClick={handlePrint}
              variant="outlined"
            >
              Print
            </Button>
            <Button
              startIcon={pdfGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
              onClick={handleDownloadPDF}
              variant="contained"
              disabled={pdfGenerating}
            >
              {pdfGenerating ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </ButtonContainer>
        </ActionBar>

        {/* Invoice Template - Printable */}
        <Box id="invoice-content" ref={invoiceRef} sx={{ width: '100%', maxWidth: '1160px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <InvoiceTemplate company={company} invoice={invoice} banking={banking} />
        </Box>
      </PageContainer>
    </>
  );
};

export default InvoiceViewPage;

