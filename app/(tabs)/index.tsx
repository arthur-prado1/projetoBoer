import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Product } from "../../src/models/Product";
import { productService } from "../../src/services/Product_Services";

type Filtro = "semanal" | "mensal";

function moedaBR(v: number) {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isMobile = width < 420;

  const [filtro, setFiltro] = useState<Filtro>("semanal");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsubscribe = productService.subscribe((items) => {
      setProducts(items);
    });

    return () => unsubscribe();
  }, []);

  const resumo = useMemo(() => {
    if (products.length === 0) {
      return {
        valorTotalVenda: 0,
        valorTotalCusto: 0,
        itensCadastrados: 0,
        precoMedio: 0,
        custoMedio: 0,
        margemMedia: 0,
        produtoMaiorMargem: "-",
        produtosRecentes: [] as Product[],
      };
    }

    let valorTotalVenda = 0;
    let valorTotalCusto = 0;
    let somaMargem = 0;
    let produtoMaiorMargem = "-";
    let maiorMargem = Number.NEGATIVE_INFINITY;

    for (const product of products) {
      const price = Number(product.price || 0);
      const costPrice = Number(product.costPrice || 0);
      const marginPercent = Number(product.marginPercent || 0);

      valorTotalVenda += price;
      valorTotalCusto += costPrice;
      somaMargem += marginPercent;

      if (marginPercent > maiorMargem) {
        maiorMargem = marginPercent;
        produtoMaiorMargem = product.name || "Sem nome";
      }
    }

    const produtosRecentes = products
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 5);

    return {
      valorTotalVenda,
      valorTotalCusto,
      itensCadastrados: products.length,
      precoMedio: products.length > 0 ? valorTotalVenda / products.length : 0,
      custoMedio: products.length > 0 ? valorTotalCusto / products.length : 0,
      margemMedia: products.length > 0 ? somaMargem / products.length : 0,
      produtoMaiorMargem,
      produtosRecentes,
    };
  }, [products, filtro]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <Text style={styles.title}>
            Dashboard de Produtos ({filtro === "semanal" ? "Semanal" : "Mensal"})
          </Text>
          <Text style={styles.subtitle}>
            Acesse perfil e produtos pelos atalhos abaixo.
          </Text>
        </View>

        <View style={styles.filtros}>
          <TouchableOpacity
            style={[styles.filtroButton, filtro === "semanal" && styles.filtroAtivo]}
            onPress={() => setFiltro("semanal")}
          >
            <Text style={styles.filtroText}>Semanal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filtroButton, filtro === "mensal" && styles.filtroAtivo]}
            onPress={() => setFiltro("mensal")}
          >
            <Text style={styles.filtroText}>Mensal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resumo}>
          <Text style={styles.label}>Valor Total de Venda</Text>
          <Text style={styles.valor}>R$ {moedaBR(resumo.valorTotalVenda)}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.label}>Produtos Cadastrados</Text>
            <Text style={styles.cardValue}>{resumo.itensCadastrados}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Custo Total</Text>
            <Text style={styles.cardValue}>R$ {moedaBR(resumo.valorTotalCusto)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Preco Medio de Venda</Text>
            <Text style={styles.cardValue}>R$ {moedaBR(resumo.precoMedio)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Margem Media</Text>
            <Text style={styles.cardValue}>{resumo.margemMedia.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.destaque}>
          <Text style={styles.label}>Produto com Maior Margem</Text>
          <Text style={styles.cardValue}>{resumo.produtoMaiorMargem}</Text>
        </View>

        <View style={styles.destaque}>
          <Text style={styles.label}>Ultimos produtos</Text>

          {resumo.produtosRecentes.length === 0 ? (
            <Text style={styles.cardValue}>-</Text>
          ) : (
            resumo.produtosRecentes.map((p, i) => (
              <Text key={`${p.id}-${i}`} style={styles.item}>
                {p.name || "Produto"} - R$ {moedaBR(Number(p.price || 0))}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 20,
  },
  headerMobile: {},
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 6,
  },
  filtros: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },
  filtroButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  filtroAtivo: {
    backgroundColor: "#2563eb",
  },
  filtroText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resumo: {
    backgroundColor: "#1e40af",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  valor: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#1e293b",
    width: "48%",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },
  cardValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  destaque: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 14,
    marginBottom: 20,
  },
  item: {
    color: "#e2e8f0",
    marginTop: 5,
  },
});
