import {
  OBSERVATION_FIELDS,
  ObservationField,
} from "@/constants/observations";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { ObservationType, ObservationValue } from "@/src/types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ObservationsSelectorProps {
  /** Mapa atual de observações: { colica: true, estresse: 2 } */
  value: Partial<Record<ObservationType, ObservationValue>>;
  /** Define (ou remove, quando `undefined`) o valor de um campo */
  onChange: (id: ObservationType, value: ObservationValue | undefined) => void;
  disabled?: boolean;
  /** Restringe quais campos exibir (ex.: só os obrigatórios no modal) */
  onlyFields?: ObservationType[];
  /** Exibe o título "Observações (opcional)" */
  showTitle?: boolean;
}

export function ObservationsSelector({
  value,
  onChange,
  disabled = false,
  onlyFields,
  showTitle = true,
}: ObservationsSelectorProps) {
  const { colors } = useAppTheme();

  const fields = onlyFields
    ? OBSERVATION_FIELDS.filter((f) => onlyFields.includes(f.id))
    : OBSERVATION_FIELDS;

  const toggleFields = fields.filter((f) => f.kind === "toggle");
  const scaleFields = fields.filter((f) => f.kind === "scale");

  const renderToggle = (field: ObservationField) => {
    const isSelected = value[field.id] === true;
    return (
      <TouchableOpacity
        key={field.id}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? colors.action : colors.surface,
            borderColor: colors.border,
            shadowColor: colors.text,
          },
          disabled && styles.chipDisabled,
        ]}
        onPress={() =>
          !disabled && onChange(field.id, isSelected ? undefined : true)
        }
        disabled={disabled}
      >
        <Text style={styles.emoji}>{field.emoji}</Text>
        <Text
          style={[
            styles.chipText,
            { color: isSelected ? colors.white : colors.text },
            isSelected && styles.chipTextSelected,
            disabled && styles.chipTextDisabled,
          ]}
        >
          {field.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderScale = (field: ObservationField) => {
    const current = value[field.id];
    return (
      <View key={field.id} style={styles.scaleSection}>
        <Text style={[styles.scaleTitle, { color: colors.text }]}>
          {field.emoji} {field.label}
          {field.required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <View style={styles.chipsContainer}>
          {field.levels?.map((level) => {
            const isSelected = current === level.value;
            return (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? colors.action
                      : colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.text,
                  },
                  disabled && styles.chipDisabled,
                ]}
                onPress={() => !disabled && onChange(field.id, level.value)}
                disabled={disabled}
              >
                <Text style={styles.emoji}>{level.emoji}</Text>
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? colors.white : colors.text },
                    isSelected && styles.chipTextSelected,
                    disabled && styles.chipTextDisabled,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={[styles.title, { color: colors.text }]}>
          Observações (opcional)
        </Text>
      )}

      {toggleFields.length > 0 && (
        <View style={styles.chipsContainer}>
          {toggleFields.map(renderToggle)}
        </View>
      )}

      {scaleFields.map(renderScale)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  scaleSection: {
    marginTop: 16,
  },
  scaleTitle: {
    ...Typography.caption,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  required: {
    color: "#C67171",
    fontWeight: "700",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: "500",
  },
  chipTextSelected: {
    fontWeight: "600",
  },
  chipTextDisabled: {
    opacity: 0.5,
  },
});
