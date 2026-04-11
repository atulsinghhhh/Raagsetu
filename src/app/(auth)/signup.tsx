import { useAuth } from "@/context/AuthProvider";
import { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
  Dimensions,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";

const { width } = Dimensions.get("window");

function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "transparent", width: "0%" };
    if (password.length < 6)
      return { label: "Weak", color: "#ef4444", width: "30%" };
    if (password.length < 10)
      return { label: "Fair", color: "#f59e0b", width: "60%" };
    return { label: "Strong", color: "#22c55e", width: "100%" };
  };

  const strength = getPasswordStrength();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long."
      );
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (error) {
      Alert.alert("Sign Up Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

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
          <Text style={styles.headline}>Create account</Text>
          <Text style={styles.subheadline}>
            Join a community of music lovers today
          </Text>

          {/* Card */}
          <View style={styles.card}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#5a5a7a"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#5a5a7a"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <Animated.View
                      style={[
                        styles.strengthBar,
                        {
                          width: strength.width as any,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.strengthLabel, { color: strength.color }]}
                  >
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmFocused && styles.inputWrapperFocused,
                  confirmPassword.length > 0 &&
                    password !== confirmPassword &&
                    styles.inputWrapperError,
                ]}
              >
                <Text style={styles.inputIcon}>🛡️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#5a5a7a"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirm ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords don't match</Text>
              )}
            </View>

            {/* Perks row */}
            <View style={styles.perksRow}>
              {["Free forever plan", "No credit card needed", "Cancel anytime"].map(
                (perk) => (
                  <View key={perk} style={styles.perkChip}>
                    <Text style={styles.perkCheck}>✓</Text>
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                )
              )}
            </View>

            {/* Sign Up Button */}
            <Animated.View
              style={{ transform: [{ scale: buttonScale }], marginTop: 4 }}
            >
              <TouchableOpacity
                style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]}
                onPress={handleSignUp}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signUpBtnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            By creating an account you agree to our{"\n"}
            <Text style={styles.footerLink}>Terms of Service</Text> &{" "}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a14",
  },
  flex: { flex: 1 },

  /* Decorative blobs */
  blobTopLeft: {
    position: "absolute",
    top: -60,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#06b6d4",
    opacity: 0.14,
  },
  blobBottomRight: {
    position: "absolute",
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#7c3aed",
    opacity: 0.18,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },

  /* Brand */
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e1b3a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#7c3aed55",
  },
  logoEmoji: { fontSize: 22 },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#e2e2ff",
    letterSpacing: 0.5,
  },

  /* Headlines */
  headline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 15,
    color: "#7878a8",
    marginBottom: 32,
    lineHeight: 22,
  },

  /* Card */
  card: {
    backgroundColor: "#13132a",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#ffffff12",
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },

  /* Fields */
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a0a0c8",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0d22",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2a2a4a",
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: "#7c3aed",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#e2e2ff",
    height: "100%",
  },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  /* Password strength */
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#1e1e3a",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },

  /* Error */
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },

  /* Perks */
  perksRow: {
    gap: 6,
    marginBottom: 16,
    marginTop: 4,
  },
  perkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  perkCheck: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
  },
  perkText: {
    color: "#6868a0",
    fontSize: 13,
  },

  /* Sign Up Button */
  signUpBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  signUpBtnDisabled: { opacity: 0.7 },
  signUpBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* Divider */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2a2a4a" },
  dividerText: {
    color: "#4a4a6a",
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: "600",
  },

  /* Login link */
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginPrompt: { color: "#7878a8", fontSize: 14 },
  loginLink: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Footer */
  footer: {
    textAlign: "center",
    color: "#4a4a6a",
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
  footerLink: { color: "#7c3aed", fontWeight: "600" },
});

export default SignupScreen;