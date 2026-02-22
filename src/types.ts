export interface Game {
  id: number;
  title: string;
  description: string;
  genre: string;
  category: string;
  platform: string;
  publisher: string;
  price: number;
  discount_price: number | null;
  image_url: string;
  rating: number;
  steam_id: string | null;
  system_requirements: string;
  is_best_seller: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  status: string;
  created_at: string;
  items: string;
}

export interface Review {
  id: number;
  user_id: number;
  username: string;
  game_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem extends Game {
  quantity: number;
}
