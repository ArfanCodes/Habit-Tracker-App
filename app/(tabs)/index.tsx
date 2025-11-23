import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  LinearGradient as ExpoLinearGradient,
  type LinearGradientProps,
} from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState, type FC } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Surface, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GradientButton: FC<LinearGradientProps> = (props) => (
  <ExpoLinearGradient {...props} />
);

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const checkAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const profileSheetOpacity = useRef(new Animated.Value(0)).current;
  const profileSheetTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
      const habitsSubscription = client.subscribe(
        habitsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            fetchHabits();
          } else if (
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            )
          ) {
            fetchHabits();
          } else if (
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            fetchHabits();
          }
        }
      );

      const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;

      const completionsSubscription = client.subscribe(
        completionsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            fetchTodayCompletions();
          }
        }
      );

      fetchHabits();
      fetchTodayCompletions();

      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments<Habit>(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      setHabits(response.documents);
      // Initialize animations for new habits
      response.documents.forEach((habit) => {
        if (!checkAnimations.current[habit.$id]) {
          checkAnimations.current[habit.$id] = new Animated.Value(1);
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments<HabitCompletion>(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      );

      const completions = response.documents;
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    
    // Animation
    if (checkAnimations.current[id]) {
      Animated.sequence([
        Animated.spring(checkAnimations.current[id], {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(checkAnimations.current[id], {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const currentDate = new Date().toISOString();
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user?.$id,
          completed_at: currentDate,
        }
      );
      const habit = habits?.find((h) => h.$id === id);
      if (!habit) return;

      await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: currentDate,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const isHabitCompleted = (habitid: string) =>
    completedHabits?.includes(habitid);

  const getHabitIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("water") || lowerTitle.includes("drink")) {
      return "cup-outline";
    }
    if (lowerTitle.includes("exercise") || lowerTitle.includes("workout")) {
      return "dumbbell";
    }
    if (lowerTitle.includes("read") || lowerTitle.includes("book")) {
      return "book-open-variant";
    }
    if (lowerTitle.includes("meditat") || lowerTitle.includes("mindful")) {
      return "meditation";
    }
    if (lowerTitle.includes("sleep")) {
      return "sleep";
    }
    return "check-circle-outline";
  };

  const getFormattedDate = () => {
    const today = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;
  };

  const renderRightActions = (habitId: string) => (
    <View style={styles.swipeActionRight}>
      {isHabitCompleted(habitId) ? (
        <MaterialCommunityIcons name="check" size={32} color="#fff" />
      ) : (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color="#fff"
        />
      )}
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons name="trash-can-outline" size={32} color="#fff" />
    </View>
  );

  const openProfileMenu = () => {
    if (showProfileMenu) return;
    setShowProfileMenu(true);
    profileSheetOpacity.setValue(0);
    profileSheetTranslate.setValue(0);
    Animated.parallel([
      Animated.timing(profileSheetOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(profileSheetTranslate, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeProfileMenu = () => {
    Animated.timing(profileSheetOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setShowProfileMenu(false);
      profileSheetTranslate.setValue(0);
    });
  };

  const overlayOpacity = profileSheetOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const sheetTranslateY = profileSheetTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: () => {},
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 60 || gesture.vy > 1.2) {
          closeProfileMenu();
        }
      },
    })
  ).current;

  const handleProfilePress = () => {
    closeProfileMenu();
    requestAnimationFrame(() => {
      navigation.navigate("profile" as never);
    });
  };

  const handleSignOut = async () => {
    closeProfileMenu();
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient Accent */}
      <View style={styles.gradientAccent} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Today&apos;s Habits</Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openProfileMenu();
          }}
          activeOpacity={0.85}
          style={styles.profileButton}
        >
          <GradientButton
            colors={["#6C47FF", "#8B63FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileButtonGradient}
          >
            <MaterialCommunityIcons name="account" size={20} color="#fff" />
          </GradientButton>
        </TouchableOpacity>
      </View>

      {/* Profile Menu Bottom Sheet */}
      {showProfileMenu && (
        <View style={styles.profileMenuOverlay}>
          <Animated.View
            style={[styles.overlayBackdrop, { opacity: overlayOpacity }]}
          >
            <Pressable
              style={styles.overlayPressable}
              onPress={closeProfileMenu}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.profileMenu,
              {
                paddingBottom: insets.bottom + 24,
                transform: [{ translateY: sheetTranslateY }],
                opacity: profileSheetOpacity,
              },
            ]}
            {...sheetPanResponder.panHandlers}
          >
            <View style={styles.profileMenuHandle} />
            <Text style={styles.profileMenuSectionTitle}>Account</Text>
            <View style={styles.profileMenuList}>
              <Pressable
                style={({ pressed }) => [
                  styles.profileMenuItem,
                  pressed && styles.profileMenuItemPressed,
                ]}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                onPress={handleProfilePress}
              >
                <MaterialCommunityIcons name="account" size={24} color="#1F1F1F" />
                <Text style={styles.profileMenuText}>Profile</Text>
              </Pressable>
              <View style={styles.profileMenuDivider} />
              <Pressable
                style={({ pressed }) => [
                  styles.profileMenuItem,
                  pressed && styles.profileMenuItemPressed,
                ]}
                android_ripple={{ color: "rgba(255,77,77,0.12)" }}
                onPress={handleSignOut}
              >
                <MaterialCommunityIcons name="logout" size={24} color="#FF4D4D" />
                <Text style={[styles.profileMenuText, styles.profileMenuTextDestructive]}>
                  Sign Out
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIconBg}>
              <MaterialCommunityIcons
                name="check-bold"
                size={36}
                color="#6C47FF"
                style={styles.emptyStateIcon}
              />
            </View>
            <Text style={styles.emptyStateTitle}>
              You're all set to build new habits
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              Start by adding your first one!
            </Text>
          </View>
        ) : (
          habits?.map((habit, key) => {
            const completed = isHabitCompleted(habit.$id);
            const progress = completed ? 100 : 0;
            const iconName = getHabitIcon(habit.title);

            return (
              <Swipeable
                key={key}
                ref={(ref) => {
                  swipeableRefs.current[habit.$id] = ref;
                }}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={renderLeftActions}
                renderRightActions={() => renderRightActions(habit.$id)}
                onSwipeableOpen={(direction) => {
                  if (direction === "left") {
                    handleDeleteHabit(habit.$id);
                  } else if (direction === "right") {
                    handleCompleteHabit(habit.$id);
                  }
                  swipeableRefs.current[habit.$id]?.close();
                }}
              >
                <Surface
                  style={[
                    styles.card,
                    completed && styles.cardCompleted,
                  ]}
                  elevation={0}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconContainer}>
                        <MaterialCommunityIcons
                          name={iconName}
                          size={28}
                          color={completed ? "#999" : "#4A90E2"}
                        />
                      </View>
                      <View style={styles.cardTitleContainer}>
                        <Text
                          style={[
                            styles.cardTitle,
                            completed && styles.cardTitleCompleted,
                          ]}
                        >
                          {habit.title}
                        </Text>
                        {habit.description && (
                          <Text style={styles.cardDescription}>
                            {habit.description}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleCompleteHabit(habit.$id)}
                        disabled={completed}
                        style={styles.checkButton}
                      >
                        <Animated.View
                          style={{
                            transform: [
                              {
                                scale: checkAnimations.current[habit.$id] || 1,
                              },
                            ],
                          }}
                        >
                          <MaterialCommunityIcons
                            name={completed ? "check-circle" : "circle-outline"}
                            size={32}
                            color={completed ? "#4CAF50" : "#ccc"}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons
                          name="fire"
                          size={18}
                          color="#ff9800"
                        />
                        <Text style={styles.streakText}>
                          {habit.streak_count} day streak
                        </Text>
                      </View>
                      <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyText}>
                          {habit.frequency.charAt(0).toUpperCase() +
                            habit.frequency.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Surface>
              </Swipeable>
            );
          })
        )}

        <View style={styles.addHabitButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/add-habit");
            }}
            style={styles.emptyStateButtonWrapper}
          >
            <GradientButton
              colors={["#6C47FF", "#8B63FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateButton}
            >
              <Text style={styles.emptyStateButtonText}>Add Habit</Text>
            </GradientButton>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9FF",
  },
  gradientAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#f4f0ff",
    opacity: 0.3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22223b",
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    fontWeight: "400",
    color: "#999",
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(108, 71, 255, 0.4)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  profileMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "flex-end",
  },
  overlayBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 14, 32, 0.5)",
  },
  overlayPressable: {
    flex: 1,
  },
  profileMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 0,
    shadowColor: "rgba(15, 14, 32, 0.4)",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  profileMenuHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DBDBE8",
    alignSelf: "center",
    marginBottom: 12,
  },
  profileMenuSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F1F33",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  profileMenuList: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
  },
  profileMenuItemPressed: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginHorizontal: 24,
  },
  profileMenuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  profileMenuTextDestructive: {
    color: "#FF4D4D",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    minHeight: 400,
    width: "100%",
  },
  emptyStateIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EDEAFC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(108, 71, 255, 0.35)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 20,
  },
  emptyStateIcon: {
    textShadowColor: "transparent",
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#22223B",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#7A7A9A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyStateButtonWrapper: {
    width: "80%",
    maxWidth: 320,
  },
  emptyStateButton: {
    height: 48,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C47FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  addHabitButtonContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  card: {
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22223b",
    marginBottom: 4,
  },
  cardTitleCompleted: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6c6c80",
    lineHeight: 20,
  },
  checkButton: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  streakText: {
    color: "#ff9800",
    fontWeight: "600",
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "600",
    fontSize: 14,
  },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 24,
    marginBottom: 16,
    paddingLeft: 24,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 24,
    marginBottom: 16,
    paddingRight: 24,
  },
});
