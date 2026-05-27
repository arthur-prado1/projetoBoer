import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmPopup from "../../src/components/ConfirmPopup";
import { Product } from "../../src/models/Product";
import { PRODUCT_CATEGORIES } from "../../src/constants/productCategories";
import { useCart } from "../../src/context/CartContext";
import { useNotification } from "../../src/context/NotificationContext";
import { productService } from "../../src/services/Product_Services";

const FIXED_FILTER_CATEGORIES = ["Todas", "Doces", "Bebidas", "Padaria"] as const;

function moedaBR(v: number) {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  const amount = Number(digits || "0") / 100;
  return `R$ ${moedaBR(amount)}`;
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  return Number(digits || "0") / 100;
}

const DEFAULT_PRODUCT_IMAGE_URL =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80";

export default function ListarProdutos() {
  const { addToCart } = useCart();
  const { notify } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [appliedFilterCategory, setAppliedFilterCategory] = useState("Todas");
  const [appliedFilterMinPrice, setAppliedFilterMinPrice] = useState("");
  const [appliedFilterMaxPrice, setAppliedFilterMaxPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const unsubscribe = productService.subscribe((items) => {
      const sorted = items
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setProducts(sorted);
    });

    return () => unsubscribe();
  }, []);

  async function handleDeleteProduct(productId: string) {
    try {
      await productService.delete(productId);
      notify("Produto apagado com sucesso!", "success");
    } catch (error) {
      console.log("Erro ao apagar produto:", error);
      notify("Nao foi possivel apagar o produto.", "error");
    }
  }

  function confirmDelete(productId: string, productName: string) {
    setPendingDelete({ id: productId, name: productName });
    setDeleteModalVisible(true);
  }

  function startEdit(item: Product) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || "");
    setEditCostPrice(formatCurrency(String(Math.round((item.costPrice ?? 0) * 100))));
    setEditPrice(formatCurrency(String(Math.round(item.price * 100))));
    setEditDescription(item.description || "");
    setEditImageUrl(item.imageUrl || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCategory("");
    setEditCostPrice("");
    setEditPrice("");
    setEditDescription("");
    setEditImageUrl("");
  }

  async function saveEdit() {
    if (!editingId || !editName || !editCategory || !editCostPrice || !editPrice) {
      notify("Preencha todos os campos de edicao.", "warning");
      return;
    }

    const parsedCostPrice = parseCurrency(editCostPrice);
    const parsedPrice = parseCurrency(editPrice);

    if (!Number.isFinite(parsedCostPrice) || parsedCostPrice <= 0) {
      notify("Preco de custo invalido.", "warning");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      notify("Preco invalido.", "warning");
      return;
    }

    try {
      const marginPercent =
        parsedCostPrice > 0
          ? Number((((parsedPrice - parsedCostPrice) / parsedCostPrice) * 100).toFixed(2))
          : 0;

      await productService.update(editingId, {
        name: editName.trim(),
        category: editCategory.trim(),
        costPrice: parsedCostPrice,
        price: parsedPrice,
        marginPercent,
        description: editDescription.trim(),
        imageUrl: editImageUrl.trim(),
      });

      cancelEdit();

      notify("Produto atualizado com sucesso!", "success");
    } catch (error) {
      console.log("Erro ao atualizar produto:", error);
      notify("Nao foi possivel atualizar o produto.", "error");
    }
  }

  function applyFilters() {
    setAppliedSearchText(searchText);
    setAppliedFilterCategory(filterCategory);
    setAppliedFilterMinPrice(filterMinPrice);
    setAppliedFilterMaxPrice(filterMaxPrice);
  }

  const filteredProducts = products.filter((item) => {
    const nameOk = item.name.toLowerCase().includes(appliedSearchText.trim().toLowerCase());
    const categoryOk =
      appliedFilterCategory === "Todas" || (item.category || "") === appliedFilterCategory;
    const min = parseCurrency(appliedFilterMinPrice || "0");
    const max = appliedFilterMaxPrice
      ? parseCurrency(appliedFilterMaxPrice)
      : Number.POSITIVE_INFINITY;
    const priceOk = item.price >= min && item.price <= max;
    return nameOk && categoryOk && priceOk;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Produtos Cadastrados</Text>

      <TextInput
        style={styles.input}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Pesquisar por nome"
        placeholderTextColor="#94a3b8"
      />
      <View style={styles.filterCategoryRow}>
        {FIXED_FILTER_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.categoryChip, filterCategory === item && styles.categoryChipActive]}
            onPress={() => setFilterCategory(item)}
          >
            <Text
              style={[styles.categoryChipText, filterCategory === item && styles.categoryChipTextActive]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filterRow}>
        <TextInput
          style={[styles.input, styles.filterInput]}
          value={filterMinPrice}
          onChangeText={(value) => setFilterMinPrice(formatCurrency(value))}
          placeholder="Preco min."
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.filterInput]}
          value={filterMaxPrice}
          onChangeText={(value) => setFilterMaxPrice(formatCurrency(value))}
          placeholder="Preco max."
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={applyFilters}>
        <Text style={styles.searchButtonText}>Aplicar Filtros</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        extraData={`${editingId}-${appliedFilterCategory}-${appliedSearchText}-${appliedFilterMinPrice}-${appliedFilterMaxPrice}`}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
        }
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;

          return (
            <View style={styles.card} key={`${item.id}-${isEditing ? "edit" : "view"}`}>
              {isEditing ? (
                <>
                  <Text style={styles.label}>Nome do produto</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Ex: Bolo de chocolate"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Categoria</Text>
                  <View style={styles.filterCategoryRow}>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[styles.categoryChip, editCategory === category && styles.categoryChipActive]}
                        onPress={() => setEditCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            editCategory === category && styles.categoryChipTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Preco de custo</Text>
                  <TextInput
                    style={styles.input}
                    value={editCostPrice}
                    onChangeText={(value) => setEditCostPrice(formatCurrency(value))}
                    keyboardType="numeric"
                    placeholder="R$ 0,00"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Preco de venda</Text>
                  <TextInput
                    style={styles.input}
                    value={editPrice}
                    onChangeText={(value) => setEditPrice(formatCurrency(value))}
                    keyboardType="numeric"
                    placeholder="R$ 0,00"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Descricao curta</Text>
                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Ex: Produto feito sob encomenda"
                    placeholderTextColor="#94a3b8"
                    multiline
                  />

                  <Text style={styles.label}>URL da imagem</Text>
                  <TextInput
                    style={styles.input}
                    value={editImageUrl}
                    onChangeText={setEditImageUrl}
                    placeholder="https://..."
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity style={styles.editButton} onPress={saveEdit}>
                    <Text style={styles.editButtonText}>Salvar Edicao</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.productImageFrame}>
                    <Image
                      source={{ uri: item.imageUrl || DEFAULT_PRODUCT_IMAGE_URL }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.category && <Text style={styles.info}>Categoria: {item.category}</Text>}
                  <Text style={styles.info}>Preco de venda: R$ {moedaBR(item.price)}</Text>
                  {!!item.costPrice && (
                    <Text style={styles.info}>Preco de custo: R$ {moedaBR(item.costPrice)}</Text>
                  )}
                  {!!item.marginPercent && (
                    <Text style={styles.info}>Margem: {item.marginPercent.toFixed(1)}%</Text>
                  )}
                  {!!item.description && <Text style={styles.info}>Descricao: {item.description}</Text>}

                  <TouchableOpacity style={styles.editButton} onPress={() => startEdit(item)}>
                    <Text style={styles.editButtonText}>Editar Produto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cartButton} onPress={() => addToCart(item)}>
                    <Text style={styles.cartButtonText}>Adicionar ao Carrinho</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item.id, item.name)}
                  >
                    <Text style={styles.deleteButtonText}>Apagar Produto</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        }}
      />

      <ConfirmPopup
        visible={deleteModalVisible}
        title="Confirmar exclusao"
        message={`Deseja apagar o produto "${pendingDelete?.name || ""}"?`}
        confirmText="Apagar"
        cancelText="Cancelar"
        onCancel={() => {
          setDeleteModalVisible(false);
          setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) {
            handleDeleteProduct(pendingDelete.id);
          }
          setDeleteModalVisible(false);
          setPendingDelete(null);
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
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterCategoryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  filterInput: {
    flex: 1,
  },
  categoryChip: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryChipActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  categoryChipText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: "#0f172a",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productImageFrame: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 4,
  },
  emptyText: {
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#0f172a",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 8,
    backgroundColor: "#475569",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cartButton: {
    marginTop: 8,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  cartButtonText: {
    color: "#062e22",
    fontWeight: "bold",
    fontSize: 14,
  },
  searchButton: {
    marginBottom: 12,
    backgroundColor: "#38bdf8",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 14,
  },
});
