import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthProvider";
import { useState, useRef } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";

function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert("Sign In Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🎵</Text>
            </View>
            <Text style={styles.brand}>Raagsetu</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.subheadline}>
            Sign in to continue your musical journey
          </Text>

          {/* Card */}
          <View style={styles.card}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#5a5a7a"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#5a5a7a"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
                onPress={handleSignIn}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signInBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>Don&apos;t have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer note */}
          <Text style={styles.footer}>
            By continuing you agree to our{" "}
            <Text style={styles.footerLink}>Terms</Text> &{" "}
            <Text style={styles.footerLink}>Privacy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  flex: { flex: 1 },

  blobTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#c799ff",
    opacity: 0.1,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#4af8e3",
    opacity: 0.08,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    justifyContent: "center",
    flexGrow: 1,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoEmoji: { fontSize: 22 },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  headline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 15,
    color: "#adaaaa",
    marginBottom: 32,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#20201f",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },

  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#adaaaa",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(118, 117, 117, 0.15)",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10, color: "#4af8e3" },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#ffffff",
    paddingVertical: 0,
  },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  forgotRow: { alignSelf: "flex-end", marginBottom: 4 },
  forgotText: {
    fontSize: 13,
    color: "#4af8e3",
    fontWeight: "600",
  },

  signInBtn: {
    backgroundColor: "#c799ff",
    borderRadius: 30,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c799ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnText: {
    color: "#440080",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(118, 117, 117, 0.15)" },
  dividerText: {
    color: "#adaaaa",
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: "600",
  },

  signupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signupPrompt: { color: "#adaaaa", fontSize: 14 },
  signupLink: {
    color: "#4af8e3",
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#adaaaa",
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
  footerLink: { color: "#4af8e3", fontWeight: "600" },
});

export default LoginScreen;