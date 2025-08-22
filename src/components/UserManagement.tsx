import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Search, Filter, Plus, Edit, Trash2, Crown, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, Calendar, Mail, Phone, Eye, Ban, RefreshCw, Settings, Shield, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserManagementProps {
  user: any;
  supabase: any;
  onBack: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  subscription?: {
    id: string;
    plan_type: 'trial' | 'paid' | 'master';
    status: 'active' | 'expired' | 'cancelled' | 'pending_payment';
    trial_start_date?: string;
    trial_end_date?: string;
    payment_date?: string;
    payment_amount?: number;
    expires_at?: string;
    manual_access?: boolean;
  };
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ user, supabase, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showSystemAccess, setShowSystemAccess] = useState(false);
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Primeiro, buscar todos os usuários autenticados
      const { data: authUsers, error: authError } = await supabase.auth.getSession();
      
      // Buscar usuários da tabela users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.warn('Erro ao buscar usuários da tabela users:', usersError);
      }

      // Buscar todos os usuários via RPC (função personalizada)
      const { data: allAuthUsers, error: rpcError } = await supabase
        .rpc('get_all_users');

      let authUsersList = [];
      
      if (rpcError) {
        console.warn('RPC não disponível, usando dados da tabela users apenas');
        authUsersList = users || [];
      } else {
        authUsersList = allAuthUsers || [];
      }

      // Se não conseguiu via RPC, tentar buscar da tabela auth.users diretamente
      if (authUsersList.length === 0) {
        try {
          const { data: directAuthUsers, error: directError } = await supabase
            .from('auth.users')
            .select('id, email, created_at, last_sign_in_at, email_confirmed_at, raw_user_meta_data');
          
          if (!directError && directAuthUsers) {
            authUsersList = directAuthUsers.map(user => ({
              id: user.id,
              email: user.email,
              name: user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.name || 'Sem nome',
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              email_confirmed_at: user.email_confirmed_at
            }));
          }
        } catch (directError) {
          console.warn('Não foi possível acessar auth.users diretamente');
          // Fallback para usuários da tabela users
          authUsersList = users || [];
        }
      }

      // Se ainda não temos usuários, criar entrada para usuários que só existem no auth
      if (authUsersList.length === 0 && users && users.length === 0) {
        // Tentar sincronizar usuário atual se existir
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          // Criar entrada na tabela users para o usuário atual se não existir
          const { error: insertError } = await supabase
            .from('users')
            .upsert({
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Usuário',
              role: currentUser.email === 'valdigley2007@gmail.com' ? 'admin' : 'photographer'
            }, { onConflict: 'id' });
          
          if (!insertError) {
            // Recarregar usuários após inserção
            const { data: updatedUsers } = await supabase
              .from('users')
              .select('*')
              .order('created_at', { ascending: false });
            authUsersList = updatedUsers || [];
          }
        }
      }

      // Buscar assinaturas para todos os usuários
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subError) {
        console.error('Erro ao buscar assinaturas:', subError);
      }

      // Combinar dados
      const combinedUsers = authUsersList.map(user => {
        const subscription = subscriptions?.find(sub => sub.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          name: user.name || 'Sem nome',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
          subscription: subscription || undefined
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTrialSubscription = async (userId: string) => {
    if (!supabase) return;

    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 15); // 15 dias de trial

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: 'trial',
          status: 'active',
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          expires_at: trialEndDate.toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      await loadUsers();
      alert('Trial de 15 dias criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar trial:', error);
      alert('Erro ao criar trial');
    }
  };

  const createPaidSubscription = async (userId: string) => {
    if (!supabase) return;

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 mês

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: 'paid',
          status: 'active',
          payment_date: new Date().toISOString(),
          payment_amount: 50.00,
          expires_at: expiresAt.toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      await loadUsers();
      alert('Assinatura paga criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar assinatura paga:', error);
      alert('Erro ao criar assinatura paga');
    }
  };

  const cancelSubscription = async (userId: string) => {
    if (!supabase) return;
    
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId);

      if (error) throw error;
      
      await loadUsers();
      alert('Assinatura cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('Erro ao cancelar assinatura');
    }
  };

  const toggleManualAccess = async (userId: string, currentStatus: boolean) => {
    if (!supabase) return;
    
    const action = currentStatus ? 'remover' : 'liberar';
    if (!confirm(`Tem certeza que deseja ${action} o acesso manual para este usuário?`)) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          manual_access: !currentStatus,
          status: 'active',
          plan_type: currentStatus ? 'trial' : 'paid', // Se removendo manual, volta para trial
          expires_at: currentStatus ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() : null
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      await loadUsers();
      alert(`Acesso manual ${currentStatus ? 'removido' : 'liberado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar acesso manual:', error);
      alert('Erro ao alterar acesso manual');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!supabase) return;
    
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      // Primeiro excluir assinatura se existir
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);

      // Depois excluir usuário da tabela users
      // Nota: O usuário ainda existirá no auth.users, mas não terá acesso ao sistema
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      await loadUsers();
      alert('Usuário removido do sistema com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.subscription) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Sem assinatura
        </span>
      );
    }

    const { status, plan_type, expires_at, manual_access } = user.subscription;
    const isExpired = expires_at && new Date(expires_at) < new Date();

    if (manual_access) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Acesso Manual
        </span>
      );
    }

    if (plan_type === 'master') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Crown className="w-3 h-3 mr-1" />
          Master
        </span>
      );
    }

    if (isExpired || status === 'expired') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Expirado
        </span>
      );
    }

    if (status === 'active' && plan_type === 'trial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Trial Ativo (15d)
        </span>
      );
    }

    if (status === 'active' && plan_type === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago Ativo
        </span>
      );
    }

    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Ban className="w-3 h-3 mr-1" />
          Cancelado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getDaysRemaining = (user: User) => {
    if (!user.subscription?.expires_at) return null;
    
    const expiresAt = new Date(user.subscription.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expirado';
    if (diffDays === 0) return 'Expira hoje';
    if (diffDays === 1) return '1 dia restante';
    return `${diffDays} dias restantes`;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.subscription?.status === 'active') ||
                         (filterStatus === 'expired' && (!user.subscription || user.subscription.status === 'expired' || 
                          (user.subscription.expires_at && new Date(user.subscription.expires_at) < new Date()))) ||
                         (filterStatus === 'cancelled' && user.subscription?.status === 'cancelled') ||
                         (filterStatus === 'no_subscription' && !user.subscription);

    const matchesPlan = filterPlan === 'all' ||
                       (filterPlan === 'trial' && user.subscription?.plan_type === 'trial') ||
                       (filterPlan === 'paid' && user.subscription?.plan_type === 'paid') ||
                       (filterPlan === 'master' && user.subscription?.plan_type === 'master');

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription?.status === 'active').length,
    trial: users.filter(u => u.subscription?.plan_type === 'trial' && u.subscription?.status === 'active' && !u.subscription?.manual_access).length,
    paid: users.filter(u => u.subscription?.plan_type === 'paid' && u.subscription?.status === 'active').length,
    revenue: users.filter(u => u.subscription?.plan_type === 'paid' && u.subscription?.status === 'active').length * 50,
    manual: users.filter(u => u.subscription?.manual_access === true).length
  };

  if (showUserDetails && selectedUser) {
    return (
      <UserDetailsModal 
        user={selectedUser}
        onClose={() => {
          setShowUserDetails(false);
          setSelectedUser(null);
        }}
        onUpdate={loadUsers}
        supabase={supabase}
      />
    );
  }

  if (showSystemAccess && selectedUserForAccess) {
    return (
      <SystemAccessModal 
        user={selectedUserForAccess}
        onClose={() => {
          setShowSystemAccess(false);
          setSelectedUserForAccess(null);
        }}
        onUpdate={loadUsers}
        supabase={supabase}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gestão de Usuários
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie usuários, assinaturas e pagamentos
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trial</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.trial}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.paid}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receita/Mês</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {stats.revenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Acesso Manual</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.manual}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="expired">Expirados</option>
                <option value="cancelled">Cancelados</option>
                <option value="no_subscription">Sem Assinatura</option>
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="all">Todos os Planos</option>
                <option value="trial">Trial</option>
                <option value="paid">Pago</option>
                <option value="master">Master</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Expira em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.subscription?.plan_type === 'trial' && 'Trial 15 dias'}
                        {user.subscription?.manual_access && 'Acesso Manual'}
                        {user.subscription?.plan_type === 'paid' && 'R$ 50/mês'}
                        {user.subscription?.plan_type === 'master' && 'Master'}
                        {!user.subscription && 'Nenhum'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getDaysRemaining(user) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUserForAccess(user);
                              setShowSystemAccess(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded"
                            title="Gerenciar Acesso aos Sistemas"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          
                          {!user.subscription && (
                            <>
                              <button
                                onClick={() => createTrialSubscription(user.id)}
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 rounded"
                                title="Criar Trial 15 dias"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => createPaidSubscription(user.id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded"
                                title="Criar Assinatura Paga"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {user.subscription && user.email !== 'valdigley2007@gmail.com' && (
                            <button
                              onClick={() => toggleManualAccess(user.id, user.subscription?.manual_access || false)}
                              className={`p-1 rounded ${
                                user.subscription.manual_access 
                                  ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300'
                                  : 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300'
                              }`}
                              title={user.subscription.manual_access ? 'Remover Acesso Manual' : 'Liberar Acesso Manual'}
                            >
                              {user.subscription.manual_access ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                          )}
                          
                          {user.subscription && user.subscription.status === 'active' && (
                            <button
                              onClick={() => cancelSubscription(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                              title="Cancelar Assinatura"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          
                          {user.email !== 'valdigley2007@gmail.com' && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tente ajustar os filtros de busca.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de detalhes do usuário
const UserDetailsModal: React.FC<{
  user: User;
  onClose: () => void;
  onUpdate: () => void;
  supabase: any;
}> = ({ user, onClose, onUpdate, supabase }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Detalhes do Usuário
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Nome</label>
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Data de Cadastro</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Último Login</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Não disponível'}
                </p>
              </div>
            </div>
          </div>

          {/* Informações da assinatura */}
          {user.subscription ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Assinatura</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Plano</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.subscription.plan_type === 'trial' && 'Trial Gratuito'}
                    {user.subscription.plan_type === 'paid' && 'Pago (R$ 50/mês)'}
                    {user.subscription.plan_type === 'master' && 'Master'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                  <p className="font-medium text-gray-900 dark:text-white">{user.subscription.status}</p>
                </div>
                {user.subscription.expires_at && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Expira em</label>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(user.subscription.expires_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {user.subscription.payment_date && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Último Pagamento</label>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(user.subscription.payment_date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Sem Assinatura</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Este usuário não possui nenhuma assinatura ativa.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Modal de controle de acesso aos sistemas
const SystemAccessModal: React.FC<{
  user: User;
  onClose: () => void;
  onUpdate: () => void;
  supabase: any;
}> = ({ user, onClose, onUpdate, supabase }) => {
  const [systemAccess, setSystemAccess] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableSystems = [
    { id: 'triagem', name: 'Triagem', description: 'Sistema de triagem médica', icon: '🏥' },
    { id: 'grana', name: 'Grana', description: 'Sistema financeiro', icon: '💰' },
    { id: 'contrato', name: 'Contratos', description: 'Sistema de contratos', icon: '📄' },
    { id: 'automacao', name: 'Automação', description: 'Sistema de automação', icon: '⚡' },
    { id: 'obrigacoes', name: 'Obrigações', description: 'Gestão de tarefas diárias de edição', icon: '📋' },
    { id: 'admin', name: 'Gerenciar', description: 'Gerenciar assinaturas e usuários', icon: '👥' },
    { id: 'configuracao', name: 'Configuração', description: 'Configurações do sistema', icon: '⚙️' },
  ];

  useEffect(() => {
    loadSystemAccess();
  }, []);

  const loadSystemAccess = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_system_access')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar acessos:', error);
        // Se não existe, criar registros padrão
        const defaultAccess = availableSystems.map(system => ({
          user_id: user.id,
          system_id: system.id,
          has_access: true, // Por padrão, se tem assinatura, tem acesso
          granted_by: null,
          granted_at: new Date().toISOString(),
          expires_at: null
        }));
        setSystemAccess(defaultAccess);
      } else {
        // Combinar com sistemas disponíveis
        const combinedAccess = availableSystems.map(system => {
          const existingAccess = data?.find(access => access.system_id === system.id);
          return existingAccess || {
            user_id: user.id,
            system_id: system.id,
            has_access: true, // Padrão
            granted_by: null,
            granted_at: new Date().toISOString(),
            expires_at: null
          };
        });
        setSystemAccess(combinedAccess);
      }
    } catch (error) {
      console.error('Erro ao carregar acessos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSystemAccess = async (systemId: string, currentAccess: boolean) => {
    if (!supabase) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_system_access')
        .upsert({
          user_id: user.id,
          system_id: systemId,
          has_access: !currentAccess,
          granted_by: user.id, // ID do master que está alterando
          granted_at: new Date().toISOString(),
          expires_at: null
        }, { onConflict: 'user_id,system_id' });

      if (error) throw error;

      // Atualizar estado local
      setSystemAccess(prev => 
        prev.map(access => 
          access.system_id === systemId 
            ? { ...access, has_access: !currentAccess }
            : access
        )
      );

      alert(`Acesso ao sistema ${!currentAccess ? 'liberado' : 'removido'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
      alert('Erro ao alterar acesso ao sistema');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllAccess = async (grantAll: boolean) => {
    if (!supabase) return;
    
    if (!confirm(`Tem certeza que deseja ${grantAll ? 'liberar' : 'remover'} acesso a todos os sistemas?`)) return;
    
    setSaving(true);
    try {
      const updates = availableSystems.map(system => ({
        user_id: user.id,
        system_id: system.id,
        has_access: grantAll,
        granted_by: user.id,
        granted_at: new Date().toISOString(),
        expires_at: null
      }));

      const { error } = await supabase
        .from('user_system_access')
        .upsert(updates, { onConflict: 'user_id,system_id' });

      if (error) throw error;

      // Atualizar estado local
      setSystemAccess(prev => 
        prev.map(access => ({ ...access, has_access: grantAll }))
      );

      alert(`Acesso ${grantAll ? 'liberado' : 'removido'} para todos os sistemas!`);
    } catch (error) {
      console.error('Erro ao alterar acessos:', error);
      alert('Erro ao alterar acessos');
    } finally {
      setSaving(false);
    }
  };

  const hasGeneralAccess = user.subscription && (
    user.subscription.manual_access ||
    (user.subscription.status === 'active' && 
     (!user.subscription.expires_at || new Date(user.subscription.expires_at) > new Date()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Controle de Acesso aos Sistemas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Status da Assinatura */}
        <div className={`mb-6 p-4 rounded-xl ${
          hasGeneralAccess 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {hasGeneralAccess ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <h3 className={`font-medium ${
              hasGeneralAccess 
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              Status da Assinatura
            </h3>
          </div>
          <p className={`text-sm ${
            hasGeneralAccess 
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {hasGeneralAccess 
              ? 'Usuário possui assinatura ativa e pode acessar sistemas liberados'
              : 'Usuário não possui assinatura ativa. Configure uma assinatura primeiro.'
            }
          </p>
        </div>

        {hasGeneralAccess && (
          <>
            {/* Ações em Lote */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => toggleAllAccess(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Unlock className="h-4 w-4" />
                Liberar Todos
              </button>
              <button
                onClick={() => toggleAllAccess(false)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                Bloquear Todos
              </button>
            </div>

            {/* Lista de Sistemas */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {availableSystems.map((system) => {
                  const access = systemAccess.find(a => a.system_id === system.id);
                  const hasAccess = access?.has_access ?? true;
                  
                  return (
                    <div
                      key={system.id}
                      className={`p-4 rounded-xl border transition-all ${
                        hasAccess
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{system.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {system.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {system.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${
                            hasAccess 
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {hasAccess ? 'Liberado' : 'Bloqueado'}
                          </span>
                          
                          <button
                            onClick={() => toggleSystemAccess(system.id, hasAccess)}
                            disabled={saving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              hasAccess ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <motion.span
                              animate={{ x: hasAccess ? 24 : 4 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UserManagement;