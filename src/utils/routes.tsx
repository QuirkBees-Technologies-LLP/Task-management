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
  AccountTreeOutlined,
} from '@mui/icons-material';

// Define the items for the sidebar
export const superUserItems = [
  // { title: 'Dashboard', icon: <DashboardOutlined fontSize="small" />, key: '' }, // Commented out - Dashboard hidden from menu
  {
    title: 'Projects',
    icon: <FolderOutlined fontSize="small" />,
    key: 'projects',  
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
    title: 'Organization',
    icon: <AccountTreeOutlined fontSize="small" />,
    key: 'organization',
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

  // Explicitly ensure Projects is first - find it and place it at the beginning
  const projectsItem = filteredItems.find(item => item.key === 'projects');
  const otherItems = filteredItems.filter(item => item.key !== 'projects');

  // Find the index of Staff Management in other items
  const staffManagementIndex = otherItems.findIndex(item => item.key === 'team');

  // Build the array with Projects explicitly first
  const itemsWithDepartment: any[] = [];
  
  // Add Projects first - this is critical for the requirement
  if (projectsItem) {
    itemsWithDepartment.push(projectsItem);
  }
  
  // Add items before Department (Staff Management)
  itemsWithDepartment.push(...otherItems.slice(0, staffManagementIndex + 1));
  
  // Insert Department right after Staff Management
  itemsWithDepartment.push({
    title: 'Department',
    icon: <BusinessOutlined fontSize="small" />,
    key: 'admin/departments',
  });
  
  // Add remaining items
  itemsWithDepartment.push(...otherItems.slice(staffManagementIndex + 1));
  
  // Add Admin at the end
  itemsWithDepartment.push({
    title: 'Admin',
    icon: <AdminPanelSettingsOutlined fontSize="small" />,
    key: 'admin',
    children: [],
  });

  return itemsWithDepartment;
})();

// Add Admin menu to superUserItems as well
export const superUserItemsWithAdmin = (() => {
  // Explicitly ensure Projects is first - find it and place it at the beginning
  const projectsItem = superUserItems.find(item => item.key === 'projects');
  const otherItems = superUserItems.filter(item => item.key !== 'projects');

  // Find the index of Staff Management in other items
  const staffManagementIndex = otherItems.findIndex(item => item.key === 'team');

  // Build the array with Projects explicitly first
  const itemsWithAdmin: any[] = [];
  
  // Add Projects first - this is critical for the requirement
  if (projectsItem) {
    itemsWithAdmin.push(projectsItem);
  }
  
  // Add items before Department (Staff Management)
  itemsWithAdmin.push(...otherItems.slice(0, staffManagementIndex + 1));
  
  // Insert Department right after Staff Management
  itemsWithAdmin.push({
    title: 'Department',
    icon: <BusinessOutlined fontSize="small" />,
    key: 'admin/departments',
  });
  
  // Add remaining items
  itemsWithAdmin.push(...otherItems.slice(staffManagementIndex + 1));
  
  // Add Admin at the end
  itemsWithAdmin.push({
    title: 'Admin',
    icon: <AdminPanelSettingsOutlined fontSize="small" />,
    key: 'admin',
    children: [],
  });

  return itemsWithAdmin;
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
      'organization', // Organization management
    ].includes(item.key)
);
