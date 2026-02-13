import { AssignmentOutlined, PeopleAltOutlined, TimelineOutlined } from '@mui/icons-material';

const iconStyle = {
  fontSize: 35,
  color: (theme) => theme.palette.primary.main,
};

const features = [
  {
    icon: <AssignmentOutlined sx={iconStyle} />,
    title: 'Manage Projects Efficiently',
    description: 'Streamline workflows and keep your team focused on priorities.',
  },
  {
    icon: <PeopleAltOutlined sx={iconStyle} />,
    title: 'Collaborate Seamlessly',
    description: 'Improve communication and teamwork with intuitive collaboration tools.',
  },
  {
    icon: <TimelineOutlined sx={iconStyle} />,
    title: 'Track Progress Effectively',
    description: 'Monitor milestones and deadlines to ensure timely project delivery.',
  },
];

const featureItems = [
  {
    title: 'Simple and Intuitive Project Management',
    subtitle: 'Project Management',
    description:
      'No more learning curves: Our user-friendly interface makes it easy for anyone to get started, regardless of technical expertise. Visualize your projects with intuitive dashboards and customizable views.',
    checkListItems: [
      'User-friendly, no learning curve',
      'Non-tech users start easily',
      'Intuitive project dashboards',
      'Customizable project views',
    ],
    img: '/images/visual.png',
  },
  {
    title: 'Seamless Collaboration for Teams',
    subtitle: 'Team Collaboration',
    description:
      'Boost team productivity with real-time collaboration tools. Stay connected and work together effectively, no matter where your team is located.',
    checkListItems: [
      'Real-time collaboration tools',
      'Centralized communication',
      'Document and file sharing',
      'Support for remote teams',
    ],
    img: '/images/collaboration.png',
  },
  {
    title: 'Track Progress with Advanced Analytics',
    subtitle: 'Analytics & Reporting',
    description:
      'Gain insights into your project performance with powerful analytics and detailed reporting. Make data-driven decisions effortlessly.',
    checkListItems: [
      'Detailed project reports',
      'Custom analytics dashboards',
      'Milestone and goal tracking',
      'Real-time progress updates',
    ],
    img: '/images/analytics.png',
  },
  {
    title: 'Secure and Reliable Data Management',
    subtitle: 'Data Security',
    description:
      'Your data is our priority. We ensure top-level security measures, so you can focus on your projects without worry.',
    checkListItems: [
      'Top-tier data encryption',
      'Regular security audits',
      'GDPR and compliance-ready',
      'Reliable cloud backups',
    ],
    img: '/images/auth.png',
  },
];

export { features, featureItems };
