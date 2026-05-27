import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useCart } from "../../src/context/CartContext";

export default function TabsLayout() {
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
        },
        tabBarActiveTintColor: "#38bdf8",
        tabBarInactiveTintColor: "#94a3b8",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cadastro-produto"
        options={{
          title: "Cadastrar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="listar-produtos"
        options={{
          title: "Produtos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="carrinho"
        options={{
          title: "Carrinho",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile-user"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cadastro-venda"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="listar-vendas"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
