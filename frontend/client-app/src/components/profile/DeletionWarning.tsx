import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { DeletionStatus } from '@/src/types/deletion.types';

interface DeletionWarningProps {
  deletionStatus: DeletionStatus;
  onCancel: () => void;
}

export function DeletionWarning({ deletionStatus, onCancel }: DeletionWarningProps) {
  if (!deletionStatus.has_pending_deletion) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="warning" size={24} color={Colors.white} />
        <Text style={styles.title}>Акаунт буде видалено</Text>
      </View>
      
      <Text style={styles.description}>
        Ваш акаунт заплановано до видалення {formatDate(deletionStatus.scheduled_date!)}.
        Залишилося днів: {deletionStatus.days_remaining}
      </Text>
      
      {deletionStatus.reason && (
        <Text style={styles.reason}>
          Причина: {deletionStatus.reason}
        </Text>
      )}
      
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Скасувати видалення</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.error,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  description: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
    marginBottom: 8,
  },
  reason: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
});
