export const formatDate = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
};

export const formatDateTime = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const datePart = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart} ${timePart}`;
  } catch {
    return String(dateInput);
  }
};

export const truncateId = (id: string, len: number = 8): string => {
  if (!id) return '';
  if (id.length <= len) return id;
  return `${id.substring(0, len)}...`;
};
