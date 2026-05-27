import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ConfirmPopup from "../../src/components/ConfirmPopup";
import { useCart } from "../../src/context/CartContext";
import { useNotification } from "../../src/context/NotificationContext";

function moedaBR(v: number) {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CarrinhoScreen() {
  const router = useRouter();
  const { notify } = useNotification();
  const { items, totals, increment, decrement, removeItem, clearCart, applyCoupon, checkoutSelected } =
    useCart();
  const [couponInput, setCouponInput] = useState("");
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const previousUnavailableMapRef = useRef<Record<string, boolean>>({});

  function handleApplyCoupon() {
    const result = applyCoupon(couponInput);
    notify(result.message, result.ok ? "success" : "warning");
  }

  function handleClearCart() {
    setClearModalVisible(true);
  }

  useEffect(() => {
    const validIds = new Set(items.map((item) => item.product.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [items]);

  useEffect(() => {
    const previous = previousUnavailableMapRef.current;
    const now: Record<string, boolean> = {};
    const newlyUnavailable = items.filter((item) => {
      now[item.product.id] = item.isUnavailable;
      return item.isUnavailable && previous[item.product.id] === false;
    });

    previousUnavailableMapRef.current = now;

    if (newlyUnavailable.length === 0) return;

    const firstName = newlyUnavailable[0].product.name || "Produto";
    const body =
      newlyUnavailable.length === 1
        ? `${firstName} ficou esgotado no carrinho.`
        : `${newlyUnavailable.length} itens ficaram esgotados no carrinho.`;

    notify(body, "warning");
    void Notifications.scheduleNotificationAsync({
      content: {
        title: "Produto esgotado",
        body,
        sound: true,
      },
      trigger: null,
    }).catch(() => {
      // fallback silencioso
    });
  }, [items, notify]);

  function toggleSelect(productId: string) {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.product.id)),
    [items, selectedIds]
  );

  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (acc, item) => acc + Number(item.product.price || 0) * Number(item.quantity || 0),
        0
      ),
    [selectedItems]
  );

  const selectedShipping = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    if (totals.appliedCoupon === "FRETEGRATIS") return 0;
    if (selectedSubtotal >= 200) return 0;
    return 15;
  }, [selectedItems.length, selectedSubtotal, totals.appliedCoupon]);

  const selectedDiscount = useMemo(() => {
    if (totals.appliedCoupon === "BOER10") return selectedSubtotal * 0.1;
    return 0;
  }, [selectedSubtotal, totals.appliedCoupon]);

  const selectedTotal = useMemo(
    () => Math.max(0, selectedSubtotal + selectedShipping - selectedDiscount),
    [selectedSubtotal, selectedShipping, selectedDiscount]
  );

  async function handleBuySelected() {
    if (selectedItems.length === 0) {
      notify("Selecione ao menos um item para comprar.", "warning");
      return;
    }

    const unavailableCount = selectedItems.filter((item) => item.isUnavailable).length;
    if (unavailableCount > 0) {
      notify("Existem itens esgotados selecionados. Remova-os para continuar.", "warning");
      return;
    }

    const result = await checkoutSelected(selectedItems.map((item) => item.product.id));
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    setSelectedIds([]);
    notify("Compra realizada e salva no Firebase. Pronta para futura notificacao push.", "success");

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Compra confirmada",
          body: "Sua compra foi realizada com sucesso!",
          sound: true,
        },
        trigger: null,
      });
    } catch {
      // fallback silencioso: toast ja informa sucesso
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrinho de Compras</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        extraData={`${selectedIds.join(",")}-${selectedSubtotal}-${selectedTotal}`}
        ListEmptyComponent={<Text style={styles.emptyText}>Seu carrinho esta vazio.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.selectRow} onPress={() => toggleSelect(item.product.id)}>
              <Ionicons
                name={selectedIds.includes(item.product.id) ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={selectedIds.includes(item.product.id) ? "#38bdf8" : "#94a3b8"}
              />
              <Text style={styles.selectText}>Selecionar</Text>
            </TouchableOpacity>
            <Text style={styles.name}>{item.product.name}</Text>
            {item.isUnavailable && <Text style={styles.unavailable}>Esgotado</Text>}
            <Text style={styles.info}>R$ {moedaBR(Number(item.product.price || 0))}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyButton} onPress={() => decrement(item.product.id)}>
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyButton, item.isUnavailable && styles.qtyButtonDisabled]}
                onPress={() => increment(item.product.id)}
                disabled={item.isUnavailable}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => removeItem(item.product.id)}>
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.partial}>Subtotal item: R$ {moedaBR(Number(item.product.price || 0) * item.quantity)}</Text>
          </View>
        )}
      />

      <View style={styles.couponBox}>
        <TextInput
          style={styles.input}
          value={couponInput}
          onChangeText={setCouponInput}
          placeholder="Cupom"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.couponButton} onPress={handleApplyCoupon}>
          <Text style={styles.couponButtonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLine}>Subtotal: R$ {moedaBR(selectedSubtotal)}</Text>
        <Text style={styles.totalLine}>Frete: R$ {moedaBR(selectedShipping)}</Text>
        <Text style={styles.totalLine}>Desconto: -R$ {moedaBR(selectedDiscount)}</Text>
        <Text style={styles.totalStrong}>Total: R$ {moedaBR(selectedTotal)}</Text>
        <Text style={styles.totalLine}>Selecionados: {selectedItems.length}</Text>
        {!!totals.appliedCoupon && <Text style={styles.couponApplied}>Cupom ativo: {totals.appliedCoupon}</Text>}
      </View>

      <TouchableOpacity style={styles.buySelectedButton} onPress={handleBuySelected}>
        <Text style={styles.buySelectedButtonText}>Comprar Selecionados</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
        <Text style={styles.clearButtonText}>Limpar Tudo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreProductsButton} onPress={() => router.push("/(tabs)/listar-produtos")}>
        <Text style={styles.moreProductsButtonText}>Comprar Mais Produtos</Text>
      </TouchableOpacity>

      <ConfirmPopup
        visible={clearModalVisible}
        title="Limpar carrinho"
        message="Deseja remover todos os itens?"
        confirmText="Limpar"
        cancelText="Cancelar"
        onCancel={() => setClearModalVisible(false)}
        onConfirm={() => {
          clearCart();
          setClearModalVisible(false);
          notify("Carrinho limpo com sucesso.", "success");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 30,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  selectText: {
    color: "#cbd5e1",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  name: { color: "#fff", fontWeight: "700", fontSize: 16 },
  info: { color: "#cbd5e1", marginTop: 4 },
  unavailable: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: "#dc2626",
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyValue: { color: "#fff", marginHorizontal: 10, fontSize: 14 },
  deleteButton: {
    marginLeft: "auto",
    backgroundColor: "#ef4444",
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  partial: { color: "#94a3b8", marginTop: 6, fontSize: 12 },
  couponBox: { marginTop: 6, flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginBottom: 0,
  },
  couponButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  couponButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  totalBox: {
    marginTop: 8,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
  },
  totalLine: { color: "#cbd5e1", marginBottom: 2, fontSize: 12 },
  totalStrong: { color: "#fff", fontSize: 16, fontWeight: "bold", marginTop: 2 },
  couponApplied: { color: "#38bdf8", marginTop: 4, fontWeight: "600", fontSize: 12 },
  clearButton: {
    marginTop: 8,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  clearButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  buySelectedButton: {
    marginTop: 8,
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  buySelectedButtonText: {
    color: "#062e22",
    fontWeight: "bold",
    fontSize: 12,
  },
  moreProductsButton: {
    marginTop: 8,
    backgroundColor: "#38bdf8",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  moreProductsButtonText: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 12,
  },
});
