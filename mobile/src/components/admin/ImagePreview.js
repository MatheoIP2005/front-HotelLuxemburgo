import { Image, StyleSheet, View } from "react-native";
import { colors } from "../../styles/theme";

export default function ImagePreview({ uri, size = 96, style }) {
  const normalizedUri = String(uri ?? "").trim();
  if (!normalizedUri) return null;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={{ uri: normalizedUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="Vista previa de imagen"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
