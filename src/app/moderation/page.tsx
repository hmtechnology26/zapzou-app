'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';
import { TopAppBar } from '@/components/TopAppBar';
import { BottomNav } from '@/components/BottomNav';

type PendingMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  date: string;
};

export default function ModerationPage() {
  const router = useRouter();
  const { user, selectedEnvironment, selectedEnvironments, setSelectedEnvironment } = useApp();
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const fetchPendingMembers = useCallback(async () => {
    if (!selectedEnvironment?.id) {
      setPendingMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_pending_environment_members',
      { p_environment_id: selectedEnvironment.id },
    );

    if (!rpcError && Array.isArray(rpcData)) {
      setPendingMembers(
        rpcData.map((member: any) => ({
          id: member.id,
          userId: member.user_id,
          name: member.name || 'Membro',
          email: member.email || '',
          avatar: member.avatar_url || '',
          date: member.created_at ? new Date(member.created_at).toLocaleDateString('pt-BR') : '',
        })),
      );
      setLoadingMembers(false);
      return;
    }

    const { data, error } = await supabase
      .from('environment_members')
      .select(`
        id,
        user_id,
        created_at,
        user_public_profiles (
          name,
          avatar_url
        )
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
          email: '',
          avatar: member.user_public_profiles?.avatar_url || '',
          date: member.created_at ? new Date(member.created_at).toLocaleDateString('pt-BR') : '',
        })),
      );
    } else {
      console.error(rpcError || error);
      setPendingMembers([]);
    }

    setLoadingMembers(false);
  }, [selectedEnvironment?.id]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedEnvironment?.id) {
      setPendingMembers([]);
      setLoadingMembers(false);
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
        setLoadingMembers(false);
        setAccessLoading(false);
        router.replace('/profile');
        return;
      }

      await fetchPendingMembers();
      setAccessLoading(false);
    };

    void verifyAccess();
  }, [user, selectedEnvironment?.id, selectedEnvironments, fetchPendingMembers, router, setSelectedEnvironment]);

  const handleApprove = async (memberId: string) => {
    setActionLoading(memberId);
    const { error } = await supabase
      .from('environment_members')
      .update({ status: 'active' })
      .eq('id', memberId);

    if (!error) {
      setPendingMembers((prev) => prev.filter((member) => member.id !== memberId));
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
    } else {
      alert('Erro ao recusar membro: ' + error.message);
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar />

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
        <div className="bg-primary/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon icon="admin_panel_settings" size={32} className='text-[#30cc36]' />
            <h1 className="text-2xl font-black text-on-surface-variant tracking-tight">Painel do Líder</h1>
          </div>
          <p className="text-on-surface-variant text-sm flex flex-col gap-1">
            <span>
              Gerencie as pessoas que solicitaram entrada em
            </span>

            <span className="font-bold text-center text-on-surface mt-1 bg-[#30cc36]/10 px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[200px]">
              {selectedEnvironment?.name || 'Comunidade Atual'}
            </span>
          </p>  
        </div>

        <div>
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center justify-between">
            Solicitações Pendentes
            <span className="bg-surface-container-high text-xs px-2 py-1 rounded-full text-on-surface-variant font-medium">
              {pendingMembers.length}
            </span>
          </h2>

          {accessLoading || loadingMembers ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <Icon icon="check_circle" size={48} className="text-primary/50 mb-4" />
              <h3 className="text-on-surface font-semibold text-lg mb-1">Tudo limpo por aqui!</h3>
              <p className="text-on-surface-variant text-sm">Não há nenhuma solicitação pendente no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-sm border border-outline-variant/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0 border border-outline-variant/20">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="person" size={24} className="text-on-surface-variant" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="font-bold text-on-surface capitalize truncate text-sm">{member.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate opacity-80 leading-tight">
                        {member.email || 'Email indisponível'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border border-amber-100">
                          <Icon icon="hourglass_empty" size={10} />
                          Análise
                        </span>
                        {member.date && (
                          <span className="text-[10px] text-on-surface-variant/60 font-medium">
                            {member.date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 pl-3 border-l border-outline-variant/10 ">
                    <button
                      onClick={() => handleReject(member.id)}
                      disabled={actionLoading === member.id}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error/10 text-error transition-all active:scale-95 disabled:opacity-50"
                      title="Recusar"
                    >
                      <Icon icon="close" size={18} />
                    </button>
                    <button
                      onClick={() => handleApprove(member.id)}
                      disabled={actionLoading === member.id}
                      className="w-10 h-10 flex items-center justify-center bg-[#30CC36] text-white hover:bg-[#259128] rounded-full transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Icon icon="check" size={18} weight={400} />
                      
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
