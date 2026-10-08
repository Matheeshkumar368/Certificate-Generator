import { Recipient } from '../types';

export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

export const parseAndValidateCsv = (csvText: string): Recipient[] => {
  const lines = csvText.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Parse header
  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const nameIdx = header.findIndex(h => h === 'name' || h.includes('name'));
  const emailIdx = header.findIndex(h => h === 'email' || h.includes('mail'));

  const startIndex = (nameIdx !== -1 && emailIdx !== -1) ? 1 : 0;
  const colName = nameIdx !== -1 ? nameIdx : 0;
  const colEmail = emailIdx !== -1 ? emailIdx : 1;

  const recipients: Recipient[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const name = cols[colName] || '';
    const email = cols[colEmail] || '';

    let status: 'Valid' | 'Invalid' = 'Valid';
    let error: string | undefined;

    if (!name) {
      status = 'Invalid';
      error = 'Missing recipient name';
    } else if (!email) {
      status = 'Invalid';
      error = 'Missing recipient email';
    } else if (!validateEmail(email)) {
      status = 'Invalid';
      error = 'Invalid email format';
    }

    recipients.push({ name, email, status, error });
  }

  return recipients;
};

export const downloadSampleCsv = () => {
  const sampleContent = `name,email
Matheesh Kumar,matheesh@example.com
Rahul Kumar,rahul@example.com
Arun Kumar,arun@example.com
Priya Sharma,priya@example.com
Vikram Patel,invalid-email-sample
`;
  const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_recipients.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
