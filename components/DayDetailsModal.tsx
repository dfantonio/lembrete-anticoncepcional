import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ObservationsSelector } from "@/components/ObservationsSelector";
import {
  OBSERVATION_EMOJIS,
  OBSERVATION_LABELS,
} from "@/constants/observations";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { FirestoreService } from "@/src/services/firestoreService";
import { DailyLog, ObservationType } from "@/src/types";

interface DayDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  dailyLog: DailyLog | null;
  dateKey: string;
  onDataChanged: () => void;
}

export function DayDetailsModal({
  visible,
  onClose,
  dailyLog,
  dateKey,
  onDataChanged,
}: DayDetailsModalProps) {
  const { colors } = useAppTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedObservations, setSelectedObservations] = useState<
    ObservationType[]
  >(dailyLog?.observations || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditObservations = () => {
    setIsEditing(true);
    setSelectedObservations(dailyLog?.observations || []);
  };

  const handleSaveObservations = async () => {
    try {
      setIsLoading(true);

      if (!dailyLog) {
        throw new Error("Log diário não encontrado");
      }

      const updatedLog: DailyLog = {
        ...dailyLog,
        observations:
          selectedObservations.length > 0 ? selectedObservations : undefined,
      };

      await FirestoreService.saveDailyLog(dateKey, updatedLog);
      setIsEditing(false);
      onDataChanged();

      Alert.alert("Sucesso", "Observações atualizadas com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar observações:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar as observações. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedObservations(dailyLog?.observations || []);
  };

  const handleDeleteRecord = () => {
    Alert.alert(
      "Excluir Registro",
      "Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await FirestoreService.deleteDailyLog(dateKey);
              onDataChanged();
              onClose();
              Alert.alert("Sucesso", "Registro excluído com sucesso!");
            } catch (error) {
              console.error("❌ Erro ao excluir registro:", error);
              Alert.alert(
                "Erro",
                "Não foi possível excluir o registro. Tente novamente."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderObservations = () => {
    if (!dailyLog?.observations || dailyLog.observations.length === 0) {
      return (
        <Text
          style={[styles.noObservationsText, { color: colors.textSecondary }]}
        >
          Nenhuma observação registrada
        </Text>
      );
    }

    return (
      <View style={styles.observationsContainer}>
        {dailyLog.observations.map((observation) => (
          <View
            key={observation}
            style={[
              styles.observationChip,
              { backgroundColor: colors.action, shadowColor: colors.text },
            ]}
          >
            <Text style={styles.observationEmoji}>
              {OBSERVATION_EMOJIS[observation]}
            </Text>
            <Text style={styles.observationText}>
              {OBSERVATION_LABELS[observation]}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.base }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.text }]}>
              ✕
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Detalhes do Dia
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Data */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data
            </Text>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(dateKey)}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Status
            </Text>
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: colors.surface, shadowColor: colors.text },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: dailyLog?.taken ? colors.success : colors.alert,
                  },
                ]}
              >
                {dailyLog?.taken ? "✅ Pílula Tomada" : "❌ Pílula Não Tomada"}
              </Text>
              {dailyLog?.takenTime && (
                <Text
                  style={[styles.timeText, { color: colors.textSecondary }]}
                >
                  às {dailyLog.takenTime}
                </Text>
              )}
            </View>
          </View>

          {/* Observações */}
          <View style={styles.section}>
            <View style={styles.observationsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Observações
              </Text>
              {!isEditing && dailyLog?.taken && (
                <Button
                  variant="outlined"
                  title="Editar"
                  size="small"
                  onPress={handleEditObservations}
                  disabled={isLoading}
                />
              )}
            </View>

            {isEditing ? (
              <View
                style={[
                  styles.editingContainer,
                  { backgroundColor: colors.surface, shadowColor: colors.text },
                ]}
              >
                <ObservationsSelector
                  selectedObservations={selectedObservations}
                  onToggleObservation={(obs) => {
                    setSelectedObservations((prev) =>
                      prev.includes(obs)
                        ? prev.filter((o) => o !== obs)
                        : [...prev, obs]
                    );
                  }}
                />

                <View style={styles.editActions}>
                  <Button
                    variant="outlined"
                    title="Cancelar"
                    onPress={handleCancelEdit}
                    disabled={isLoading}
                  />
                  <Button
                    title="Salvar"
                    onPress={handleSaveObservations}
                    disabled={isLoading}
                  />
                </View>
              </View>
            ) : (
              renderObservations()
            )}
          </View>

          {/* Ações */}
          {dailyLog?.taken && (
            <View style={styles.actionsSection}>
              <TouchableOpacity
                onPress={handleDeleteRecord}
                style={[
                  styles.deleteButton,
                  { backgroundColor: colors.alert, shadowColor: colors.alert },
                ]}
                disabled={isLoading}
              >
                <Text style={styles.deleteButtonText}>🗑️ Excluir Registro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    ...Typography.h2,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  dateText: {
    ...Typography.body,
    textTransform: "capitalize",
  },
  statusContainer: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusText: {
    fontWeight: "600",
  },
  timeText: {
    ...Typography.body,
    marginTop: 4,
    opacity: 0.7,
  },
  observationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  editingContainer: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    opacity: 0.1,
    alignItems: "center",
  },
  cancelButtonText: {
    ...Typography.button,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
  },
  observationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  observationChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  observationEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  observationText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  noObservationsText: {
    ...Typography.body,
    opacity: 0.5,
    fontStyle: "italic",
  },
  actionsSection: {
    marginTop: "auto",
    paddingTop: 20,
  },
  deleteButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    ...Typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
