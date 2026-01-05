'use client';

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Stack,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const InvoiceContainer = styled(Box)(({ theme }) => ({
  width: '1160px',
  maxWidth: '100%',
  margin: '0 auto',
  fontFamily: 'Rubik, sans-serif',
  color: '#000248',
  backgroundColor: '#fff',
  padding: theme.spacing(4),
  '@media print': {
    width: '100%',
    padding: '10mm !important',
    margin: 0,
    pageBreakInside: 'avoid',
  },
  '@media (max-width: 1200px)': {
    width: '100%',
  },
  // Apply compact spacing for PDF generation
  '&.pdf-mode': {
    padding: '10mm !important',
    '& h1': {
      fontSize: '28px !important',
      marginBottom: '5px !important',
    },
  },
}));

const InvoiceHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: '20px',
  '@media print': {
    marginBottom: '8px',
    pageBreakAfter: 'avoid',
  },
  '& h1': {
    fontSize: '48px',
    fontWeight: 700,
    color: '#000',
    margin: 0,
    fontFamily: theme.typography.fontFamily,
    '@media print': {
      fontSize: '28px',
      marginBottom: '5px',
    },
  },
}));

const HeaderTable = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '15px',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(82, 82, 108, 0.2)',
  '@media print': {
    marginBottom: '8px',
    paddingBottom: '6px',
    pageBreakInside: 'avoid',
  },
});

const CompanyInfo = styled(Box)({
  flex: 1,
});

const CompanyContact = styled(Box)({
  textAlign: 'right',
  color: '#52526C',
  opacity: 0.8,
});

const AddressText = styled(Typography)({
  color: '#52526C',
  opacity: 0.8,
  fontSize: '18px',
  lineHeight: 1.5,
  fontWeight: 500,
  marginTop: '10px',
  width: '40%',
  fontStyle: 'normal',
});

const ContactText = styled(Typography)({
  display: 'block',
  lineHeight: 1.5,
  fontSize: '18px',
  fontWeight: 500,
  color: '#52526C',
  opacity: 0.8,
});

const InvoiceInfoRight = styled(Box)({
  textAlign: 'right',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const InfoItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

const InfoLabel = styled(Typography)({
  color: '#52526C',
  opacity: 0.8,
  fontSize: '18px',
  fontWeight: 500,
});

const InfoValue = styled('h4')({
  margin: 0,
  fontWeight: 400,
  fontSize: '18px',
  fontFamily: 'Rubik, sans-serif',
});

const StatusBadge = styled('h4')<{ status: string }>(({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { bg: 'rgba(84, 186, 74, 0.1)', color: '#54BA4A' };
      case 'pending':
        return { bg: 'rgba(255, 193, 7, 0.1)', color: '#FFC107' };
      case 'overdue':
        return { bg: 'rgba(244, 67, 54, 0.1)', color: '#F44336' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.1)', color: '#9E9E9E' };
    }
  };

  const colors = getStatusColor();
  return {
    margin: 0,
    fontWeight: 400,
    fontSize: '18px',
    padding: '6px 18px',
    backgroundColor: colors.bg,
    color: colors.color,
    borderRadius: '5px',
    display: 'inline-block',
    fontFamily: 'Rubik, sans-serif',
  };
});

const BillingSection = styled(Box)({
  padding: '15px 0',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '40px',
  flexWrap: 'wrap',
  borderBottom: '1px solid rgba(82, 82, 108, 0.2)',
  marginBottom: '15px',
  '@media print': {
    padding: '6px 0',
    marginBottom: '8px',
    pageBreakInside: 'avoid',
  },
});

const BillingBox = styled(Box)({
  flex: '1',
  minWidth: '300px',
});

const SectionLabel = styled(Typography)({
  color: '#000248',
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '@media print': {
    marginBottom: '4px',
    fontSize: '12px',
  },
});

const ClientName = styled('h4')({
  fontWeight: 400,
  margin: '6px 0 4px 0',
  fontSize: '18px',
  fontFamily: 'Rubik, sans-serif',
  '@media print': {
    margin: '2px 0 2px 0',
    fontSize: '14px',
  },
});

const ClientAddress = styled(Typography)({
  width: '54%',
  display: 'block',
  lineHeight: 1.5,
  color: '#52526C',
  opacity: 0.8,
  fontSize: '18px',
  fontWeight: 400,
  marginBottom: '8px',
});

const StyledTable = styled(Table)({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  border: '1px solid rgba(82, 82, 108, 0.1)',
  marginTop: '12px',
  marginBottom: '12px',
  tableLayout: 'fixed',
  '@media print': {
    marginTop: '6px',
    marginBottom: '6px',
    pageBreakInside: 'avoid',
  },
});

const TableHeader = styled(TableHead)({
  background: '#1976d2',
  borderRadius: '5.47059px',
  overflow: 'hidden',
  boxShadow:
    '0px 10.9412px 10.9412px rgba(25, 118, 210, 0.04), 0px 9.51387px 7.6111px rgba(25, 118, 210, 0.06), 0px 5.05275px 4.0422px rgba(25, 118, 210, 0.0484671)',
});

const HeaderCell = styled(TableCell)({
  padding: '18px 15px',
  textAlign: 'left',
  border: 'none',
  '@media print': {
    padding: '10px 12px',
  },
  '& span': {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    '@media print': {
      fontSize: '14px',
    },
  },
  '&[align="right"]': {
    textAlign: 'right',
    paddingRight: '15px',
    paddingLeft: '15px',
    '@media print': {
      paddingRight: '12px',
      paddingLeft: '12px',
    },
  },
});

const TableRowStyled = styled(TableRow)<{ isEven?: boolean }>(({ isEven }) => ({
  backgroundColor: isEven ? 'rgba(245, 246, 249, 1)' : 'transparent',
  boxShadow: '0px 1px 0px 0px rgba(82, 82, 108, 0.15)',
}));

const TableCellStyled = styled(TableCell)({
  padding: '18px 15px',
  border: 'none',
  fontSize: '18px',
  color: '#000248',
  fontWeight: 500,
  '@media print': {
    padding: '10px 12px',
    fontSize: '14px',
  },
  '&[align="right"]': {
    textAlign: 'right',
    paddingRight: '15px',
    paddingLeft: '15px',
    '@media print': {
      paddingRight: '12px',
      paddingLeft: '12px',
    },
  },
});

const ItemContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});

const ItemIcon = styled(Box)({
  width: '54px',
  height: '51px',
  backgroundColor: '#F5F6F9',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '5px',
});

const ItemDetails = styled(Box)({
  '& h4': {
    fontWeight: 400,
    margin: '4px 0px',
    fontSize: '18px',
  },
  '& span': {
    color: '#52526C',
    opacity: 0.8,
    fontSize: '14px',
  },
});

const TotalsTable = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  marginTop: '12px',
  minWidth: '400px',
  '@media print': {
    marginTop: '6px',
    pageBreakInside: 'avoid',
  },
});

const TotalRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  padding: '4px 0',
  '@media print': {
    padding: '2px 0',
  },
  '&.last': {
    paddingTop: '10px',
    paddingBottom: '12px',
    borderTop: '1px solid rgba(82, 82, 108, 0.2)',
    marginTop: '6px',
    '@media print': {
      paddingTop: '5px',
      paddingBottom: '6px',
      marginTop: '4px',
    },
  },
});

const TotalLabel = styled(Typography)({
  textAlign: 'right',
  color: '#52526C',
  fontSize: '18px',
  fontWeight: 400,
  width: '200px',
  paddingRight: '16px',
  flexShrink: 0,
});

const TotalColon = styled(Typography)({
  fontSize: '18px',
  color: '#52526C',
  paddingRight: '8px',
  flexShrink: 0,
});

const TotalValue = styled(Typography)({
  textAlign: 'right',
  fontSize: '18px',
  fontWeight: 400,
  color: '#000248',
  width: '140px',
  flexShrink: 0,
  '@media print': {
    fontSize: '12px',
  },
  '&.grand': {
    fontWeight: 500,
    fontSize: '20px',
    color: 'rgba(115, 102, 255, 1)',
    '@media print': {
      fontSize: '14px',
    },
  },
});

const GrandTotalLabel = styled(Typography)({
  textAlign: 'right',
  fontWeight: 600,
  fontSize: '20px',
  color: 'rgba(0, 2, 72, 1)',
  width: '200px',
  paddingRight: '16px',
  flexShrink: 0,
  '@media print': {
    fontSize: '14px',
    paddingRight: '10px',
  },
});

const GrandTotalColon = styled(Typography)({
  fontSize: '20px',
  color: 'rgba(0, 2, 72, 1)',
  paddingRight: '8px',
  flexShrink: 0,
});

const GrandTotalValue = styled(Typography)({
  textAlign: 'right',
  fontWeight: 500,
  fontSize: '20px',
  color: '#1976d2',
  width: '140px',
  flexShrink: 0,
  '@media print': {
    fontSize: '14px',
  },
});

const Divider = styled(Box)({
  display: 'block',
  background: 'rgba(82, 82, 108, 0.3)',
  height: '1px',
  width: '100%',
  marginBottom: '12px',
  marginTop: '12px',
  '@media print': {
    marginBottom: '10px',
    marginTop: '10px',
  },
});

const ActionButtons = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '15px',
  marginTop: '20px',
  '@media print': {
    display: 'none',
  },
});

const ActionButton = styled('a')<{ variant?: 'primary' | 'secondary' }>(
  ({ variant = 'primary' }) => ({
    background: variant === 'primary' ? '#1976d2' : 'rgba(25, 118, 210, 0.1)',
    color: variant === 'primary' ? 'rgba(255, 255, 255, 1)' : '#1976d2',
    borderRadius: '10px',
    padding: '18px 27px',
    fontSize: '16px',
    fontWeight: 600,
    outline: 0,
    border: 0,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.9,
    },
  })
);

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

interface InvoiceItem {
  description?: string;
  quantity?: number;
  price?: number;
  total?: number;
  unit?: string;
  vat?: number;
}

interface Invoice {
  _id?: string;
  invoiceNumber: string;
  clientName?: string;
  clientProject?: string;
  clientEmail?: string;
  status: string;
  dueDate?: string;
  items?: InvoiceItem[];
  amount?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
  notes?: string;
  createdAt?: string;
}

interface InvoiceTemplateProps {
  company: CompanySettings;
  invoice: Invoice;
  banking?: BankingDetails;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ company, invoice, banking }) => {
  const theme = useTheme();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getCurrencyCode = () => (invoice.currency || 'USD').toUpperCase();
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: getCurrencyCode(),
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Use amount from form field directly (not calculated from items)
  const subtotal = invoice.amount ?? 0;
  const tax = invoice.tax ?? 0;
  const shipping = 0; // Can be added to invoice model later
  const total = invoice.total ?? invoice.amount ?? 0;

  // Calculate issue date (use createdAt if available, otherwise current date)
  const issueDate = invoice.createdAt
    ? formatDate(invoice.createdAt)
    : formatDate(new Date().toISOString());

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          #invoice-template {
            page-break-inside: avoid;
            padding: 10mm !important;
          }
          #invoice-template > * {
            page-break-inside: avoid;
          }
        }
        /* Styles for PDF generation (html2pdf.js) */
        #invoice-template {
          padding: 10mm;
        }
        #invoice-template h1 {
          font-size: 28px !important;
          margin-bottom: 5px !important;
        }
        #invoice-template [class*="InvoiceHeader"] {
          margin-bottom: 8px !important;
        }
        #invoice-template [class*="HeaderTable"] {
          margin-bottom: 8px !important;
          padding-bottom: 6px !important;
        }
        #invoice-template [class*="BillingSection"] {
          padding: 6px 0 !important;
          margin-bottom: 8px !important;
        }
        #invoice-template [class*="SectionLabel"] {
          margin-bottom: 4px !important;
          font-size: 12px !important;
        }
        #invoice-template [class*="ClientName"] {
          margin: 2px 0 !important;
          font-size: 14px !important;
        }
        #invoice-template [class*="StyledTable"] {
          margin-top: 6px !important;
          margin-bottom: 6px !important;
        }
        #invoice-template [class*="TableHeader"] th,
        #invoice-template [class*="TableCellStyled"] {
          padding: 8px 10px !important;
          font-size: 14px !important;
        }
        #invoice-template [class*="TotalsTable"] {
          margin-top: 6px !important;
        }
        #invoice-template [class*="TotalRow"] {
          padding: 2px 0 !important;
        }
        #invoice-template [class*="TotalRow"].last {
          padding-top: 5px !important;
          padding-bottom: 6px !important;
          margin-top: 4px !important;
        }
        #invoice-template [class*="TotalLabel"],
        #invoice-template [class*="TotalValue"],
        #invoice-template [class*="TotalColon"] {
          font-size: 12px !important;
        }
        #invoice-template [class*="GrandTotalLabel"],
        #invoice-template [class*="GrandTotalValue"],
        #invoice-template [class*="GrandTotalColon"] {
          font-size: 14px !important;
        }
        #invoice-template img {
          max-height: 50px !important;
          max-width: 120px !important;
        }
        #invoice-template [class*="Divider"] {
          margin-top: 5px !important;
          margin-bottom: 5px !important;
        }
        #invoice-template .MuiTypography-h6 {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        #invoice-template .MuiTypography-body1,
        #invoice-template .MuiTypography-body2 {
          font-size: 12px !important;
        }
      `}} />
      <InvoiceContainer id="invoice-template">
        {/* Invoice Header */}
        <InvoiceHeader>
          <Typography
            component="h1"
            sx={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#000',
              margin: 0,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            INVOICE
          </Typography>
        </InvoiceHeader>

        {/* Header Section */}
        <HeaderTable>
          <CompanyInfo>
            {company.logoUrl && (
              <Box
                sx={{
                  marginBottom: '16px',
                  '@media print': {
                    marginBottom: '10px',
                    '& img': {
                      maxHeight: '60px !important',
                      maxWidth: '150px !important',
                    },
                  },
                }}
              >
                <img
                  src={company.logoUrl}
                  alt={company.companyName || 'Company Logo'}
                  style={{
                    maxHeight: '80px',
                    maxWidth: '200px',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                marginBottom: '8px',
                fontSize: '18px',
                '@media print': {
                  fontSize: '14px',
                  marginBottom: '4px',
                },
              }}
            >
              {company.companyName || 'Company Name'}
            </Typography>
            {company.address && (
              <AddressText
                sx={{
                  width: '100%',
                  marginTop: '8px',
                  '@media print': {
                    fontSize: '12px',
                    marginTop: '4px',
                  },
                }}
              >
                {company.address}
              </AddressText>
            )}
            <Box
              sx={{
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                '@media print': {
                  marginTop: '4px',
                  gap: '2px',
                  '& *': {
                    fontSize: '12px',
                  },
                },
              }}
            >
              {company.email && <ContactText style={{ textAlign: 'left' }}>Email : {company.email}</ContactText>}
              {company.website && <ContactText style={{ textAlign: 'left' }}>Website: {company.website}</ContactText>}
              {company.phone && <ContactText style={{ textAlign: 'left' }}>Contact No : {company.phone}</ContactText>}
            </Box>
          </CompanyInfo>

          <InvoiceInfoRight>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <InfoLabel style={{ margin: 0 }}>Date</InfoLabel>
                <InfoValue style={{ margin: 0, minWidth: '100px', textAlign: 'right' }}>{issueDate}</InfoValue>
              </Box>
              <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <InfoLabel style={{ margin: 0 }}>Invoice No</InfoLabel>
                <InfoValue style={{ margin: 0, minWidth: '100px', textAlign: 'right' }}>#{invoice.invoiceNumber}</InfoValue>
              </Box>
              <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                <InfoLabel style={{ margin: 0 }}>Payment Status</InfoLabel>
                <StatusBadge status={invoice.status} style={{ margin: 0 }}>{invoice.status}</StatusBadge>
              </Box>
            </Box>
          </InvoiceInfoRight>
        </HeaderTable>

        {/* Billing & Shipping Address */}
        <BillingSection>
          <BillingBox>
            <SectionLabel>BILL TO</SectionLabel>
            <ClientName
              sx={{
                marginTop: '8px',
                marginBottom: '4px',
                '@media print': {
                  marginTop: '4px',
                  marginBottom: '2px',
                },
              }}
            >
              {invoice.clientName || 'N/A'}
            </ClientName>
            {invoice.clientEmail && (
              <ClientAddress
                sx={{
                  width: '100%',
                  marginBottom: '4px',
                  '@media print': {
                    marginBottom: '2px',
                    fontSize: '12px',
                  },
                }}
              >
                {invoice.clientEmail}
              </ClientAddress>
            )}
          </BillingBox>
        </BillingSection>

        {/* Project Name and Subtotal Table - Only show if project is assigned */}
        {invoice.clientProject && (
          <StyledTable>
            <TableHeader>
              <TableRow>
                <HeaderCell
                  sx={{
                    padding: '10px 15px',
                    '@media print': {
                      padding: '8px 10px',
                    },
                  }}
                >
                  <Typography component="span">PROJECT NAME</Typography>
                </HeaderCell>
                <HeaderCell
                  align="right"
                  sx={{
                    padding: '18px 15px',
                    textAlign: 'right',
                    '@media print': {
                      padding: '8px 10px',
                    },
                  }}
                >
                  
                  <Typography component="span">SUBTOTAL</Typography>
                </HeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRowStyled isEven={false}>
                <TableCellStyled
                  sx={{
                    padding: '18px 15px',
                    '@media print': {
                      padding: '8px 10px',
                    },
                  }}
                >
                  {invoice.clientProject}
                </TableCellStyled>
                <TableCellStyled
                  align="right"
                  sx={{
                    padding: '18px 15px',
                    textAlign: 'right',
                    '@media print': {
                      padding: '8px 10px',
                    },
                  }}
                >
                  {formatCurrency(subtotal)}
                </TableCellStyled>
              </TableRowStyled>
            </TableBody>
          </StyledTable>
        )}

        {/* Totals Section */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '20px' }}>
          <TotalsTable>
            <TotalRow>
              <TotalLabel>Subtotal</TotalLabel>
              <TotalColon>:</TotalColon>
              <TotalValue>{formatCurrency(subtotal)}</TotalValue>
            </TotalRow>
            <TotalRow>
              <TotalLabel>Tax Rate</TotalLabel>
              <TotalColon>:</TotalColon>
              <TotalValue>{formatCurrency(tax)}</TotalValue>
            </TotalRow>
            <TotalRow>
              <TotalLabel>Discount</TotalLabel>
              <TotalColon>:</TotalColon>
              <TotalValue>$0.00</TotalValue>
            </TotalRow>
            <TotalRow>
              <TotalLabel>Total Tax</TotalLabel>
              <TotalColon>:</TotalColon>
              <TotalValue>{formatCurrency(tax)}</TotalValue>
            </TotalRow>
            <TotalRow>
              <TotalLabel>Shipping / Handling</TotalLabel>
              <TotalColon>:</TotalColon>
              <TotalValue>{formatCurrency(shipping)}</TotalValue>
            </TotalRow>
            <TotalRow className="last">
              <GrandTotalLabel>TOTAL</GrandTotalLabel>
              <GrandTotalColon>:</GrandTotalColon>
              <GrandTotalValue>{formatCurrency(total)}</GrandTotalValue>
            </TotalRow>
          </TotalsTable>
        </Box>

        {/* Banking Details Section */}
        {banking && (banking.accountHolder || banking.accountNumber || banking.bankName || banking.accountType) && (
          <Box
            sx={{
              marginTop: '15px',
              padding: '12px 0',
              width: '50%',
              '@media print': {
                marginTop: '12px',
                padding: '10px 0',
                pageBreakInside: 'avoid',
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '18px',
                color: '#000248',
                marginBottom: '16px',
              }}
            >
              BANK DETAILS :
            </Typography>
            <Stack spacing={2}>
              {banking.accountHolder && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Typography
                    sx={{
                      color: '#000248',
                      fontSize: '16px',
                      fontWeight: 400,
                      minWidth: '160px',
                      flexShrink: 0,
                    }}
                  >
                    Account Holder :
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#000248',
                    }}
                  >
                    {banking.accountHolder}
                  </Typography>
                </Box>
              )}
              {banking.accountNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Typography
                    sx={{
                      color: '#000248',
                      fontSize: '16px',
                      fontWeight: 400,
                      minWidth: '160px',
                      flexShrink: 0,
                      '@media print': {
                        fontSize: '12px',
                        minWidth: '120px',
                      },
                    }}
                  >
                    Account Number :
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#000248',
                    }}
                  >
                    {banking.accountNumber}
                  </Typography>
                </Box>
              )}
              {banking.bankName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Typography
                    sx={{
                      color: '#000248',
                      fontSize: '14px',
                      fontWeight: 400,
                      minWidth: '160px',
                      flexShrink: 0,
                      '@media print': {
                        fontSize: '12px',
                        minWidth: '120px',
                      },
                    }}
                  >
                    Bank :
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#000248',
                      '@media print': {
                        fontSize: '12px',
                      },
                    }}
                  >
                    {banking.bankName}
                  </Typography>
                </Box>
              )}
              {banking.accountType && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Typography
                    sx={{
                      color: '#000248',
                      fontSize: '16px',
                      fontWeight: 400,
                      minWidth: '160px',
                      flexShrink: 0,
                      '@media print': {
                        fontSize: '12px',
                        minWidth: '120px',
                      },
                    }}
                  >
                    Account Type :
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#000248',
                      '@media print': {
                        fontSize: '12px',
                      },
                    }}
                  >
                    {banking.accountType}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        <Divider />
      </InvoiceContainer>
    </>
  );
};

export default InvoiceTemplate;
