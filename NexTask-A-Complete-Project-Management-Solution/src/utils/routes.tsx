import {
  DashboardOutlined,
  FolderOutlined,
  ChecklistOutlined,
  InventoryOutlined,
  ArticleOutlined,
  PeopleOutline,
  LeaderboardOutlined,
  NotificationsOutlined,
  PeopleAltOutlined,
  VpnKeyOutlined,
  FeedbackOutlined,
  EmailOutlined,
  SettingsOutlined,
  CalendarMonth,
} from '@mui/icons-material';

// Define the items for the sidebar
export const superUserItems = [
  { title: 'Dashboard', icon: <DashboardOutlined fontSize="small" />, key: '' },
  {
    title: 'Tasks',
    icon: <ChecklistOutlined fontSize="small" />,
    key: 'tasks',
  },
  {
    title: 'Staff Management',
    icon: <PeopleOutline fontSize="small" />,
    key: 'team',
  },
  {
    title: 'Email Templates',
    icon: <EmailOutlined fontSize="small" />,
    key: 'email-templates',
  },
  {
    title: 'Projects',
    icon: <FolderOutlined fontSize="small" />,
    key: 'projects',
  },
  {
    title: 'Invoices',
    icon: <InventoryOutlined fontSize="small" />,
    key: 'invoices',
  },
  {
    title: 'Contracts',
    icon: <ArticleOutlined fontSize="small" />,
    key: 'contracts',
  },
  {
    title: 'Reports',
    icon: <LeaderboardOutlined fontSize="small" />,
    key: 'reports',
  },
  {
    title: 'Notifications',
    icon: <NotificationsOutlined fontSize="small" />,
    key: 'notifications',
  },
  {
    title: 'Client Management',
    icon: <PeopleAltOutlined fontSize="small" />,
    key: 'clients',
  },
  {
    title: 'Roles & Permissions',
    icon: <VpnKeyOutlined fontSize="small" />,
    key: 'permissions',
  },
  {
    title: 'Calendar',
    icon: <CalendarMonth fontSize="small" />,
    key: 'calendar',
  },
  {
    title: 'Support',
    icon: <FeedbackOutlined fontSize="small" />,
    key: 'support',
  },
  {
    title: 'Settings',
    icon: <SettingsOutlined fontSize="small" />,
    key: 'settings',
  },
];

export const adminItems = superUserItems.filter(
  (item) => !['manage-apis', 'email-templates', 'permissions'].includes(item.key)
);

export const regularItems = adminItems.filter(
  (item) =>
    ![
      'manage-apis',
      'plans',
      'permissions',
      'clients',
      'contracts',
      'reports',
      'email-templates',
      'invoices',
      'team',
    ].includes(item.key)
);
