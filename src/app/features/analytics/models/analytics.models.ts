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
export interface PayMethodAnalytics {
  pay_method: string;
  total_cost: number;
  gaming_cost: number;
  products_cost: number;
}
export interface StationsAnalyticsResult {
  stations: StationAnalytics[];
  payMethods: PayMethodAnalytics[];
}
export interface SessionItems {
  id: number;
  name: string;
  quantity: number;
  total_revenue: number;
}
export interface SortOption {
  key: string;
  label: string;
}
export const STATION_SORT_OPTIONS: SortOption[] = [
  { key: 'dec-total', label: $localize`:@@analytics.decTotal:Decreasing total` },
  { key: 'inc-total', label: $localize`:@@analytics.incTotal:Increasing total` },
  { key: 'dec-gaming', label: $localize`:@@analytics.decGaming:Decreasing gaming` },
  { key: 'inc-gaming', label: $localize`:@@analytics.incGaming:Increasing gaming` },
  { key: 'dec-products', label: $localize`:@@analytics.decProducts:Decreasing products` },
  { key: 'inc-products', label: $localize`:@@analytics.incProducts:Increasing products` },
];

export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { key: 'dec-total', label: $localize`:@@analytics.decTotal:Decreasing total` },
  { key: 'inc-total', label: $localize`:@@analytics.incTotal:Increasing total` },
  { key: 'dec-quantity', label: $localize`:@@analytics.decQuantity:Decreasing quantity` },
  { key: 'inc-quantity', label: $localize`:@@analytics.incQuantity:Increasing quantity` },
];
