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
}
