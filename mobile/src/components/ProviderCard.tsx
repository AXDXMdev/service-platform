import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors } from "../theme"
import type { Provider } from "../types"

type Props = {
  provider: Provider
  onPress: () => void
}

export function ProviderCard({ provider, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{provider.name.slice(0, 1)}</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.title}>{provider.title}</Text>
          <Text style={styles.meta}>
            {provider.name} · {provider.city}, {provider.district}
          </Text>
        </View>
      </View>
      <View style={styles.stats}>
        <Text style={styles.stat}>{provider.rating.toFixed(1)} ({provider.reviewCount})</Text>
        <Text style={styles.stat}>ab {provider.priceFrom} EUR</Text>
        {provider.verified && <Text style={styles.verified}>Verifiziert</Text>}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 12
  },
  pressed: {
    opacity: 0.85
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  avatar: {
    height: 46,
    width: 46,
    borderRadius: 12,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800"
  },
  main: {
    flex: 1
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  meta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  stat: {
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  verified: {
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: colors.success,
    fontSize: 12,
    fontWeight: "800"
  }
})
