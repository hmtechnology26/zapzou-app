'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';
import { TopAppBar } from '@/components/TopAppBar';

type PendingMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  date: string;
  createdAt: string;
  unit?: string;
};

type ActiveMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: 'member' | 'moderator' | 'resident' | 'service_provider';
  status: 'active' | 'banned';
  createdAt: string;
  unit?: string;
  servicesCount?: number;
  avgRating?: number;
};

type ReviewItem = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  userId: string;
  userName: string;
  userAvatar: string;
  stars: number;
  comment?: string;
  createdAt: string;
  isAnonymous?: boolean;
  approved?: boolean;
};

type ServiceItem = {
  id: string;
  title: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  category: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  createdAt: string;
  views: number;
};

type Stats = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  bannedMembers: number;
  totalServices: number;
  activeServices: number;
  totalReviews: number;
  avgRating: number;
};

type Tab = 'dashboard' | 'pending' | 'members' | 'services' | 'reviews';

type ModerationMemberRecord = {
  id: string;
  user_id: string;
  created_at: string;
  status: 'pending' | 'active' | 'banned';
  role: 'member' | 'moderator';
  unit?: string | null;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export default function ModerationPage() {
  const router = useRouter();
  const { user, selectedEnvironment, selectedEnvironments, setSelectedEnvironment } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const userId = user?.id ?? null;
  const managedEnvironmentIdsKey = (user?.managedEnvironmentIds ?? []).slice().sort().join('|');
  const selectedEnvironmentIdsKey = selectedEnvironments
    .map((env) => env.id)
    .sort()
    .join('|');

  const loadVisibleReviews = useCallback(async (environmentId: string) => {
    const { data: linkData } = await supabase
      .from('service_environment_links')
      .select('service_id')
      .eq('environment_id', environmentId);
    const serviceIds = (linkData || []).map(l => l.service_id);
    if (serviceIds.length === 0) return [];

    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, title')
      .in('id', serviceIds);

    if (servicesError) {
      throw servicesError;
    }

    const serviceMap = new Map((servicesData || []).map((service: any) => [service.id, service.title]));

    if (serviceIds.length === 0) {
      return [];
    }

    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved')
      .in('service_id', serviceIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (reviewsError) {
      throw reviewsError;
    }

    return (reviewsData || []).map((review: any) => ({
      id: review.id,
      serviceId: review.service_id,
      serviceTitle: serviceMap.get(review.service_id) || 'Serviço',
      userId: review.user_id,
      userName: review.user_name || 'Usuário',
      userAvatar: review.user_avatar || '',
      stars: review.stars || 0,
      comment: review.comment || '',
      createdAt: review.created_at,
      isAnonymous: review.is_anonymous,
      approved: review.approved,
    })) as ReviewItem[];
  }, []);

  const fetchStats = useCallback(async () => {
    if (!selectedEnvironment?.id) return;
    setLoadingStats(true);

    try {
      const { data: linkData } = await supabase
        .from('service_environment_links')
        .select('service_id')
        .eq('environment_id', selectedEnvironment.id);
      const envServiceIds = (linkData || []).map(l => l.service_id);

      const [membersRes, servicesRes, reviewsRes] = await Promise.all([
        supabase
          .from('environment_members')
          .select('status')
          .eq('environment_id', selectedEnvironment.id),
        envServiceIds.length > 0
          ? supabase.from('services').select('id, is_active, rating, reviews_count').in('id', envServiceIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        loadVisibleReviews(selectedEnvironment.id),
      ]);

      const members = membersRes.data || [];
      const servicesData = servicesRes.data || [];
      const reviewsData = reviewsRes || [];

      const activeCount = members.filter((m: any) => m.status === 'active').length;
      const pendingCount = members.filter((m: any) => m.status === 'pending').length;
      const bannedCount = members.filter((m: any) => m.status === 'banned').length;
      const activeServices = servicesData.filter((s: any) => s.is_active).length;

      let totalRating = 0;
      let servicesWithRating = 0;
      servicesData.forEach((s: any) => {
        if (s.rating && s.rating > 0) {
          totalRating += s.rating;
          servicesWithRating++;
        }
      });

      setStats({
        totalMembers: members.length,
        activeMembers: activeCount,
        pendingMembers: pendingCount,
        bannedMembers: bannedCount,
        totalServices: servicesData.length,
        activeServices: activeServices,
        totalReviews: reviewsData.length,
        avgRating: servicesWithRating > 0 ? Number((totalRating / servicesWithRating).toFixed(1)) : 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }

    setLoadingStats(false);
  }, [loadVisibleReviews, selectedEnvironment?.id]);

  const fetchPendingMembers = useCallback(async () => {
    if (!selectedEnvironment?.id) {
      setPendingMembers([]);
      setLoadingPending(false);
      return;
    }

    setLoadingPending(true);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_moderation_environment_members',
        { p_environment_id: selectedEnvironment.id },
      );

      if (!rpcError && Array.isArray(rpcData)) {
        const members = rpcData as ModerationMemberRecord[];
        setPendingMembers(
          members
            .filter((member) => member.status === 'pending')
            .map((member) => ({
              id: member.id,
              userId: member.user_id,
              name: member.name || 'Membro',
              email: member.email || '',
              avatar: member.avatar_url || '',
              date: member.created_at ? new Date(member.created_at).toLocaleDateString('pt-BR') : '',
              createdAt: member.created_at,
              unit: member.unit || undefined,
            })),
        );
        setLoadingPending(false);
        return;
      }

      const { data, error } = await supabase
        .from('environment_members')
        .select(`
          id,
          user_id,
          created_at,
          unit,
          user_public_profiles (name, avatar_url),
          users (email)
        `)
        .eq('environment_id', selectedEnvironment.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setPendingMembers(
          data.map((member: any) => ({
            id: member.id,
            userId: member.user_id,
            name: member.user_public_profiles?.name || 'Membro',
            email: member.users?.email || '',
            avatar: member.user_public_profiles?.avatar_url || '',
            date: member.created_at ? new Date(member.created_at).toLocaleDateString('pt-BR') : '',
            createdAt: member.created_at,
            unit: member.unit,
          })),
        );
      } else {
        setPendingMembers([]);
      }
    } catch (err) {
      console.error('Error fetching pending members:', err);
      setPendingMembers([]);
    }

    setLoadingPending(false);
  }, [selectedEnvironment?.id]);

  const fetchActiveMembers = useCallback(async () => {
    if (!selectedEnvironment?.id) {
      setActiveMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);

    try {
      const { data: linkData } = await supabase
        .from('service_environment_links')
        .select('service_id')
        .eq('environment_id', selectedEnvironment.id);
      const envServiceIds = (linkData || []).map(l => l.service_id);

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_moderation_environment_members',
        { p_environment_id: selectedEnvironment.id },
      );

      if (rpcData && !rpcError && Array.isArray(rpcData)) {
        const membersData = rpcData as ModerationMemberRecord[];
        const memberIds = membersData.map((m) => m.user_id);

        const serviceQuery = envServiceIds.length > 0
          ? supabase.from('services').select('provider_id, rating').in('id', envServiceIds).in('provider_id', memberIds)
          : supabase.from('services').select('provider_id, rating').eq('id', '00000000-0000-0000-0000-000000000000');
        const { data: servicesData } = await serviceQuery;

        const servicesByProvider = new Map<string, { count: number; totalRating: number }>();
        (servicesData || []).forEach((s: any) => {
          const existing = servicesByProvider.get(s.provider_id) || { count: 0, totalRating: 0 };
          existing.count++;
          if (s.rating) existing.totalRating += s.rating;
          servicesByProvider.set(s.provider_id, existing);
        });

        setActiveMembers(
          membersData
            .filter((member) => member.status === 'active' || member.status === 'banned')
            .map((member) => {
              const providerStats = servicesByProvider.get(member.user_id) || { count: 0, totalRating: 0 };
              return {
                id: member.id,
                userId: member.user_id,
                name: member.name || 'Membro',
                email: member.email || '',
                avatar: member.avatar_url || '',
                role: member.role,
                status: member.status,
                createdAt: member.created_at,
                unit: member.unit,
                servicesCount: providerStats.count,
                avgRating: providerStats.count > 0 ? Number((providerStats.totalRating / providerStats.count).toFixed(1)) : 0,
              };
            }),
        );
      } else {
        const { data: membersData, error: membersError } = await supabase
          .from('environment_members')
          .select(`
            id,
            user_id,
            role,
            status,
            created_at,
            unit,
            user_public_profiles (name, avatar_url),
            users (email)
          `)
          .eq('environment_id', selectedEnvironment.id)
          .in('status', ['active', 'banned'])
          .order('created_at', { ascending: false });

        if (membersData && !membersError) {
          const memberIds = membersData.map((m: any) => m.user_id);

          const serviceQuery = envServiceIds.length > 0
            ? supabase.from('services').select('provider_id, rating').in('id', envServiceIds).in('provider_id', memberIds)
            : supabase.from('services').select('provider_id, rating').eq('id', '00000000-0000-0000-0000-000000000000');
          const { data: servicesData } = await serviceQuery;

          const servicesByProvider = new Map<string, { count: number; totalRating: number }>();
          (servicesData || []).forEach((s: any) => {
            const existing = servicesByProvider.get(s.provider_id) || { count: 0, totalRating: 0 };
            existing.count++;
            if (s.rating) existing.totalRating += s.rating;
            servicesByProvider.set(s.provider_id, existing);
          });

          setActiveMembers(
            membersData.map((member: any) => {
              const providerStats = servicesByProvider.get(member.user_id) || { count: 0, totalRating: 0 };
              return {
                id: member.id,
                userId: member.user_id,
                name: member.user_public_profiles?.name || 'Membro',
                email: member.users?.email || '',
                avatar: member.user_public_profiles?.avatar_url || '',
                role: member.role,
                status: member.status,
                createdAt: member.created_at,
                unit: member.unit,
                servicesCount: providerStats.count,
                avgRating: providerStats.count > 0 ? Number((providerStats.totalRating / providerStats.count).toFixed(1)) : 0,
              };
            }),
          );
        } else {
          setActiveMembers([]);
        }
      }
    } catch (err) {
      console.error('Error fetching active members:', err);
      setActiveMembers([]);
    }

    setLoadingMembers(false);
  }, [selectedEnvironment?.id]);

  const fetchServices = useCallback(async () => {
    if (!selectedEnvironment?.id) {
      setServices([]);
      setLoadingServices(false);
      return;
    }

    setLoadingServices(true);

    try {
      const { data: linkData } = await supabase
        .from('service_environment_links')
        .select('service_id')
        .eq('environment_id', selectedEnvironment.id);
      const serviceIds = (linkData || []).map(l => l.service_id);

      if (serviceIds.length === 0) {
        setServices([]);
        setLoadingServices(false);
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          provider_id,
          provider,
          category,
          rating,
          reviews_count,
          is_active,
          created_at,
          views,
          user_public_profiles (avatar_url)
        `)
        .in('id', serviceIds)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setServices(
          data.map((s: any) => ({
            id: s.id,
            title: s.title,
            providerId: s.provider_id,
            providerName: s.provider,
            providerAvatar: s.user_public_profiles?.avatar_url || '',
            category: s.category,
            rating: s.rating || 0,
            reviewsCount: s.reviews_count || 0,
            isActive: s.is_active,
            createdAt: s.created_at,
            views: s.views || 0,
          })),
        );
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices([]);
    }

    setLoadingServices(false);
  }, [selectedEnvironment?.id]);

  const fetchReviews = useCallback(async () => {
    if (!selectedEnvironment?.id) {
      setReviews([]);
      setLoadingReviews(false);
      return;
    }

    setLoadingReviews(true);

    try {
      const visibleReviews = await loadVisibleReviews(selectedEnvironment.id);
      setReviews(visibleReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    }

    setLoadingReviews(false);
  }, [loadVisibleReviews, selectedEnvironment?.id]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedEnvironment?.id) {
      setPendingMembers([]);
      setActiveMembers([]);
      setReviews([]);
      setServices([]);
      setStats(null);
      setLoadingPending(false);
      setLoadingMembers(false);
      setLoadingReviews(false);
      setLoadingServices(false);
      setLoadingStats(false);
      setAccessLoading(false);
      return;
    }

    const managedEnvironmentIds = user?.managedEnvironmentIds || [];
    if (managedEnvironmentIds.length > 0 && !managedEnvironmentIds.includes(selectedEnvironment.id)) {
      const targetEnvironment = selectedEnvironments.find((env) => managedEnvironmentIds.includes(env.id));
      if (targetEnvironment) {
        setSelectedEnvironment(targetEnvironment);
        return;
      }
    }

    const verifyAccess = async () => {
      setAccessLoading(true);

      const { data, error } = await supabase
        .from('environment_members')
        .select('role, status')
        .eq('user_id', user.id)
        .eq('environment_id', selectedEnvironment.id)
        .maybeSingle();

      const canManage = !error && data?.role === 'moderator' && data?.status === 'active';

      if (!canManage) {
        setPendingMembers([]);
        setActiveMembers([]);
        setReviews([]);
        setServices([]);
        setStats(null);
        setLoadingPending(false);
        setLoadingMembers(false);
        setLoadingReviews(false);
        setLoadingServices(false);
        setLoadingStats(false);
        setAccessLoading(false);
        router.replace('/profile');
        return;
      }

      await Promise.all([fetchStats(), fetchPendingMembers(), fetchActiveMembers(), fetchServices(), fetchReviews()]);
      setAccessLoading(false);
    };

    void verifyAccess();
  }, [userId, managedEnvironmentIdsKey, selectedEnvironment?.id, selectedEnvironmentIdsKey, fetchStats, fetchPendingMembers, fetchActiveMembers, fetchServices, fetchReviews, router, setSelectedEnvironment]);

  const handleApprove = async (memberId: string) => {
    setActionLoading(memberId);
    const { error } = await supabase
      .from('environment_members')
      .update({ status: 'active' })
      .eq('id', memberId);

    if (!error) {
      setPendingMembers((prev) => prev.filter((member) => member.id !== memberId));
      await Promise.all([fetchActiveMembers(), fetchStats()]);
    } else {
      alert('Erro ao aprovar membro: ' + error.message);
    }
    setActionLoading(null);
  };

  const handleReject = async (memberId: string) => {
    if (!window.confirm('Deseja realmente recusar este pedido? O registro será excluído.')) return;

    setActionLoading(memberId);
    const { error } = await supabase
      .from('environment_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      setPendingMembers((prev) => prev.filter((member) => member.id !== memberId));
      await fetchStats();
    } else {
      alert('Erro ao recusar membro: ' + error.message);
    }
    setActionLoading(null);
  };

  const handleToggleMember = async (memberId: string, activate: boolean) => {
    const action = activate ? 'ativar' : 'desativar';
    if (!window.confirm(`Deseja realmente ${action} este membro? Os serviços dele serão ${activate ? 'ativados' : 'ocultados'} temporariamente.`)) return;

    setActionLoading(memberId);
    try {
      const { error } = await supabase.rpc('toggle_member_status', {
        p_member_id: memberId,
        p_active: activate,
      });

      if (error) {
        throw error;
      }

      await Promise.all([fetchActiveMembers(), fetchServices(), fetchStats()]);
    } catch (err: any) {
      alert('Erro ao atualizar membro: ' + (err.message || 'Erro desconhecido'));
    }
    setActionLoading(null);
  };

  const handleToggleService = async (serviceId: string, activate: boolean) => {
    setActionLoading(serviceId);
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: activate })
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, isActive: activate } : s)));
      await fetchStats();
    } catch (err: any) {
      alert('Erro ao atualizar serviço: ' + (err.message || 'Erro desconhecido'));
    }
    setActionLoading(null);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Deseja realmente excluir esta avaliação?')) return;

    setActionLoading(reviewId);
    try {
      const { error } = await supabase.rpc('delete_review', {
        p_review_id: reviewId,
      });

      if (error) {
        throw error;
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      await fetchStats();
    } catch (err: any) {
      alert('Erro ao excluir avaliação: ' + (err.message || 'Erro desconhecido'));
    }
    setActionLoading(null);
  };

  const handleApproveReview = async (reviewId: string) => {
    if (!window.confirm('Aprovar esta avaliação? Ela será exibida no serviço.')) return;

    setActionLoading(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true })
        .eq('id', reviewId);

      if (error) {
        throw error;
      }

      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, approved: true } : r)));
      await fetchStats();
    } catch (err: any) {
      alert('Erro ao aprovar avaliação: ' + (err.message || 'Erro desconhecido'));
    }
    setActionLoading(null);
  };
  const renderStars = (stars: number, size = 14) => {
    return (
      <div className="flex items-center gap-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon
            key={n}
            icon={n <= stars ? 'star' : 'star_border'}
            size={size}
            grade={n <= stars ? 0 : -25}
            className={n <= stars ? 'text-amber-400' : 'text-outline-variant'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Painel', icon: 'dashboard' },
    { key: 'pending', label: 'Pendentes', icon: 'hourglass_empty' },
    { key: 'members', label: 'Membros', icon: 'group' },
    { key: 'services', label: 'Serviços', icon: 'storefront' },
    { key: 'reviews', label: 'Avaliações', icon: 'star_rate' },
  ];

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(15,23,42,0.03)_100%)] pb-24">
      <TopAppBar />

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-8 pt-16 md:space-y-6 md:px-8 md:pt-20">
        <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-primary/10 bg-surface-container-lowest/90 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-[#04193D]/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-5 md:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#04193D]/10 text-[#04193d] shadow-sm">
                  <Icon icon="admin_panel_settings" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-on-surface md:text-3xl">Painel do líder</h1>
                  <p className="text-sm font-medium text-on-surface-variant">{selectedEnvironment?.name || 'Ambiente'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {stats && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#04193D]/20 bg-[#04193D]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#04193d]">
                    <Icon icon="group" size={14} />
                    {stats.activeMembers} membros ativos
                  </span>
                )}
              </div>
            </div>

            
          </div>
        </section>

        <div className="rounded-[1.5rem] border border-outline-variant/10 bg-surface-container-lowest/80 p-2 shadow-sm backdrop-blur">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-[#04193D] text-white shadow-lg shadow-[#04193D]/25'
                    : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon icon={tab.icon} size={18} />
                {tab.label}
                {tab.key === 'pending' && stats?.pendingMembers ? (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-xs">{stats.pendingMembers}</span>
                ) : null}
                {tab.key === 'reviews' && stats?.totalReviews ? (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-xs">{stats.totalReviews}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {loadingStats ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : stats && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                  <div className="h-[92px] bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/10 flex flex-col justify-between sm:h-auto sm:min-h-[132px] sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-[#04193D]/10 flex items-center justify-center">
                        <Icon icon="group" size={14} className="text-[#04193D]" />
                      </div>
                      <span className="text-on-surface-variant text-xs font-medium">Membros</span>
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface">{stats.activeMembers}</p>
                    <p className="text-on-surface-variant text-xs">de {stats.totalMembers} ativos</p>
                  </div>

                  <div className="h-[92px] bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/10 flex flex-col justify-between sm:h-auto sm:min-h-[132px] sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Icon icon="hourglass_empty" size={14} className="text-amber-500" />
                      </div>
                      <span className="text-on-surface-variant text-xs font-medium">Pendências</span>
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface">{stats.pendingMembers}</p>
                    <p className="text-on-surface-variant text-xs">solicitações pendentes</p>
                  </div>

                  <div className="h-[92px] bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/10 flex flex-col justify-between sm:h-auto sm:min-h-[132px] sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Icon icon="storefront" size={14} className="text-blue-500" />
                      </div>
                      <span className="text-on-surface-variant text-xs font-medium">Serviços</span>
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface">{stats.activeServices}</p>
                    <p className="text-on-surface-variant text-xs">de {stats.totalServices} publicados</p>
                  </div>

                  <div className="h-[92px] bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/10 flex flex-col justify-between sm:h-auto sm:min-h-[132px] sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-400/10 flex items-center justify-center">
                        <Icon icon="star" size={14} className="text-amber-400" />
                      </div>
                      <span className="text-on-surface-variant text-xs font-medium">Avaliações</span>
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface flex items-center gap-1">
                      {stats.avgRating}
                      <Icon icon="star" size={12} className="text-amber-400" />
                    </p>
                    <p className="text-on-surface-variant text-xs">{stats.totalReviews} avaliações</p>
                  </div>
                </div>

                {stats.bannedMembers > 0 && (
                  <div className="bg-error/5 border border-error/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                      <Icon icon="block" size={20} className="text-error" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface text-sm">Membros bloqueados</p>
                      <p className="text-on-surface-variant text-xs">{stats.bannedMembers} membro(s) inativos</p>
                    </div>
                  </div>
                )}

                {stats.pendingMembers > 0 && (
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 hover:bg-amber-500/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Icon icon="pending_actions" size={20} className="text-amber-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-on-surface text-sm">Você tem {stats.pendingMembers} solicitação(ões) pendente(s)</p>
                      <p className="text-on-surface-variant text-xs">Clique para analisar</p>
                    </div>
                    <Icon icon="chevron_right" size={20} className="text-on-surface-variant" />
                  </button>
                )}

                <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10">
                  <h3 className="font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
                    <Icon icon="insights" size={18} className="text-on-surface-variant" />
                    Resumo da Comunidade
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Total de membros</span>
                      <span className="font-semibold text-on-surface">{stats.totalMembers}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Membros ativos</span>
                      <span className="font-semibold text-[#04193D]">{stats.activeMembers}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Total de serviços</span>
                      <span className="font-semibold text-on-surface">{stats.totalServices}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Serviços ativos</span>
                      <span className="font-semibold text-blue-500">{stats.activeServices}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-on-surface-variant">Nota média</span>
                      <span className="font-semibold text-amber-500 flex items-center gap-1">
                        {stats.avgRating} <Icon icon="star" size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-3">
            {loadingPending ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingMembers.length === 0 ? (
              <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#04193D]/10 flex items-center justify-center mb-4">
                  <Icon icon="check_circle" size={32} className="text-[#04193D]" />
                </div>
                <h3 className="text-on-surface font-semibold text-lg mb-1">Tudo limpo!</h3>
                <p className="text-on-surface-variant text-sm">Não há solicitações pendentes.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-2">
                <Icon icon="info" size={18} className="text-amber-600" />
                <span className="text-amber-700 text-sm font-medium">{pendingMembers.length} solicitação(ões) aguardando aprovação</span>
              </div>
            )}

            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 hover:border-[#04193D]/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-amber-500/30">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <Icon icon="person" size={28} className="text-on-surface-variant" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center border-2 border-surface-container-lowest">
                      <Icon icon="hourglass_empty" size={10} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-on-surface capitalize truncate">{member.name}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate mb-2 flex items-center gap-1">
                      <Icon icon="email" size={12} />
                      {member.email || 'Email indisponível'}
                    </p>
                    {member.unit && (
                      <p className="text-xs text-on-surface-variant bg-surface-container-low inline-flex items-center gap-1 px-2 py-1 rounded-lg mb-2">
                        <Icon icon="home" size={12} />
                        {member.unit}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
                      <Icon icon="schedule" size={12} />
                      Solicitado em {member.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/10">
                  <button
                    onClick={() => handleReject(member.id)}
                    disabled={actionLoading === member.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-error/10 text-error font-medium text-sm hover:bg-error/20 transition-all disabled:opacity-50"
                  >
                    <Icon icon="close" size={18} />
                    Recusar
                  </button>
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={actionLoading === member.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#04193D] text-white font-medium text-sm hover:bg-[#259128] transition-all shadow-lg shadow-[#04193D]/25 disabled:opacity-50"
                  >
                    <Icon icon="check" size={18} />
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-3">
            {loadingMembers ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activeMembers.length === 0 ? (
              <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <Icon icon="group_off" size={48} className="text-on-surface-variant/30 mb-4" />
                <h3 className="text-on-surface font-semibold text-lg mb-1">Nenhum membro</h3>
                <p className="text-on-surface-variant text-sm">Não há membros neste ambiente.</p>
              </div>
            ) : (
              activeMembers.map((member) => (
                <div
                  key={member.id}
                  className={`bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 transition-all ${
                    member.status === 'banned' ? 'opacity-60 bg-error/5 border-error/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <Icon icon="person" size={28} className="text-on-surface-variant" />
                        )}
                      </div>
                      {member.status === 'banned' && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-error flex items-center justify-center border-2 border-surface-container-lowest">
                          <Icon icon="block" size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-on-surface capitalize truncate">{member.name}</p>
                        {member.role === 'moderator' && (
                          <span className="bg-[#04193D]/10 text-[#259128] text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border border-[#04193D]/20">
                            <Icon icon="verified" size={10} className="mr-1" />
                            Líder
                          </span>
                        )}
                        {member.status === 'banned' && (
                          <span className="bg-error/10 text-error text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border border-error/20">
                            <Icon icon="block" size={10} className="mr-1" />
                            Bloqueado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate mb-2 flex items-center gap-1">
                        <Icon icon="email" size={12} />
                        {member.email || 'Email indisponível'}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        {member.unit && (
                          <span className="flex items-center gap-1">
                            <Icon icon="home" size={12} />
                            {member.unit}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Icon icon="calendar_today" size={12} />
                          {formatDate(member.createdAt)}
                        </span>
                      </div>

                      {member.servicesCount !== undefined && member.servicesCount > 0 && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant/10">
                          <div className="flex items-center gap-1 text-xs">
                            <Icon icon="storefront" size={12} className="text-blue-500" />
                            <span className="text-on-surface-variant">{member.servicesCount ?? 0} serviço(s)</span>
                          </div>
                          {(member.avgRating ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              {renderStars(member.avgRating ?? 0, 12)}
                              <span className="text-on-surface-variant">({member.avgRating ?? 0})</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {member.role !== 'moderator' && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.status === 'active'}
                            onChange={(e) => handleToggleMember(member.id, e.target.checked)}
                            disabled={actionLoading === member.id}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04193D] disabled:opacity-50">
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-3">
            {loadingServices ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <Icon icon="storefront" size={48} className="text-on-surface-variant/30 mb-4" />
                <h3 className="text-on-surface font-semibold text-lg mb-1">Sem serviços</h3>
                <p className="text-on-surface-variant text-sm">Nenhum serviço publicado neste ambiente.</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className={`bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 transition-all ${
                    !service.isActive ? 'opacity-60 bg-error/5 border-error/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20 shrink-0">
                      {service.providerAvatar ? (
                        <img src={service.providerAvatar} alt={service.providerName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <Icon icon="storefront" size={20} className="text-on-surface-variant" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-on-surface truncate">{service.title}</p>
                        {!service.isActive && (
                          <span className="bg-error/10 text-error text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border border-error/20">
                            <Icon icon="visibility_off" size={10} className="mr-1" />
                            Oculto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-2">
                        <Icon icon="person" size={12} />
                        {service.providerName}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                        <span className="bg-surface-container-low px-2 py-1 rounded-lg flex items-center gap-1">
                          <Icon icon="category" size={12} />
                          {service.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon="visibility" size={12} />
                          {formatNumber(service.views)} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon="chat_bubble" size={12} />
                          {service.reviewsCount} avaliações
                        </span>
                        {service.rating > 0 && (
                          <span className="flex items-center gap-1 text-amber-500">
                            {renderStars(service.rating, 12)}
                            <span className="text-on-surface-variant">({service.rating})</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={service.isActive}
                          onChange={(e) => handleToggleService(service.id, e.target.checked)}
                          disabled={actionLoading === service.id}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04193D] disabled:opacity-50">
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {loadingReviews ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <Icon icon="star_rate" size={48} className="text-on-surface-variant/30 mb-4" />
                <h3 className="text-on-surface font-semibold text-lg mb-1">Sem avaliações</h3>
                <p className="text-on-surface-variant text-sm">Nenhuma avaliação nos serviços deste ambiente.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 ${review.isAnonymous ? 'border-amber-300/30 bg-amber-50/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {review.isAnonymous ? (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden border border-amber-300/30 shrink-0">
                        <Icon icon="visibility_off" size={18} className="text-amber-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20 shrink-0">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <Icon icon="person" size={20} className="text-on-surface-variant" />
                        )}
                      </div>
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-on-surface text-sm truncate flex items-center gap-2">
                          {review.isAnonymous ? (
                            <>
                              <Icon icon="visibility_off" size={14} className="text-amber-600" />
                              <span className="text-amber-700">Anônimo</span>
                            </>
                          ) : (
                            review.userName
                          )}
                        </p>
                        {review.isAnonymous && (
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300/30 shrink-0">
                            ANÔNIMO
                          </span>
                        )}
                        {review.approved === false && (
                          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-300/30 shrink-0">
                            PENDENTE
                          </span>
                        )}
                        {review.isAnonymous && review.approved === true && (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-300/30 shrink-0">
                            APROVADO
                          </span>
                        )}
                        {!review.isAnonymous && (
                          <span className="text-[10px] text-on-surface-variant/60 shrink-0">
                            {formatDate(review.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mb-2 flex items-center gap-1">
                        <Icon icon="storefront" size={12} className="text-blue-500" />
                        {review.serviceTitle}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 mb-2">
                          {renderStars(review.stars)}
                          <span className="text-xs text-on-surface-variant ml-1">({review.stars}/5)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {review.approved === false && (
                            <button
                              onClick={() => handleApproveReview(review.id)}
                              disabled={actionLoading === review.id}
                              className="text-[#04193D] hover:bg-[#04193D]/10 p-2 rounded-full transition-all disabled:opacity-50"
                              title="Aprovar avaliação"
                            >
                              <Icon icon="check_circle" size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={actionLoading === review.id}
                            className="text-error hover:bg-error/10 p-2 rounded-full transition-all disabled:opacity-50"
                            title="Excluir avaliação"
                          >
                            <Icon icon="delete" size={18} />
                          </button>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-xl leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
