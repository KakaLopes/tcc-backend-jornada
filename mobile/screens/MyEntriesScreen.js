import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export default function MyEntriesScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      const response = await api.get("/my-entries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEntries(response.data);
    } catch (error) {
      console.log("ERRO HISTORICO:", error?.response?.data || error.message);

      Alert.alert(
        "Erro",
        error?.response?.data?.error || "Não foi possível carregar o histórico"
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("pt-BR");
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(minutes) {
    if (!minutes && minutes !== 0) return "—";

    const safeMinutes = Math.max(0, minutes);
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;

    return `${hours}h ${mins}min`;
  }

  function renderStatus(item) {
    if (!item.clock_out) {
      return (
        <Text style={styles.statusOpen}>
          Status: jornada em andamento
        </Text>
      );
    }

    return (
      <Text style={styles.statusClosed}>
        Status: jornada finalizada
      </Text>
    );
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.date}>📅 {formatDate(item.clock_in)}</Text>

        <Text style={styles.label}>
          Entrada: <Text style={styles.value}>{formatTime(item.clock_in)}</Text>
        </Text>

        <Text style={styles.label}>
          Saída:{" "}
          <Text style={styles.value}>
            {item.clock_out ? formatTime(item.clock_out) : "em aberto"}
          </Text>
        </Text>

        <Text style={styles.label}>
          Total:{" "}
          <Text style={styles.value}>
            {item.clock_out ? formatDuration(item.duration_minutes) : "em andamento"}
          </Text>
        </Text>

        {renderStatus(item)}

        {item.note ? (
          <Text style={styles.note}>
            Observação: <Text style={styles.value}>{item.note}</Text>
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Jornadas</Text>

      <TouchableOpacity style={styles.button} onPress={loadEntries}>
        <Text style={styles.buttonText}>
          {loading ? "Atualizando..." : "Atualizar histórico"}
        </Text>
      </TouchableOpacity>

      {entries.length === 0 && !loading ? (
        <Text style={styles.empty}>Nenhum registro encontrado.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2e7d6b",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    marginBottom: 4,
    color: "#333",
  },
  value: {
    fontWeight: "600",
    color: "#000",
  },
  note: {
    marginTop: 8,
    fontSize: 14,
    color: "#444",
  },
  statusOpen: {
    marginTop: 10,
    color: "#d97706",
    fontWeight: "bold",
  },
  statusClosed: {
    marginTop: 10,
    color: "#15803d",
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#666",
  },
});