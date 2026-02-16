import { keyframes } from '@emotion/react';
import {
  BarChartOutlined,
  GroupsOutlined,
  LockOutlined,
  RocketLaunchOutlined,
} from '@mui/icons-material';

// Type definition for card items
interface CardItem {
  title: string;
  description: string;
  icon: JSX.Element;
}

// Type definition for FAQ items
interface FAQItem {
  q: string;
  a: string;
}

// Type definition for company items
interface Company {
  name: string;
  logo: string;
}

// Define card items
export const cardItems: CardItem[] = [
  {
    title: 'Streamline Your Projects',
    description:
      'Boost productivity with NexTask SaaS-Dev, the all-in-one cloud platform for seamless project organization, team collaboration, and progress tracking.',
    icon: (
      <RocketLaunchOutlined sx={{ fontSize: 35, color: (theme) => theme.palette.primary.main }} />
    ),
  },
  {
    title: 'Collaborate Seamlessly',
    description:
      "Enable real-time teamwork with NexTask's collaboration tools. Share updates, assign tasks, and communicate seamlessly to keep everyone aligned.",
    icon: <GroupsOutlined sx={{ fontSize: 35, color: (theme) => theme.palette.primary.main }} />,
  },
  {
    title: 'Track Progress with Detailed Analytics',
    description:
      "Get actionable insights with NexTask's analytics. Track timelines, spot bottlenecks, and make data-driven decisions to keep projects on course.",
    icon: <BarChartOutlined sx={{ fontSize: 35, color: (theme) => theme.palette.primary.main }} />,
  },
  {
    title: 'Secure Data with Advanced Encryption',
    description:
      "Shield your projects with NexTask's robust security features. Your data is encrypted and accessible only to authorized users, ensuring full protection.",
    icon: <LockOutlined sx={{ fontSize: 35, color: (theme) => theme.palette.primary.main }} />,
  },
];

// Define frequently asked questions
export const faqs: FAQItem[] = [
  {
    q: 'What makes this Task Management application stand out?',
    a: 'Built with the power of Next.js and Material UI, our Task Management application combines speed, scalability, and a sleek, modern design. It offers a seamless experience, helping teams to streamline their workflows, stay organized, and achieve more in less time.',
  },
  {
    q: 'How can this application improve my business operations?',
    a: 'By centralizing task assignment, tracking, and communication, our solution minimizes miscommunications and boosts productivity. It helps your team stay aligned on project goals, track deadlines effortlessly, and prioritize tasks to achieve faster turnaround times, leading to improved client satisfaction and business growth.',
  },
  {
    q: 'What features does this Task Management application offer?',
    a: 'Key features include task assignment and tracking, progress monitoring, team collaboration, automated reminders, customizable task statuses, and insightful analytics. Plus, with a highly intuitive user interface powered by Material UI, managing tasks has never looked so good!',
  },
  {
    q: 'Why did you choose Next.js and Material UI for this application?',
    a: 'Next.js ensures that the application is fast, SEO-friendly, and scalable, perfect for businesses of all sizes. Material UI provides a beautiful, responsive design that makes the application user-friendly and visually appealing. Together, they ensure a robust and delightful user experience.',
  },
  {
    q: 'How secure is this Task Management application?',
    a: 'Security is our priority. Using Next.js allows us to implement secure server-side rendering, and with proper authentication and authorization protocols, your data remains protected. Regular updates ensure the highest standards of security.',
  },
  {
    q: 'Can I customize the look and feel of the application?',
    a: 'Absolutely! With our custom theming options, you can personalize the appearance to match your brand. Whether you want to change colors, fonts, or layout styles, our Material UI integration makes it easy to create a look that suits your business.',
  },
  {
    q: 'Is the application suitable for remote teams?',
    a: 'Yes, it’s perfect for remote teams! Our application offers real-time updates and notifications, allowing team members to stay connected and in sync, no matter where they are. Assign tasks, track progress, and collaborate—all from a single, easy-to-use platform.',
  },
  {
    q: 'How does this application support growth as my business scales?',
    a: 'Scalability is built into the core of our solution with Next.js, enabling your business to handle an increasing number of tasks, projects, and team members without compromising performance. As your needs grow, the app grows with you, providing a consistent experience at every stage.',
  },
  {
    q: 'What kind of support do you provide for this Task Management application?',
    a: "We offer comprehensive support, including onboarding assistance, regular updates, and customer service to help you get the most out of the application. We're committed to ensuring a smooth experience for you and your team.",
  },
  {
    q: 'How easy is it to get started with this Task Management application?',
    a: 'It’s as easy as signing up and adding your first tasks! Our intuitive interface ensures that even new users can get up and running quickly. Plus, with our support team available to guide you, you’ll be optimizing your workflow in no time.',
  },
];

// Define companies using the application
export const companies: Company[] = [
  {
    name: 'TechNova Solutions',
    logo: 'https://res.cloudinary.com/dr5tkqlig/image/upload/v1750790058/Nvidia-Logo-PNG-Image-Transparent_dhrdft.png',
  },
  {
    name: 'CloudEdge Software',
    logo: 'https://res.cloudinary.com/dr5tkqlig/image/upload/v1750789449/1200px-Google_2015_logo.svg_maqrom.png',
  },
  {
    name: 'InnovateX Enterprises',
    logo: 'https://res.cloudinary.com/dr5tkqlig/image/upload/v1750789399/meta-logo-free-download-meta-logo-free-png_jwfzh9.png',
  },
  {
    name: 'NextWave Logistics',
    logo: 'https://res.cloudinary.com/dr5tkqlig/image/upload/v1750789046/1200px-Amazon_logo.svg_jfawxa.png',
  },
  {
    name: 'Pinnacle Analytics',
    logo: 'https://res.cloudinary.com/dr5tkqlig/image/upload/v1750789006/1280px-Microsoft_logo__282012_29.svg_vw6rpo.png',
  },
];

// Define gradient animation
export const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
