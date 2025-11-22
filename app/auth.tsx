import { useAuth } from "@/lib/auth-context";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";

const MEDIUM_BLUE = "#4A90E2";
const BRIGHT_BLUE = "#5BA3F5"; // Brighter, cleaner blue for buttons
const LIGHT_GREY = "#F0F0F0"; // Softer, lighter grey
const WHITE = "#FFFFFF";
const INPUT_HEIGHT = 56; // Slightly larger
const SPACING = 20; // Consistent spacing between elements
const INPUT_BORDER_RADIUS = 16; // Larger corner radius
const CARD_BORDER_RADIUS = 32; // More rounded card

// Facebook Logo Component - Official blue 'f' icon
const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <FontAwesome5 name="facebook-f" size={size} color="#1877F2" solid />
);

// Google Logo Component - Official Google 'G' logo
const GoogleIcon = ({ size = 24 }: { size?: number }) => (
  <FontAwesome5 name="google" size={size} color="#DB4437" brand />
);

// Apple Logo Component - Official black Apple logo
const AppleIcon = ({ size = 24 }: { size?: number }) => (
  <FontAwesome5 name="apple" size={size} color="#000000" solid />
);

export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (isSignup) {
      if (!name || !email || !password) {
        setError("Please fill in all fields");
        return;
      }
      if (!agreeToTerms) {
        setError("Please agree to the Terms of Service");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (isSignup) {
        const error = await signUp(email, password);
        if (error) {
          setError(error);
          setIsLoading(false);
          return;
        }
        router.replace("/");
      } else {
        const error = await signIn(email, password);
        if (error) {
          setError(error);
          setIsLoading(false);
          return;
        }
        router.replace("/");
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Always centered */}
          <View style={styles.header}>
            {isSignup && (
              <TouchableOpacity
                onPress={() => {
                  setIsSignup(false);
                  setError(null);
                }}
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
            )}
            <Text style={styles.appTitle}>Havit</Text>
          </View>

          {/* Main Auth Card - Centered */}
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              {/* Heading */}
              <Text style={styles.cardHeading}>
                {isSignup ? "Create an Account" : "Welcome back!"}
              </Text>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Form Fields */}
              {isSignup && (
                <View style={styles.inputContainer}>
                  <RNTextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <RNTextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <RNTextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Screen: Remember Me & Forgot Password */}
              {!isSignup && (
                <View style={styles.rememberRow}>
                  <TouchableOpacity
                    onPress={() => setRememberMe(!rememberMe)}
                    style={styles.checkboxRow}
                  >
                    <View style={styles.checkbox}>
                      {rememberMe && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={MEDIUM_BLUE}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Signup Screen: Terms Checkbox */}
              {isSignup && (
                <TouchableOpacity
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  style={styles.checkboxRow}
                >
                  <View style={styles.checkbox}>
                    {agreeToTerms && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={MEDIUM_BLUE}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to the{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                  </Text>
                </TouchableOpacity>
              )}

              {/* Primary Button */}
              <TouchableOpacity
                onPress={handleAuth}
                disabled={isLoading}
                style={[
                  styles.primaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSignup ? "Create account" : "Login"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or Sign in with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <FacebookIcon size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <GoogleIcon size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <AppleIcon size={24} />
                </TouchableOpacity>
              </View>

              {/* Switch to Signup - Inside Card */}
              {!isSignup && (
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    Don&apos;t have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsSignup(true);
                      setError(null);
                    }}
                  >
                    <Text style={styles.switchLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_GREY,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16, // Closer to card for better connection
    position: "relative",
    width: "100%",
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: "600", // Medium/semibold - not too thin, not too bold
    color: MEDIUM_BLUE,
    textAlign: "center",
    letterSpacing: 1.2, // Slight letter spacing for premium feel
    includeFontPadding: false,
  },
  cardWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: CARD_BORDER_RADIUS,
    padding: 32,
    width: "100%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, // Softer, lighter opacity
    shadowRadius: 16, // More blur
    elevation: 3,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24, // Equal top/bottom margins
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: SPACING,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    position: "relative",
    marginBottom: SPACING,
  },
  input: {
    backgroundColor: LIGHT_GREY,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: 20, // More internal padding
    paddingVertical: 0, // Let height handle vertical padding
    height: INPUT_HEIGHT,
    fontSize: 16,
    color: "#000",
    borderWidth: 0,
    textAlignVertical: "center", // Vertically center placeholder
  },
  eyeIcon: {
    position: "absolute",
    right: 18,
    top: (INPUT_HEIGHT - 22) / 2, // Perfectly centered
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4, // Consistent spacing from inputs
    marginBottom: SPACING,
    width: "100%",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: SPACING,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: MEDIUM_BLUE,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WHITE,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  forgotPassword: {
    fontSize: 14,
    color: MEDIUM_BLUE,
    fontWeight: "500",
    includeFontPadding: false,
  },
  termsLink: {
    color: MEDIUM_BLUE,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: BRIGHT_BLUE,
    borderRadius: 28, // Pill shape
    height: 56, // Slightly larger
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8, // Consistent spacing from checkbox
    marginBottom: SPACING,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8, // Equal spacing above
    marginBottom: SPACING, // Equal spacing below
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 16, // Longer symmetric spacing
    fontSize: 14,
    color: "#999",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32, // More space before footer
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8, // Better spacing from social icons
  },
  switchText: {
    fontSize: 14,
    color: "#666",
  },
  switchLink: {
    fontSize: 14,
    color: MEDIUM_BLUE,
    fontWeight: "600",
  },
});
