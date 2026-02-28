export interface GraphPoint {
  date: string;
  total: number;
}
export interface StationAnalytics {
  id: number;
  name: string;
  total_cost: number;
  gaming_cost: number;
  products_cost: number;
}

export type SortOption =
  | 'Decreasing total'
  | 'Increasing total'
  | 'Decreasing gaming'
  | 'Increasing gaming'
  | 'Decreasing products'
  | 'Increasing products';
