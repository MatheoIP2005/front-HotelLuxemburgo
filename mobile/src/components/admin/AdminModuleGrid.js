import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ADMIN_MODULE_GROUPS } from "../../config/adminModules";
import { colors, shadow } from "../../styles/theme";

const ALL_SECTIONS = { key: "all", title: "Todos" };

export default function AdminModuleGrid({ navigation, activeSection = "all" }) {
  const openModule = (module) => {
    navigation.navigate(module.route);
  };

  const visibleGroups =
    activeSection === "all"
      ? ADMIN_MODULE_GROUPS
      : ADMIN_MODULE_GROUPS.filter((group) => group.key === activeSection);

  return (
    <View style={styles.container}>
      {visibleGroups.map((group) => (
        <View key={group.key ?? group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.grid}>
            {group.modules.map((module) => (
              <Pressable
                key={module.key}
                style={styles.tile}
                onPress={() => openModule(module)}
              >
                <Text style={styles.tileTitle} numberOfLines={2}>
                  {module.title}
                </Text>
                <Text style={styles.tileHint}>Abrir módulo</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function AdminSectionTabs({ activeSection, onChange }) {
  const sections = [
    ALL_SECTIONS,
    ...ADMIN_MODULE_GROUPS.map((group) => ({
      key: group.key,
      title: group.title,
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContent}
    >
      {sections.map((section) => {
        const isActive = activeSection === section.key;
        return (
          <Pressable
            key={section.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(section.key)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
              {section.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    width: "48%",
    minHeight: 88,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    justifyContent: "space-between",
    ...shadow,
  },
  tileTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  tileHint: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  tabsContent: {
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#e2e8f0",
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#fff",
  },
});
