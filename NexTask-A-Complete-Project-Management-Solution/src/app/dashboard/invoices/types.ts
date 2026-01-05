export interface Invoice {
  id: number;
  invoiceNumber: string;
  project: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string;
}

export interface InvoiceDialogProps {
  isDialogOpen: boolean;
  handleCloseDialog: () => void;
  isEdit: boolean;
  invoiceForm: any;
  setInvoiceForm: (inv: any) => any;
  handleSaveInvoice: (inv: any) => any;
}
