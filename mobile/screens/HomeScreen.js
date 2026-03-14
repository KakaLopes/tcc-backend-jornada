import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "../services/api";

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [hoursToday, setHoursToday] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadUser();
    loadHoursToday();
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

  async function loadHoursToday() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.log("TOKEN NÃO ENCONTRADO");
        return;
      }

      const response = await api.get("/my-hours-today", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHoursToday(response.data.total_hours || 0);
    } catch (error) {
      console.log("ERRO HOURS TODAY:", error?.response?.data || error.message);
    }
  }

  async function handleClockIn() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      await api.post(
        "/clock-in",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Sucesso", "Entrada registrada");
      loadHoursToday();
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

      await api.post(
        "/clock-out",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Sucesso", "Saída registrada");
      loadHoursToday();
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

      <Text style={styles.hours}>Horas hoje: {hoursToday}h</Text>

      <View style={styles.button}>
        <Button title="Registrar entrada" onPress={handleClockIn} />
      </View>

      <View style={styles.button}>
        <Button title="Registrar saída" onPress={handleClockOut} />
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
  hours: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    marginBottom: 15,
  },
});