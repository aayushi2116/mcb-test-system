import { Operator } from '../types/system';

export const MOCK_OPERATORS: Operator[] = [
  {
    id: 'OP-8821',
    name: 'Dr. Marcus Vance',
    badgeNumber: 'STN4-ENG-8821',
    role: 'LAB_ENGINEER',
    labStation: 'Station 4 (High-Current Test Cell)',
    lastLogin: '2026-09-30T09:15:00.000Z',
  },
  {
    id: 'OP-7419',
    name: 'Elena Rostova',
    badgeNumber: 'STN4-TECH-7419',
    role: 'OPERATOR',
    labStation: 'Station 4 (High-Current Test Cell)',
    lastLogin: '2026-09-29T16:30:00.000Z',
  },
  {
    id: 'OP-9012',
    name: 'Sarah Chen, PE',
    badgeNumber: 'QA-AUDIT-9012',
    role: 'QUALITY_AUDITOR',
    labStation: 'Certification Verification Bureau',
    lastLogin: '2026-09-28T11:00:00.000Z',
  },
  {
    id: 'OP-1001',
    name: 'Vikram Joshi',
    badgeNumber: 'SYS-ADMIN-1001',
    role: 'ADMIN',
    labStation: 'Master Control Center',
    lastLogin: '2026-09-30T08:00:00.000Z',
  }
];
