import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, X, Plus, Edit, Trash2, Palette, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getIconComponent } from '../utils/icons';
import { SSOManager } from '../utils/sso';
import UserManagement from './UserManagement';

interface ConfigurationPageProps {
  user: any;
  supabase: any;
  onBack: () => void;
  onSettingsChange: (settings: any) => void;
}

interface ButtonConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundImage: string;
  url: string;
  isActive: boolean;
}

interface SystemSettings {
  appearance: {
    mainWallpaper: string;
    lockScreenWallpaper: string;
    gradientFrom: string;
    gradientTo: string;
    buttons: ButtonConfig[];
  };
}

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ user, supabase, onBack, onSettingsChange }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    appearance: {
      mainWallpaper: '',
      lockScreenWallpaper: '',
      gradientFrom: '#3b82f6',
      gradientTo: '#1e40af',
      buttons: []
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [editingButton, setEditingButton] = useState<ButtonConfig | null>(null);
  const [showAddButton, setShowAddButton] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [ssoSessions, setSsoSessions] = useState<any[]>([]);
  const [showSSOSessions, setShowSSOSessions] = useState(false);

  // Botões padrão
  const defaultButtons: ButtonConfig[] = [
    {
      id: 'fotografias',
      name: 'Fotografias',
      icon: 'Heart',
      color: 'green',
      backgroundImage: 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://fotografias.exemplo.com',
      isActive: true
    },
    {
      id: 'financeiro',
      name: 'Financeiro',
      icon: 'DollarSign',
      color: 'yellow',
      backgroundImage: 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://financeiro.exemplo.com',
      isActive: true
    },
    {
      id: 'clientes',
      name: 'Clientes',
      icon: 'FileText',
      color: 'blue',
      backgroundImage: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://clientes.exemplo.com',
      isActive: true
    },
    {
      id: 'agenda',
      name: 'Agenda',
      icon: 'Zap',
      color: 'purple',
      backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://agenda.exemplo.com',
      isActive: true
    },
    {
      id: 'portfolio',
      name: 'Portfólio',
      icon: 'CheckSquare',
      color: 'orange',
      backgroundImage: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://portfolio.exemplo.com',
      isActive: true
    }
  ];

  // Ícones disponíveis
  const availableIcons = [
    'Heart', 'DollarSign', 'FileText', 'Zap', 'CheckSquare', 'Settings', 'User', 'Calendar',
    'Camera', 'Image', 'Mail', 'Phone', 'Star', 'Award', 'Target', 'Shield', 'Lock',
    'Database', 'Server', 'Cloud', 'Activity', 'BarChart', 'TrendingUp', 'Search',
    'Bookmark', 'BookOpen', 'Coffee', 'Gift', 'Headphones', 'Mic', 'Monitor',
    'Printer', 'Smartphone', 'Tablet', 'Watch', 'Globe', 'Link', 'Share', 'Tag',
    'Folder', 'Archive', 'Clipboard', 'Edit', 'Plus', 'Minus', 'X', 'Check',
    'AlertTriangle', 'Info', 'HelpCircle'
  ];

  // Cores disponíveis
  const availableColors = [
    { name: 'Azul', value: 'blue' },
    { name: 'Verde', value: 'green' },
    { name: 'Roxo', value: 'purple' },
    { name: 'Rosa', value: 'pink' },
    { name: 'Laranja', value: 'orange' },
    { name: 'Vermelho', value: 'red' },
    { name: 'Cinza', value: 'gray' },
    { name: 'Amarelo', value: 'yellow' }
  ];

  useEffect(() => {
    loadSettings();
    loadSSOSessions();
  }, []);

  const loadSettings = async () => {
    try {
      // Primeiro tentar carregar do Supabase
      if (supabase && user) {
        const { data } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .limit(1);

        // Se há dados retornados
        if (data && data.length > 0 && data[0].settings) {
          setSettings(prev => ({
            ...prev,
            ...data[0].settings,
            appearance: {
              ...prev.appearance,
              ...data[0].settings.appearance,
              buttons: data[0].settings.appearance?.buttons || defaultButtons
            }
          }));
          return;
        }
      }

      // Fallback para localStorage
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings,
            appearance: {
              ...prev.appearance,
              ...parsedSettings.appearance,
              buttons: parsedSettings.appearance?.buttons || defaultButtons
            }
          }));
        } catch (error) {
          console.error('Erro ao carregar configurações do localStorage:', error);
          setSettings(prev => ({
            ...prev,
            appearance: { ...prev.appearance, buttons: defaultButtons }
          }));
        }
      } else {
        setSettings(prev => ({
          ...prev,
          appearance: { ...prev.appearance, buttons: defaultButtons }
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(prev => ({
        ...prev,
        appearance: { ...prev.appearance, buttons: defaultButtons }
      }));
    }
  };

  const loadSSOSessions = async () => {
    if (!supabase || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('sso_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('last_used_at', { ascending: false });
      
      if (!error && data) {
        setSsoSessions(data);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões SSO:', error);
    }
  };

  const invalidateSession = async (sessionId: string) => {
    if (!supabase) return;
    
    try {
      await supabase
        .from('sso_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
      loadSSOSessions();
    } catch (error) {
      console.error('Erro ao invalidar sessão:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      // Salvar no Supabase primeiro
      if (supabase && user) {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            settings: settings,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Erro ao salvar no Supabase:', error);
          setSaveError('Erro ao salvar no servidor. Salvando localmente...');
        } else {
          setSaveSuccess('Configurações salvas com sucesso!');
          
          // Se é o usuário master, propagar configurações para usuários sem configurações próprias
          if (user.email === 'valdigley2007@gmail.com') {
            try {
              // Buscar usuários que não têm configurações próprias
              const { data: usersWithoutSettings } = await supabase
                .from('users')
                .select('id')
                .not('id', 'in', `(${
                  (await supabase.from('user_settings').select('user_id')).data?.map(s => `'${s.user_id}'`).join(',') || "''"
                })`);

              // Criar configurações para usuários sem configurações
              if (usersWithoutSettings && usersWithoutSettings.length > 0) {
                const settingsToCreate = usersWithoutSettings.map(user => ({
                  user_id: user.id,
                  settings: settings,
                  updated_at: new Date().toISOString()
                }));

                await supabase
                  .from('user_settings')
                  .insert(settingsToCreate);
              }
            } catch (propagationError) {
              console.error('Erro ao propagar configurações:', propagationError);
              // Não mostrar erro para o usuário, é apenas uma funcionalidade adicional
            }
          }
        }
      }

      // Sempre salvar no localStorage como backup
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      onSettingsChange(settings);
      
      setTimeout(() => {
        setSaving(false);
        setSaveSuccess('');
        setSaveError('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSaveError('Erro ao salvar configurações');
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, data: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleImageUpload = async (file: File, type: 'main' | 'lock' | 'button', buttonId?: string) => {
    try {
      // Upload para Supabase Storage se disponível
      if (supabase && user) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, file);

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(fileName);

          if (type === 'button' && buttonId) {
            const updatedButtons = settings.appearance.buttons.map(btn =>
              btn.id === buttonId ? { ...btn, backgroundImage: publicUrl } : btn
            );
            updateSettings('appearance', { buttons: updatedButtons });
          } else {
            updateSettings('appearance', {
              [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: publicUrl
            });
          }
          return;
        }
      }

      // Fallback para base64 se Supabase não estiver disponível
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        if (type === 'button' && buttonId) {
          const updatedButtons = settings.appearance.buttons.map(btn =>
            btn.id === buttonId ? { ...btn, backgroundImage: base64 } : btn
          );
          updateSettings('appearance', { buttons: updatedButtons });
        } else {
          updateSettings('appearance', {
            [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: base64
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const addButton = () => {
    const newButton: ButtonConfig = {
      id: `custom-${Date.now()}`,
      name: 'Novo Sistema',
      icon: 'Settings',
      color: 'blue',
      backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://exemplo.com',
      isActive: true
    };
    
    const updatedButtons = [...settings.appearance.buttons, newButton];
    updateSettings('appearance', { buttons: updatedButtons });
    setEditingButton(newButton);
    setShowAddButton(false);
  };

  const updateButton = (buttonId: string, updates: Partial<ButtonConfig>) => {
    const updatedButtons = settings.appearance.buttons.map(btn =>
      btn.id === buttonId ? { ...btn, ...updates } : btn
    );
    updateSettings('appearance', { buttons: updatedButtons });
    
    if (editingButton && editingButton.id === buttonId) {
      setEditingButton({ ...editingButton, ...updates });
    }
  };

  const deleteButton = (buttonId: string) => {
    if (confirm('Tem certeza que deseja excluir este botão?')) {
      const updatedButtons = settings.appearance.buttons.filter(btn => btn.id !== buttonId);
      updateSettings('appearance', { buttons: updatedButtons });
      if (editingButton && editingButton.id === buttonId) {
        setEditingButton(null);
      }
    }
  };

  const resetToDefaults = () => {
    if (confirm('Tem certeza que deseja restaurar os botões padrão? Isso irá remover todas as personalizações.')) {
      updateSettings('appearance', { buttons: defaultButtons });
      setEditingButton(null);
    }
  };

  // Se está mostrando gerenciamento de usuários
  if (showUserManagement) {
    return (
      <UserManagement
        user={user}
        supabase={supabase}
        onBack={() => setShowUserManagement(false)}
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
                  Configurações
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personalize aparência e botões do sistema
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSSOSessions(true)}
                className="px-4 py-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                Sessões SSO ({ssoSessions.length})
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserManagement(true)}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Gerenciar Usuários
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetToDefaults}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Restaurar Padrão
              </motion.button>
              
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
      </div>

      {/* Mensagens de feedback */}
      {(saveSuccess || saveError) && (
        <div className="fixed bottom-4 right-4 z-50">
          {saveSuccess && (
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {saveError}
            </div>
          )}
        </div>
      )}

      {/* Modal de Sessões SSO */}
      {showSSOSessions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Sessões SSO Ativas ({ssoSessions.length})
                </h3>
                <button
                  onClick={() => setShowSSOSessions(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {ssoSessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma sessão SSO ativa encontrada.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ssoSessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {session.name || session.email}
                            </h4>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                            <p><strong>Email:</strong> {session.email}</p>
                            <p><strong>Último uso:</strong> {new Date(session.last_used_at).toLocaleString('pt-BR')}</p>
                            <p><strong>Expira em:</strong> {new Date(session.expires_at).toLocaleString('pt-BR')}</p>
                            {session.user_agent && (
                              <p><strong>Navegador:</strong> {session.user_agent.substring(0, 100)}...</p>
                            )}
                            {session.ip_address && (
                              <p><strong>IP:</strong> {session.ip_address}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => invalidateSession(session.id)}
                          className="px-3 py-1 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm"
                        >
                          Invalidar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda - Wallpapers e Cores */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Wallpapers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Papéis de Parede
              </h3>
              
              <div className="space-y-4">
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
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => updateSettings('appearance', { mainWallpaper: '' })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 text-sm">
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
                    Wallpaper Tela de Login
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {settings.appearance.lockScreenWallpaper ? (
                      <div className="relative">
                        <img
                          src={settings.appearance.lockScreenWallpaper}
                          alt="Wallpaper Tela de Login"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => updateSettings('appearance', { lockScreenWallpaper: '' })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 text-sm">
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

            {/* Cores de Fundo */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Cores de Fundo
              </h3>
              
              <div className="space-y-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div
                    className="w-full h-16 rounded-lg border border-gray-300 dark:border-gray-600"
                    style={{
                      background: `linear-gradient(135deg, ${settings.appearance.gradientFrom}, ${settings.appearance.gradientTo})`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Botões */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Botões do Sistema
                </h3>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddButton(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Botão
                </motion.button>
              </div>

              {/* Lista de Botões */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {settings.appearance.buttons.map((button) => {
                  const IconComponent = getIconComponent(button.icon);
                  
                  return (
                    <div
                      key={button.id}
                      className={`relative p-4 border-2 rounded-xl transition-all cursor-pointer ${
                        editingButton?.id === button.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                      onClick={() => setEditingButton(button)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center bg-cover bg-center relative overflow-hidden"
                          style={{ backgroundImage: `url(${button.backgroundImage})` }}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-${button.color}-500 to-${button.color}-700 opacity-80`}></div>
                          <IconComponent className="h-6 w-6 text-white relative z-10" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {button.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {button.url}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            button.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteButton(button.id);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Editor de Botão */}
              {editingButton && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Editando: {editingButton.name}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={editingButton.name}
                        onChange={(e) => updateButton(editingButton.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL
                      </label>
                      <input
                        type="url"
                        value={editingButton.url}
                        onChange={(e) => updateButton(editingButton.id, { url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="https://exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ícone
                      </label>
                      <select
                        value={editingButton.icon}
                        onChange={(e) => updateButton(editingButton.id, { icon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        {availableIcons.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cor
                      </label>
                      <select
                        value={editingButton.color}
                        onChange={(e) => updateButton(editingButton.id, { color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        {availableColors.map(color => (
                          <option key={color.value} value={color.value}>{color.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imagem de Fundo
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={editingButton.backgroundImage}
                          onChange={(e) => updateButton(editingButton.id, { backgroundImage: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="URL da imagem ou faça upload"
                        />
                        <label className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'button', editingButton.id);
                            }}
                          />
                        </label>
                        {editingButton.url && (
                          <a
                            href={editingButton.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer transition-colors"
                            title="Testar link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingButton.isActive}
                          onChange={(e) => updateButton(editingButton.id, { isActive: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Botão ativo
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setEditingButton(null)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Adicionar Botão */}
              {showAddButton && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Adicionar Novo Botão
                    </h4>
                    <button
                      onClick={() => setShowAddButton(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={addButton}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Criar Botão
                    </button>
                    <button
                      onClick={() => setShowAddButton(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;