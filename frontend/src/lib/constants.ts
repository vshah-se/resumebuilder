import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import WorkIcon from '@mui/icons-material/WorkOutlineOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import TrackChangesIcon from '@mui/icons-material/TrackChangesOutlined';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

export const APP_NAME = 'ResumeForge';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: DashboardIcon },
  { label: 'Profile', path: '/profile', icon: PersonIcon },
  { label: 'Job Match', path: '/jobs', icon: WorkIcon },
  { label: 'Resume', path: '/resume', icon: DescriptionIcon },
  { label: 'Applications', path: '/applications', icon: AssignmentIcon },
  { label: 'Active', path: '/active', icon: TrackChangesIcon },
  { label: 'Messaging', path: '/messaging', icon: EmailIcon },
];

export const DRAWER_WIDTH = 260;

export const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Material UI',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins',
  'REST APIs', 'GraphQL', 'gRPC', 'WebSockets',
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence',
  'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
  'Project Management', 'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
  'Figma', 'Adobe XD', 'Sketch', 'UI/UX Design',
  'Linux', 'Bash', 'PowerShell',
  'Unit Testing', 'Integration Testing', 'Jest', 'Cypress', 'Selenium',
];

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'withdrawn',
] as const;

export const INTERVIEW_STAGES = [
  'Phone Screen',
  'Round 1',
  'Round 2',
  'Round 3',
  'Final',
  'Offer',
  'Declined',
] as const;

export const MESSAGE_STAGES = [
  'initial_outreach',
  'follow_up_1',
  'follow_up_2',
  'follow_up_3',
  'thank_you',
] as const;
