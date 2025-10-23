import {
  OBSERVATION_EMOJIS,
  OBSERVATION_LABELS,
} from "@/constants/observations";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { ObservationType } from "@/src/types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ObservationsSelectorProps {
  selectedObservations: ObservationType[];
  onToggleObservation: (observation: ObservationType) => void;
  disabled?: boolean;
}

export function ObservationsSelector({
  selectedObservations,
  onToggleObservation,
  disabled = false,
}: ObservationsSelectorProps) {
  const { colors } = useAppTheme();
  const allObservations: ObservationType[] = [
    "colica",
    "sangramento",
    "corrimento",
    "dor_seio",
    "dor_costas",
    "dor_pernas",
    "dor_cabeca",
    "espinha",
    "sexo_protegido",
    "sexo_sem_protecao",
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Observações (opcional)
      </Text>
      <View style={styles.chipsContainer}>
        {allObservations.map((observation) => {
          const isSelected = selectedObservations.includes(observation);
          return (
            <TouchableOpacity
              key={observation}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.action : colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                },
                isSelected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => !disabled && onToggleObservation(observation)}
              disabled={disabled}
            >
              <Text style={styles.emoji}>
                {OBSERVATION_EMOJIS[observation]}
              </Text>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? colors.white : colors.text,
                  },
                  isSelected && styles.chipTextSelected,
                  disabled && styles.chipTextDisabled,
                ]}
              >
                {OBSERVATION_LABELS[observation]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  chipSelected: {
    opacity: 1,
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
