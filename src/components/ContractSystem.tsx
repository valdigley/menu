import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Edit, Trash2, Eye, FileText, User, Calendar, DollarSign, MapPin, Phone, Mail, Save, X, Check, AlertCircle, Download, Upload, CreditCard, Clock, CheckCircle } from 'lucide-react';
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
  event_type_id?: string;
  package_id?: string;
  payment_method_id?: string;
  preferred_payment_day?: number;
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
  event_type_id?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  installments: number;
  is_active: boolean;
}

interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  payment_method: string;
  notes?: string;
}

const ContractSystem: React.FC<ContractSystemProps> = ({ user, supabase, onBack }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<Partial<Contract>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('contracts');
  const [selectedPackages, setSelectedPackages] = useState<Package[]>([]);

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
        setEventTypes([
          { id: '1', name: 'Casamento', is_active: true },
          { id: '2', name: 'Aniversário', is_active: true },
          { id: '3', name: 'Formatura', is_active: true },
          { id: '4', name: 'Ensaio Fotográfico', is_active: true },
          { id: '5', name: 'Corporativo', is_active: true }
        ]);
      } else {
        setEventTypes(eventTypesData || []);
      }

      // Carregar pacotes
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*, event_types(name)')
        .eq('is_active', true)
        .order('price');

      if (packagesError) {
        console.warn('Erro ao carregar pacotes:', packagesError);
        setPackages([
          { id: '1', name: 'Básico', description: 'Pacote básico', price: 1500, features: ['Fotos digitais', 'Edição básica'], is_active: true },
          { id: '2', name: 'Premium', description: 'Pacote premium', price: 2500, features: ['Fotos digitais', 'Edição avançada', 'Álbum'], is_active: true },
          { id: '3', name: 'Completo', description: 'Pacote completo', price: 3500, features: ['Fotos digitais', 'Edição avançada', 'Álbum', 'Vídeo'], is_active: true }
        ]);
      } else {
        setPackages(packagesData || []);
      }

      // Carregar métodos de pagamento
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (paymentMethodsError) {
        console.warn('Erro ao carregar métodos de pagamento:', paymentMethodsError);
        setPaymentMethods([
          { id: '1', name: 'À Vista', description: 'Pagamento à vista', discount_percentage: 10, installments: 1, is_active: true },
          { id: '2', name: 'Cartão de Crédito', description: 'Parcelado no cartão', discount_percentage: 0, installments: 12, is_active: true },
          { id: '3', name: 'PIX', description: 'Pagamento via PIX', discount_percentage: 5, installments: 1, is_active: true }
        ]);
      } else {
        setPaymentMethods(paymentMethodsData || []);
      }

      // Carregar pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('due_date', { ascending: false });

      if (paymentsError) {
        console.warn('Erro ao carregar pagamentos:', paymentsError);
        setPayments([]);
      } else {
        setPayments(paymentsData || []);
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

  const getContractStats = () => {
    const total = contracts.length;
    const thisMonth = contracts.filter(c => {
      const contractDate = new Date(c.created_at);
      const now = new Date();
      return contractDate.getMonth() === now.getMonth() && contractDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalValue = contracts.reduce((sum, c) => sum + (c.final_price || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    return { total, thisMonth, totalValue, pendingPayments };
  };

  const stats = getContractStats();

  if (showForm) {
    return (
      <ContractForm
        formData={formData}
        setFormData={setFormData}
        eventTypes={eventTypes}
        packages={packages}
        paymentMethods={paymentMethods}
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
        selectedPackages={selectedPackages}
        setSelectedPackages={setSelectedPackages}
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
                  Gerencie contratos, clientes e pagamentos
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Contratos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Este Mês</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map((contract, index) => {
                    const contractPayments = payments.filter(p => p.contract_id === contract.id);
                    const paidAmount = contractPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
                    const totalAmount = contract.final_price || 0;
                    const paymentStatus = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
                    
                    return (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : paymentStatus === 'partial'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {paymentStatus === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {paymentStatus === 'partial' && <Clock className="w-3 h-3 mr-1" />}
                            {paymentStatus === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {paymentStatus === 'paid' ? 'Pago' : paymentStatus === 'partial' ? 'Parcial' : 'Pendente'}
                          </span>
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
                    );
                  })}
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
  paymentMethods: PaymentMethod[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  isEditing: boolean;
  selectedPackages: Package[];
  setSelectedPackages: (packages: Package[]) => void;
}> = ({ 
  formData, 
  setFormData, 
  eventTypes, 
  packages, 
  paymentMethods, 
  onSave, 
  onCancel, 
  saving, 
  error, 
  isEditing,
  selectedPackages,
  setSelectedPackages
}) => {
  
  const updateField = (field: keyof Contract, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const filteredPackages = formData.event_type_id ? packages.filter(pkg => 
    !formData.event_type_id || pkg.event_type_id === formData.event_type_id
  ) : [];

  const calculateFinalPrice = () => {
    const basePrice = formData.package_price || 0;
    const paymentMethod = paymentMethods.find(pm => pm.id === formData.payment_method_id);
    const discount = paymentMethod ? (basePrice * paymentMethod.discount_percentage / 100) : 0;
    return basePrice - discount;
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
                    value={formData.event_type_id || ''}
                    onChange={(e) => {
                      updateField('event_type_id', e.target.value);
                      const eventType = eventTypes.find(et => et.id === e.target.value);
                      if (eventType) {
                        updateField('tipo_evento', eventType.name);
                        // Limpar pacote selecionado quando mudar tipo de evento
                        updateField('package_id', '');
                        updateField('package_price', 0);
                        updateField('final_price', 0);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione o tipo</option>
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Local do Pré-Wedding
                      </label>
                      <input
                        type="text"
                        value={formData.local_pre_wedding || ''}
                        onChange={(e) => updateField('local_pre_wedding', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Local do Making Of
                      </label>
                      <input
                        type="text"
                        value={formData.local_making_of || ''}
                        onChange={(e) => updateField('local_making_of', e.target.value)}
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

            {/* Pacotes e Valores */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pacotes e Valores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pacote
                  </label>
                  <select
                    value={formData.package_id || ''}
                    onChange={(e) => {
                      const selectedPackage = packages.find(p => p.id === e.target.value);
                      updateField('package_id', e.target.value);
                      if (selectedPackage) {
                        updateField('package_price', selectedPackage.price);
                        updateField('final_price', calculateFinalPrice());
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione um pacote</option>
                    {!formData.event_type_id && (
                      <option value="" disabled>Primeiro selecione o tipo de evento</option>
                    )}
                    {filteredPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - R$ {pkg.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {formData.event_type_id && filteredPackages.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Nenhum pacote disponível para este tipo de evento
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de Pagamento
                  </label>
                  <select
                    value={formData.payment_method_id || ''}
                    onChange={(e) => {
                      updateField('payment_method_id', e.target.value);
                      updateField('final_price', calculateFinalPrice());
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione o método</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name} {method.discount_percentage > 0 && `(${method.discount_percentage}% desconto)`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor do Pacote
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.package_price || ''}
                    onChange={(e) => {
                      updateField('package_price', parseFloat(e.target.value) || 0);
                      updateField('final_price', calculateFinalPrice());
                    }}
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
                    value={formData.final_price || calculateFinalPrice()}
                    onChange={(e) => updateField('final_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dia Preferido para Pagamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.preferred_payment_day || ''}
                    onChange={(e) => updateField('preferred_payment_day', parseInt(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 10 (dia 10 de cada mês)"
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