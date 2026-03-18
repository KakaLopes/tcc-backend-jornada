import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export default function AdminAdjustmentsScreen() {
  const [adjustments, setAdjustments] = useState([]);

  useEffect(() => {
    loadAdjustments();
  }, []);

  async function loadAdjustments() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await api.get("/admin/adjustments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAdjustments(response.data);
    } catch (error) {
      console.log("ERRO LOAD ADJUSTMENTS:", error);
    }
  }

  async function approve(id) {
    try {
      const token = await AsyncStorage.getItem("token");

      await api.post(
        `/admin/adjustments/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Sucesso", "Ajuste aprovado");
      loadAdjustments();
    } catch (error) {
      Alert.alert("Erro", "Erro ao aprovar");
    }
  }

  async function reject(id) {
    try {
      const token = await AsyncStorage.getItem("token");

      await api.post(
        `/admin/adjustments/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Rejeitado");
      loadAdjustments();
    } catch (error) {
      Alert.alert("Erro", "Erro ao rejeitar");
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text>ID: {item.id}</Text>
        <Text>Work Entry: {item.work_entry_id}</Text>
        <Text>Novo horário: {item.new_value}</Text>
        <Text>Motivo: {item.reason}</Text>

        <View style={styles.buttons}>
          <Button title="Aprovar" onPress={() => approve(item.id)} />
          <Button title="Rejeitar" onPress={() => reject(item.id)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes Pendentes</Text>

      <FlatList
        data={adjustments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});