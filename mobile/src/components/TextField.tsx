import { StyleSheet, TextInput, TextInputProps } from "react-native"
import { colors } from "../theme"

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      {...props}
      style={[styles.input, props.multiline ? styles.multiline : null, props.style]}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15
  },
  multiline: {
    minHeight: 104,
    paddingTop: 12,
    textAlignVertical: "top"
  }
})
