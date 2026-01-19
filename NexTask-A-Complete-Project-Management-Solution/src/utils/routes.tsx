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
  AdminPanelSettingsOutlined,
  BusinessOutlined,
} from '@mui/icons-material';

// Define the items for the sidebar
export const superUserItems = [
  { title: 'Dashboard', icon: <DashboardOutlined fontSize="small" />, key: '' },
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

export const adminItems = (() => {
  // Filter out Dashboard and other restricted items, but keep Dashboard in code structure
  const filteredItems = superUserItems.filter(
    (item) => !['', 'manage-apis', 'email-templates', 'permissions'].includes(item.key)
  );

  // Find the index of Staff Management
  const staffManagementIndex = filteredItems.findIndex(item => item.key === 'team');

  // Insert Department right after Staff Management
  const itemsWithDepartment = [
    ...filteredItems.slice(0, staffManagementIndex + 1),
    {
      title: 'Department',
      icon: <BusinessOutlined fontSize="small" />,
      key: 'admin/departments',
    },
    ...filteredItems.slice(staffManagementIndex + 1),
    {
      title: 'Admin',
      icon: <AdminPanelSettingsOutlined fontSize="small" />,
      key: 'admin',
      children: [],
    },
  ];

  return itemsWithDepartment;
})();

// Add Admin menu to superUserItems as well
export const superUserItemsWithAdmin = (() => {
  // Find the index of Staff Management
  const staffManagementIndex = superUserItems.findIndex(item => item.key === 'team');

  // Insert Department right after Staff Management
  return [
    ...superUserItems.slice(0, staffManagementIndex + 1),
    {
      title: 'Department',
      icon: <BusinessOutlined fontSize="small" />,
      key: 'admin/departments',
    },
    ...superUserItems.slice(staffManagementIndex + 1),
    {
      title: 'Admin',
      icon: <AdminPanelSettingsOutlined fontSize="small" />,
      key: 'admin',
      children: [],
    },
  ];
})();

export const regularItems = adminItems.filter(
  (item) =>
    ![
      '', // Dashboard
      'admin', // Admin module
      'admin/departments', // Department management
      'manage-apis',
      'plans',
      'permissions',
      'clients',
      'contracts',
      'reports',
      'email-templates',
      'invoices',
      'team', // Staff Management
    ].includes(item.key)
);
