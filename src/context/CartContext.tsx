import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set } from "firebase/database";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Product } from "../models/Product";
import { auth, database } from "../services/connectionFirebase";
import { productService } from "../services/Product_Services";

type CouponCode = "BOER10" | "FRETEGRATIS";

export type CartItem = {
  product: Product;
  quantity: number;
  isUnavailable: boolean;
};

type Totals = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon: string | null;
};

type CartContextData = {
  items: CartItem[];
  itemCount: number;
  totals: Totals;
  addToCart: (product: Product) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (couponText: string) => { ok: boolean; message: string };
  checkoutSelected: (productIds: string[]) => Promise<{ ok: boolean; message: string }>;
};

const CartContext = createContext<CartContextData | undefined>(undefined);

const BASE_SHIPPING = 15;
const FREE_SHIPPING_MIN = 200;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<CouponCode | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [remoteSyncBlocked, setRemoteSyncBlocked] = useState(false);
  const isApplyingRemoteRef = useRef(false);
  const lastSyncedPayloadRef = useRef("");
  const availableProductsMapRef = useRef<Map<string, Product>>(new Map());
  const hasLoadedProductsRef = useRef(false);

  function reconcileItemsWithProducts(list: CartItem[]) {
    if (!hasLoadedProductsRef.current) {
      return list;
    }
    const productMap = availableProductsMapRef.current;
    return list.map((item) => {
      const updated = productMap.get(item.product.id);
      if (!updated) {
        return { ...item, isUnavailable: true };
      }
      return { ...item, product: updated, isUnavailable: false };
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      if (!user) {
        setItems([]);
        setCouponCode(null);
        setHydrated(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const cartRef = ref(database, `carts/${userId}`);
    const unsubscribe = onValue(
      cartRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setItems([]);
          setCouponCode(null);
          setHydrated(true);
          return;
        }

        const cartItemsRaw = Array.isArray(data.items) ? data.items : [];
        const loadedItems: CartItem[] = cartItemsRaw
          .map((item: any) => ({
            product: item.product as Product,
            quantity: Number(item.quantity || 0),
            isUnavailable: !!item.isUnavailable,
          }))
          .filter((item: CartItem) => item.product?.id && item.quantity > 0);

        const loadedCoupon = data.couponCode as CouponCode | null;
        const reconciledItems = reconcileItemsWithProducts(loadedItems);
        const remotePayload = JSON.stringify({
          items: reconciledItems,
          couponCode: loadedCoupon ?? null,
        });
        if (remotePayload === lastSyncedPayloadRef.current) {
          setHydrated(true);
          setRemoteSyncBlocked(false);
          return;
        }
        isApplyingRemoteRef.current = true;
        setItems(reconciledItems);
        setCouponCode(loadedCoupon ?? null);
        lastSyncedPayloadRef.current = remotePayload;
        setHydrated(true);
        setRemoteSyncBlocked(false);
      },
      (error) => {
        if (error?.code === "PERMISSION_DENIED") {
          setRemoteSyncBlocked(true);
        }
        setHydrated(true);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const unsubscribe = productService.subscribe((products) => {
      const map = new Map(products.map((product) => [product.id, product]));
      availableProductsMapRef.current = map;
      hasLoadedProductsRef.current = true;

      setItems((prev) => reconcileItemsWithProducts(prev));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !hydrated || remoteSyncBlocked) return;
    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false;
      return;
    }

    const localPayload = JSON.stringify({
      items,
      couponCode,
    });
    if (localPayload === lastSyncedPayloadRef.current) return;

    const cartRef = ref(database, `carts/${userId}`);
    void set(cartRef, {
      items,
      couponCode,
      updatedAt: new Date().toISOString(),
    }).catch((error) => {
      if (error?.code === "PERMISSION_DENIED") {
        setRemoteSyncBlocked(true);
      }
    });
    lastSyncedPayloadRef.current = localPayload;
  }, [userId, items, couponCode, hydrated, remoteSyncBlocked]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.product.price || 0) * item.quantity, 0),
    [items]
  );

  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    if (couponCode === "FRETEGRATIS") return 0;
    if (subtotal >= FREE_SHIPPING_MIN) return 0;
    return BASE_SHIPPING;
  }, [items.length, subtotal, couponCode]);

  const discount = useMemo(() => {
    if (couponCode === "BOER10") return subtotal * 0.1;
    return 0;
  }, [couponCode, subtotal]);

  const total = Math.max(0, subtotal + shipping - discount);

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  function addToCart(product: Product) {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id);
      if (index >= 0) {
        const copy = [...prev];
        if (copy[index].isUnavailable) return prev;
        copy[index] = { ...copy[index], quantity: copy[index].quantity + 1 };
        return copy;
      }
      return [...prev, { product, quantity: 1, isUnavailable: false }];
    });
  }

  function increment(productId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && !item.isUnavailable
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decrement(productId: string) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setItems([]);
    setCouponCode(null);
  }

  function applyCoupon(couponText: string) {
    const normalized = couponText.trim().toUpperCase();
    if (!normalized) {
      setCouponCode(null);
      return { ok: true, message: "Cupom removido." };
    }
    if (normalized === "BOER10" || normalized === "FRETEGRATIS") {
      setCouponCode(normalized);
      return { ok: true, message: "Cupom aplicado com sucesso." };
    }
    return { ok: false, message: "Cupom invalido. Use BOER10 ou FRETEGRATIS." };
  }

  async function checkoutSelected(productIds: string[]) {
    if (!userId) {
      return { ok: false, message: "Usuario nao autenticado." };
    }

    const selectedSet = new Set(productIds);
    const selectedItems = items.filter((item) => selectedSet.has(item.product.id));

    if (selectedItems.length === 0) {
      return { ok: false, message: "Nenhum item selecionado para compra." };
    }

    if (selectedItems.some((item) => item.isUnavailable)) {
      return { ok: false, message: "Existem itens esgotados na selecao." };
    }

    const subtotal = selectedItems.reduce(
      (acc, item) => acc + Number(item.product.price || 0) * item.quantity,
      0
    );
    const shipping =
      couponCode === "FRETEGRATIS" ? 0 : subtotal >= FREE_SHIPPING_MIN ? 0 : BASE_SHIPPING;
    const discount = couponCode === "BOER10" ? subtotal * 0.1 : 0;
    const total = Math.max(0, subtotal + shipping - discount);

    try {
      const buyerName =
        auth.currentUser?.displayName ||
        auth.currentUser?.email ||
        auth.currentUser?.uid ||
        "Usuario";

      const salesRef = ref(database, `vendasNotificadas/${userId}`);
      await push(salesRef, {
        buyerName,
        buyerId: userId,
        items: selectedItems,
        summary: { subtotal, shipping, discount, total, couponCode: couponCode ?? null },
        status: "created",
        createdAt: new Date().toISOString(),
        notificationStatus: "pending",
      });
    } catch (error: any) {
      if (error?.code === "PERMISSION_DENIED") {
        return {
          ok: false,
          message:
            "Sem permissao no Firebase para salvar compras. Ajuste as regras de carts/vendasNotificadas.",
        };
      }
      return { ok: false, message: "Nao foi possivel registrar a compra." };
    }

    setItems((prev) => prev.filter((item) => !selectedSet.has(item.product.id)));

    return { ok: true, message: "Compra registrada com sucesso." };
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totals: {
          subtotal,
          shipping,
          discount,
          total,
          appliedCoupon: couponCode,
        },
        addToCart,
        increment,
        decrement,
        removeItem,
        clearCart,
        applyCoupon,
        checkoutSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider.");
  }
  return context;
}
