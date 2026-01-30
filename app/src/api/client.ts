import type { BoundingBox, DeliveryCost, DeliveryPoint, DeliveryPointsResponse, CdekCity } from '../types/cdek';

// API base URL - uses relative path to work with Vite proxy
const API_BASE_URL = '/api';

// User information from backend
export interface UserInfo {
  id: number;
  role: string;
  mode: string;
  status: string;
  username?: string;
  phone?: string;
}

// Image DTO for product images
export interface ImageDTO {
  image_url: string;
  display_order: number;
}

// Good DTO from backend
export interface GoodDTO {
  id: number;
  name: string;
  category: string;
  price: number;
  non_discount_price?: number;
  description: string;
  images: ImageDTO[];
  status: string;
  sort_order: number;
  favorite: boolean;
}

/**
 * Fetch all goods with status NEW (public endpoint)
 */
export async function fetchGoods(): Promise<GoodDTO[]> {
  const response = await fetch(`${API_BASE_URL}/goods`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch goods: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch goods for current user with favorite flag (auth required)
 */
export async function fetchMyGoods(initData: string): Promise<GoodDTO[]> {
  const response = await fetch(`${API_BASE_URL}/goods/my`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch my goods: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Add product to favorites (auth required)
 */
export async function addFavorite(productId: number, initData: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add favorite: ${response.status} ${errorText}`);
  }
}

/**
 * Remove product from favorites (auth required)
 */
export async function removeFavorite(productId: number, initData: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to remove favorite: ${response.status} ${errorText}`);
  }
}

// Category DTO from backend
export interface CategoryDTO {
  id: number;
  title: string;
  status: string;
}

// Good card data for creating new products
export interface GoodCardData {
  name: string;
  category: string;
  price: number;
  non_discount_price?: number;
  description: string;
  sort_order?: number;
}

/**
 * Fetch current user information from backend
 */
export async function fetchUserInfo(initData: string): Promise<UserInfo> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user info: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch all categories with status NEW (public endpoint)
 */
export async function fetchCategories(): Promise<CategoryDTO[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch categories: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Create a new good card (ADMIN only)
 */
export async function createGoodCard(
  goodCardData: GoodCardData,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/card`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goodCardData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create good card: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Add images to existing good (ADMIN only)
 */
export async function addGoodImages(
  goodId: number,
  files: File[],
  initData: string
): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add images to good: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.imageUrls;
}

/**
 * Update existing good card (ADMIN only)
 */
export async function updateGoodCard(
  goodId: number,
  goodCardData: GoodCardData,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goodCardData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update good card: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Delete good (ADMIN only)
 */
export async function deleteGood(
  goodId: number,
  initData: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete good: ${response.status} ${errorText}`);
  }
}

/**
 * Block good - set status to BLOCKED (ADMIN only)
 */
export async function blockGood(
  goodId: number,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/block`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to block good: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Activate good - set status to NEW (ADMIN only)
 */
export async function activateGood(
  goodId: number,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/activate`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to activate good: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch all goods regardless of status (for admin)
 */
export async function fetchAllGoods(initData: string): Promise<GoodDTO[]> {
  const response = await fetch(`${API_BASE_URL}/goods/all`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch all goods: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Address suggestion from DaData
export interface AddressSuggestion {
  value: string;
  geo_lat: string | null;
  geo_lon: string | null;
}

// Shop address
export interface ShopAddress {
  id: number;
  address: string;
}

/**
 * Get address suggestions from DaData API (proxied through backend)
 */
export async function suggestAddress(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 3) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/dadata/suggest?query=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch address suggestions: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch all shop addresses (public endpoint)
 */
export async function fetchShopAddresses(): Promise<ShopAddress[]> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch shop addresses: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Create a new shop address (ADMIN only)
 */
export async function createShopAddress(
  address: string,
  initData: string
): Promise<ShopAddress> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create shop address: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Update existing shop address (ADMIN only)
 */
export async function updateShopAddress(
  addressId: number,
  address: string,
  initData: string
): Promise<ShopAddress> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update shop address: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Delete shop address (ADMIN only)
 */
// Promo Banner DTO
export interface PromoBannerDTO {
  id: number;
  status: string;
  display_order: number;
  image_url: string;
  link: number | null;
}

/**
 * Fetch active promo banners (public endpoint)
 */
export async function fetchPromoBanners(): Promise<PromoBannerDTO[]> {
  const response = await fetch(`${API_BASE_URL}/promo`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch promo banners: ${response.status} ${errorText}`);
  }
  return response.json();
}

/**
 * Fetch all promo banners including blocked (ADMIN only)
 */
export async function fetchAllPromoBanners(initData: string): Promise<PromoBannerDTO[]> {
  const response = await fetch(`${API_BASE_URL}/promo/all`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch all promo banners: ${response.status} ${errorText}`);
  }
  return response.json();
}

/**
 * Create a new promo banner by uploading image (ADMIN only)
 */
export async function createPromoBanner(file: File, initData: string): Promise<PromoBannerDTO> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(`${API_BASE_URL}/promo`, {
    method: 'POST',
    headers: { 'Authorization': `tma ${initData}` },
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create promo banner: ${response.status} ${errorText}`);
  }
  return response.json();
}

/**
 * Delete a promo banner (ADMIN only)
 */
export async function deletePromoBanner(bannerId: number, initData: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/promo/${bannerId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete promo banner: ${response.status} ${errorText}`);
  }
}

/**
 * Block a promo banner (ADMIN only)
 */
export async function blockPromoBanner(bannerId: number, initData: string): Promise<PromoBannerDTO> {
  const response = await fetch(`${API_BASE_URL}/promo/${bannerId}/block`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to block promo banner: ${response.status} ${errorText}`);
  }
  return response.json();
}

/**
 * Activate a promo banner (ADMIN only)
 */
export async function activatePromoBanner(bannerId: number, initData: string): Promise<PromoBannerDTO> {
  const response = await fetch(`${API_BASE_URL}/promo/${bannerId}/activate`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to activate promo banner: ${response.status} ${errorText}`);
  }
  return response.json();
}

/**
 * Update promo banner link (ADMIN only)
 */
export async function updatePromoBannerLink(
  bannerId: number,
  link: number | null,
  initData: string
): Promise<PromoBannerDTO> {
  const response = await fetch(`${API_BASE_URL}/promo/${bannerId}/link`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ link }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update promo banner link: ${response.status} ${errorText}`);
  }
  return response.json();
}

export async function deleteShopAddress(
  addressId: number,
  initData: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses/${addressId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete shop address: ${response.status} ${errorText}`);
  }
}

/**
 * Fetch CDEK delivery points for a viewport bbox.
 */
export async function fetchCdekDeliveryPoints(
  bbox: BoundingBox,
  zoom: number,
  options?: {
    type?: 'PVZ' | 'POSTAMAT';
    allowed_cod?: boolean;
  },
  signal?: AbortSignal
): Promise<DeliveryPointsResponse> {
  const url = new URL(`${API_BASE_URL}/cdek/delivery-points`, window.location.origin);
  url.searchParams.set('south', String(bbox.south));
  url.searchParams.set('west', String(bbox.west));
  url.searchParams.set('north', String(bbox.north));
  url.searchParams.set('east', String(bbox.east));
  url.searchParams.set('zoom', String(zoom));

  if (options?.type) {
    url.searchParams.set('type', options.type);
  }
  if (options?.allowed_cod !== undefined) {
    url.searchParams.set('allowed_cod', String(options.allowed_cod));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch CDEK points: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch details for a single CDEK delivery point.
 */
export async function fetchCdekDeliveryPointDetail(code: string): Promise<DeliveryPoint> {
  const response = await fetch(`${API_BASE_URL}/cdek/delivery-points/${code}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch CDEK point detail: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Calculate delivery cost for a selected CDEK point.
 */
export async function calculateCdekDelivery(params: {
  delivery_point_code: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  declared_value?: number;
}): Promise<DeliveryCost> {
  const response = await fetch(`${API_BASE_URL}/cdek/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to calculate CDEK delivery: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Search CDEK cities for autocomplete.
 */
export async function searchCdekCities(query: string): Promise<CdekCity[]> {
  const url = new URL(`${API_BASE_URL}/cdek/cities`, window.location.origin);
  url.searchParams.set('query', query);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to search CDEK cities: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.cities ?? [];
}
