import { Pressable, StyleSheet, Text } from "react-native"
import { colors } from "../theme"

type Props = {
  label: string
  onPress: () => void
  variant?: "primary" | "secondary"
  disabled?: boolean
}

export function Button({ label, onPress, variant = "primary", disabled }: Props) {
  const secondary = variant === "secondary"
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        secondary ? styles.secondary : styles.primary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={[styles.label, secondary ? styles.secondaryLabel : null]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  primary: {
    backgroundColor: colors.brand
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryLabel: {
    color: colors.ink
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    opacity: 0.55
  }
})
