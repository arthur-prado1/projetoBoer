import { get, onValue, push, ref, remove, update } from "firebase/database";
import { Product, ProductInput } from "../models/Product";
import { database } from "./connectionFirebase";

const PATH = "products";

function mapProduct(id: string, data: any): Product {
  return {
    id,
    name: data.name ?? "",
    price: Number(data.price ?? 0),
    imageUrl: data.imageUrl ?? "",
    category: data.category ?? "",
    costPrice: Number(data.costPrice ?? 0),
    description: data.description ?? "",
    marginPercent: Number(data.marginPercent ?? 0),
    createdAt: data.createdAt,
  };
}

export const productService = {
  async create(product: ProductInput) {
    const productRef = ref(database, PATH);
    await push(productRef, {
      ...product,
      createdAt: new Date().toISOString(),
    });
  },

  async getAll(): Promise<Product[]> {
    const snapshot = await get(ref(database, PATH));
    const data = snapshot.val();

    if (!data) return [];

    const products: Product[] = [];

    for (const id in data) {
      products.push(mapProduct(id, data[id]));
    }

    return products;
  },

  subscribe(callback: (products: Product[]) => void) {
    const productsRef = ref(database, PATH);

    return onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        callback([]);
        return;
      }

      const products: Product[] = [];
      for (const id in data) {
        products.push(mapProduct(id, data[id]));
      }

      callback(products);
    });
  },

  async update(id: string, product: ProductInput) {
    const productRef = ref(database, `${PATH}/${id}`);
    await update(productRef, product);
  },

  async delete(id: string) {
    const productRef = ref(database, `${PATH}/${id}`);
    await remove(productRef);
  },
};
