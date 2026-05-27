export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  costPrice?: number;
  description?: string;
  marginPercent?: number;
  createdAt?: string;
};

export type ProductInput = {
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  costPrice?: number;
  description?: string;
  marginPercent?: number;
};
