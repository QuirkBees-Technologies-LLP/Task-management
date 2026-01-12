import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { CSVLink } from 'react-csv';
import { Button, CircularProgress, Stack } from '@mui/material';
import { getPdfTemplate } from '../helpers';
import { ExportOptionsProps } from '../types';

const ExportOptions: React.FC<ExportOptionsProps> = ({ title, data, columns }) => {
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const csvLink = useRef<CSVLink & HTMLAnchorElement>(null);

  // Handle CSV export
  const handleExportCSV = () => {
    csvLink?.current?.link?.click();
  };

  // Handle PDF generation
  const handleGeneratePdf = async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    setPdfLoading(true);

    try {
      const pdfTemplate = await getPdfTemplate({
        columns,
        data,
      });

      const element = document.createElement('div');
      element.innerHTML = pdfTemplate;
      document.body.appendChild(element);

      const options = {
        margin: 1,
        filename: `${title}_report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      await html2pdf()
        .from(element)
        .set(options)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          window.open(pdf.output('bloburl'), '_blank');
        });

      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={2}>
        {/* CSV Export Button */}
        <Button variant="contained" color="primary" onClick={handleExportCSV}>
          Export CSV
        </Button>

        {/* PDF Generate Button */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGeneratePdf}
          startIcon={pdfLoading && <CircularProgress color="inherit" size={13} />}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Generating...' : 'Generate PDF'}
        </Button>
      </Stack>

      {/* Hidden CSVLink Component */}
      <CSVLink
        data={data}
        filename={`${title}_report.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </>
  );
};

export default ExportOptions;
