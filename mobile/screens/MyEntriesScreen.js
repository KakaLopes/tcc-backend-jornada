import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export default function MyEntriesScreen() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await api.get("/my-entries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEntries(response.data);
    } catch (error) {
      console.log("ERRO HISTORICO:", error?.response?.data || error.message);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.date}>📅 {formatDate(item.clock_in)}</Text>
        <Text>Entrada: {formatTime(item.clock_in)}</Text>
        <Text>Saída: {item.clock_out ? formatTime(item.clock_out) : "—"}</Text>
        <Text>
          Total: {item.duration_minutes ? item.duration_minutes + " min" : "—"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Jornadas</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
  },
  date: {
    fontWeight: "bold",
    marginBottom: 5,
  },
});
