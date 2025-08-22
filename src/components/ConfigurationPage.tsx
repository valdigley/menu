import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, X, Plus, Edit, Trash2, Palette, Settings, Building, Calendar, Package, CreditCard, Bell, Globe, Camera, Smartphone, Mail, Phone, MapPin, DollarSign, Clock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigurationPageProps {
  user: any;
  supabase: any;
  onBack: () => void;
  onSettingsChange: (settings: any) => void;
}

interface SystemSettings {
  general: {
    systemName: string;
    description: string;
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  };
  company: {
    name: string;
    owner: string;
    document: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    bankAccount: string;
    pixKey: string;
    instagram: string;
    facebook: string;
    whatsapp: string;
  };
  appearance: {
    mainWallpaper: string;
    lockScreenWallpaper: string;
    gradientFrom: string;
    gradientTo: string;
    buttons: Array<{
      id: string;
      name: string;
      icon: string;
      color: string;
      backgroundImage: string;
      url: string;
      isActive: boolean;
    }>;
  };
  eventTypes: {
    types: Array<{
      id: string;
      name: string;
      days: number;
      color: string;
      basePrice: number;
    }>;
  };
}

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ user, supabase, onBack, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      systemName: 'Ferramentas para Fotógrafos',
      description: 'Sistema completo para gestão fotográfica',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY'
    },
    company: {
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
      instagram: '',
      facebook: '',
      whatsapp: ''
    },
    appearance: {
      mainWallpaper: '',
      lockScreenWallpaper: '',
      gradientFrom: '#3b82f6',
      gradientTo: '#1e40af',
      buttons: []
    },
    eventTypes: {
      types: [
        { id: 'ensaio', name: 'Ensaio Fotográfico', days: 7, color: '#3b82f6', basePrice: 500 },
        { id: 'casamento', name: 'Casamento', days: 30, color: '#ec4899', basePrice: 3000 },
        { id: 'aniversario', name: 'Aniversário', days: 14, color: '#f59e0b', basePrice: 800 },
        { id: 'formatura', name: 'Formatura', days: 21, color: '#8b5cf6', basePrice: 1200 },
        { id: 'corporativo', name: 'Corporativo', days: 10, color: '#6b7280', basePrice: 600 },
        { id: 'produto', name: 'Produto', days: 5, color: '#10b981', basePrice: 400 },
        { id: 'evento', name: 'Evento', days: 14, color: '#f97316', basePrice: 1000 },
        { id: 'edicao', name: 'Edição de Fotos', days: 3, color: '#6366f1', basePrice: 200 },
        { id: 'album', name: 'Entrega de Álbum', days: 45, color: '#ef4444', basePrice: 800 },
        { id: 'reuniao', name: 'Reunião com Cliente', days: 1, color: '#14b8a6', basePrice: 0 }
      ]
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingEventType, setEditingEventType] = useState<any>(null);
  const [showEventTypeForm, setShowEventTypeForm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      onSettingsChange(settings);
      
      // Tentar salvar no Supabase se disponível
      if (supabase && user) {
        // Implementar salvamento no banco quando necessário
      }
      
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, data: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleImageUpload = async (file: File, type: 'main' | 'lock') => {
    setUploadingImage(true);
    try {
      if (!supabase) {
        // Fallback: usar FileReader para converter para base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          updateSettings('appearance', {
            [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: base64
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      // Tentar criar o bucket se não existir
      try {
        await supabase.storage.createBucket('wallpapers', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
      } catch (bucketError) {
        console.log('Bucket já existe ou erro ao criar:', bucketError);
      }

      // Fazer upload da imagem
      const fileExt = file.name.split('.').pop();
      const fileName = `wallpaper-${type}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('wallpapers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        // Fallback para base64 se upload falhar
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          updateSettings('appearance', {
            [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: base64
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(fileName);

      updateSettings('appearance', {
        [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: publicUrl
      });

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      
      // Fallback final: usar base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateSettings('appearance', {
          [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: base64
        });
        alert('Imagem salva localmente (Supabase indisponível)');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const addEventType = () => {
    setEditingEventType({
      id: '',
      name: '',
      days: 7,
      color: '#3b82f6',
      basePrice: 0
    });
    setShowEventTypeForm(true);
  };

  const editEventType = (eventType: any) => {
    setEditingEventType(eventType);
    setShowEventTypeForm(true);
  };

  const saveEventType = () => {
    if (!editingEventType.name) return;

    const newTypes = [...settings.eventTypes.types];
    const existingIndex = newTypes.findIndex(t => t.id === editingEventType.id);

    if (existingIndex >= 0) {
      newTypes[existingIndex] = editingEventType;
    } else {
      editingEventType.id = editingEventType.name.toLowerCase().replace(/\s+/g, '_');
      newTypes.push(editingEventType);
    }

    updateSettings('eventTypes', { types: newTypes });
    setShowEventTypeForm(false);
    setEditingEventType(null);
  };

  const deleteEventType = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tipo de evento?')) {
      const newTypes = settings.eventTypes.types.filter(t => t.id !== id);
      updateSettings('eventTypes', { types: newTypes });
    }
  };

  const tabs = [
    { id: 'general', name: 'Geral', icon: Settings },
    { id: 'company', name: 'Empresa', icon: Building },
    { id: 'appearance', name: 'Aparência', icon: Palette },
    { id: 'eventTypes', name: 'Tipos de Eventos', icon: Calendar },
    { id: 'packages', name: 'Pacotes', icon: Package },
    { id: 'payments', name: 'Pagamentos', icon: CreditCard },
    { id: 'notifications', name: 'Notificações', icon: Bell }
  ];

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
                  Configurações do Sistema
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personalize e configure seu sistema
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Configurações Gerais
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome do Sistema
                          </label>
                          <input
                            type="text"
                            value={settings.general.systemName}
                            onChange={(e) => updateSettings('general', { systemName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Idioma
                          </label>
                          <select
                            value={settings.general.language}
                            onChange={(e) => updateSettings('general', { language: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en-US">English (US)</option>
                            <option value="es-ES">Español</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descrição
                          </label>
                          <textarea
                            value={settings.general.description}
                            onChange={(e) => updateSettings('general', { description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'company' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Dados da Empresa
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome da Empresa
                          </label>
                          <input
                            type="text"
                            value={settings.company.name}
                            onChange={(e) => updateSettings('company', { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proprietário
                          </label>
                          <input
                            type="text"
                            value={settings.company.owner}
                            onChange={(e) => updateSettings('company', { owner: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CNPJ/CPF
                          </label>
                          <input
                            type="text"
                            value={settings.company.document}
                            onChange={(e) => updateSettings('company', { document: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Telefone
                          </label>
                          <input
                            type="text"
                            value={settings.company.phone}
                            onChange={(e) => updateSettings('company', { phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={settings.company.email}
                            onChange={(e) => updateSettings('company', { email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={settings.company.website}
                            onChange={(e) => updateSettings('company', { website: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Chave PIX
                          </label>
                          <input
                            type="text"
                            value={settings.company.pixKey}
                            onChange={(e) => updateSettings('company', { pixKey: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Instagram
                          </label>
                          <input
                            type="text"
                            value={settings.company.instagram}
                            onChange={(e) => updateSettings('company', { instagram: e.target.value })}
                            placeholder="@seuinstagram"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'appearance' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Aparência
                      </h2>
                      
                      <div className="space-y-8">
                        {/* Wallpapers */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Papéis de Parede
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Wallpaper Principal
                              </label>
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                {settings.appearance.mainWallpaper ? (
                                  <div className="relative">
                                    <img
                                      src={settings.appearance.mainWallpaper}
                                      alt="Wallpaper Principal"
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                      onClick={() => updateSettings('appearance', { mainWallpaper: '' })}
                                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-2">
                                      <label className="cursor-pointer">
                                        <span className="text-blue-600 hover:text-blue-500">
                                          Fazer upload
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, 'main');
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Wallpaper Tela de Bloqueio
                              </label>
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                {settings.appearance.lockScreenWallpaper ? (
                                  <div className="relative">
                                    <img
                                      src={settings.appearance.lockScreenWallpaper}
                                      alt="Wallpaper Tela de Bloqueio"
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                      onClick={() => updateSettings('appearance', { lockScreenWallpaper: '' })}
                                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-2">
                                      <label className="cursor-pointer">
                                        <span className="text-blue-600 hover:text-blue-500">
                                          Fazer upload
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, 'lock');
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gradientes */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Gradiente de Fallback
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cor Inicial
                              </label>
                              <input
                                type="color"
                                value={settings.appearance.gradientFrom}
                                onChange={(e) => updateSettings('appearance', { gradientFrom: e.target.value })}
                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cor Final
                              </label>
                              <input
                                type="color"
                                value={settings.appearance.gradientTo}
                                onChange={(e) => updateSettings('appearance', { gradientTo: e.target.value })}
                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div
                              className="w-full h-20 rounded-lg"
                              style={{
                                background: `linear-gradient(135deg, ${settings.appearance.gradientFrom}, ${settings.appearance.gradientTo})`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'eventTypes' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Tipos de Eventos
                        </h2>
                        <button
                          onClick={addEventType}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Tipo
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {settings.eventTypes.types.map((eventType) => (
                          <div
                            key={eventType.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: eventType.color }}
                              ></div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editEventType(eventType)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteEventType(eventType.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                              {eventType.name}
                            </h3>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {eventType.days} {eventType.days === 1 ? 'dia' : 'dias'}
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                R$ {eventType.basePrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(activeTab === 'packages' || activeTab === 'payments' || activeTab === 'notifications') && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Settings className="mx-auto h-12 w-12" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Em Desenvolvimento
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Esta seção estará disponível em breve.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Tipo de Evento */}
      <AnimatePresence>
        {showEventTypeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingEventType?.id ? 'Editar' : 'Adicionar'} Tipo de Evento
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editingEventType?.name || ''}
                    onChange={(e) => setEditingEventType(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prazo (dias)
                  </label>
                  <input
                    type="number"
                    value={editingEventType?.days || ''}
                    onChange={(e) => setEditingEventType(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço Base
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingEventType?.basePrice || ''}
                    onChange={(e) => setEditingEventType(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={editingEventType?.color || '#3b82f6'}
                    onChange={(e) => setEditingEventType(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEventTypeForm(false);
                    setEditingEventType(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEventType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConfigurationPage;