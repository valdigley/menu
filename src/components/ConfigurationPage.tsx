import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, X, Plus, Edit, Trash2, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfigurationPageProps {
  user: any;
  supabase: any;
  onBack: () => void;
  onSettingsChange: (settings: any) => void;
}

interface SystemSettings {
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
  const [uploadingImage, setUploadingImage] = useState(false);

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
      // Usar FileReader para converter para base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateSettings('appearance', {
          [type === 'main' ? 'mainWallpaper' : 'lockScreenWallpaper']: base64
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploadingImage(false);
    }
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
                  Personalize a aparência do sistema
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-8">
            {/* Wallpapers */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5" />
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
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
                    Wallpaper Tela de Login
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {settings.appearance.lockScreenWallpaper ? (
                      <div className="relative">
                        <img
                          src={settings.appearance.lockScreenWallpaper}
                          alt="Wallpaper Tela de Login"
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
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
                Cores de Fundo
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div
                  className="w-full h-20 rounded-lg border border-gray-300 dark:border-gray-600"
                  style={{
                    background: `linear-gradient(135deg, ${settings.appearance.gradientFrom}, ${settings.appearance.gradientTo})`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;