import { inject, Injectable } from '@angular/core';
import { SUPABASE_CLIENT } from './supabase.token';
import {
  GraphPoint,
  PayMethodAnalytics,
  SessionItems,
  StationAnalytics,
  StationsAnalyticsResult,
} from '../../features/analytics/models/analytics.models';

type Granularity = 'day' | 'week' | 'month';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  async getIncomeGraph(startDate: Date, endDate: Date): Promise<GraphPoint[]> {
    const startStr = new Date(startDate).toISOString();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const endStr = end.toISOString();

    const { data, error } = await this.supabase
      .from('sessions')
      .select('start_time, total_cost')
      .gte('start_time', startStr)
      .lte('start_time', endStr)
      .not('total_cost', 'is', null)
      .neq('pay_method', 'NotPaid');

    if (error) {
      throw new Error($localize`:@@error.fetchingError:Could not fetch data. Please try again.`);
    }

    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const granularity: Granularity = diffDays <= 14 ? 'day' : diffDays <= 90 ? 'week' : 'month';

    return this.groupData(data, startDate, endDate, granularity);
  }

  private groupData(
    sessions: { start_time: string; total_cost: number }[],
    startDate: Date,
    endDate: Date,
    granularity: Granularity,
  ): GraphPoint[] {
    const buckets = new Map<string, number>();

    for (const session of sessions) {
      const date = new Date(session.start_time);
      const key = this.getBucketKey(date, granularity);
      buckets.set(key, (buckets.get(key) ?? 0) + Number(session.total_cost));
    }

    const points: GraphPoint[] = [];
    const selectedDay = new Date(startDate);
    selectedDay.setHours(0, 0, 0, 0);

    const endDay = new Date(endDate);
    endDay.setHours(23, 59, 59, 999);

    if (granularity === 'week') {
      const day = selectedDay.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      selectedDay.setDate(selectedDay.getDate() + diff);
    }

    if (granularity === 'month') {
      selectedDay.setDate(1);
    }
    while (selectedDay <= endDay) {
      const key = this.getBucketKey(selectedDay, granularity);

      points.push({
        date: this.getLabel(selectedDay, granularity),
        total: buckets.get(key) ?? 0,
      });

      if (granularity === 'day') {
        selectedDay.setDate(selectedDay.getDate() + 1);
      } else if (granularity === 'week') {
        selectedDay.setDate(selectedDay.getDate() + 7);
      } else {
        selectedDay.setMonth(selectedDay.getMonth() + 1);
        selectedDay.setDate(1);
      }
    }

    return points;
  }

  private getBucketKey(date: Date, granularity: Granularity): string {
    if (granularity === 'day') {
      return this.formatLocalDate(date);
    }

    if (granularity === 'week') {
      const monday = new Date(date);
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(date.getDate() + diff);

      return this.formatLocalDate(monday); // ✅ FIX
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getLabel(date: Date, granularity: Granularity): string {
    //undefined defaults to prefered locale(setting ka-ge didnt work btw)
    if (granularity === 'day') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      // → "Jan 7"
    }

    if (granularity === 'week') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      // → "Jan 6" (the Monday that starts the week)
    }

    // month
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    // → "Jan 2025"
  }

  async getStationsAnalytics(startDate: Date, endDate: Date): Promise<StationsAnalyticsResult> {
    const startStr = new Date(startDate).toISOString();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [{ data: sessions, error: sessionsError }, { data: stations, error: stationsError }] =
      await Promise.all([
        this.supabase
          .from('sessions')
          .select(
            'station_id, total_cost, gaming_cost, products_cost, pay_method, cash_paid, card_paid, fitpass_paid',
          )
          .gte('start_time', startStr)
          .lte('start_time', end.toISOString()),
        this.supabase
          .from('stations')
          .select('id, name')
          .lte('created_at', end.toISOString())
          .or(`deleted_at.is.null,deleted_at.gte.${startStr}`)
          .order('display_order', { ascending: true }),
      ]);

    if (sessionsError || stationsError)
      throw new Error($localize`:@@error.fetchingError:Could not fetch data. Please try again.`);

    const byStation = new Map<number, Omit<StationAnalytics, 'id' | 'name'>>();
    const byPayMethod = new Map<string, PayMethodAnalytics>();

    const addToPayMethod = (key: string, amount: number, gaming: number, products: number) => {
      const existing = byPayMethod.get(key);
      if (existing) {
        existing.total_cost += amount;
        existing.gaming_cost += gaming;
        existing.products_cost += products;
      } else {
        byPayMethod.set(key, {
          pay_method: key,
          total_cost: amount,
          gaming_cost: gaming,
          products_cost: products,
        });
      }
    };

    for (const session of sessions) {
      // Skip fully unpaid sessions from station totals
      if (session.pay_method === 'NotPaid') continue;

      const existing = byStation.get(session.station_id);
      const total = Number(session.total_cost ?? 0);
      const gaming = Number(session.gaming_cost ?? 0);
      const products = Number(session.products_cost ?? 0);

      if (existing) {
        existing.total_cost += total;
        existing.gaming_cost += gaming;
        existing.products_cost += products;
      } else {
        byStation.set(session.station_id, {
          total_cost: total,
          gaming_cost: gaming,
          products_cost: products,
        });
      }

      // Attribute each payment method by actual paid amounts
      const cash = Number(session.cash_paid ?? 0);
      const card = Number(session.card_paid ?? 0);
      const fitpass = Number(session.fitpass_paid ?? 0);
      const totalPaid = cash + card + fitpass;

      if (totalPaid === 0) continue;

      // Distribute gaming/products cost proportionally to paid amounts
      const cashRatio = cash / totalPaid;
      const cardRatio = card / totalPaid;
      const fitpassRatio = fitpass / totalPaid;

      if (cash > 0) addToPayMethod('Cash', cash, gaming * cashRatio, products * cashRatio);
      if (card > 0) addToPayMethod('Card', card, gaming * cardRatio, products * cardRatio);
      if (fitpass > 0)
        addToPayMethod('Fitpass', fitpass, gaming * fitpassRatio, products * fitpassRatio);
    }

    const stationResults = stations
      .map((station) => ({
        id: station.id,
        name: station.name,
        ...(byStation.get(station.id) ?? { total_cost: 0, gaming_cost: 0, products_cost: 0 }),
      }))
      .sort((a, b) => b.total_cost - a.total_cost);

    const payMethodResults = Array.from(byPayMethod.values()).sort(
      (a, b) => b.total_cost - a.total_cost,
    );

    return { stations: stationResults, payMethods: payMethodResults };
  }

  async getProductsData(startDate: Date, endDate: Date): Promise<SessionItems[]> {
    const startStr = new Date(startDate).toISOString();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from('session_items')
      .select('*, sessions!inner(start_time)')
      .gte('sessions.start_time', startStr)
      .lte('sessions.start_time', end.toISOString());
    if (error) {
      throw new Error($localize`:@@error.fetchingError:Could not fetch data. Please try again.`);
    }

    // group by product_id
    const byProduct = new Map<number, { name: string; quantity: number; total_revenue: number }>();
    for (const item of data) {
      const existing = byProduct.get(item.product_id);
      const revenue = Number(item.quantity ?? 0) * Number(item.price_at_purchase ?? 0);
      if (existing) {
        existing.quantity += Number(item.quantity ?? 0);
        existing.total_revenue += revenue;
      } else {
        byProduct.set(item.product_id, {
          name: item.name,
          quantity: Number(item.quantity ?? 0),
          total_revenue: revenue,
        });
      }
    }
    return Array.from(byProduct.entries())
      .map(([productId, stats]) => ({
        id: productId,
        name: stats.name,
        quantity: stats.quantity,
        total_revenue: stats.total_revenue,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);
  }
}
