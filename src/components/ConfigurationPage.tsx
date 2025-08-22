import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Settings, Palette, Upload, Eye, Trash2, Plus, Monitor, Smartphone, Image, Zap, Grid3X3, Sparkles, X, Check, Calendar, Users, DollarSign, FileText, Package, CreditCard, Building, MapPin, Phone, Mail, Globe, Camera, Clock, Star, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIconComponent } from '../utils/icons';

interface ConfigurationPageProps {
  user: any;
  supabase: any;
  onBack: () => void;
  onSettingsChange?: (settings: any) => void;
}

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ user, supabase, onBack, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Sistema de Gestão Fotográfica',
      siteDescription: 'Plataforma completa de gestão para fotógrafos',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      dateFormat: 'dd/MM/yyyy',
      businessName: '',
      businessPhone: '',
      businessEmail: '',
      businessAddress: '',
      businessWebsite: ''
    },
    appearance: {
      theme: 'light',
      primaryColor: '#3b82f6',
      logoUrl: '',
      backgroundImage: '',
      backgroundType: 'gradient',
      backgroundColor: '#f8fafc',
      gradientFrom: '#3b82f6',
      gradientTo: '#1e40af',
      mainWallpaper: null as string | null,
      lockScreenWallpaper: null as string | null,
      buttons: [
        {
          id: 'triagem',
          name: 'Triagem',
          icon: 'Image',
          color: 'green',
          backgroundImage: 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800',
          url: 'https://triagem.exemplo.com',
          isActive: true
        },
        {
          id: 'grana',
          name: 'Grana',
          icon: 'DollarSign',
          color: 'yellow',
          backgroundImage: 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=800',
          url: 'https://grana.exemplo.com',
          isActive: false
        },
        {
          id: 'contrato',
          name: 'Contratos',
          icon: 'FileText',
          color: 'blue',
          backgroundImage: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=800',
          url: 'internal:contratos',
          isActive: true
        },
        {
          id: 'automacao',
          name: 'Automação',
          icon: 'Zap',
          color: 'purple',
          backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
          url: 'https://automacao.exemplo.com',
          isActive: false
        },
        {
          id: 'obrigacoes',
          name: 'Obrigações',
          icon: 'CheckSquare',
          color: 'orange',
          backgroundImage: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
          url: 'internal:obrigacoes',
          isActive: true
        }
      ]
    },
    eventTypes: {
      types: [
        { id: 'ensaio', name: 'Ensaio Fotográfico', days: 7, color: '#3b82f6', price: 400 },
        { id: 'casamento', name: 'Casamento', days: 30, color: '#ec4899', price: 2500 },
        { id: 'aniversario', name: 'Aniversário', days: 14, color: '#f59e0b', price: 800 },
        { id: 'formatura', name: 'Formatura', days: 21, color: '#8b5cf6', price: 600 },
        { id: 'corporativo', name: 'Corporativo', days: 10, color: '#6b7280', price: 500 },
        { id: 'produto', name: 'Produto', days: 5, color: '#10b981', price: 300 },
        { id: 'evento', name: 'Evento', days: 14, color: '#f97316', price: 700 },
        { id: 'edicao', name: 'Edição de Fotos', days: 3, color: '#6366f1', price: 150 },
        { id: 'album', name: 'Entrega de Álbum', days: 45, color: '#ef4444', price: 200 },
        { id: 'reuniao', name: 'Reunião com Cliente', days: 1, color: '#14b8a6', price: 0 }
      ]
    },
    packages: {
      packages: [
        {
          id: 'basico-casamento',
          eventTypeId: 'casamento',
          name: 'Básico',
          description: 'Pacote básico para casamento',
          price: 2500,
          features: ['Cobertura de 6 horas', '200 fotos editadas', 'Galeria online'],
          isActive: true
        },
        {
          id: 'premium-casamento',
          eventTypeId: 'casamento',
          name: 'Premium',
          description: 'Pacote premium para casamento',
          price: 4000,
          features: ['Cobertura de 8 horas', '400 fotos editadas', 'Álbum 30x30', 'Galeria online', 'Pré-wedding'],
          isActive: true
        },
        {
          id: 'completo-casamento',
          eventTypeId: 'casamento',
          name: 'Completo',
          description: 'Pacote completo para casamento',
          price: 6000,
          features: ['Cobertura completa', '600+ fotos editadas', 'Álbum premium', 'Galeria online', 'Pré-wedding', 'Making of', 'Vídeo highlights'],
          isActive: true
        },
        {
          id: 'basico-aniversario',
          eventTypeId: 'aniversario',
          name: 'Básico',
          description: 'Pacote básico para aniversário',
          price: 800,
          features: ['Cobertura de 3 horas', '100 fotos editadas', 'Galeria online'],
          isActive: true
        },
        {
          id: 'premium-aniversario',
          eventTypeId: 'aniversario',
          name: 'Premium',
          description: 'Pacote premium para aniversário',
          price: 1200,
          features: ['Cobertura de 4 horas', '200 fotos editadas', 'Álbum 20x20', 'Galeria online'],
          isActive: true
        }
      ]
    },
    paymentMethods: {
      methods: [
        {
          id: 'avista',
          name: 'À Vista',
          description: 'Pagamento à vista com desconto',
          discountPercentage: 10,
          installments: 1,
          isActive: true
        },
        {
          id: 'cartao',
          name: 'Cartão de Crédito',
          description: 'Parcelado no cartão de crédito',
          discountPercentage: 0,
          installments: 12,
          isActive: true
        },
        {
          id: 'pix',
          name: 'PIX',
          description: 'Pagamento via PIX',
          discountPercentage: 5,
          installments: 1,
          isActive: true
        },
        {
          id: 'transferencia',
          name: 'Transferência',
          description: 'Transferência bancária',
          discountPercentage: 5,
          installments: 1,
          isActive: true
        },
        {
          id: 'dinheiro',
          name: 'Dinheiro',
          description: 'Pagamento em dinheiro',
          discountPercentage: 10,
          installments: 1,
          isActive: true
        }
      ]
    },
    business: {
      name: '',
      owner: '',
      document: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      bankAccount: '',
      pixKey: '',
      socialMedia: {
        instagram: '',
        facebook: '',
        whatsapp: ''
      }
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      contractReminders: true,
      paymentReminders: true,
      eventReminders: true,
      reminderDays: 7
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingLock, setUploadingLock] = useState(false);

  const tabs = [
    { 
      id: 'general', 
      name: 'Geral', 
      icon: Settings,
      description: 'Configurações gerais do sistema',
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      id: 'business', 
      name: 'Empresa', 
      icon: Building,
      description: 'Dados da sua empresa',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'appearance', 
      name: 'Aparência', 
      icon: Palette,
      description: 'Personalize a interface visual',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'events', 
      name: 'Tipos de Eventos', 
      icon: Calendar,
      description: 'Configure tipos e prazos',
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 'packages', 
      name: 'Pacotes', 
      icon: Package,
      description: 'Gerencie pacotes de serviços',
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      id: 'payments', 
      name: 'Pagamentos', 
      icon: CreditCard,
      description: 'Métodos de pagamento',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      id: 'notifications', 
      name: 'Notificações', 
      icon: Bell,
      description: 'Configurar alertas e lembretes',
      color: 'from-red-500 to-pink-500'
    }
  ];

  const availableIcons = [
    'Settings', 'Users', 'Image', 'DollarSign', 'FileText', 'Shield', 'Bell',
    'Zap', 'Bot', 'Cpu', 'Database', 'Server', 'Workflow', 'GitBranch',
    'Calendar', 'Clock', 'Mail', 'Phone', 'MessageSquare', 'Video',
    'Camera', 'Music', 'Play', 'Pause', 'Download', 'Upload',
    'Search', 'Filter', 'Sort', 'Grid', 'List', 'Map',
    'Home', 'Building', 'Car', 'Truck', 'Plane', 'Ship',
    'Heart', 'Star', 'Award', 'Trophy', 'Target', 'Flag',
    'Lock', 'Unlock', 'Key', 'Eye', 'EyeOff', 'Fingerprint',
    'Wifi', 'Bluetooth', 'Radio', 'Signal', 'Battery', 'Power',
    'Lightbulb', 'Sun', 'Moon', 'Cloud', 'Umbrella', 'Thermometer',
    'Activity', 'BarChart', 'PieChart', 'TrendingUp', 'TrendingDown', 'LineChart'
  ];

  const colorOptions = [
    { name: 'Azul', value: 'blue', hex: '#3b82f6' },
    { name: 'Verde', value: 'green', hex: '#10b981' },
    { name: 'Roxo', value: 'purple', hex: '#8b5cf6' },
    { name: 'Rosa', value: 'pink', hex: '#ec4899' },
    { name: 'Laranja', value: 'orange', hex: '#f59e0b' },
    { name: 'Vermelho', value: 'red', hex: '#ef4444' },
    { name: 'Cinza', value: 'gray', hex: '#6b7280' },
    { name: 'Amarelo', value: 'yellow', hex: '#eab308' }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no Supabase se disponível
      if (supabase) {
        try {
          // Salvar tipos de eventos
          for (const eventType of settings.eventTypes.types) {
            await supabase
              .from('event_types')
              .upsert({
                id: eventType.id,
                name: eventType.name,
                is_active: true
              }, { onConflict: 'name' });
          }

          // Salvar pacotes
          for (const pkg of settings.packages.packages) {
            const eventType = settings.eventTypes.types.find(et => et.id === pkg.eventTypeId);
            if (eventType) {
              await supabase
                .from('packages')
                .upsert({
                  id: pkg.id,
                  name: pkg.name,
                  description: pkg.description,
                  price: pkg.price,
                  features: pkg.features,
                  is_active: pkg.isActive,
                  event_type_id: eventType.id
                }, { onConflict: 'id' });
            }
          }

          // Salvar métodos de pagamento
          for (const method of settings.paymentMethods.methods) {
            await supabase
              .from('payment_methods')
              .upsert({
                id: method.id,
                name: method.name,
                description: method.description,
                discount_percentage: method.discountPercentage,
                installments: method.installments,
                is_active: method.isActive
              }, { onConflict: 'id' });
          }
        } catch (error) {
          console.warn('Erro ao salvar no Supabase:', error);
        }
      }
      
      // Notificar mudanças para o componente pai
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category as keyof typeof settings],
        [key]: value
      }
    };
    
    setSettings(newSettings);
    
    // Salvar imediatamente no localStorage
    localStorage.setItem('systemSettings', JSON.stringify(newSettings));
    
    // Notificar mudanças para o componente pai SEMPRE
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const updateSettingsObject = (newSettings: any) => {
    setSettings(newSettings);
    
    // Salvar imediatamente no localStorage
    localStorage.setItem('systemSettings', JSON.stringify(newSettings));
    
    // Notificar mudanças para o componente pai
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  // Carregar configurações salvas ao inicializar
  useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Garantir que sempre temos a estrutura completa
        const mergedSettings = {
          ...settings,
          ...parsedSettings,
          general: { ...settings.general, ...parsedSettings.general },
          business: { ...settings.business, ...parsedSettings.business },
          appearance: {
            ...settings.appearance,
            ...parsedSettings.appearance,
            buttons: parsedSettings.appearance?.buttons || settings.appearance.buttons
          },
          eventTypes: {
            ...settings.eventTypes,
            ...parsedSettings.eventTypes
          },
          packages: {
            ...settings.packages,
            ...parsedSettings.packages
          },
          paymentMethods: {
            ...settings.paymentMethods,
            ...parsedSettings.paymentMethods
          },
          notifications: {
            ...settings.notifications,
            ...parsedSettings.notifications
          }
        };
        setSettings(mergedSettings);
        
        // Aplicar configurações carregadas
        if (onSettingsChange) {
          onSettingsChange(mergedSettings);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, [onSettingsChange]);

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      {/* Configurações Gerais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configurações Gerais
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configurações básicas do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Sistema
            </label>
            <input
              type="text"
              value={settings.general.siteName}
              onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Idioma
            </label>
            <select
              value={settings.general.language}
              onChange={(e) => updateSetting('general', 'language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fuso Horário
            </label>
            <select
              value={settings.general.timezone}
              onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="Europe/London">London (GMT+0)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moeda
            </label>
            <select
              value={settings.general.currency}
              onChange={(e) => updateSetting('general', 'currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição do Sistema
            </label>
            <textarea
              value={settings.general.siteDescription}
              onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-8">
      {/* Dados da Empresa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dados da Empresa
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Informações do seu negócio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={settings.business.name}
              onChange={(e) => updateSetting('business', 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proprietário
            </label>
            <input
              type="text"
              value={settings.business.owner}
              onChange={(e) => updateSetting('business', 'owner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CNPJ/CPF
            </label>
            <input
              type="text"
              value={settings.business.document}
              onChange={(e) => updateSetting('business', 'document', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefone
            </label>
            <input
              type="text"
              value={settings.business.phone}
              onChange={(e) => updateSetting('business', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.business.email}
              onChange={(e) => updateSetting('business', 'email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={settings.business.website}
              onChange={(e) => updateSetting('business', 'website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={settings.business.address}
              onChange={(e) => updateSetting('business', 'address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cidade
            </label>
            <input
              type="text"
              value={settings.business.city}
              onChange={(e) => updateSetting('business', 'city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <input
              type="text"
              value={settings.business.state}
              onChange={(e) => updateSetting('business', 'state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </motion.div>

      {/* Dados Bancários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dados Bancários
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Informações para recebimento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conta Bancária
            </label>
            <input
              type="text"
              value={settings.business.bankAccount}
              onChange={(e) => updateSetting('business', 'bankAccount', e.target.value)}
              placeholder="Banco, Agência, Conta"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              value={settings.business.pixKey}
              onChange={(e) => updateSetting('business', 'pixKey', e.target.value)}
              placeholder="CPF, CNPJ, Email ou Telefone"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </motion.div>

      {/* Redes Sociais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Redes Sociais
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Links das suas redes sociais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instagram
            </label>
            <input
              type="text"
              value={settings.business.socialMedia.instagram}
              onChange={(e) => updateSetting('business', 'socialMedia', { ...settings.business.socialMedia, instagram: e.target.value })}
              placeholder="@seuinstagram"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facebook
            </label>
            <input
              type="text"
              value={settings.business.socialMedia.facebook}
              onChange={(e) => updateSetting('business', 'socialMedia', { ...settings.business.socialMedia, facebook: e.target.value })}
              placeholder="facebook.com/seuperfil"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp Business
            </label>
            <input
              type="text"
              value={settings.business.socialMedia.whatsapp}
              onChange={(e) => updateSetting('business', 'socialMedia', { ...settings.business.socialMedia, whatsapp: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-8">
      {/* Wallpapers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Image className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Papéis de Parede
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalize o fundo da aplicação
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Monitor className="h-4 w-4 inline mr-2" />
              Papel de Parede Principal
            </label>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'main')}
                    className="hidden"
                    disabled={uploadingMain}
                  />
                  <div className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer text-center ${
                    uploadingMain ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    {uploadingMain ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para selecionar imagem
                        </span>
                      </div>
                    )}
                  </div>
                </label>
                
                {settings.appearance.mainWallpaper && (
                  <button
                    onClick={() => removeWallpaper('main')}
                    className="px-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {settings.appearance.mainWallpaper && (
                <div className="mt-3">
                  <div
                    className="h-20 w-full rounded-lg bg-cover bg-center border border-gray-200 dark:border-gray-600 shadow-sm"
                    style={{ backgroundImage: `url(${settings.appearance.mainWallpaper})` }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preview do papel de parede</p>
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" />
                      <span className="text-xs">Carregado</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Smartphone className="h-4 w-4 inline mr-2" />
              Tela de Bloqueio
            </label>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'lock')}
                    className="hidden"
                    disabled={uploadingLock}
                  />
                  <div className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer text-center ${
                    uploadingLock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    {uploadingLock ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para selecionar imagem
                        </span>
                      </div>
                    )}
                  </div>
                </label>
                
                {settings.appearance.lockScreenWallpaper && (
                  <button
                    onClick={() => removeWallpaper('lock')}
                    className="px-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {settings.appearance.lockScreenWallpaper && (
                <div className="mt-3">
                  <div
                    className="h-20 w-full rounded-lg bg-cover bg-center border border-gray-200 dark:border-gray-600 shadow-sm"
                    style={{ backgroundImage: `url(${settings.appearance.lockScreenWallpaper})` }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preview da tela de bloqueio</p>
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" />
                      <span className="text-xs">Carregado</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fundo da Interface
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure cores e gradientes
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Gradientes Predefinidos
            </label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((color) => (
                <motion.button
                  key={color.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const colors = {
                      blue: { from: '#3b82f6', to: '#1e40af' },
                      green: { from: '#10b981', to: '#059669' },
                      purple: { from: '#8b5cf6', to: '#7c3aed' },
                      pink: { from: '#ec4899', to: '#db2777' },
                      orange: { from: '#f59e0b', to: '#d97706' },
                      red: { from: '#ef4444', to: '#dc2626' },
                      gray: { from: '#6b7280', to: '#4b5563' },
                      yellow: { from: '#eab308', to: '#d97706' }
                    };
                    const colorData = colors[color.value as keyof typeof colors];
                    updateSetting('appearance', 'gradientFrom', colorData.from);
                    updateSetting('appearance', 'gradientTo', colorData.to);
                  }}
                  className="h-16 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-all shadow-sm hover:shadow-md relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${color.hex}, ${color.hex}dd)`
                  }}
                  title={color.name}
                >
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
                    <span className="text-white font-medium text-xs opacity-0 hover:opacity-100 transition-opacity">
                      {color.name}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <Grid3X3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Botões do Sistema
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure os aplicativos disponíveis
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addButton}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </motion.button>
        </div>

        <div className="space-y-4">
          {settings.appearance.buttons.filter(button => button && button.id).map((button, index) => (
            <motion.div
              key={button.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                    #{settings.appearance.buttons.indexOf(button) + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {button.name}
                  </span>
                </div>
                <button
                  onClick={() => removeButton(button.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remover botão"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={button.name}
                    onChange={(e) => updateButton(button.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={button.url}
                    onChange={(e) => updateButton(button.id, 'url', e.target.value)}
                    placeholder="https://exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ícone
                  </label>
                  <select
                    value={button.icon}
                    onChange={(e) => updateButton(button.id, 'icon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cor
                  </label>
                  <select
                    value={button.color}
                    onChange={(e) => updateButton(button.id, 'color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem de Fundo
                </label>
                <input
                  type="url"
                  value={button.backgroundImage}
                  onChange={(e) => updateButton(button.id, 'backgroundImage', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                />
              </div>

              <div className="mt-4 flex justify-center">
                <div
                  className={`w-20 h-20 rounded-xl shadow-md overflow-hidden relative border-2 border-gray-200 dark:border-gray-600 transition-all ${
                    button.isActive === false ? 'opacity-50 grayscale' : ''
                  }`}
                  style={{
                    backgroundImage: `url(${button.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    button.isActive === false ? 'from-gray-600 to-gray-800' : getColorGradient(button.color)
                  } opacity-80`}></div>
                  <div className="relative h-full flex items-center justify-center">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                      {React.createElement(getIconComponent(button.icon), { 
                        className: `h-5 w-5 ${button.isActive === false ? 'text-gray-400' : 'text-white'}` 
                      })}
                    </div>
                  </div>
                  {button.isActive === false && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-gray-500 rounded-full border border-white"></div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // Implementar outras funções necessárias...
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'lock') => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file, type);
    }
    event.target.value = '';
  };

  const uploadImage = async (file: File, type: 'main' | 'lock') => {
    if (!supabase) {
      alert('Supabase não configurado');
      return;
    }

    const setUploading = type === 'main' ? setUploadingMain : setUploadingLock;
    setUploading(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Imagem muito grande. Máximo 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-wallpaper-${Date.now()}.${fileExt}`;
      const filePath = `wallpapers/${fileName}`;

      const { data, error } = await supabase.storage
        .from('Uteis')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Uteis')
        .getPublicUrl(filePath);

      const settingKey = type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper';
      updateSetting('appearance', settingKey, publicUrl);

    } catch (error: any) {
      console.error('Erro no upload:', error);
      alert(error.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const removeWallpaper = async (type: 'main' | 'lock') => {
    const settingKey = type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper';
    const currentUrl = settings.appearance[settingKey];
    
    if (currentUrl && supabase) {
      try {
        const urlParts = currentUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `wallpapers/${fileName}`;
        
        await supabase.storage
          .from('Uteis')
          .remove([filePath]);
      } catch (error) {
        console.error('Erro ao remover arquivo:', error);
      }
    }
    
    updateSetting('appearance', settingKey, null);
  };

  const getColorGradient = (color: string) => {
    const gradients = {
      blue: 'from-blue-500 to-indigo-600',
      green: 'from-green-500 to-emerald-600',
      purple: 'from-purple-500 to-pink-600',
      pink: 'from-pink-500 to-rose-600',
      orange: 'from-orange-500 to-amber-600',
      red: 'from-red-500 to-pink-600',
      gray: 'from-gray-500 to-slate-600',
      yellow: 'from-yellow-500 to-orange-600'
    };
    return gradients[color as keyof typeof gradients] || 'from-blue-500 to-indigo-600';
  };

  const updateButton = (buttonId: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        buttons: settings.appearance.buttons.map(btn => 
          btn.id === buttonId ? { ...btn, [key]: value } : btn
        )
      }
    };
    
    updateSettingsObject(newSettings);
  };

  const addButton = () => {
    const newButton = {
      id: `custom_${Date.now()}`,
      name: 'Novo Sistema',
      icon: 'Zap',
      color: 'blue',
      backgroundImage: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://exemplo.com',
      isActive: true
    };

    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        buttons: [...settings.appearance.buttons, newButton]
      }
    };
    
    updateSettingsObject(newSettings);
  };

  const removeButton = (buttonId: string) => {
    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        buttons: settings.appearance.buttons.filter(btn => btn.id !== buttonId)
      }
    };
    
    updateSettingsObject(newSettings);
  };

  // Implementar renderização das outras abas...
  const renderEventTypesSettings = () => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tipos de Eventos e Prazos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure os tipos de eventos e seus prazos padrão
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addEventType}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Adicionar Tipo
          </motion.button>
        </div>

        <div className="space-y-4">
          {settings.eventTypes.types.map((eventType, index) => (
            <motion.div
              key={eventType.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: eventType.color }}
                  ></div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {eventType.name}
                  </span>
                </div>
                <button
                  onClick={() => removeEventType(eventType.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remover tipo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Tipo
                  </label>
                  <input
                    type="text"
                    value={eventType.name}
                    onChange={(e) => updateEventType(eventType.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prazo (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={eventType.days}
                    onChange={(e) => updateEventType(eventType.id, 'days', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço Base
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventType.price}
                    onChange={(e) => updateEventType(eventType.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={eventType.color}
                    onChange={(e) => updateEventType(eventType.id, 'color', e.target.value)}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Previsão de entrega:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {eventType.days} {eventType.days === 1 ? 'dia' : 'dias'} após a data do evento
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    Preço base sugerido:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    R$ {eventType.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const addEventType = () => {
    const newType = {
      id: `custom_${Date.now()}`,
      name: 'Novo Tipo',
      days: 7,
      color: '#3b82f6',
      price: 500
    };

    const newSettings = {
      ...settings,
      eventTypes: {
        ...settings.eventTypes,
        types: [...settings.eventTypes.types, newType]
      }
    };
    
    updateSettingsObject(newSettings);
  };

  const removeEventType = (typeId: string) => {
    const newSettings = {
      ...settings,
      eventTypes: {
        ...settings.eventTypes,
        types: settings.eventTypes.types.filter(type => type.id !== typeId)
      }
    };
    
    updateSettingsObject(newSettings);
  };

  const updateEventType = (typeId: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      eventTypes: {
        ...settings.eventTypes,
        types: settings.eventTypes.types.map(type => 
          type.id === typeId ? { ...type, [key]: value } : type
        )
      }
    };
    
    updateSettingsObject(newSettings);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'business':
        return renderBusinessSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'events':
        return renderEventTypesSettings();
      case 'packages':
        return <div>Pacotes em desenvolvimento...</div>;
      case 'payments':
        return <div>Métodos de pagamento em desenvolvimento...</div>;
      case 'notifications':
        return <div>Notificações em desenvolvimento...</div>;
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header */}
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
                  Configurações do Sistema
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personalize sua experiência
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
              } disabled:opacity-50`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? 'Salvo!' : 'Salvar Alterações'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Modern Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Categorias
              </h2>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-4 p-4 text-left rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        activeTab === tab.id 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{tab.name}</div>
                        <div className={`text-xs ${
                          activeTab === tab.id 
                            ? 'text-white/80' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;