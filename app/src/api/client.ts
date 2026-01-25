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
