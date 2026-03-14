import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      console.log("LOGIN OK:", response.data);

      // salva token
      if (response.data?.token) {
        await AsyncStorage.setItem("token", response.data.token);
      }

      // salva user somente se existir
      if (response.data?.user) {
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      }

      Alert.alert("Sucesso", "Login realizado com sucesso!");
      router.replace("/home");
    } catch (error) {
      console.log("ERRO COMPLETO:", error);
      console.log("ERRO RESPONSE:", error?.response?.data);
      console.log("ERRO MESSAGE:", error?.message);

      if (error?.response?.data) {
        Alert.alert("Erro", JSON.stringify(error.response.data));
      } else {
        Alert.alert("Erro", error?.message || "Erro no login");
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Entrar" onPress={handleLogin} />
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
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
});