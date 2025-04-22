export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  sku: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  brand?: string;
  featured?: boolean;
  tags?: string[];
} 