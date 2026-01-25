// API base URL - uses relative path to work with Vite proxy
const API_BASE_URL = '/api';

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
