'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Service, Environment, Member } from '../types';
import { supabase } from '../lib/supabase';

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  plan?: 'free' | 'pro' | 'plus';
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  selectedEnvironments: Environment[];
  setSelectedEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>;
  selectedEnvironment: Environment | null;
  setSelectedEnvironment: (env: Environment | null) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  services: Service[];
  toggleServiceStatus: (id: string) => void;
  addService: (service: Omit<Service, 'id' | 'slug' | 'environments'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  removeService: (id: string) => void;
  approveService: (id: string) => void;
  rejectService: (id: string) => void;
  members: Member[];
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  approveMember: (id: string) => void;
  rateService: (id: string, stars: number, comment?: string) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Login automático desabilitado para testes
    // if (typeof window !== 'undefined') {
    //   const saved = localStorage.getItem('zapzou_user');
    //   if (saved) {
    //     setUser(JSON.parse(saved));
    //   }
    // }
  }, []);

  const defaultEnvironments = [
    { id: '1', slug: 'residencial-aurora', name: 'Residencial Aurora', type: 'residential' as const, members: 120, image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200', isSelected: true },
    { id: '2', slug: 'condominio-solar', name: 'Condomínio Solar', type: 'residential' as const, members: 85, image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=200', isSelected: false }
  ];

  const [selectedEnvironments, setSelectedEnvironments] = useState<Environment[]>(defaultEnvironments);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedServices = localStorage.getItem('zapzou_services');
      if (savedServices) {
        setServices(JSON.parse(savedServices));
      } else {
        setServices([
          {
            id: '1',
            slug: 'marmitas-da-julia',
            title: 'Marmitas da Julia',
            description: 'Cozinhamos com o coração para levar até você o verdadeiro sabor da comida caseira com o equilíbrio da linha fit. Ingredientes selecionados diariamente para garantir frescor e saúde na sua mesa.',
            category: 'Alimentação',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
            images: [
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
              'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
              'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800'
            ],
            rating: 4.9,
            reviews: 128,
            provider: 'Julia Santos',
            WhatsApp: '5511999999999',
            instagram: 'https://instagram.com/marmitasdajulia',
            status: 'active' as const,
            isActive: true,
            environmentId: '1',
            environmentSlug: 'residencial-aurora',
            tags: ['Sem Conservantes', 'Opções Veggie'],
            verified: true,
            menu: [
              { id: 'm1', name: 'Marmita Pequena (350g)', description: 'Ideal para um almoço leve', price: 'R$ 25', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' },
              { id: 'm2', name: 'Marmita Média (500g)', description: 'Nossa campeã de vendas', price: 'R$ 32', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200' },
              { id: 'm3', name: 'Combo Semanal (5 un.)', description: 'Praticidade para sua semana', price: 'R$ 145', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200' }
            ]
          },
          {
            id: '2',
            slug: 'limpeza-residencial',
            title: 'Limpeza Residencial',
            description: 'Serviço de limpeza doméstica com produtos ecológicos e biodegradáveis. Deixe sua casa impecável e segura.',
            category: 'Limpeza',
            image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
            rating: 4.7,
            reviews: 45,
            provider: 'Maria Silva',
            WhatsApp: '5511888888888',
            instagram: '@limpezamaria',
            status: 'active' as const,
            isActive: true,
            environmentId: '1',
            environmentSlug: 'residencial-aurora',
            verified: true,
            menu: [
              { id: 'm4', name: 'Limpeza Completa', description: '2h de serviço', price: 'R$ 120' },
              { id: 'm5', name: 'Limpeza Rápida', description: '1h de serviço', price: 'R$ 80' }
            ]
          },
          {
            id: '3',
            slug: 'dog-walker-pedro',
            title: 'Dog Walker - Pedro',
            description: 'Passeios diários para seu cão de estimação.amoroso e responsável.',
            category: 'Pet Sitting',
            image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
            rating: 5.0,
            reviews: 23,
            provider: 'Pedro Santos',
            WhatsApp: '5511777777777',
            status: 'active' as const,
            isActive: true,
            environmentId: '1',
            environmentSlug: 'residencial-aurora',
            tags: ['Pet Friendly']
          }
        ]);
      }
      const savedEnvs = localStorage.getItem('zapzou_environments');
      if (savedEnvs) {
        try {
          const parsed = JSON.parse(savedEnvs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedEnvironments(parsed);
          }
        } catch (e) {
          console.log('Erro ao carregar ambientes');
        }
      }
      setLocalLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localLoaded) {
      try {
        const servicesToSave = services.map(s => ({
          ...s,
          image: s.image?.length > 500000 ? '' : s.image,
          images: s.images?.map((img: string) => img.length > 500000 ? '' : img).filter(Boolean)
        }));
        localStorage.setItem('zapzou_services', JSON.stringify(servicesToSave));
      } catch (e) {
        console.log('localStorage cheio, limpando dados antigos');
        localStorage.removeItem('zapzou_services');
      }
    }
  }, [services, localLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localLoaded) {
      try {
        localStorage.setItem('zapzou_environments', JSON.stringify(selectedEnvironments));
      } catch (e) {
        console.log('localStorage cheio');
      }
    }
  }, [selectedEnvironments, localLoaded]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        
        const { data: envs, error: envError } = await supabase
          .from('environments')
          .select('*')
          .order('name');
        
        if (envs && !envError && envs.length > 0 && selectedEnvironments.length === 0) {
          const formattedEnvs = envs.map((e: any) => ({
            id: e.id,
            name: e.name,
            slug: generateSlug(e.name),
            type: e.type,
            members: 0,
            image: e.image_url || '',
            isSelected: false,
            status: e.status,
            latitude: e.latitude,
            longitude: e.longitude
          }));
          setSelectedEnvironments(formattedEnvs);
        }

        const { data: svc, error: svcError } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false });

        if (svc && !svcError && svc.length > 0) {
          const formattedServices = svc.map((s: any) => ({
            id: s.id,
            slug: s.slug || generateSlug(s.title),
            title: s.title,
            description: s.description,
            category: s.category,
            image: s.image_url || '',
            images: s.images_urls || [],
            provider: 'User',
            status: s.status as any,
            isActive: s.is_active,
            environmentId: s.environment_id,
            WhatsApp: s.whatsapp,
            instagram: s.instagram,
            frequency: s.frequency,
            menu: s.menu || [],
            latitude: s.latitude,
            longitude: s.longitude
          }));
          setServices(formattedServices);
        }
      } catch (err) {
        console.log('Supabase não disponível, usando dados locais');
      } finally {
        setLoading(false);
      }
    }
    if (localLoaded) {
      init();
    }
  }, [localLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('zapzou_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zapzou_selected_env');
      if (saved) {
        const parsed = JSON.parse(saved);
        const env = selectedEnvironments.find(e => e.id === parsed.id);
        if (env) {
          setSelectedEnvironment(env);
        }
      } else if (selectedEnvironments.length > 0) {
        setSelectedEnvironment(selectedEnvironments[0]);
      }
    }
  }, [selectedEnvironments]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedEnvironment) {
      localStorage.setItem('zapzou_selected_env', JSON.stringify(selectedEnvironment));
    }
  }, [selectedEnvironment]);

  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Ricardo Silveira', email: 'ricardo.silva@email.com', unit: 'Torre A • Apto 104', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: '2', name: 'Ana Martins', email: 'ana.martins@email.com', unit: 'Torre B • Apto 302', initials: 'AM' },
    { id: '3', name: 'Beatriz Souza', email: 'beatriz.souza@email.com', unit: 'Torre A • Apto 501', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
    { id: '4', name: 'Fernando Oliveira', email: 'fernando.oliveira@email.com', unit: 'Torre C • Apto 12', initials: 'FO' },
    { id: '5', name: 'Marcos Oliveira', email: 'marcos.oliver@email.com', unit: 'Torre C • Apto 402', isPending: true },
    { id: '6', name: 'Carla Mendes', email: 'carla.mendes@email.com', unit: 'Torre B • Apto 115', isPending: true },
  ]);

  const updateEnvironment = async (id: string, updates: Partial<Environment>) => {
    const { error } = await supabase
      .from('environments')
      .update({
        name: updates.name,
        image_url: updates.image,
        status: updates.status
      })
      .eq('id', id);

    if (!error) {
      setSelectedEnvironments(prev => prev.map(env => 
        env.id === id ? { ...env, ...updates } : env
      ));
    }
  };

  const toggleServiceStatus = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;

    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.isActive })
      .eq('id', id);

    if (!error) {
      setServices(services.map(s => 
        s.id === id ? { ...s, isActive: !s.isActive } : s
      ));
    }
  };

  const addService = async (service: any) => {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newSlug = generateSlug(service.title);
    const env = selectedEnvironments.find(e => e.id === service.environmentId);
    const newServiceWithId = { 
      ...service, 
      id: newId, 
      slug: newSlug,
      environmentSlug: env?.slug,
      environments: service.environmentId ? [{ id: service.environmentId, slug: env?.slug || '' }] : []
    } as Service;
    
    setServices(prev => [...prev, newServiceWithId]);
    
    try {
      const { error } = await supabase
        .from('services')
        .insert([{
          title: service.title,
          description: service.description,
          category: service.category,
          image_url: service.image,
          images_urls: service.images,
          whatsapp: service.WhatsApp,
          instagram: service.instagram,
          frequency: service.frequency,
          status: service.status,
          is_active: true,
          environment_id: service.environmentId,
          environments: service.environments
        }]);

      if (error) {
        console.log('Serviço adicionado localmente (Supabase não configurado)');
      }
    } catch (err) {
      console.log('Serviço adicionado localmente');
    }
  };

  const updateService = async (id: string, updatedFields: Partial<Service>) => {
    const { error } = await supabase
      .from('services')
      .update({
        title: updatedFields.title,
        description: updatedFields.description,
        category: updatedFields.category,
        image_url: updatedFields.image,
        images_urls: updatedFields.images,
        whatsapp: updatedFields.WhatsApp,
        instagram: updatedFields.instagram,
        frequency: updatedFields.frequency,
        status: updatedFields.status,
        is_active: updatedFields.isActive
      })
      .eq('id', id);

    if (!error) {
      const updatedSlug = updatedFields.title ? generateSlug(updatedFields.title) : undefined;
      setServices(services.map(s => 
        s.id === id ? { ...s, ...updatedFields, slug: updatedSlug || s.slug } : s
      ));
    }
  };

  const removeService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (!error) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const approveService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .update({ status: 'active', is_active: true })
      .eq('id', id);

    if (!error) {
      setServices(services.map(s => 
        s.id === id ? { ...s, status: 'active', isActive: true } : s
      ));
    }
  };

  const rejectService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .update({ status: 'rejected', is_active: false })
      .eq('id', id);

    if (!error) {
      setServices(services.map(s => 
        s.id === id ? { ...s, status: 'rejected', isActive: false } : s
      ));
    }
  };

  const addMember = (member: Member) => {
    setMembers([...members, { ...member, id: Date.now().toString() }]);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const approveMember = (id: string) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, isPending: false } : m
    ));
  };

  const rateService = async (id: string, stars: number, comment?: string) => {
    const { error } = await supabase
      .from('reviews')
      .insert([{
        service_id: id,
        stars,
        comment: comment || ''
      }]);

    if (!error) {
      setServices(services.map(s => {
        if (s.id === id) {
          const currentReviews = s.reviews || 0;
          const currentRating = s.rating || 0;
          const newReviews = currentReviews + 1;
          const newRating = Number(((currentRating * currentReviews + stars) / newReviews).toFixed(1));
          return { ...s, reviews: newReviews, rating: newRating };
        }
        return s;
      }));
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      selectedEnvironments,
      setSelectedEnvironments,
      selectedEnvironment,
      setSelectedEnvironment,
      updateEnvironment,
      services,
      toggleServiceStatus,
      addService,
      updateService,
      removeService,
      approveService,
      rejectService,
      members,
      addMember,
      removeMember,
      approveMember,
      rateService,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
