import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PRODUCT_CATEGORIES } from "../../src/constants/productCategories";
import { useNotification } from "../../src/context/NotificationContext";
import { productService } from "../../src/services/Product_Services";

function moedaBR(value: number) {
  return value.toLocaleString("pt-BR", {
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

export default function CadastroProduto() {
  const { notify } = useNotification();
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const indicadores = useMemo(() => {
    const parsedCost = parseCurrency(costPrice);
    const parsedSale = parseCurrency(salePrice);

    const margem =
      Number.isFinite(parsedCost) && parsedCost > 0 && Number.isFinite(parsedSale)
        ? ((parsedSale - parsedCost) / parsedCost) * 100
        : 0;

    const lucroUnitario =
      Number.isFinite(parsedSale) && Number.isFinite(parsedCost) ? parsedSale - parsedCost : 0;

    return { margem, lucroUnitario };
  }, [costPrice, salePrice]);

  async function handleRegisterProduct() {
    if (!productName || !category || !salePrice || !costPrice) {
      notify("Preencha os campos obrigatorios.", "warning");
      return;
    }

    const parsedSalePrice = parseCurrency(salePrice);
    const parsedCostPrice = parseCurrency(costPrice);

    if (!Number.isFinite(parsedSalePrice) || parsedSalePrice <= 0) {
      notify("Informe um preco de venda valido.", "warning");
      return;
    }

    if (!Number.isFinite(parsedCostPrice) || parsedCostPrice <= 0) {
      notify("Informe um preco de custo valido.", "warning");
      return;
    }

    try {
      const margemPercent =
        parsedCostPrice > 0
          ? Number((((parsedSalePrice - parsedCostPrice) / parsedCostPrice) * 100).toFixed(2))
          : 0;

      await productService.create({
        name: productName.trim(),
        category: category.trim(),
        costPrice: parsedCostPrice,
        price: parsedSalePrice,
        marginPercent: margemPercent,
        description: description.trim(),
        imageUrl: imageUrl.trim(),
      });

      setProductName("");
      setCategory("");
      setCostPrice("");
      setSalePrice("");
      setDescription("");
      setImageUrl("");

      notify("Produto cadastrado com sucesso!", "success");
    } catch (error) {
      console.log("Erro ao cadastrar produto:", error);
      notify("Nao foi possivel cadastrar o produto.", "error");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastrar Produto</Text>

      <Text style={styles.label}>Nome do produto *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Bolo de chocolate"
        placeholderTextColor="#94a3b8"
        value={productName}
        onChangeText={setProductName}
      />

      <Text style={styles.label}>Categoria *</Text>
      <View style={styles.categoryRow}>
        {PRODUCT_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.categoryChip, category === item && styles.categoryChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Preco de custo *</Text>
          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            placeholderTextColor="#94a3b8"
            value={costPrice}
            onChangeText={(value) => setCostPrice(formatCurrency(value))}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Preco de venda *</Text>
          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            placeholderTextColor="#94a3b8"
            value={salePrice}
            onChangeText={(value) => setSalePrice(formatCurrency(value))}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>URL da imagem</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor="#94a3b8"
        value={imageUrl}
        onChangeText={setImageUrl}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Descricao curta</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Ex: Produto feito sob encomenda"
        placeholderTextColor="#94a3b8"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Margem estimada: {indicadores.margem.toFixed(1)}%</Text>
        <Text style={styles.infoText}>Lucro unitario estimado: R$ {moedaBR(indicadores.lucroUnitario)}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegisterProduct}>
        <Text style={styles.buttonText}>Cadastrar Produto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 10,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
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
  infoBox: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    marginTop: 4,
  },
  infoText: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#38bdf8",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 16,
  },
});
