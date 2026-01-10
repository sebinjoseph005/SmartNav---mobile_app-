import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const DATA = [
  {
    title: "Smart & Safe Navigation",
    description:
      "Get route recommendations based on real-time safety data, not just speed.",
  },
  {
    title: "Stay Connected Offline",
    description:
      "Mesh networking keeps you safe even when the signal drops.",
  },
  {
    title: "Live Like a Local",
    description:
      "Discover hidden gems verified by locals, not tourists.",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < DATA.length - 1) {
      setIndex(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{DATA[index].title}</Text>
      <Text style={styles.desc}>{DATA[index].description}</Text>

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>
          {index === DATA.length - 1 ? "Done" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: "#B0B7C3",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#4F8CFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
