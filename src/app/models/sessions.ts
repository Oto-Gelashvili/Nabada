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
}
