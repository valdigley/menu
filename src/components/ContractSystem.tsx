import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Edit, Trash2, Eye, FileText, User, Calendar, DollarSign, MapPin, Phone, Mail, Save, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractSystemProps {
  user: any;
  supabase: any;
  onBack: () => void;
}

interface Contract {
  id: string;
  nome_completo: string;
  cpf: string;
  endereco: string;
  cidade: string;
  data_nascimento: string;
  tipo_evento: string;
  data_evento: string;
  horario_evento: string;
  local_festa: string;
  local_pre_wedding?: string;
  local_making_of?: string;
  local_cerimonia?: string;
  nome_noivos?: string;
  nome_aniversariante?: string;
  email: string;
  whatsapp: string;
  package_price: number;
  final_price: number;
  created_at: string;
  updated_at: string;
}

interface EventType {
  id: string;
  name: string;
  is_active: boolean;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
}

const ContractSystem: React.FC<ContractSystemProps> = ({ user, supabase, onBack }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<Partial<Contract>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Carregar contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      setContracts(contractsData || []);

      // Carregar tipos de eventos
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('event_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (eventTypesError) {
        console.warn('Erro ao carregar tipos de eventos:', eventTypesError);
        // Usar tipos padrão se não conseguir carregar do banco
        setEventTypes([
          { id: '1', name: 'Casamento', is_active: true },
          { id: '2', name: 'Aniversário', is_active: true },
          { id: '3', name: 'Formatura', is_active: true },
          { id: '4', name: 'Ensaio', is_active: true },
          { id: '5', name: 'Corporativo', is_active: true }
        ]);
      } else {
        setEventTypes(eventTypesData || []);
      }

      // Carregar pacotes
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (packagesError) {
        console.warn('Erro ao carregar pacotes:', packagesError);
        // Usar pacotes padrão se não conseguir carregar do banco
        setPackages([
          { id: '1', name: 'Básico', description: 'Pacote básico', price: 1500, features: ['Fotos digitais', 'Edição básica'], is_active: true },
          { id: '2', name: 'Premium', description: 'Pacote premium', price: 2500, features: ['Fotos digitais', 'Edição avançada', 'Álbum'], is_active: true },
          { id: '3', name: 'Completo', description: 'Pacote completo', price: 3500, features: ['Fotos digitais', 'Edição avançada', 'Álbum', 'Video'], is_active: true }
        ]);
      } else {
        setPackages(packagesData || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !formData.nome_completo || !formData.email) {
      setError('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const contractData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingContract) {
        // Atualizar contrato existente
        const { error } = await supabase
          .from('contratos')
          .update(contractData)
          .eq('id', editingContract.id);

        if (error) throw error;
      } else {
        // Criar novo contrato
        const { error } = await supabase
          .from('contratos')
          .insert([{
            ...contractData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      await loadData();
      setShowForm(false);
      setEditingContract(null);
      setFormData({});
    } catch (error: any) {
      console.error('Erro ao salvar contrato:', error);
      setError(error.message || 'Erro ao salvar contrato');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData(contract);
    setShowForm(true);
  };

  const handleDelete = async (contractId: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir este contrato?')) return;

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      setError('Erro ao excluir contrato');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.cpf.includes(searchTerm);
    
    const matchesFilter = filterType === 'all' || contract.tipo_evento === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (showForm) {
    return (
      <ContractForm
        formData={formData}
        setFormData={setFormData}
        eventTypes={eventTypes}
        packages={packages}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingContract(null);
          setFormData({});
          setError(null);
        }}
        saving={saving}
        error={error}
        isEditing={!!editingContract}
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
                  Sistema de Contratos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie contratos e clientes
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Contrato
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="all">Todos os Tipos</option>
              {eventTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contracts List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Nenhum contrato encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando um novo contrato.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map((contract, index) => (
                    <motion.tr
                      key={contract.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {contract.nome_completo}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {contract.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {contract.tipo_evento}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.local_festa}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(contract.data_evento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(contract.final_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(contract)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente do formulário
const ContractForm: React.FC<{
  formData: Partial<Contract>;
  setFormData: (data: Partial<Contract>) => void;
  eventTypes: EventType[];
  packages: Package[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  isEditing: boolean;
}> = ({ formData, setFormData, eventTypes, packages, onSave, onCancel, saving, error, isEditing }) => {
  
  const updateField = (field: keyof Contract, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

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
                onClick={onCancel}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Preencha os dados do contrato
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-8">
            {/* Dados Pessoais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_completo || ''}
                    onChange={(e) => updateField('nome_completo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf || ''}
                    onChange={(e) => updateField('cpf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp || ''}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento || ''}
                    onChange={(e) => updateField('data_nascimento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.endereco || ''}
                    onChange={(e) => updateField('endereco', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.cidade || ''}
                    onChange={(e) => updateField('cidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Evento */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Dados do Evento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Evento
                  </label>
                  <select
                    value={formData.tipo_evento || ''}
                    onChange={(e) => updateField('tipo_evento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione o tipo</option>
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data do Evento
                  </label>
                  <input
                    type="date"
                    value={formData.data_evento || ''}
                    onChange={(e) => updateField('data_evento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horário do Evento
                  </label>
                  <input
                    type="time"
                    value={formData.horario_evento || ''}
                    onChange={(e) => updateField('horario_evento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Local da Festa
                  </label>
                  <input
                    type="text"
                    value={formData.local_festa || ''}
                    onChange={(e) => updateField('local_festa', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                {formData.tipo_evento === 'Casamento' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome dos Noivos
                      </label>
                      <input
                        type="text"
                        value={formData.nome_noivos || ''}
                        onChange={(e) => updateField('nome_noivos', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Local da Cerimônia
                      </label>
                      <input
                        type="text"
                        value={formData.local_cerimonia || ''}
                        onChange={(e) => updateField('local_cerimonia', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}
                
                {formData.tipo_evento === 'Aniversário' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Aniversariante
                    </label>
                    <input
                      type="text"
                      value={formData.nome_aniversariante || ''}
                      onChange={(e) => updateField('nome_aniversariante', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Valores */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Valores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor do Pacote
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.package_price || ''}
                    onChange={(e) => updateField('package_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor Final
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.final_price || ''}
                    onChange={(e) => updateField('final_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSystem;