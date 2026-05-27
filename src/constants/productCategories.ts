export const PRODUCT_CATEGORIES = ["Doces", "Bebidas", "Padaria"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
