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
import { AppColors, Typography } from "@/constants/theme";
import {
  OBSERVATION_EMOJIS,
  OBSERVATION_LABELS,
} from "@/src/constants/observations";
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
        <Text style={styles.noObservationsText}>
          Nenhuma observação registrada
        </Text>
      );
    }

    return (
      <View style={styles.observationsContainer}>
        {dailyLog.observations.map((observation) => (
          <View key={observation} style={styles.observationChip}>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Dia</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>
            <Text style={styles.dateText}>{formatDate(dateKey)}</Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusContainer}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: dailyLog?.taken
                      ? AppColors.success
                      : AppColors.alert,
                  },
                ]}
              >
                {dailyLog?.taken ? "✅ Pílula Tomada" : "❌ Pílula Não Tomada"}
              </Text>
              {dailyLog?.takenTime && (
                <Text style={styles.timeText}>às {dailyLog.takenTime}</Text>
              )}
            </View>
          </View>

          {/* Observações */}
          <View style={styles.section}>
            <View style={styles.observationsHeader}>
              <Text style={styles.sectionTitle}>Observações</Text>
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
              <View style={styles.editingContainer}>
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
                style={styles.deleteButton}
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
    backgroundColor: AppColors.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: AppColors.text,
    // opacity: 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: AppColors.text,
    // color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    ...Typography.h2,
    color: AppColors.text,
    // color: "red",
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
    color: AppColors.text,
    marginBottom: 12,
  },
  dateText: {
    ...Typography.body,
    color: AppColors.text,
    textTransform: "capitalize",
  },
  statusContainer: {
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: AppColors.text,
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
    color: AppColors.text,
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
    backgroundColor: AppColors.action,
    borderRadius: 16,
  },
  editButtonText: {
    ...Typography.caption,
    color: AppColors.white,
    fontWeight: "600",
  },
  editingContainer: {
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: AppColors.text,
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
    // flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: AppColors.text,
    opacity: 0.1,
    alignItems: "center",
  },
  cancelButtonText: {
    ...Typography.button,
    color: AppColors.text,
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
    backgroundColor: AppColors.action,
    shadowColor: AppColors.text,
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
    color: AppColors.white,
    fontWeight: "600",
  },
  noObservationsText: {
    ...Typography.body,
    color: AppColors.text,
    opacity: 0.5,
    fontStyle: "italic",
  },
  actionsSection: {
    marginTop: "auto",
    paddingTop: 20,
  },
  deleteButton: {
    backgroundColor: AppColors.alert,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: AppColors.alert,
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
    color: AppColors.white,
    fontWeight: "600",
  },
});
