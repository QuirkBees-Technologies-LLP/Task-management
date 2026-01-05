const generateProjectData = (year, totalProjects) => {
  const projects: any[] = [];
  const names = [
    'Alpha',
    'Beta',
    'Gamma',
    'Delta',
    'Epsilon',
    'Zeta',
    'Eta',
    'Theta',
    'Iota',
    'Kappa',
  ];

  for (let i = 1; i <= totalProjects; i++) {
    const startMonth = Math.floor(Math.random() * 12) + 1; // Random month between 1-12
    const startDay = Math.floor(Math.random() * 28) + 1; // Random day between 1-28
    const startDate = new Date(year, startMonth - 1, startDay);

    const endMonth = startMonth + Math.floor(Math.random() * (12 - startMonth + 1)); // Ensures endMonth >= startMonth
    const endDay = Math.floor(Math.random() * 28) + 1;
    const endDate = new Date(year, endMonth - 1, endDay);

    projects.push({
      id: i,
      name: `Project ${names[i % names.length]} ${i}`,
      description: `Description for Project ${i}`,
      status: Math.random() > 0.5 ? 'Completed' : 'In Progress',
      startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    });
  }

  return projects;
};

function generateInvoiceData(year, numRecords) {
  const projects = [
    'Website Redesign',
    'Mobile App Development',
    'SEO Optimization',
    'E-commerce Website',
    'Social Media Campaign',
    'CRM System Implementation',
    'API Integration',
    'Cloud Migration',
    'UI/UX Design',
    'Custom Dashboard Development',
  ];

  const statuses = ['Paid', 'Pending', 'Overdue'];

  const data: any[] = [];
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  for (let i = 1; i <= numRecords; i++) {
    const randomProject = projects[Math.floor(Math.random() * projects.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomAmount = Math.floor(Math.random() * 15000) + 1000; // Random amount between 1000 and 15000
    const randomDueDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );

    data.push({
      id: i,
      invoiceNumber: `INV-${String(i).padStart(3, '0')}`,
      project: randomProject,
      amount: randomAmount,
      status: randomStatus,
      dueDate: randomDueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    });
  }

  return data;
}

function generateTaskData(year, numRecords) {
  const statuses = ['Todo', 'In Progress', 'Completed', 'Blocked'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const data: any[] = [];
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  for (let i = 1; i <= numRecords; i++) {
    const randomTitle = `Task ${i}`;
    const randomDescription = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    const randomProjectId = Math.floor(Math.random() * 10) + 1; // Random projectId between 1 and 10
    const randomDueDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );

    data.push({
      id: i,
      title: randomTitle,
      description: randomDescription,
      status: randomStatus,
      priority: randomPriority,
      projectId: randomProjectId.toString(),
      dueDate: randomDueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    });
  }

  return data;
}

function generateTeamData(year, numRecords) {
  const roles = ['Developer', 'Designer', 'Project Manager', 'QA Engineer', 'DevOps Engineer'];
  const departments = ['Engineering', 'Design', 'Product', 'Quality Assurance', 'Operations'];
  const skillsPool = [
    'JavaScript',
    'React',
    'Node.js',
    'TypeScript',
    'Python',
    'Django',
    'CSS',
    'HTML',
    'SQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'Figma',
    'Jira',
    'Git',
  ];
  const firstNames = ['John', 'Jane', 'Alex', 'Emily', 'Michael', 'Sarah', 'David', 'Sophia'];
  const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Garcia'];

  const data: any[] = [];
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  for (let i = 1; i <= numRecords; i++) {
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomDepartment = departments[Math.floor(Math.random() * departments.length)];
    const randomEmail = `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}@example.com`;
    const randomJoinDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    const randomSkills = Array.from(
      { length: Math.floor(Math.random() * 4) + 2 }, // Randomly select 2-5 skills
      () => skillsPool[Math.floor(Math.random() * skillsPool.length)]
    ).filter((skill, index, self) => self.indexOf(skill) === index); // Ensure unique skills

    data.push({
      id: i,
      name: `${randomFirstName} ${randomLastName}`,
      email: randomEmail,
      role: randomRole,
      department: randomDepartment,
      joinDate: randomJoinDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      skills: randomSkills,
    });
  }

  return data;
}

function generateContractData(year, numRecords) {
  const titles = [
    'Website Development',
    'Mobile App Development',
    'SEO Optimization',
    'CRM Implementation',
    'API Integration',
    'UI/UX Redesign',
    'Cloud Migration',
    'Social Media Campaign',
    'Custom Dashboard Development',
    'Software Testing',
  ];

  const clients = [
    'ABC Corp',
    'XYZ Ltd',
    'Tech Solutions',
    'Acme Inc',
    'Global Ventures',
    'Bright Future Co.',
    'NextGen Innovations',
    'FutureWorks',
    'Prime Technologies',
    'Elite Enterprises',
  ];

  const statuses = ['Active', 'Completed', 'Terminated', 'Pending'];

  const data: any[] = [];
  const startDateRange = new Date(`${year}-01-01`);
  const endDateRange = new Date(`${year}-12-31`);

  for (let i = 1; i <= numRecords; i++) {
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomStartDate = new Date(
      startDateRange.getTime() + Math.random() * (endDateRange.getTime() - startDateRange.getTime())
    );
    const randomEndDate = new Date(
      randomStartDate.getTime() + Math.random() * 15552000000 // Add random duration between 0-6 months
    );
    const randomBudget = Math.floor(Math.random() * 100000) + 10000; // Budget between 10,000 and 100,000
    const randomDescription = `Develop a ${randomTitle.toLowerCase()} for ${randomClient}. The project involves delivering a high-quality solution within the agreed timeline and budget.`;

    data.push({
      id: i.toString(),
      title: randomTitle,
      client: randomClient,
      startDate: randomStartDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: randomEndDate.toISOString().split('T')[0],
      status: randomStatus,
      budget: randomBudget,
      description: randomDescription,
    });
  }

  return data;
}

function generateClientDataSource(numberOfClients) {
  const clientNames = [
    'ABC Corp',
    'XYZ Ltd',
    'Global Ventures',
    'Tech Solutions',
    'Prime Industries',
    'Elite Enterprises',
    'Bright Future Co.',
    'NextGen Innovations',
    'FutureWorks',
    'Acme Inc',
  ];

  const dataSource: any[] = [];
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 1; i <= numberOfClients; i++) {
    const clientName = clientNames[i % clientNames.length] + ` ${i}`; // Unique client name
    const projectName = `Project ${i}`;
    const email = `client${i}@example.com`;
    const projectsCount = getRandomInt(1, 10); // Random number of projects between 1 and 10

    dataSource.push({
      id: i,
      clientName,
      projectName,
      email,
      projectsCount,
    });
  }

  return dataSource;
}

const teams = generateTeamData(2024, 120);
const tasks = generateTaskData(2024, 120);
const projects = generateProjectData(2024, 120);
const invoices = generateInvoiceData(2024, 120);
const contracts = generateContractData(2024, 120);
const clients = generateClientDataSource(120);

const roles = [
  {
    id: 1,
    roleName: 'Admin',
    permissions: ['All Access'],
    description: 'Full access to all features',
  },
  {
    id: 2,
    roleName: 'Editor',
    permissions: ['Edit', 'View'],
    description: 'Can edit and view content',
  },
  {
    id: 3,
    roleName: 'Viewer',
    permissions: ['View'],
    description: 'Can only view content',
  },
  {
    id: 4,
    roleName: 'Contributor',
    permissions: ['Create', 'Edit', 'View'],
    description: 'Can create and edit content',
  },
  {
    id: 5,
    roleName: 'Manager',
    permissions: ['Manage', 'Teams', 'Edit'],
    description: 'Manage teams and content',
  },
];

const projectDetailTasks = [
  {
    id: 86,
    title: 'Task 86',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'Completed',
    priority: 'Low',
    projectId: '1',
    startDate: '2024-01-22',
    endDate: '2024-03-22',
  },
  {
    id: 92,
    title: 'Task 92',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'Blocked',
    priority: 'Low',
    projectId: '1',
    startDate: '2024-01-21',
    endDate: '2024-08-21',
  },
  {
    id: 95,
    title: 'Task 95',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'In Progress',
    priority: 'High',
    projectId: '1',
    startDate: '2024-01-22',
    endDate: '2024-03-22',
  },
  {
    id: 109,
    title: 'Task 109',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'In Progress',
    priority: 'Low',
    projectId: '1',
    startDate: '2024-01-28',
    endDate: '2024-08-28',
  },
  {
    id: 110,
    title: 'Task 110',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'Completed',
    priority: 'High',
    projectId: '1',
    startDate: '2024-01-14',
    endDate: '2024-08-14',
  },
  {
    id: 112,
    title: 'Task 112',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'Todo',
    priority: 'Low',
    projectId: '1',
    startDate: '2024-02-02',
    endDate: '2024-04-02',
  },
  {
    id: 113,
    title: 'Task 113',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'Todo',
    priority: 'Critical',
    projectId: '1',
    startDate: '2024-01-09',
    endDate: '2024-04-09',
  },
  {
    id: 120,
    title: 'Task 120',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    status: 'Completed',
    priority: 'Critical',
    projectId: '1',
    startDate: '2024-01-23',
    endDate: '2024-06-23',
  },
];

const projectDetail: any = {
  id: 1,
  name: 'Website Redesign',
  startDate: '12/04/2024',
  endDate: '12/08/2024',
  progress: 65,
  description:
    'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolore aliquid unde laboriosam nisi corporis suscipit asperiores quae culpa alias ab nam temporibus, doloribus autem eum. Labore ut voluptas deleniti quam?',
  team: [
    { id: 1, name: 'John Doe', avatar: '/placeholder.svg?height=40&width=40' },
    {
      id: 2,
      name: 'Jane Smith',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
    },
  ],
  tasks: tasks.filter((item) => item.projectId === '1'),
};

const projectResources = [
  { id: 1, name: 'John Doe', role: 'UI/UX Designer' },
  { id: 2, name: 'Jane Smith', role: 'Frontend Developer' },
  { id: 3, name: 'Johnson Mike', role: 'Frontend Developer' },
  { id: 4, name: 'Mike Johnson', role: 'Backend Developer' },
  { id: 5, name: 'Mike Tyson', role: 'Backend Developer' },
];

export {
  projects,
  invoices,
  tasks,
  teams,
  contracts,
  clients,
  roles,
  projectDetailTasks,
  projectDetail,
  projectResources,
};

export const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Brazzaville)',
  'Congo (Kinshasa)',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
];
