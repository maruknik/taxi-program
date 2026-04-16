export interface DeleteAccountRequest {
  password: string;
  reason?: string;
}

export interface DeletionStatus {
  has_pending_deletion: boolean;
  scheduled_date?: string;
  days_remaining?: number;
  reason?: string;
}

export const DELETION_REASONS = [
  'Більше не користуюся сервісом',
  'Знайшов кращу альтернативу',
  'Проблеми з конфіденційністю',
  'Технічні проблеми',
  'Інше',
] as const;
