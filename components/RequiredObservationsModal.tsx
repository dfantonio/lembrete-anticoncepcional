import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ObservationsSelector } from "@/components/ObservationsSelector";
import { ObservationField } from "@/constants/observations";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { ObservationType, ObservationValue } from "@/src/types";

type ObservationMap = Partial<Record<ObservationType, ObservationValue>>;

interface RequiredObservationsModalProps {
  visible: boolean;
  /** Campos obrigatórios que ainda precisam ser preenchidos */
  fields: ObservationField[];
  /** Valores já selecionados (pré-preenche o seletor) */
  initialValues: ObservationMap;
  onComplete: (values: ObservationMap) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function RequiredObservationsModal({
  visible,
  fields,
  initialValues,
  onComplete,
  onCancel,
  disabled = false,
}: RequiredObservationsModalProps) {
  const { colors } = useAppTheme();
  const [values, setValues] = useState<ObservationMap>(initialValues);

  // Reinicia os valores locais sempre que o modal reabre
  useEffect(() => {
    if (visible) setValues(initialValues);
  }, [visible, initialValues]);

  const fieldIds = fields.map((f) => f.id);
  const allAnswered = fields.every((f) => values[f.id] != null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.base }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Antes de salvar 💛
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Preencha para continuar:
          </Text>

          <View style={styles.selectorWrapper}>
            <ObservationsSelector
              value={values}
              onChange={(id, value) =>
                setValues((prev) => {
                  const next = { ...prev };
                  if (value === undefined) delete next[id];
                  else next[id] = value;
                  return next;
                })
              }
              onlyFields={fieldIds}
              showTitle={false}
              disabled={disabled}
            />
          </View>

          <View style={styles.actions}>
            <Button
              variant="outlined"
              title="Cancelar"
              onPress={onCancel}
              disabled={disabled}
            />
            <Button
              title="Salvar"
              onPress={() => onComplete(values)}
              disabled={disabled || !allAnswered}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: 24,
  },
  selectorWrapper: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
});
