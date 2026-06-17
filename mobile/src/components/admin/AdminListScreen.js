import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/theme";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";
import { createSafeRenderItem, filterSafeList } from "../../utils/adminCollection";

export default function AdminListScreen({
  title,
  subtitle,
  items = [],
  loading = false,
  refreshing = false,
  error = "",
  onRefresh,
  onRetry,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
}) {
  if (loading && items.length === 0) {
    return <LoadingState message={`Cargando ${title || "registros"}...`} />;
  }

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={filterSafeList(items)}
      keyExtractor={keyExtractor}
      renderItem={createSafeRenderItem(renderItem)}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      ListHeaderComponent={
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {error ? <ErrorState message={error} onRetry={onRetry} /> : null}
          {ListHeaderComponent || null}
        </View>
      }
      ListEmptyComponent={
        !loading ? <EmptyState title="No hay registros" message={subtitle} /> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
  },
});
