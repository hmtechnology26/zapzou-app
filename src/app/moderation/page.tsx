'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';
import { TopAppBar } from '@/components/TopAppBar';
import { BottomNav } from '@/components/BottomNav';

export default function ModerationPage() {
  const router = useRouter();
  const { user, selectedEnvironment } = useApp();
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.membershipRole !== 'moderator') {
      router.push('/');
      return;
    }

    fetchPendingMembers();
  }, [user, selectedEnvironment]);

  const fetchPendingMembers = async () => {
    if (!selectedEnvironment?.id) return;
    setLoadingMembers(true);
    
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
      setPendingMembers(data.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        name: m.user_public_profiles?.name || 'Membro',
        avatar: m.user_public_profiles?.avatar_url || '',
        date: new Date(m.created_at).toLocaleDateString('pt-BR')
      })));
    } else {
      console.error(error);
    }
    setLoadingMembers(false);
  };

  const handleApprove = async (memberId: string) => {
    setActionLoading(memberId);
    const { error } = await supabase
      .from('environment_members')
      .update({ status: 'active' })
      .eq('id', memberId);
      
    if (!error) {
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));
    } else {
      alert('Erro ao aprovar membro: ' + error.message);
    }
    setActionLoading(null);
  };

  const handleReject = async (memberId: string) => {
    if (!window.confirm("Deseja realmente recusar este pedido? O registro será excluído.")) return;
    setActionLoading(memberId);
    const { error } = await supabase
      .from('environment_members')
      .delete()
      .eq('id', memberId);
      
    if (!error) {
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));
    } else {
      alert('Erro ao recusar membro: ' + error.message);
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar 
        title="Moderação" 
        showBack 
        onBack={() => router.back()} 
      />
      
      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
        <div className="bg-primary/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Icon icon="admin_panel_settings" size={32} />
            <h1 className="text-2xl font-black tracking-tight">Painel do Líder</h1>
          </div>
          <p className="text-on-surface-variant text-sm flex items-center gap-2">
            Gerencie as pessoas que solicitaram entrada em 
            <span className="font-bold text-on-surface bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis inline-block align-middle max-w-[200px]">
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

          {loadingMembers ? (
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
                <div key={member.id} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-sm border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0 border border-outline-variant/20">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="person" size={24} className="text-on-surface-variant" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-on-surface capitalize">{member.name}</p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Icon icon="event" size={12} className="opacity-70" />
                        <span className="font-medium text-xs">Aguardando aprovação</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <button 
                      onClick={() => handleReject(member.id)}
                      disabled={actionLoading === member.id}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error/10 text-error transition-colors disabled:opacity-50"
                      title="Recusar"
                    >
                      <Icon icon="close" size={20} />
                    </button>
                    <button 
                      onClick={() => handleApprove(member.id)}
                      disabled={actionLoading === member.id}
                      className="px-4 h-10 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 border border-primary/20"
                    >
                      {actionLoading === member.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Icon icon="check" size={18} />
                          Aprovar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
