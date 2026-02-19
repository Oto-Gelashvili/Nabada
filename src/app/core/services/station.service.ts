import { inject, Injectable } from '@angular/core';
import { Station, ServiceSession, CreateSessionDTO } from '../../models/sessions';
import { SUPABASE_CLIENT } from './supabase.token';
import { SessionItem } from '../../models/products.model';

@Injectable({
  providedIn: 'root',
})
export class StationsService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  constructor() {}

  async getStations(date?: Date): Promise<Station[]> {
    if (!date) {
      const { data, error } = await this.supabase
        .from('stations')
        .select('*')
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Station[];
    }

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from('stations')
      .select('*')
      .lte('created_at', endOfDay.toISOString())
      .or(`deleted_at.is.null,deleted_at.gte.${endOfDay.toISOString()}`)
      .order('display_order');

    if (error) throw error;
    return data as Station[];
  }

  async createStation(station: { name: string; display_order: number }): Promise<Station> {
    const { data, error } = await this.supabase
      .from('stations')
      .insert({
        name: station.name,
        display_order: station.display_order,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Station;
  }

  async updateStationName(id: number, newName: string): Promise<void> {
    const { error } = await this.supabase.from('stations').update({ name: newName }).eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async removeStation(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('stations')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }

  async getSessions(date: Date): Promise<ServiceSession[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startStr = startOfDay.toISOString();
    const endStr = endOfDay.toISOString();

    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .or(
        `and(start_time.gte.${startStr},start_time.lte.${endStr}),and(end_time.gte.${startStr},end_time.lte.${endStr})`,
      );

    if (error) {
      throw new Error(error.message);
    }

    return data as ServiceSession[];
  }
  async getSessionItems(sessionID: number): Promise<SessionItem[]> {
    const { data, error } = await this.supabase
      .from('session_items')
      .select('*')
      .eq('session_id', sessionID);

    if (error) {
      throw new Error($localize`:@@error.getSessionItems:Could not fetch product details.`);
    }
    return data as SessionItem[];
  }

  async createSession(data: CreateSessionDTO) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error($localize`:@@common.notAuthenticated: User not Authenticated`);

    const { data: result, error } = await this.supabase.rpc('create_session_smart', {
      p_station_id: data.station_id,
      p_start_time: data.start_time,
      p_end_time: data.end_time || null,
      p_hourly_rate: 8.0,
      p_user_id: user.id,
      p_items: data.products || [],
    });

    if (error) {
      if (error.message.includes('no_overlapping_sessions')) {
        throw new Error($localize`:@@common.overlapError:Times are overlapping`);
      }

      if (error.message.includes('check_times')) {
        throw new Error($localize`:@@common.timeError:End time must be after start time`);
      }

      throw new Error($localize`:@@common.createError:Could not create session. Please try again.`);
    }

    return result;
  }
  async updateSession(sessionId: number, data: CreateSessionDTO) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error($localize`:@@common.notAuthenticated: User not Authenticated`);

    const { data: result, error } = await this.supabase.rpc('update_session_smart', {
      p_session_id: sessionId,
      p_station_id: data.station_id,
      p_start_time: data.start_time,
      p_end_time: data.end_time || null,
      p_hourly_rate: 8.0,
      p_user_id: user.id,
      p_items: data.products || [],
    });

    if (error) {
      console.error('Update Session Error:', error);
      if (error.message.includes('no_overlapping_sessions')) {
        throw new Error($localize`:@@common.overlapError:Times are overlapping`);
      }
      if (error.message.includes('check_times')) {
        throw new Error($localize`:@@common.timeError:End time must be after start time`);
      }
      throw new Error($localize`:@@common.updateError:Could not update session. Please try again.`);
    }

    return result;
  }
}
