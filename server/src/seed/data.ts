import type { Role, Severity } from '../domain/types';

/** All seed data is synthetic: invented people, hosts and assets (Synthetic-Data Rule). */
export const SEED_USERS: Array<{ username: string; displayName: string; role: Role }> = [
  { username: 'alice.admin', displayName: 'Alice Admin', role: 'ADMIN' },
  { username: 'ravi.auditor', displayName: 'Ravi Auditor', role: 'AUDITOR' },
  { username: 'arun.auditor', displayName: 'Arun Auditor', role: 'AUDITOR' },
  { username: 'olivia.owner', displayName: 'Olivia Owner', role: 'OWNER' },
  { username: 'omar.owner', displayName: 'Omar Owner', role: 'OWNER' },
  { username: 'rhea.reviewer', displayName: 'Rhea Reviewer', role: 'REVIEWER' },
  { username: 'rob.reviewer', displayName: 'Rob Reviewer', role: 'REVIEWER' },
];

export interface SeedControl {
  controlId: string;
  title: string;
  category: string;
  severity: Severity;
  description: string;
}

export const SEED_CONTROLS: Record<string, SeedControl[]> = {
  ISO27001: [
    { controlId: 'A.5.1', title: 'Policies for information security', category: 'Organizational', severity: 'MEDIUM', description: 'An information security policy is defined, approved, published and reviewed at planned intervals.' },
    { controlId: 'A.5.15', title: 'Access control', category: 'Organizational', severity: 'HIGH', description: 'Rules to control physical and logical access are established based on business and security requirements.' },
    { controlId: 'A.5.23', title: 'Information security for cloud services', category: 'Organizational', severity: 'HIGH', description: 'Processes for acquiring, using, managing and exiting cloud services are defined.' },
    { controlId: 'A.8.2', title: 'Privileged access rights', category: 'Technological', severity: 'CRITICAL', description: 'Allocation and use of privileged access rights is restricted and managed.' },
    { controlId: 'A.8.8', title: 'Management of technical vulnerabilities', category: 'Technological', severity: 'HIGH', description: 'Information about technical vulnerabilities is obtained, exposure evaluated and measures taken.' },
    { controlId: 'A.8.13', title: 'Information backup', category: 'Technological', severity: 'MEDIUM', description: 'Backup copies are maintained and regularly tested in line with the backup policy.' },
    { controlId: 'A.8.15', title: 'Logging', category: 'Technological', severity: 'MEDIUM', description: 'Logs recording activities, exceptions and faults are produced, stored, protected and analysed.' },
    { controlId: 'A.8.24', title: 'Use of cryptography', category: 'Technological', severity: 'HIGH', description: 'Rules for the effective use of cryptography, including key management, are defined and implemented.' },
  ],
  SOC2: [
    { controlId: 'CC6.1', title: 'Logical access security', category: 'Logical and Physical Access', severity: 'HIGH', description: 'Logical access security software, infrastructure and architectures protect information assets.' },
    { controlId: 'CC6.2', title: 'User registration and authorization', category: 'Logical and Physical Access', severity: 'HIGH', description: 'New internal and external users are registered and authorized before credentials are issued.' },
    { controlId: 'CC6.6', title: 'Boundary protection', category: 'Logical and Physical Access', severity: 'CRITICAL', description: 'Logical access security measures protect against threats from sources outside system boundaries.' },
    { controlId: 'CC7.2', title: 'Security event monitoring', category: 'System Operations', severity: 'HIGH', description: 'System components are monitored for anomalies indicative of malicious acts or errors.' },
    { controlId: 'CC7.4', title: 'Incident response', category: 'System Operations', severity: 'HIGH', description: 'Identified security incidents are responded to by executing a defined incident response program.' },
    { controlId: 'CC8.1', title: 'Change management', category: 'Change Management', severity: 'MEDIUM', description: 'Changes to infrastructure, data, software and procedures are authorized, tested and approved.' },
  ],
  CIS: [
    { controlId: 'CIS-1.1', title: 'Enterprise asset inventory', category: 'Inventory and Control of Enterprise Assets', severity: 'MEDIUM', description: 'An accurate, detailed and up-to-date inventory of enterprise assets is maintained.' },
    { controlId: 'CIS-3.3', title: 'Data access control lists', category: 'Data Protection', severity: 'HIGH', description: 'Data access control lists are configured based on need to know.' },
    { controlId: 'CIS-4.1', title: 'Secure configuration process', category: 'Secure Configuration', severity: 'HIGH', description: 'A secure configuration process for enterprise assets and software is maintained.' },
    { controlId: 'CIS-5.4', title: 'Restrict administrator privileges', category: 'Account Management', severity: 'CRITICAL', description: 'Administrator privileges are restricted to dedicated administrator accounts.' },
    { controlId: 'CIS-7.1', title: 'Vulnerability management process', category: 'Continuous Vulnerability Management', severity: 'HIGH', description: 'A documented vulnerability management process is established and maintained.' },
    { controlId: 'CIS-8.2', title: 'Collect audit logs', category: 'Audit Log Management', severity: 'MEDIUM', description: 'Audit logs are collected across enterprise assets.' },
  ],
};
