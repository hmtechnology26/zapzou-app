export const SERVICE_CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', icon: 'restaurant' },
  { id: 'limpeza', label: 'Limpeza', icon: 'cleaning_services' },
  { id: 'manutencao', label: 'Manutenção', icon: 'engineering' },
  { id: 'bem-estar', label: 'Bem-Estar', icon: 'spa' },
  { id: 'agro-pets', label: 'Agro & Pets', icon: 'pets' },
  { id: 'beleza', label: 'Beleza', icon: 'content_cut' },
  { id: 'tecnologia', label: 'Tecnologia', icon: 'terminal' },
  { id: 'reformas', label: 'Reformas', icon: 'construction' },
  { id: 'construcao', label: 'Construção', icon: 'construction' },
  { id: 'saude', label: 'Saúde', icon: 'medical_services' },
  { id: 'eventos', label: 'Eventos', icon: 'event' },
  { id: 'pet-sitting', label: 'Pet Sitting', icon: 'pets' },
  { id: 'outros', label: 'Outros', icon: 'category' },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]['label'];
