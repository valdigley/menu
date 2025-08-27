import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, Edit, Trash2, Plus, Crown, 
  Calendar, DollarSign, CheckCircle, XCircle, AlertTriangle,
  Mail, Phone, User, Settings, Eye, Ban, Check, X
} from 'lucide-react';

interface UserManagementProps {
  user: any;
  supabase: any;
  onBack: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string;
  subscription?: {
    id: string;
    plan_type: string;
    status: string;
    expires_at: string;
    trial_end_date: string;
    manual_access: boolean;
  };
  system_access?: {
    photography_tasks: boolean;
    contracts: boolean;
    clients: boolean;
  };
}

const UserManagement: React.FC<UserManagementProps> = ({ user, supabase, onBack }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários do auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erro ao carregar usuários:', authError);
        return;
      }

      // Buscar assinaturas
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*');

      // Buscar acessos do sistema
      const { data: systemAccess } = await supabase
        .from('user_system_access')
        .select('*');

      // Combinar dados
      const usersWithData = authUsers.users.map((authUser: any) => {
        const subscription = subscriptions?.find(sub => sub.user_id === authUser.id);
        const access = systemAccess?.filter(acc => acc.user_id === authUser.id);
        
        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          subscription,
          system_access: {
            photography_tasks: access?.some(a => a.system_id === 'photography_tasks' && a.has_access),
            contracts: access?.some(a => a.system_id === 'contracts' && a.has_access),
            clients: access?.some(a => a.system_id === 'clients' && a.has_access),
          }
        };
      });

      setUsers(usersWithData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && user.subscription?.status === 'active';
    if (filterStatus === 'trial') return matchesSearch && user.subscription?.plan_type === 'trial';
    if (filterStatus === 'expired') return matchesSearch && user.subscription?.status === 'expired';
    
    return matchesSearch;
  });

  const getSubscriptionStatus = (user: UserData) => {
    if (!user.subscription) {
      return { status: 'Sem assinatura', color: 'gray', icon: XCircle };
    }

    const { subscription } = user;
    
    if (subscription.manual_access) {
      return { status: 'Acesso Manual', color: 'purple', icon: Crown };
    }

    if (subscription.status === 'active') {
      if (subscription.plan_type === 'trial') {
        const trialEnd = new Date(subscription.trial_end_date);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 0) {
          return { status: 'Trial Expirado', color: 'red', icon: XCircle };
        }
        return { status: `Trial (${daysLeft}d)`, color: 'yellow', icon: AlertTriangle };
      }
      return { status: 'Ativo', color: 'green', icon: CheckCircle };
    }

    if (subscription.status === 'expired') {
      return { status: 'Expirado', color: 'red', icon: XCircle };
    }

    return { status: subscription.status, color: 'gray', icon: AlertTriangle };
  };

  const updateSubscription = async (userId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      await loadUsers();
      setShowEditModal(false);
      setEditingSubscription(null);
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      alert('Erro ao atualizar assinatura');
    }
  };

  const updateSystemAccess = async (userId: string, systemId: string, hasAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('user_system_access')
        .upsert({
          user_id: userId,
          system_id: systemId,
          has_access: hasAccess,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,system_id'
        });

      if (error) throw error;
      
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar acesso:', error);
      alert('Erro ao atualizar acesso do sistema');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Deletar do auth (isso vai cascatear para outras tabelas)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      await loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Gerenciar Usuários
                </h1>
                <p className="text-sm text-gray-500">
                  {users.length} usuários cadastrados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="trial">Trial</option>
                <option value="expired">Expirados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assinatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acessos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userData) => {
                  const subscriptionStatus = getSubscriptionStatus(userData);
                  const StatusIcon = subscriptionStatus.icon;
                  
                  return (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {userData.name}
                              {userData.email === 'valdigley2007@gmail.com' && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 text-${subscriptionStatus.color}-500`} />
                          <span className={`text-sm font-medium text-${subscriptionStatus.color}-600`}>
                            {subscriptionStatus.status}
                          </span>
                        </div>
                        {userData.subscription?.expires_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expira: {formatDate(userData.subscription.expires_at)}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {userData.system_access?.photography_tasks && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Fotografias
                            </span>
                          )}
                          {userData.system_access?.contracts && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Contratos
                            </span>
                          )}
                          {userData.system_access?.clients && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Clientes
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {userData.last_sign_in_at ? formatDate(userData.last_sign_in_at) : 'Nunca'}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(userData);
                              setEditingSubscription(userData.subscription || {
                                plan_type: 'trial',
                                status: 'active',
                                manual_access: false
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          {userData.email !== 'valdigley2007@gmail.com' && (
                            <button
                              onClick={() => deleteUser(userData.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Edição */}
        {showEditModal && selectedUser && editingSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Usuário: {selectedUser.name}
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Informações do Usuário */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informações</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cadastrado em:</span>
                      <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Assinatura */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Assinatura</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Plano
                        </label>
                        <select
                          value={editingSubscription.plan_type || 'trial'}
                          onChange={(e) => setEditingSubscription({
                            ...editingSubscription,
                            plan_type: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="trial">Trial</option>
                          <option value="paid">Pago</option>
                          <option value="master">Master</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={editingSubscription.status || 'active'}
                          onChange={(e) => setEditingSubscription({
                            ...editingSubscription,
                            status: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="active">Ativo</option>
                          <option value="expired">Expirado</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="pending_payment">Pagamento Pendente</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingSubscription.manual_access || false}
                          onChange={(e) => setEditingSubscription({
                            ...editingSubscription,
                            manual_access: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Acesso Manual (ignora expiração)
                        </span>
                      </label>
                    </div>

                    {editingSubscription.plan_type === 'trial' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Expiração do Trial
                        </label>
                        <input
                          type="datetime-local"
                          value={editingSubscription.trial_end_date ? 
                            new Date(editingSubscription.trial_end_date).toISOString().slice(0, 16) : 
                            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                          }
                          onChange={(e) => setEditingSubscription({
                            ...editingSubscription,
                            trial_end_date: new Date(e.target.value).toISOString()
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {editingSubscription.plan_type === 'paid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Expiração
                        </label>
                        <input
                          type="datetime-local"
                          value={editingSubscription.expires_at ? 
                            new Date(editingSubscription.expires_at).toISOString().slice(0, 16) : 
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                          }
                          onChange={(e) => setEditingSubscription({
                            ...editingSubscription,
                            expires_at: new Date(e.target.value).toISOString()
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Acessos do Sistema */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Acessos do Sistema</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'photography_tasks', name: 'Sistema de Fotografias', description: 'Gerenciar tarefas fotográficas' },
                      { id: 'contracts', name: 'Sistema de Contratos', description: 'Gerenciar contratos e pagamentos' },
                      { id: 'clients', name: 'Sistema de Clientes', description: 'Gerenciar clientes e eventos' }
                    ].map((system) => (
                      <div key={system.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{system.name}</h5>
                          <p className="text-xs text-gray-500">{system.description}</p>
                        </div>
                        <button
                          onClick={() => updateSystemAccess(
                            selectedUser.id, 
                            system.id, 
                            !selectedUser.system_access?.[system.id as keyof typeof selectedUser.system_access]
                          )}
                          className={`p-2 rounded-lg transition-colors ${
                            selectedUser.system_access?.[system.id as keyof typeof selectedUser.system_access]
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {selectedUser.system_access?.[system.id as keyof typeof selectedUser.system_access] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => updateSubscription(selectedUser.id, editingSubscription)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;