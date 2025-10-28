// Shared status color helpers used across dashboards
export type Status =
  | 'RECEIVED'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'INVOICED'
  | 'DISPATCHED'
  | 'VERIFIED'
  | 'PAID'

type Tokens = { bg: string; color: string; border: string };

const statusMap: Record<Status, Tokens> = {
  RECEIVED: { bg: 'bg-gray-100', color: 'text-gray-800', border: 'border-gray-200' },
  ASSIGNED: { bg: 'bg-blue-100', color: 'text-blue-800', border: 'border-blue-200' },
  CONFIRMED: { bg: 'bg-yellow-100', color: 'text-yellow-800', border: 'border-yellow-200' },
  INVOICED: { bg: 'bg-purple-100', color: 'text-purple-800', border: 'border-purple-200' },
  DISPATCHED: { bg: 'bg-orange-100', color: 'text-orange-800', border: 'border-orange-200' },
  VERIFIED: { bg: 'bg-green-100', color: 'text-green-800', border: 'border-green-200' },
  PAID: { bg: 'bg-emerald-100', color: 'text-emerald-800', border: 'border-emerald-200' }
};

export function getStatusTokens(status: string): Tokens {
  // Normalize to uppercase to handle both SCREAMING_SNAKE_CASE and PascalCase inputs
  const normalizedStatus = status.toUpperCase();
  return (statusMap as Record<string, Tokens>)[normalizedStatus] ?? { bg: 'bg-gray-100', color: 'text-gray-800', border: 'border-gray-200' };
}

export function getStatusClasses(status: string): string {
  const t = getStatusTokens(status);
  return `${t.bg} ${t.color} ${t.border}`;
}

export default { getStatusTokens, getStatusClasses };
