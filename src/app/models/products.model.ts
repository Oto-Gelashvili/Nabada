export interface Product {
  id: number;
  name: string;
  price: number;
}
export interface ProductAmount {
  id: number;
  amount: number;
}
export interface SessionItem {
  id: number;
  session_id: number;
  product_id: number;
  name: string;
  quantity: number;
  price_at_purchase: number;
}
