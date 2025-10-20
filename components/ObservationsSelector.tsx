import { AppColors, Typography } from "@/constants/theme";
import {
  OBSERVATION_EMOJIS,
  OBSERVATION_LABELS,
} from "@/src/constants/observations";
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
  const allObservations: ObservationType[] = [
    "colica",
    "sangramento",
    "corrimento",
    "dor_seio",
    "dor_costas",
    "dor_pernas",
    "espinha",
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Observações (opcional)</Text>
      <View style={styles.chipsContainer}>
        {allObservations.map((observation) => {
          const isSelected = selectedObservations.includes(observation);
          return (
            <TouchableOpacity
              key={observation}
              style={[
                styles.chip,
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
    color: AppColors.text,
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
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.text,
    opacity: 0.3,
    shadowColor: AppColors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: AppColors.action,
    borderColor: AppColors.action,
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
    color: AppColors.text,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: AppColors.white,
    fontWeight: "600",
  },
  chipTextDisabled: {
    opacity: 0.5,
  },
});
