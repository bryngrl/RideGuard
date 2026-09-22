import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

import type { ProfilePayload } from './profile.types';

export async function submitProfile(payload: ProfilePayload): Promise<void> {
  await apiClient.post<ApiResponse<unknown>>('/profile/personal-info', payload);
}
