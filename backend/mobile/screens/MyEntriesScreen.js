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
        Alert.alert("Error", "Token not found. Please log in again.");
        return;
      }

      const response = await api.get("/my-entries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEntries(response.data || []);
    } catch (error) {
      console.log("HISTORY ERROR:", error?.response?.data || error.message);

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Unable to load history"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjust(item) {
    Alert.prompt(
      "New time",
      "Enter the new time in HH:MM format",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: (newTime) => {
            if (!newTime || !/^\d{2}:\d{2}$/.test(newTime)) {
              Alert.alert("Error", "Please enter the time in HH:MM format.");
              return;
            }

            Alert.prompt(
              "Adjustment reason",
              "Describe the reason for this adjustment",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Submit",
                  onPress: async (reason) => {
                    try {
                      const token = await AsyncStorage.getItem("token");

                      const originalDate = new Date(item.clock_in);
                      const [hours, minutes] = newTime.split(":");

                      const newDate = new Date(originalDate);
                      newDate.setHours(Number(hours));
                      newDate.setMinutes(Number(minutes));
                      newDate.setSeconds(0);

                      await api.post(
                        "/adjustments/request",
                        {
                          work_entry_id: item.id,
                          old_value: item.clock_in,
                          new_value: newDate.toISOString(),
                          reason,
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      Alert.alert("Success", "Adjustment request sent successfully.");
                    } catch (error) {
                      console.log(
                        "ADJUSTMENT ERROR:",
                        error?.response?.data || error.message
                      );

                      Alert.alert(
                        "Error",
                        error?.response?.data?.error ||
                          "Unable to send adjustment request"
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IE");
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("en-IE", {
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
      return <Text style={styles.statusOpen}>Status: work in progress</Text>;
    }

    return <Text style={styles.statusClosed}>Status: completed</Text>;
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.date}>📅 {formatDate(item.clock_in)}</Text>

        <Text style={styles.label}>
          Clock-in:{" "}
          <Text style={styles.value}>{formatTime(item.clock_in)}</Text>
        </Text>

        <Text style={styles.label}>
          Clock-out:{" "}
          <Text style={styles.value}>
            {item.clock_out ? formatTime(item.clock_out) : "Open"}
          </Text>
        </Text>

        <Text style={styles.label}>
          Total:{" "}
          <Text style={styles.value}>
            {item.clock_out
              ? formatDuration(item.duration_minutes)
              : "In progress"}
          </Text>
        </Text>

        {renderStatus(item)}

        {item.note ? (
          <Text style={styles.note}>
            Note: <Text style={styles.value}>{item.note}</Text>
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => handleAdjust(item)}
        >
          <Text style={styles.adjustText}>Request Adjustment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work History</Text>

      <TouchableOpacity style={styles.button} onPress={loadEntries}>
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Refresh History"}
        </Text>
      </TouchableOpacity>

      {entries.length === 0 && !loading ? (
        <Text style={styles.empty}>No records found.</Text>
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
    backgroundColor: "#f5f7fb",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
    color: "#111827",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  label: {
    fontSize: 15,
    marginBottom: 5,
    color: "#374151",
  },
  value: {
    fontWeight: "600",
    color: "#111827",
  },
  note: {
    marginTop: 8,
    fontSize: 14,
    color: "#4b5563",
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
    color: "#6b7280",
  },
  adjustButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
  },
  adjustText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});