export interface Station {
  id: number;
  name: string;
  display_order: number;
}

export interface ServiceSession {
  id: number;
  station_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  hourly_rate: number;
  total_cost: number;
  pay_method: string;
  controller_amount: number;
  controller_cost: number;
  cash_paid: number;
  card_paid: number;
  fitpass_paid: number;
  fitpass_count: number;
}

export interface CreateSessionDTO {
  station_id: number;
  start_time: string;
  end_time?: string | null;
  products?: {
    product_id: number;
    quantity: number;
    price_at_purchase: number;
    name: string;
  }[];
  hourly_rate: number;
  controller_amount: number;
  controller_cost: number;
  cash_paid: number;
  card_paid: number;
  fitpass_paid: number;
  fitpass_count: number;
}

export const PAY_METHOD_OPTIONS = [
  { key: 'Cash', label: $localize`:@@sessions.cash:Cash` },
  { key: 'Card', label: $localize`:@@sessions.card:Card` },
  { key: 'Fitpass', label: $localize`:@@sessions.fitPass:Fitpass` },
] as const;

export type PayMethod = (typeof PAY_METHOD_OPTIONS)[number]['key'];

export function derivePayMethod(
  session: Pick<ServiceSession, 'cash_paid' | 'card_paid' | 'fitpass_paid'>,
): string {
  const total = session.cash_paid + session.card_paid + session.fitpass_paid;
  if (total === 0) return 'NotPaid';
  const methods = [];
  if (session.cash_paid > 0) methods.push('Cash');
  if (session.card_paid > 0) methods.push('Card');
  if (session.fitpass_paid > 0) methods.push('Fitpass');
  return methods.join(',');
}
