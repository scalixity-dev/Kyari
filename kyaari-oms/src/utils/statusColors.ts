// Shared status color helpers used across dashboards
export type Status =
  | 'Received'
  | 'Assigned'
  | 'Confirmed'
  | 'Invoiced'
  | 'Dispatched'
  | 'Verified'
  | 'Paid'

type Tokens = { bg: string; color: string; border: string };

const statusMap: Record<Status, Tokens> = {
  Received: { bg: 'bg-gray-100', color: 'text-gray-800', border: 'border-gray-200' },
  Assigned: { bg: 'bg-blue-100', color: 'text-blue-800', border: 'border-blue-200' },
  Confirmed: { bg: 'bg-yellow-100', color: 'text-yellow-800', border: 'border-yellow-200' },
  Invoiced: { bg: 'bg-purple-100', color: 'text-purple-800', border: 'border-purple-200' },
  Dispatched: { bg: 'bg-orange-100', color: 'text-orange-800', border: 'border-orange-200' },
  Verified: { bg: 'bg-green-100', color: 'text-green-800', border: 'border-green-200' },
  Paid: { bg: 'bg-emerald-100', color: 'text-emerald-800', border: 'border-emerald-200' }
};

export function getStatusTokens(status: string): Tokens {
  // If status is not a known Status, return a gray fallback
  return (statusMap as Record<string, Tokens>)[status] ?? { bg: 'bg-gray-100', color: 'text-gray-800', border: 'border-gray-200' };
}

export function getStatusClasses(status: string): string {
  const t = getStatusTokens(status);
  return `${t.bg} ${t.color} ${t.border}`;
}

export default { getStatusTokens, getStatusClasses };
