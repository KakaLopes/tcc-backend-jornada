import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
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
    const token = await AsyncStorage.getItem("token");

    if (!savedUser || !token) {
      router.replace("login");
      return;
    }

    setUser(JSON.parse(savedUser));
  } catch (error) {
    console.log("LOAD USER ERROR:", error);
    router.replace("login");
  }
}

async function loadDashboardData() {
  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      router.replace("login");
      return;
    }

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
      "DASHBOARD ERROR:",
      error?.response?.data || error.message
    );

    if (
      error?.response?.status === 401 ||
      error?.response?.data?.error?.includes("Token")
    ) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("login");
      return;
    }
  }
}

  async function handleClockIn() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Token not found. Please log in again.");
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

      Alert.alert("Success", response.data.message || "Clock-in registered");
      loadDashboardData();
    } catch (error) {
      console.log("CLOCK-IN ERROR:", error?.response?.data || error.message);

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Unable to register clock-in"
      );
    }
  }

  async function handleClockOut() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Token not found. Please log in again.");
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

      Alert.alert("Success", response.data.message || "Clock-out registered");
      loadDashboardData();
    } catch (error) {
      console.log("CLOCK-OUT ERROR:", error?.response?.data || error.message);

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Unable to register clock-out"
      );
    }
  }

  async function handleLogout() {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    router.replace("login");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Time Tracker</Text>

      <Text style={styles.welcome}>
        Welcome, {user?.full_name || "User"} 👋
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Daily Summary</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hours today</Text>
          <Text style={styles.infoValue}>{hoursToday}h</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total entries</Text>
          <Text style={styles.infoValue}>{entriesCount}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shift status</Text>
          <Text style={openEntry ? styles.statusOpen : styles.statusClosed}>
            {openEntry ? "Work in progress" : "No active shift"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleClockIn}>
        <Text style={styles.primaryButtonText}>Clock In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleClockOut}>
        <Text style={styles.secondaryButtonText}>Clock Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/history")}
      >
        <Text style={styles.secondaryButtonText}>View History</Text>
      </TouchableOpacity>

      {user?.role === "admin" && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push("/admin-adjustments")}
        >
          <Text style={styles.adminButtonText}>Admin Panel</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fb",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111827",
    marginBottom: 10,
  },
  welcome: {
    fontSize: 18,
    textAlign: "center",
    color: "#374151",
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 14,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  statusOpen: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d97706",
  },
  statusClosed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#15803d",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#111827",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  adminButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  adminButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});