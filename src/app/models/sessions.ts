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
}
export const PAY_METHOD_OPTIONS = [
  { key: 'Cash', label: $localize`:@@sessions.cash:Cash` },
  { key: 'Card', label: $localize`:@@sessions.card:Card` },
  { key: 'Fitpass', label: $localize`:@@sessions.fitPass:Fitpass` },
] as const;

export type PayMethod = (typeof PAY_METHOD_OPTIONS)[number]['key'];
