import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "../services/api";

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [hoursToday, setHoursToday] = useState(0);
  const [entriesCount, setEntriesCount] = useState(0);
  const [openEntry, setOpenEntry] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
    loadDashboardData();
  }, []);

  async function loadUser() {
    try {
      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.log("ERRO LOAD USER:", error);
    }
  }

  async function loadDashboardData() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const [hoursResponse, entriesResponse] = await Promise.all([
        api.get("/my-hours-today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        api.get("/my-entries", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setHoursToday(hoursResponse.data.total_hours || 0);

      const entries = entriesResponse.data || [];
      setEntriesCount(entries.length);

      const hasOpenEntry = entries.some((item) => !item.clock_out);
      setOpenEntry(hasOpenEntry);
    } catch (error) {
      console.log(
        "ERRO DASHBOARD:",
        error?.response?.data || error.message
      );
    }
  }

  async function handleClockIn() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      const response = await api.post(
        "/clock-in",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Sucesso", response.data.message || "Entrada registrada");
      loadDashboardData();
    } catch (error) {
      console.log("ERRO CLOCK-IN:", error?.response?.data || error.message);

      Alert.alert(
        "Erro",
        error?.response?.data?.error || "Não foi possível registrar entrada"
      );
    }
  }

  async function handleClockOut() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      const response = await api.post(
        "/clock-out",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Sucesso", response.data.message || "Saída registrada");
      loadDashboardData();
    } catch (error) {
      console.log("ERRO CLOCK-OUT:", error?.response?.data || error.message);

      Alert.alert(
        "Erro",
        error?.response?.data?.error || "Não foi possível registrar saída"
      );
    }
  }

  async function handleLogout() {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <Text style={styles.text}>
        Bem-vinda, {user?.full_name || "Usuária"} 👋
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Resumo</Text>
        <Text style={styles.infoText}>Horas hoje: {hoursToday}h</Text>
        <Text style={styles.infoText}>Total de registros: {entriesCount}</Text>
        <Text style={openEntry ? styles.statusOpen : styles.statusClosed}>
          {openEntry ? "Jornada em andamento" : "Nenhuma jornada aberta"}
        </Text>
      </View>

      <View style={styles.button}>
        <Button title="Registrar entrada" onPress={handleClockIn} />
      </View>

      <View style={styles.button}>
        <Button title="Registrar saída" onPress={handleClockOut} />
      </View>

      <View style={styles.button}>
        <Button
          title="Ver histórico"
          onPress={() => router.push("/history")}
        />
      </View>
<View style={styles.button}>
  <Button
    title="Painel Admin"
    onPress={() => router.push("/admin-adjustments")}
  />
</View>
      <View style={styles.button}>
        <Button title="Sair" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 16,
    marginBottom: 25,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 6,
  },
  statusOpen: {
    marginTop: 8,
    color: "#d97706",
    fontWeight: "bold",
  },
  statusClosed: {
    marginTop: 8,
    color: "#15803d",
    fontWeight: "bold",
  },
  button: {
    marginBottom: 15,
  },
});