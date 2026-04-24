import { supabase } from '@/lib/supabase';

export type ServiceInteractionType =
  | 'service_view'
  | 'service_click'
  | 'whatsapp_click'
  | 'instagram_click';

type TrackServiceInteractionInput = {
  serviceId: string;
  interactionType: ServiceInteractionType;
  source?: string;
  metadata?: Record<string, unknown>;
};

export async function trackServiceInteraction({
  serviceId,
  interactionType,
  source,
  metadata,
}: TrackServiceInteractionInput): Promise<void> {
  if (!serviceId) return;

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    interaction_type: interactionType,
  };

  if (source) payload.source = source;
  if (metadata && Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  const { error } = await supabase.from('service_interactions').insert(payload);
  if (error) {
    console.warn('trackServiceInteraction failed:', error);
  }
}
