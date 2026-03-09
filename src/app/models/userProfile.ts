export interface UserProfile {
  id: string | null;
  username: string;
  avatar_url: string | null;
  email?: string;
  hourly_rate: number;
  fitpass_rate: number;
  controller_rate: number;
}
