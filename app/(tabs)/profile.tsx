import {
    client,
    COMPLETIONS_COLLECTION_ID,
    DATABASE_ID,
    databases,
    HABITS_COLLECTION_ID,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    LinearGradient as ExpoLinearGradient,
    type LinearGradientProps,
} from "expo-linear-gradient";
import { useEffect, useMemo, useState, type FC } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GradientView: FC<LinearGradientProps> = (props) => (
  <ExpoLinearGradient {...props} />
);

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [dailyReminder, setDailyReminder] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [themePreference, setThemePreference] = useState<
    "light" | "dark" | "system"
  >("light");

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const habitsResponse = await databases.listDocuments<Habit>(
          DATABASE_ID,
          HABITS_COLLECTION_ID,
          [Query.equal("user_id", user.$id)]
        );

        const completionsResponse = await databases.listDocuments<HabitCompletion>(
          DATABASE_ID,
          COMPLETIONS_COLLECTION_ID,
          [Query.equal("user_id", user.$id)]
        );

        setHabits(habitsResponse.documents);
        setCompletions(completionsResponse.documents);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();

    const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;

    const unsubscribeHabits = client.subscribe(habitsChannel, ({ events }) => {
      if (events.some((event) => event.includes("databases"))) fetchData();
    });

    const unsubscribeCompletions = client.subscribe(
      completionsChannel,
      ({ events }) => {
        if (events.some((event) => event.includes("databases"))) fetchData();
      }
    );

    return () => {
      unsubscribeHabits();
      unsubscribeCompletions();
    };
  }, [user]);

  const getStreakData = (habitId: string) => {
    const habitCompletions = completions
      .filter((completion) => completion.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
      );

    if (!habitCompletions.length)
      return { streak: 0, bestStreak: 0, total: 0 };

    let streak = 0;
    let bestStreak = 0;
    let lastDate: Date | null = null;
    let currentStreak = 0;

    habitCompletions.forEach((completion) => {
      const date = new Date(completion.completed_at);
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        currentStreak = diff <= 1.5 ? currentStreak + 1 : 1;
      } else {
        currentStreak = 1;
      }

      if (currentStreak > bestStreak) bestStreak = currentStreak;
      streak = currentStreak;
      lastDate = date;
    });

    return { streak, bestStreak, total: habitCompletions.length };
  };

  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = completions.filter((completion) => {
      const completionDate = new Date(completion.completed_at);
      return completionDate >= today;
    }).length;

    const streakData = habits.map((habit) => getStreakData(habit.$id));
    const longestStreak = streakData.reduce(
      (max, data) => Math.max(max, data.bestStreak),
      0
    );
    const currentStreak = streakData.reduce(
      (max, data) => Math.max(max, data.streak),
      0
    );

    return {
      totalHabits: habits.length,
      completedToday,
      longestStreak,
      currentStreak,
    };
  }, [habits, completions]);

  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const weeklyCompleted = completions.filter((completion) => {
      const date = new Date(completion.completed_at);
      return date >= startOfWeek && date < endOfWeek;
    }).length;

    const totalWeeklyHabits = Math.max(habits.length * 7, 1);
    const percent = Math.min(
      100,
      Math.round((weeklyCompleted / totalWeeklyHabits) * 100)
    );

    return {
      weekLabel: `Week ${weekNumber}`,
      percent,
      description: `${percent}% of weekly habits completed`,
    };
  }, [habits, completions]);

  const stats = [
    { label: "Total Habits", value: String(todayStats.totalHabits) },
    { label: "Completed Today", value: String(todayStats.completedToday) },
    {
      label: "Longest Streak",
      value: `${todayStats.longestStreak} day${todayStats.longestStreak === 1 ? "" : "s"}`,
    },
    {
      label: "Current Streak",
      value: `${todayStats.currentStreak} day${todayStats.currentStreak === 1 ? "" : "s"}`,
    },
  ];

  const progressBarWidth = `${weeklyProgress.percent}%` as `${number}%`;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16 },
          ]}
        >
          <Text style={styles.screenTitle}>Profile</Text>

          <View style={styles.avatarWrapper}>
            <GradientView
              colors={["#6C47FF", "#8B63FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <MaterialCommunityIcons name="account" size={36} color="#fff" />
            </GradientView>
          </View>

          <View style={styles.userInfoCard}>
            <Text style={styles.userName}>{user?.name ?? "Habit Explorer"}</Text>
            <Text style={styles.userEmail}>
              {user?.email ?? "user@example.com"}
            </Text>

            <TouchableOpacity activeOpacity={0.9} style={styles.editProfileButton}>
              <GradientView
                colors={["#6C47FF", "#8B63FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editProfileGradient}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </GradientView>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Habit Statistics</Text>
              <MaterialCommunityIcons name="chart-bar" size={24} color="#6C47FF" />
            </View>
            <View style={styles.statsGrid}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Progress Overview</Text>
              <MaterialCommunityIcons name="clock-outline" size={22} color="#8E8EA9" />
            </View>
            <Text style={styles.subLabel}>{weeklyProgress.weekLabel}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: progressBarWidth }]} />
            </View>
            <Text style={styles.progressLabel}>{weeklyProgress.description}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Reminder Settings</Text>
              <MaterialCommunityIcons name="bell-ring" size={22} color="#8E8EA9" />
            </View>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.rowTitle}>Daily Reminder</Text>
                <Text style={styles.rowSubtitle}>Stay on track every morning</Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                thumbColor={dailyReminder ? "#6C47FF" : "#E0E0E0"}
                trackColor={{ false: "#D6D6D6", true: "#D4C5FF" }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.rowTitle}>Reminder Time</Text>
                <Text style={styles.rowSubtitle}>08:00 AM</Text>
              </View>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Theme & Appearance</Text>
              <MaterialCommunityIcons name="palette" size={22} color="#8E8EA9" />
            </View>
            <View style={styles.themeOptions}>
              {["light", "dark", "system"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.themeOption,
                    themePreference === option && styles.themeOptionActive,
                  ]}
                  onPress={() => setThemePreference(option as typeof themePreference)}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      themePreference === option && styles.themeOptionTextActive,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Preferences</Text>
              <MaterialCommunityIcons name="tune" size={22} color="#8E8EA9" />
            </View>

            <View style={styles.preferenceRow}>
              <View>
                <Text style={styles.rowTitle}>Notifications</Text>
                <Text style={styles.rowSubtitle}>Daily digests & habit tips</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                thumbColor={notificationsEnabled ? "#6C47FF" : "#E0E0E0"}
                trackColor={{ false: "#D6D6D6", true: "#D4C5FF" }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.preferenceRow}>
              <View>
                <Text style={styles.rowTitle}>Haptic Feedback</Text>
                <Text style={styles.rowSubtitle}>Vibration on completion</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                thumbColor={hapticsEnabled ? "#6C47FF" : "#E0E0E0"}
                trackColor={{ false: "#D6D6D6", true: "#D4C5FF" }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.preferenceRow}>
              <View>
                <Text style={styles.rowTitle}>Data Sync</Text>
                <Text style={styles.rowSubtitle}>Automatically sync to cloud</Text>
              </View>
              <MaterialCommunityIcons name="cloud-sync" size={22} color="#6C47FF" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Account Actions</Text>
              <MaterialCommunityIcons name="shield-check" size={22} color="#8E8EA9" />
            </View>
            {[
              { label: "Backup My Data", icon: "backup-restore" },
              { label: "Export Habits", icon: "file-export" },
            ].map((action) => (
              <View key={action.label}>
                <TouchableOpacity style={styles.actionRow}>
                  <MaterialCommunityIcons
                    name={action.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={22}
                    color="#1F1F33"
                  />
                  <Text style={styles.actionText}>{action.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#B0B0C3" />
                </TouchableOpacity>
                <View style={styles.divider} />
              </View>
            ))}
            <TouchableOpacity style={styles.actionRow}>
              <MaterialCommunityIcons name="delete-forever" size={22} color="#FF4D4D" />
              <Text style={[styles.actionText, styles.destructiveText]}>Delete My Account</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#FF4D4D" />
            </TouchableOpacity>
          </View>

          <View style={styles.signOutWrapper}>
            <TouchableOpacity style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9FF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAF9FF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F1F33",
    textAlign: "center",
    marginBottom: 12,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(108, 71, 255, 0.3)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  userInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1F33",
  },
  userEmail: {
    fontSize: 14,
    color: "#7A7A9A",
    marginTop: 4,
    marginBottom: 16,
  },
  editProfileButton: {
    width: "70%",
    borderRadius: 999,
    overflow: "hidden",
  },
  editProfileGradient: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  editProfileText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F1F33",
  },
  subLabel: {
    fontSize: 14,
    color: "#8E8EA9",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    width: "47%",
    backgroundColor: "#F8F7FF",
    borderRadius: 18,
    padding: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6C47FF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6E6E82",
  },
  progressBarBg: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E7E4FF",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#6C47FF",
  },
  progressLabel: {
    marginTop: 12,
    fontSize: 14,
    color: "#6E6E82",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1F33",
  },
  rowSubtitle: {
    fontSize: 13,
    color: "#8E8EA9",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 16,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1EEFF",
  },
  timeButtonText: {
    color: "#6C47FF",
    fontWeight: "600",
  },
  themeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E2F3",
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  themeOptionActive: {
    borderColor: "#6C47FF",
    backgroundColor: "#F3EEFF",
  },
  themeOptionText: {
    fontSize: 14,
    color: "#6E6E82",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  themeOptionTextActive: {
    color: "#6C47FF",
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#1F1F33",
    fontWeight: "500",
  },
  destructiveText: {
    color: "#FF4D4D",
  },
  signOutWrapper: {
    marginTop: 4,
    alignItems: "center",
  },
  signOutButton: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FFB4B4",
    backgroundColor: "#FFF5F5",
  },
  signOutText: {
    textAlign: "center",
    color: "#FF4D4D",
    fontSize: 16,
    fontWeight: "600",
  },
});

function getStartOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getWeekNumber(date: Date) {
  const target = new Date(date.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 4 - (target.getDay() || 7));
  const yearStart = new Date(target.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}
