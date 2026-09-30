import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

const C = {
  ink: "#18090F",
  panel: "#2A0E19",
  panelRaised: "#1E0B13",
  edge: "#80502C",
  gold: "#F4C52D",
  paper: "#FFF2DB",
  muted: "#D2B8A4",
  danger: "#FF8295",
};

export interface Dragon89LoginCardProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onDismiss?: () => void;
}

/** Focused login-card treatment. Authentication remains entirely with the host app. */
export function Dragon89LoginCard({ onLogin, onDismiss }: Dragon89LoginCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!username.trim() || !password) {
      setError("Enter your username and password to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await onLogin(username.trim(), password);
      if (!result.success) setError(result.error || "Sign in could not be completed.");
    } catch {
      setError("Sign in could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.artBand}>
          <Image
            source={require("../../assets/images/dragon89-chest-card.jpg")}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel="Dragon89 chest artwork"
          />
          <View style={styles.artTint} />
          <View style={styles.brand}>
            <Image
              source={require("../../assets/images/dragon89-wordmark.png")}
              style={styles.wordmark}
              contentFit="contain"
              accessibilityLabel="Dragon89"
            />
            <Text style={styles.brandSub}>PLAYER ACCESS</Text>
          </View>
          {onDismiss ? (
            <Pressable onPress={onDismiss} style={styles.close} accessibilityRole="button" accessibilityLabel="Close sign in">
              <Feather name="x" size={17} color={C.paper} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.rule}>
            <View style={styles.ruleWing} />
            <View style={styles.ruleDiamond} />
            <View style={styles.ruleWing} />
          </View>
          <Text style={styles.title}>LOG IN</Text>
          <Text style={styles.subtitle}>Sign in to continue playing.</Text>

          <Text style={styles.fieldLabel}>USERNAME</Text>
          <View style={styles.inputFrame}>
            <Feather name="user" size={15} color={C.gold} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor="#788681"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              returnKeyType="next"
              style={styles.input}
              accessibilityLabel="Username"
            />
          </View>

          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View style={styles.inputFrame}>
            <Feather name="lock" size={15} color={C.gold} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor="#788681"
              secureTextEntry
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={submit}
              style={styles.input}
              accessibilityLabel="Password"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.help}>Need access? Contact your Dragon89 agent.</Text>
          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.submit, pressed && styles.submitPressed, busy && styles.submitBusy]}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {busy ? <ActivityIndicator color={C.ink} size="small" /> : <Feather name="log-in" size={16} color={C.ink} />}
            <Text style={styles.submitText}>{busy ? "SIGNING IN" : "LOGIN"}</Text>
            {!busy ? <Feather name="arrow-right" size={15} color={C.ink} /> : null}
          </Pressable>
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>DRAGON89</Text>
            <View style={styles.footerLine} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: "100%", alignSelf: "stretch", paddingHorizontal: 22, paddingVertical: 28, position: "relative", backgroundColor: "#F7F6F2", alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 330, borderRadius: 23, overflow: "hidden", borderWidth: 1, borderColor: "#C08C32", backgroundColor: C.panel, shadowColor: "#4B3B30", shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 12 },
  artBand: { minHeight: 136, backgroundColor: C.ink, borderBottomWidth: 1, borderBottomColor: "#A97632", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  artTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(35, 5, 18, 0.56)" },
  wordmark: { width: 190, height: 74 },
  brand: { alignItems: "center", zIndex: 1 },
  brandSub: { color: C.gold, fontSize: 8, fontWeight: "800", letterSpacing: 3, marginTop: -4 },
  close: { position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,11,17,0.7)", zIndex: 2 },
  cardBody: { paddingHorizontal: 22, paddingTop: 15, paddingBottom: 17 },
  rule: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 },
  ruleWing: { flex: 1, height: 1, backgroundColor: "#80502C" },
  ruleDiamond: { width: 8, height: 8, borderWidth: 1.5, borderColor: C.gold, transform: [{ rotate: "45deg" }] },
  title: { color: C.gold, fontSize: 21, fontWeight: "900", textAlign: "center", letterSpacing: 2.1 },
  subtitle: { color: C.muted, fontSize: 10, textAlign: "center", marginTop: 4, marginBottom: 13 },
  fieldLabel: { color: "#E9C182", fontSize: 8, fontWeight: "900", letterSpacing: 1.7, marginBottom: 6, marginTop: 10 },
  inputFrame: { minHeight: 45, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, borderRadius: 9, backgroundColor: C.panelRaised, borderWidth: 1, borderColor: "#67412B" },
  input: { flex: 1, color: C.paper, fontSize: 13, paddingVertical: 11 },
  errorBox: { flexDirection: "row", gap: 8, alignItems: "center", padding: 10, marginTop: 13, borderRadius: 10, backgroundColor: "rgba(255,130,149,0.09)", borderWidth: 1, borderColor: "rgba(255,130,149,0.24)" },
  errorText: { color: C.danger, fontSize: 10, flex: 1, lineHeight: 15 },
  help: { color: "#C6A98C", fontSize: 9, textAlign: "center", marginTop: 12, marginBottom: 12 },
  submit: { minHeight: 49, borderRadius: 10, backgroundColor: C.gold, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: "#FFE477" },
  submitPressed: { backgroundColor: "#FFDC58" },
  submitBusy: { opacity: 0.75 },
  submitText: { color: C.ink, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  footerLine: { flex: 1, height: 1, backgroundColor: "#63402C" },
  footerText: { color: "#B89769", fontSize: 8, fontWeight: "800", letterSpacing: 2.4 },
});