export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryPoint {
  code: string;
  name: string;
  type: 'PVZ' | 'POSTAMAT';
  address: string;
  address_full: string;
  city_code: number;
  coordinates: Coordinates;
  work_time: string;
  work_time_list: Array<{
    day: number;
    time: string;
  }>;
  phones: Array<{
    number: string;
  }>;
  email?: string;
  note?: string;
  have_cashless: boolean;
  have_cash: boolean;
  allowed_cod: boolean;
  is_dressing_room: boolean;
  is_handout: boolean;
  weight_max?: number;
  weight_min?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

export interface DeliveryPointsResponse {
  points: DeliveryPoint[];
  total: number;
}

export interface DeliveryCost {
  delivery_sum: number;
  period_min: number;
  period_max: number;
  total_sum: number;
  currency: string;
  tariff_code: number;
  tariff_name?: string;
}

export interface CdekCity {
  code: number;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}
