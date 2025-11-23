import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { Text, TextInput, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const gradientColors = ["#6C47FF", "#8B63FF"] as const;

  const handleAddHabit = async () => {
    if (!user) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      );

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.back();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        setIsSubmitting(false);
        return;
      }
      setError("There was an error creating habit");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              router.back();
            }
          }}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color="#4A90E2"
          />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Create Habit</Text>
          <Text style={styles.headerSubtitle}>Set up your new routine</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.form,
              isKeyboardVisible ? styles.formKeyboard : styles.formCentered,
            ]}
          >
            <TextInput
              label="Title"
              mode="outlined"
              onChangeText={setTitle}
              style={styles.input}
              value={title}
              outlineColor="#D9D7F3"
              activeOutlineColor="#6C47FF"
              contentStyle={styles.inputContent}
              outlineStyle={styles.inputOutline}
            />
            <TextInput
              label="Description"
              mode="outlined"
              onChangeText={setDescription}
              style={styles.input}
              value={description}
              multiline
              outlineColor="#D9D7F3"
              activeOutlineColor="#6C47FF"
              contentStyle={[styles.inputContent, { height: 110 }]}
              outlineStyle={styles.inputOutline}
            />
            <View style={styles.frequencyContainer}>
              <View style={styles.frequencyPills}>
                {FREQUENCIES.map((freq) => {
                  const isActive = frequency === freq;
                  return (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => {
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut
                        );
                        setFrequency(freq);
                      }}
                      activeOpacity={0.9}
                      style={styles.frequencyPillWrapper}
                    >
                      {isActive ? (
                        <LinearGradient
                          colors={gradientColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.frequencyPillActive}
                        >
                          <Text style={styles.frequencyPillActiveText}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.frequencyPillInactive}>
                          <Text style={styles.frequencyPillInactiveText}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddHabit}
              activeOpacity={0.9}
              disabled={!title || !description || isSubmitting}
              style={styles.submitButtonWrapper}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.submitButton,
                  (!title || !description || isSubmitting) &&
                    styles.submitButtonDisabled,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "Saving..." : "Add Habit"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}> 
                {error}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9FF",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
    width: "100%",
    gap: 18,
  },
  formCentered: {
    justifyContent: "center",
  },
  formKeyboard: {
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextGroup: {
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F1B50",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B6A89",
    marginTop: 6,
  },

  input: {
    marginBottom: 18,
  },
  inputOutline: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9D7F3",
  },
  inputContent: {
    paddingVertical: 14,
  },

  frequencyContainer: {
    marginTop: 24,
  },
  frequencyPills: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  frequencyPillWrapper: {
    flex: 1,
  },
  frequencyPillActive: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "rgba(108, 71, 255, 0.35)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  frequencyPillActiveText: {
    color: "#fff",
    fontWeight: "600",
  },
  frequencyPillInactive: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D7F3",
    backgroundColor: "#fff",
  },
  frequencyPillInactiveText: {
    color: "#7A7A9A",
    fontWeight: "600",
  },

  submitButtonWrapper: {
    marginTop: 32,
    width: "100%",
  },
  submitButton: {
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(108, 71, 255, 0.35)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  errorText: {
    marginTop: 12,
    textAlign: "center",
  },
});
