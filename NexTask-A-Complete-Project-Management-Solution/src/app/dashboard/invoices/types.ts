export interface Invoice {
  id?: number | string;
  _id?: string;
  invoiceNumber: string;
  clientName?: string;
  clientProject?: string;
  project?: string;
  clientEmail?: string;
  amount: number;
  currency?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'draft' | 'paid' | 'pending' | 'overdue';
  dueDate: string;
  items?: any[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceDialogProps {
  isDialogOpen: boolean;
  handleCloseDialog: () => void;
  isEdit: boolean;
  invoiceForm: Partial<Invoice>;
  setInvoiceForm: (inv: Partial<Invoice> | ((prev: Partial<Invoice>) => Partial<Invoice>)) => void;
  handleSaveInvoice: () => void;
  saving?: boolean;
}
