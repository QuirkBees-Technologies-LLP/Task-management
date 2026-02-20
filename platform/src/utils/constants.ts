import { JWT_SECRET } from '@/app/api/config';
import { clients, contracts, invoices, projects, roles, tasks, teams } from './data';

export const accessTokenKey = `token.${JWT_SECRET}`;
export const drawerWidth = 250;
export const appbarHeight = 70;

export const navRoutes = [
  { title: 'About', key: 'about' },
  { title: 'Features', key: 'features' },
  { title: 'Contact us', key: 'contact-us' },
  { title: 'Blog', key: 'blog' },
];

export const defaultAnchorOrigin: any = {
  horizontal: 'right',
  vertical: 'bottom',
};

export const getRandomColor = () => {
  // Generate a random color in RGB format
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
};

export function truncateDescription(description, wordLimit = 7) {
  const words = description.split(' ');
  return words.slice(0, wordLimit).join(' ') + (words.length > wordLimit ? '...' : '');
}

export const mockData = {
  projects,
  invoices,
  tasks,
  teams,
  contracts,
  clients,
  roles,
};

export const userRoles = {
  admin: 'Admin',
  regular: 'Regular',
};

export const plans = {
  standard: {
    name: 'Standard',
    price: 199,
  },
  plus: {
    name: 'Plus',
    price: 299,
  },
};

export const emailTemplateVariables = {
  firstName: '{{firstName}}',
  lastName: '{{lastName}}',
  name: '{{name}}',
  btnLink: '{{btnLink}}',
  email: '{{email}}',
  password: '{{password}}',
  baseUrl: '{{baseUrl}}',
  feedback: '{{feedback}}',
};

export const EMAIL_CONFIRMATION_TEXT = `
Hi ${emailTemplateVariables.name},

Welcome to NexTask! Please confirm your email address to activate your account.

Click the link below to verify your email:
${emailTemplateVariables.btnLink}

If you didn’t create this account, you can ignore this message.

Best,  
The NexTask Team
`;

export const PASSWORD_RESET_TEXT = `
Hi ${emailTemplateVariables.name},

We received a request to reset your password.

You can reset your password using the link below:
${emailTemplateVariables.btnLink}

If you didn’t request this change, please ignore this email.

Best,  
The NexTask Team
`;

export const SUPPORT_FEEDBACK_TEXT = `
Hi ${emailTemplateVariables.name},

We’ve received your feedback:

"${emailTemplateVariables.feedback}"

Thank you for sharing your thoughts with us! Our support team will review your message and get back to you if needed.

Best regards,  
The NexTask Team
`;

export const dateFormat = 'MM/DD/YYYY';

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initialFormDataChangePassword = {
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
