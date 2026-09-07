export interface Campaign {
  id: string;
  organizer_id: string;
  name: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  access_code: string;
  access_password: string;
  is_active: boolean;
  created_at: string;
}

export interface Area {
  id: string;
  campaign_id: string;
  name: string;
  color: string;
  estimated_minutes_per_patient: number;
  is_enabled: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  campaign_id: string;
  area_id: string;
  name: string;
  created_at: string;
}
