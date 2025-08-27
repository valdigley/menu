import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, Phone, Mail, Camera, DollarSign, Check, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface ClientFormProps {
  companySettings?: any;
  eventTypes?: any[];
  packages?: any[];
  onSubmit?: (data: any) => void;
}

interface FormData {
  // Dados pessoais
  nome_completo: string;
  email: string;
  whatsapp: string;
  cpf: string;
  data_nascimento: string;
  endereco: string;
  cidade: string;
  
  // Dados do evento
  tipo_evento: string;
  data_evento: string;
  horario_evento: string;
  local_festa: string;
  local_cerimonia: string;
  local_pre_wedding: string;
  local_making_of: string;
  nome_noivos: string;
  nome_aniversariante: string;
  
  // Pacote e valores
  package_id: string;
  package_price: number;
  observacoes: string;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  companySettings, 
  eventTypes = [], 
  packages = [], 
  onSubmit 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nome_completo: '',
    email: '',
    whatsapp: '',
    cpf: '',
    data_nascimento: '',
    endereco: '',
    cidade: '',
    tipo_evento: '',
    data_evento: '',
    horario_evento: '',
    local_festa: '',
    local_cerimonia: '',
    local_pre_wedding: '',
    local_making_of: '',
    nome_noivos: '',
    nome_aniversariante: '',
    package_id: '',
    package_price: 0,
    observacoes: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Tipos de eventos padrão
  const defaultEventTypes = [
    { id: 'casamento', name: 'Casamento', color: '#ec4899', basePrice: 3000 },
    { id: 'aniversario', name: 'Aniversário', color: '#f59e0b', basePrice: 800 },
    { id: 'ensaio', name: 'Ensaio Fotográfico', color: '#3b82f6', basePrice: 500 },
    { id: 'formatura', name: 'Formatura', color: '#8b5cf6', basePrice: 1200 },
    { id: 'corporativo', name: 'Corporativo', color: '#6b7280', basePrice: 600 }
  ];

  const availableEventTypes = eventTypes.length > 0 ? eventTypes : defaultEventTypes;

  // Pacotes padrão baseados no tipo de evento
  const getDefaultPackages = (eventType: string) => {
    switch (eventType) {
      case 'casamento':
        return [
          { id: 'casamento-basico', name: 'Básico', price: 2500, description: 'Cobertura de 6 horas, 200 fotos editadas' },
          { id: 'casamento-premium', name: 'Premium', price: 4000, description: 'Cobertura de 8 horas, 400 fotos editadas, álbum' },
          { id: 'casamento-completo', name: 'Completo', price: 6000, description: 'Cobertura completa, 600+ fotos, álbum premium, vídeo' }
        ];
      case 'aniversario':
        return [
          { id: 'aniversario-basico', name: 'Básico', price: 800, description: 'Cobertura de 3 horas, 100 fotos editadas' },
          { id: 'aniversario-premium', name: 'Premium', price: 1200, description: 'Cobertura de 4 horas, 200 fotos editadas, álbum' }
        ];
      case 'ensaio':
        return [
          { id: 'ensaio-basico', name: 'Básico', price: 400, description: '1 hora de sessão, 30 fotos editadas' },
          { id: 'ensaio-premium', name: 'Premium', price: 600, description: '2 horas de sessão, 50 fotos editadas, 10 impressas' }
        ];
      default:
        return [
          { id: 'padrao-basico', name: 'Básico', price: 500, description: 'Pacote básico para o evento' },
          { id: 'padrao-premium', name: 'Premium', price: 800, description: 'Pacote premium para o evento' }
        ];
    }
  };

  const availablePackages = packages.length > 0 
    ? packages.filter(p => p.event_type_id === formData.tipo_evento)
    : getDefaultPackages(formData.tipo_evento);

  const updateField = (field: keyof FormData, value: any) => {
    console.log(`🔄 Atualizando campo ${field}:`, value);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📋 Novo formData:', newData);
      return newData;
    });
    
    // Limpar pacote selecionado quando mudar tipo de evento
    if (field === 'tipo_evento') {
      setFormData(prev => ({ ...prev, package_id: '', package_price: 0 }));
    }
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome é obrigatório';
      if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
      if (!formData.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp é obrigatório';
    }

    if (step === 2) {
      if (!formData.tipo_evento) newErrors.tipo_evento = 'Tipo de evento é obrigatório';
      if (!formData.data_evento) newErrors.data_evento = 'Data do evento é obrigatória';
      if (!formData.local_festa.trim()) newErrors.local_festa = 'Local é obrigatório';
    }

    if (step === 3) {
      if (!formData.package_id) newErrors.package_id = 'Selecione um pacote';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    
    try {
      // Salvar no localStorage como fallback
      const clientForms = JSON.parse(localStorage.getItem('clientForms') || '[]');
      const newForm = {
        ...formData,
        id: Date.now().toString(),
        submitted_at: new Date().toISOString()
      };
      clientForms.push(newForm);
      localStorage.setItem('clientForms', JSON.stringify(clientForms));
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      setIsSubmitted(true);
      setCurrentStep(4);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return User;
      case 2: return Calendar;
      case 3: return Camera;
      case 4: return CheckCircle;
      default: return User;
    }
  };

  const steps = [
    { number: 1, title: 'Seus Dados', description: 'Informações pessoais' },
    { number: 2, title: 'Seu Evento', description: 'Detalhes do evento' },
    { number: 3, title: 'Pacote', description: 'Escolha seu pacote' },
    { number: 4, title: 'Confirmação', description: 'Finalizar solicitação' }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Solicitação Enviada!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Obrigado pelo seu interesse! Entraremos em contato em breve para finalizar os detalhes do seu evento.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Resumo da sua solicitação:</p>
            <div className="text-left space-y-1">
              <p className="text-sm"><strong>Evento:</strong> {formData.tipo_evento}</p>
              <p className="text-sm"><strong>Data:</strong> {new Date(formData.data_evento).toLocaleDateString('pt-BR')}</p>
              <p className="text-sm"><strong>Local:</strong> {formData.local_festa}</p>
            </div>
          </div>
          
          {companySettings?.company?.whatsapp && (
            <a
              href={`https://wa.me/${companySettings.company.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header com informações da empresa */}
      {companySettings?.company && (
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {companySettings.company.name || 'Fotografia Profissional'}
              </h1>
              {companySettings.company.owner && (
                <p className="text-gray-600 mt-1">
                  {companySettings.company.owner}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = getStepIcon(step.number);
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Step 1: Dados Pessoais */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Vamos nos conhecer!
                </h2>
                <p className="text-gray-600">
                  Conte-nos um pouco sobre você
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_completo}
                    onChange={(e) => updateField('nome_completo', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.nome_completo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Seu nome completo"
                  />
                  {errors.nome_completo && (
                    <p className="text-red-500 text-sm mt-1">{errors.nome_completo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.whatsapp && (
                    <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => updateField('cpf', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => updateField('data_nascimento', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => updateField('endereco', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => updateField('cidade', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Sua cidade"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dados do Evento */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Conte sobre seu evento
                </h2>
                <p className="text-gray-600">
                  Vamos entender todos os detalhes
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Evento *
                  </label>
                  <select
                    value={formData.tipo_evento}
                    onChange={(e) => {
                      console.log('🎯 Select onChange - valor:', e.target.value);
                      updateField('tipo_evento', e.target.value);
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.tipo_evento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o tipo</option>
                    {availableEventTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.tipo_evento && (
                    <p className="text-red-500 text-sm mt-1">{errors.tipo_evento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    value={formData.data_evento}
                    onChange={(e) => updateField('data_evento', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.data_evento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.data_evento && (
                    <p className="text-red-500 text-sm mt-1">{errors.data_evento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário do Evento
                  </label>
                  <input
                    type="time"
                    value={formData.horario_evento}
                    onChange={(e) => updateField('horario_evento', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local da Festa *
                  </label>
                  <input
                    type="text"
                    value={formData.local_festa}
                    onChange={(e) => updateField('local_festa', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.local_festa ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nome do local ou endereço"
                  />
                  {errors.local_festa && (
                    <p className="text-red-500 text-sm mt-1">{errors.local_festa}</p>
                  )}
                </div>

                {/* Campos específicos por tipo de evento */}
                {formData.tipo_evento === 'casamento' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome dos Noivos
                      </label>
                      <input
                        type="text"
                        value={formData.nome_noivos}
                        onChange={(e) => updateField('nome_noivos', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="João & Maria"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Local da Cerimônia
                      </label>
                      <input
                        type="text"
                        value={formData.local_cerimonia}
                        onChange={(e) => updateField('local_cerimonia', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Igreja, cartório, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Local do Pré-Wedding
                      </label>
                      <input
                        type="text"
                        value={formData.local_pre_wedding}
                        onChange={(e) => updateField('local_pre_wedding', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Local para ensaio pré-casamento"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Local do Making Of
                      </label>
                      <input
                        type="text"
                        value={formData.local_making_of}
                        onChange={(e) => updateField('local_making_of', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Local dos preparativos"
                      />
                    </div>
                  </>
                )}

                {formData.tipo_evento === 'aniversario' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Aniversariante
                    </label>
                    <input
                      type="text"
                      value={formData.nome_aniversariante}
                      onChange={(e) => updateField('nome_aniversariante', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nome do aniversariante"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Pacotes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Escolha seu pacote
                </h2>
                <p className="text-gray-600">
                  Selecione o pacote que melhor atende suas necessidades
                </p>
              </div>

              {availablePackages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePackages.map((pkg) => (
                    <motion.div
                      key={pkg.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        updateField('package_id', pkg.id);
                        updateField('package_price', pkg.price);
                      }}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                        formData.package_id === pkg.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {pkg.name}
                        </h3>
                        <div className="text-3xl font-bold text-blue-600 mb-4">
                          {formatCurrency(pkg.price)}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                          {pkg.description}
                        </p>
                        {formData.package_id === pkg.id && (
                          <div className="flex items-center justify-center text-blue-600">
                            <Check className="h-5 w-5 mr-2" />
                            Selecionado
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Primeiro selecione o tipo de evento para ver os pacotes disponíveis.
                  </p>
                </div>
              )}

              {errors.package_id && (
                <p className="text-red-500 text-sm text-center">{errors.package_id}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Conte-nos mais detalhes sobre seu evento, expectativas especiais, etc."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;