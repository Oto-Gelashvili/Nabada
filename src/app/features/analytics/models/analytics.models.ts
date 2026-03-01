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

export interface SessionItems {
  id: number;
  name: string;
  quantity: number;
  total_revenue: number;
}
export const STATION_SORT_OPTIONS = [
  'Decreasing total',
  'Increasing total',
  'Decreasing gaming',
  'Increasing gaming',
  'Decreasing products',
  'Increasing products',
] as const;
export type StationSortOption = (typeof STATION_SORT_OPTIONS)[number];

export const PRODUCT_SORT_OPTIONS = [
  'Decreasing total',
  'Increasing total',
  'Decreasing quantity',
  'Increasing quantity',
] as const;
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];
