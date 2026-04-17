import { useAuth } from "@/context/AuthProvider";
import { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert,View,Text,TextInput,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Animated,ActivityIndicator,ScrollView,} from "react-native";
import { Link, useRouter } from "expo-router";

function SignupScreen() {
  const router=useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "transparent", width: "0%" };
    if (password.length < 6) return { label: "Weak", color: "#ef4444", width: "30%" };
    if (password.length < 10) return { label: "Fair", color: "#f59e0b", width: "60%" };
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
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      router.replace("/(app)/home");
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
            <Text style={styles.brand}>Raagsetu</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Create account</Text>
          <Text style={styles.subheadline}>
            Dive into your music world.
          </Text>

          {/* Card */}
          <View style={styles.card}>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                {/* <Text style={styles.inputIcon}>✉️</Text> */}
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
                {/* <Text style={styles.inputIcon}></Text> */}
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
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

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View
                      style={[
                        styles.strengthBar,
                        { width: strength.width as any, backgroundColor: strength.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
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
                  confirmPassword.length > 0 &&
                    password !== confirmPassword &&
                    styles.inputWrapperError,
                ]}
              >
                {/* <Text style={styles.inputIcon}>🛡️</Text> */}
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#5a5a7a"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
                <Text style={styles.errorText}>Passwords don&apos;t match</Text>
              )}
            </View>


            {/* Sign Up Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 4 }}>
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
    backgroundColor: "#0e0e0e",
  },
  flex: { flex: 1 },

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
    backgroundColor: "#c799ff",
    opacity: 0.18,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
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
    backgroundColor: "#20201f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#c799ff55",
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
    borderWidth: 1,
    borderColor: "#ffffff12",
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
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
    backgroundColor: "#0d0d22",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2a2a4a",
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#ffffff",
    paddingVertical: 0,
  },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#20201f",
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

  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },

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
    color: "#adaaaa",
    fontSize: 13,
  },

  signUpBtn: {
    backgroundColor: "#c799ff",
    borderRadius: 12,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c799ff",
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

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2a2a4a" },
  dividerText: {
    color: "#adaaaa",
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: "600",
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginPrompt: { color: "#adaaaa", fontSize: 14 },
  loginLink: {
    color: "#c799ff",
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
  footerLink: { color: "#c799ff", fontWeight: "600" },
});

export default SignupScreen;