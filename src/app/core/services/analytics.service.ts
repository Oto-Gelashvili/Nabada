import { inject, Injectable } from '@angular/core';
import { SUPABASE_CLIENT } from './supabase.token';
import {
  GraphPoint,
  SessionItems,
  StationAnalytics,
} from '../../features/analytics/models/analytics.models';

type Granularity = 'day' | 'week' | 'month';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  async getDailyIncome(startDate: Date, endDate: Date): Promise<GraphPoint[]> {
    const startStr = new Date(startDate).toISOString();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const endStr = end.toISOString();

    const { data, error } = await this.supabase
      .from('sessions')
      .select('start_time, total_cost')
      .gte('start_time', startStr)
      .lte('start_time', endStr)
      .not('total_cost', 'is', null);

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
      }
    }

    return points;
  }

  private getBucketKey(date: Date, granularity: Granularity): string {
    if (granularity === 'day') {
      // "2025-01-07"
      return date.toISOString().slice(0, 10);
    }

    if (granularity === 'week') {
      // ISO week number: we find the Monday of the week this date belongs to
      const monday = new Date(date);
      const day = date.getDay(); // 0=Sun, 1=Mon ... 6=Sat
      // getDay() returns 0 for Sunday, we treat Sunday as end of week
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(date.getDate() + diff);
      return monday.toISOString().slice(0, 10);
    }

    // month: "2025-01"
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private getLabel(date: Date, granularity: Granularity): string {
    if (granularity === 'day') {
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      // → "Jan 7"
    }

    if (granularity === 'week') {
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      // → "Jan 6" (the Monday that starts the week)
    }

    // month
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    // → "Jan 2025"
  }

  async getStationsAnalytics(startDate: Date, endDate: Date): Promise<StationAnalytics[]> {
    const startStr = new Date(startDate).toISOString();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [{ data: sessions, error: sessionsError }, { data: stations, error: stationsError }] =
      await Promise.all([
        this.supabase
          .from('sessions')
          .select('station_id, total_cost, gaming_cost, products_cost')
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
    for (const session of sessions) {
      const existing = byStation.get(session.station_id);
      if (existing) {
        existing.total_cost += Number(session.total_cost ?? 0);
        existing.gaming_cost += Number(session.gaming_cost ?? 0);
        existing.products_cost += Number(session.products_cost ?? 0);
      } else {
        byStation.set(session.station_id, {
          total_cost: Number(session.total_cost ?? 0),
          gaming_cost: Number(session.gaming_cost ?? 0),
          products_cost: Number(session.products_cost ?? 0),
        });
      }
    }

    return stations
      .map((station) => ({
        id: station.id,
        name: station.name,
        ...(byStation.get(station.id) ?? { total_cost: 0, gaming_cost: 0, products_cost: 0 }),
      }))
      .sort((a, b) => b.total_cost - a.total_cost);
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
