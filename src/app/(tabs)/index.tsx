import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>basta nasa home kana kuys</Text>
      <Pressable
        style={styles.sitemapButton}
        onPress={() => router.push("/_sitemap")}
      >
        <Ionicons name="map-outline" size={22} color="#FFFFFF" />

        <Text style={styles.sitemapText}>Open Sitemap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },

  sitemapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    paddingHorizontal: 20,
    paddingVertical: 12,

    borderRadius: 8,
    backgroundColor: "#000000",
  },

  sitemapText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
