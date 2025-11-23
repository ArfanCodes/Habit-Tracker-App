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
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { ScrollView } from "react-native-gesture-handler";
import { Card, Text } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

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
            fetchCompletions();
          }
        }
      );
      fetchHabits();
      fetchCompletions();

      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompletions = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );

      const completions = response.documents as HabitCompletion[];
      setCompletedHabits(completions);
    } catch (error) {
      console.error(error);
    }
  };

  interface StreakData {
    streak: number;
    bestStreak: number;
    total: number;
  }

  const getStreakData = (habitId: string): StreakData => {
    const habitCompletions = completedHabits
      ?.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime()
      );

    if (habitCompletions?.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    // build streak data
    let streak = 0;
    let bestStreak = 0;
    let total = habitCompletions.length;

    let lastDate: Date | null = null;
    let currentStreak = 0;

    habitCompletions?.forEach((c) => {
      const date = new Date(c.completed_at);
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > bestStreak) bestStreak = currentStreak;
      streak = currentStreak;
      lastDate = date;
    });

    return { streak, bestStreak, total };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, bestStreak, streak, total };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);
  const topRankedHabits = rankedHabits.slice(0, 3);
  const rankingIcons = ["🥇", "🥈", "🥉"];
  const hasHabits = rankedHabits.length > 0;

  const getTrendIndicator = (current: number, best: number) => {
    if (current === 0) return null;
    if (current >= best) {
      return { name: "arrow-up-bold" as const, color: "#4CAF50" };
    }
    if (current < best) {
      return { name: "arrow-down-bold" as const, color: "#FF6B6B" };
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} variant="headlineSmall">
            Habit Streaks
          </Text>
          <Text style={styles.subtitle}>Your habit progress at a glance</Text>
        </View>

        {hasHabits ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 120 },
            ]}
          >
            <View style={styles.listInner}>
              <View style={styles.rankingContainer}>
                <Text style={styles.rankingTitle}>🏅 Top Streaks </Text>
                {topRankedHabits.map((item, key) => (
                  <View key={item.habit.$id}>
                    <View style={styles.rankingRow}>
                      <View style={styles.rankingIconWrapper}>
                        <Text style={styles.rankingIcon}>{rankingIcons[key]}</Text>
                      </View>
                      <View style={styles.rankingInfo}>
                        <Text style={styles.rankingHabit}>{item.habit.title}</Text>
                        <Text style={styles.rankingSmallLabel}>Best streak</Text>
                      </View>
                      <Text style={styles.rankingStreak}>{item.bestStreak}</Text>
                    </View>
                    {key < topRankedHabits.length - 1 && (
                      <View style={styles.rankingDivider} />
                    )}
                  </View>
                ))}
              </View>

              {rankedHabits.map(({ habit, streak, bestStreak, total }) => (
                <Card
                  key={habit.$id}
                  style={[
                    styles.card,
                    rankedHabits[0].habit.$id === habit.$id && styles.firstCard,
                  ]}
                >
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.habitTitle}>
                      {habit.title}
                    </Text>
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                    <View style={styles.statsRow}>
                      {[
                        {
                          label: "Current",
                          value: streak,
                          icon: "fire",
                          tint: "rgba(255,152,0,0.12)",
                          iconColor: "#FF9800",
                          trend: getTrendIndicator(streak, bestStreak),
                        },
                        {
                          label: "Best",
                          value: bestStreak,
                          icon: "crown-outline",
                          tint: "rgba(255,214,0,0.12)",
                          iconColor: "#C9A128",
                        },
                        {
                          label: "Total",
                          value: total,
                          icon: "check-circle-outline",
                          tint: "rgba(76,175,80,0.12)",
                          iconColor: "#4CAF50",
                        },
                      ].map((stat, index) => (
                        <View
                          key={stat.label}
                          style={[
                            styles.statItem,
                            index < 2 && styles.statItemSpacing,
                          ]}
                        >
                          <View
                            style={[
                              styles.statIconWrapper,
                              { backgroundColor: stat.tint },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={stat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                              size={26}
                              color={stat.iconColor}
                            />
                          </View>
                          <View style={styles.statValueRow}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            {stat.trend && (
                              <MaterialCommunityIcons
                                name={stat.trend.name}
                                size={16}
                                color={stat.trend.color}
                                style={styles.trendIcon}
                              />
                            )}
                          </View>
                          <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                  </Card.Content>
                </Card>
              ))}
              <Text style={styles.updatedTimestamp}>Updated 5 min ago</Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyStateWrapper}>
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconWrapper}>
                <Text style={styles.emptyIcon}>🔥</Text>
              </View>
              <Text style={styles.emptyTitle}>No streaks yet</Text>
              <Text style={styles.emptySubtitle}>
                Build habits daily to start earning streaks!
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9FF",
  },
  content: {
    flex: 1,
    backgroundColor: "#FAF9FF",
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#8F95B2",
    marginTop: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  listInner: {
    paddingTop: 24,
    gap: 24,
  },
  title: {
    fontWeight: "700",
    fontSize: 24,
    color: "#1F1F33",
  },
  card: {
    marginBottom: 22,
    borderRadius: 22,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#F5F2FF",
  },

  firstCard: {
    borderWidth: 1.5,
    borderColor: "#B697FF",
    shadowColor: "rgba(108,71,255,0.35)",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  habitDescription: {
    color: "#6c6c80",
    marginBottom: 8,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#F9F8FF",
  },
  statItemSpacing: {
    marginRight: 12,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1F33",
  },
  statLabel: {
    fontSize: 12,
    color: "#7E8097",
    marginTop: 2,
  },
  trendIcon: {
    marginTop: 0,
  },
  rankingContainer: {
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  rankingTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 12,
    color: "#6C47FF",
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  rankingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rankingIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingHabit: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: 600,
  },
  rankingSmallLabel: {
    fontSize: 12,
    color: "#9C9EB5",
    marginTop: 4,
  },
  rankingStreak: {
    fontSize: 14,
    color: "#7c4dff",
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "right",
  },
  rankingDivider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 14,
    marginLeft: 48,
  },
  updatedTimestamp: {
    textAlign: "center",
    color: "#A0A3B8",
    fontSize: 12,
    marginTop: 6,
  },
  emptyStateWrapper: {
    flex: 1,
    paddingTop: 48,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyIconWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#E9E8FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C47FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
    color: "#6C47FF",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F1F33",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8EA9",
    textAlign: "center",
  },
});
