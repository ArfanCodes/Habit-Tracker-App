import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { ColorValue, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const gradientColors: [ColorValue, ColorValue] = ["#6C47FF", "#8B63FF"];
const inactiveColor = "#A7A7A7";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

  const renderTab = (
    iconName: IconName,
    label: string,
    focused: boolean
  ) => {
    return (
      <View style={styles.tabButton}>
        {focused ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeIconWrapper}
          >
            <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconWrapper}>
            <MaterialCommunityIcons name={iconName} size={20} color={inactiveColor} />
          </View>
        )}
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            styles.tabLabel,
            focused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 16,
          shadowColor: "rgba(108, 71, 255, 0.2)",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          height: Platform.OS === "ios" ? insets.bottom + 72 : insets.bottom + 64,
          paddingBottom: Platform.OS === "ios" ? insets.bottom + 14 : insets.bottom + 10,
          paddingTop: 12,
        },
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => renderTab("calendar-month", "Today", focused),
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ focused }) => renderTab("fire", "Streaks", focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => renderTab("account", "Profile", focused),
        }}
      />
      <Tabs.Screen
        name="add-habit"
        options={{
          href: null, // Hide from tab bar since we use FAB
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    paddingHorizontal: 4,
  },
  activeIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(108, 71, 255, 0.35)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  inactiveIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  tabLabelActive: {
    color: gradientColors[0],
  },
  tabLabelInactive: {
    color: inactiveColor,
  },
});
