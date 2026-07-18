export const SERVICE_CATEGORIES = [
  { id: "alimentacao", label: "Alimentação", icon: "restaurant" },
  { id: "limpeza", label: "Limpeza", icon: "cleaning_services" },
  { id: "manutencao", label: "Manutenção", icon: "engineering" },
  { id: "oficina", label: "Mecânica", icon: "car_repair" },
  { id: "revenda", label: "Veículos", icon: "garage" },
  { id: "agro-pets", label: "Pets", icon: "pets" },
  { id: "beleza", label: "Beleza", icon: "content_cut" },
  { id: "tecnologia", label: "Tecnologia", icon: "terminal" },
  { id: "construcao", label: "Construção", icon: "construction" },
  { id: "saude", label: "Saúde", icon: "medical_services"},
  { id: "eventos", label: "Eventos", icon: "event" },
  { id: "religioso", label: "Religião", icon: "church" },
  { id: "vestuário", label: "Moda", icon: "apparel" },
  { id: "transporte", label: "Transporte", icon: "commute"},
  { id: "outros", label: "Outros", icon: "category" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["label"];
