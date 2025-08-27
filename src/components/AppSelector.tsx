import React, { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { getIconComponent } from '../utils/icons';
import ConfigurationPage from './ConfigurationPage';

interface AppSelectorProps {
  user: any;
  supabase: any;
}

const AppSelector: React.FC<AppSelectorProps> = ({ user, supabase }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profile, setProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallpaperSettings, setWallpaperSettings] = useState<any>(null);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [showConfiguration, setShowConfiguration] = useState(false);

  useEffect(() => {
    // Detectar tema do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    
    // Aplicar tema
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Carregar configurações completas do sistema
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.appearance) {
          setWallpaperSettings(parsedSettings.appearance);
          if (parsedSettings.appearance.buttons) {
            // Filtrar botões válidos
            const validButtons = parsedSettings.appearance.buttons.filter(
              (button: any) => button && button.id && button.name
            );
            setCustomButtons(validButtons);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Criar perfil básico
      const basicProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        is_master: user.email === 'valdigley2007@gmail.com',
      };

      setProfile(basicProfile);

      // Tentar carregar assinaturas
      if (supabase) {
        try {
          const { data: subscriptionsData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id);

          setSubscriptions(subscriptionsData || []);
        } catch (error) {
          console.warn('Erro ao carregar assinaturas:', error);
          setSubscriptions([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const hasSystemAccess = (systemId: string): boolean => {
    if (!profile) return false;
    
    // Master tem acesso a tudo
    if (profile.is_master) return true;
    
    // Verificar se tem assinatura ativa geral
    return subscriptions.some(sub => 
      sub.manual_access === true ||
      (
        sub.status === 'active' && 
        (sub.plan_type === 'paid' || sub.plan_type === 'trial') &&
        (!sub.expires_at || new Date(sub.expires_at) > new Date())
      )
    );
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

  const handleSettingsChange = (settings: any) => {
    // Atualizar configurações locais
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    
    // Recarregar configurações
    if (settings.appearance) {
      setWallpaperSettings(settings.appearance);
      if (settings.appearance.buttons) {
        const validButtons = settings.appearance.buttons.filter(
          (button: any) => button && button.id && button.name
        );
        setCustomButtons(validButtons);
      }
    }
  };

  // Usar botões customizados se disponíveis, senão usar padrões
  const defaultApps = [
    {
      id: 'triagem',
      name: 'Triagem',
      description: 'Sistema de triagem médica',
      icon: 'Heart',
      color: 'green',
      backgroundImage: 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://triagem.exemplo.com',
      hasAccess: hasSystemAccess('triagem'),
      isActive: true
    },
    {
      id: 'grana',
      name: 'Grana',
      description: 'Sistema financeiro',
      icon: 'DollarSign',
      color: 'yellow',
      backgroundImage: 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://grana.exemplo.com',
      hasAccess: hasSystemAccess('grana'),
      isActive: false
    },
    {
      id: 'contrato',
      name: 'Contratos',
      description: 'Sistema de contratos',
      icon: 'FileText',
      color: 'blue',
      backgroundImage: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://contratos.exemplo.com',
      hasAccess: hasSystemAccess('contrato'),
      isActive: true
    },
    {
      id: 'automacao',
      name: 'Automação',
      description: 'Sistema de automação',
      icon: 'Zap',
      color: 'purple',
      backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://automacao.exemplo.com',
      hasAccess: hasSystemAccess('automacao'),
      isActive: false
    },
    {
      id: 'obrigacoes',
      name: 'Obrigações',
      description: 'Gestão de tarefas diárias',
      icon: 'CheckSquare',
      color: 'orange',
      backgroundImage: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://obrigacoes.exemplo.com',
      hasAccess: hasSystemAccess('obrigacoes'),
      isActive: true
    },
    {
      id: 'configuracao',
      name: 'Configuração',
      description: 'Configurações do sistema',
      icon: 'Settings',
      color: 'gray',
      backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: '#',
      hasAccess: true,
      isActive: true
    }
  ];

  // Mapear botões customizados para o formato esperado
  const customApps = customButtons.length > 0 ? customButtons.map(button => ({
    id: button.id,
    name: button.name,
    description: `Sistema ${button.name}`,
    icon: button.icon,
    color: button.color,
    backgroundImage: button.backgroundImage,
    url: button.url,
    hasAccess: true, // Sempre true para não afetar o visual
    isActive: button.isActive !== false
  })) : [];

  // Sempre incluir o botão de configuração
  const configButton = profile?.is_master ? {
    id: 'configuracao',
    name: 'Configuração',
    description: 'Configurações do sistema',
    icon: 'Settings',
    color: 'gray',
    backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: '#',
    hasAccess: true,
    isActive: true
  } : null;

  // Se há botões customizados, usar eles + configuração, senão usar padrões
  const apps = customButtons.length > 0 
    ? [...customApps, ...(configButton ? [configButton] : [])]
    : profile?.is_master ? defaultApps : defaultApps.filter(app => app.id !== 'configuracao');

  const handleAppClick = (app: any) => {
    console.log('🔄 Clicou no app:', app.id, app.name);
    
    // Se for configuração, mostrar modal interno
    if (app.id === 'configuracao') {
      console.log('⚙️ Abrindo configurações...');
      setShowConfiguration(true);
      return;
    }
    
    // Verificar se o sistema está desabilitado ou sem acesso
    if (app.isActive === false || !app.hasAccess) {
      console.log('❌ App desabilitado ou sem acesso');
      return; // Não faz nada, sem mensagens
    }
    
    // Abrir link externo
    console.log('🔗 Abrindo link externo:', app.url);
    window.open(app.url, '_blank');
  };

  // Se está mostrando configurações, renderizar o componente
  if (showConfiguration) {
    console.log('🎛️ Renderizando ConfigurationPage...');
    return (
      <ConfigurationPage
        user={user}
        supabase={supabase}
        onBack={() => {
          console.log('⬅️ Voltando das configurações...');
          setShowConfiguration(false);
        }}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Determinar qual wallpaper usar
  const getBackgroundStyle = () => {
    if (wallpaperSettings?.mainWallpaper) {
      return {
        backgroundImage: `url(${wallpaperSettings.mainWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Fallback para gradiente
    const gradientFrom = wallpaperSettings?.gradientFrom || '#3b82f6';
    const gradientTo = wallpaperSettings?.gradientTo || '#1e40af';
    
    return {
      background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
    };
  };

  console.log('🎯 Apps disponíveis:', apps.map(app => ({ id: app.id, name: app.name })));

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={getBackgroundStyle()}
    >
      {/* Overlay para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
      
      {/* Header Controls */}
      <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-30">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-white/30 transition-colors shadow-lg border border-white/20"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* User Info & Controls */}
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/20">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm text-white/90 font-medium max-w-32 truncate">
                {profile.full_name || profile.email}
              </span>
            </div>
          )}
          
          <button
            onClick={handleSignOut}
            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white/80 hover:text-red-400 hover:bg-red-500/20 transition-colors shadow-lg border border-white/20"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
          {apps.map((app) => {
            const IconComponent = getIconComponent(app.icon);
            const hasAccess = profile?.is_master ? true : hasSystemAccess(app.id);
            const isActive = app.isActive !== false;
            const isDisabled = profile?.is_master ? false : (!isActive || !hasAccess);
            
            return (
              <div
                key={app.id}
                onClick={() => handleAppClick(app)}
                className={`w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 group relative flex-shrink-0 ${
                  isDisabled
                    ? 'opacity-60 cursor-not-allowed grayscale'
                    : 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:scale-105'
                }`}
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${app.backgroundImage})` }}
                ></div>
                
                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  isDisabled
                    ? 'from-gray-500 to-gray-700'
                    : getColorGradient(app.color)
                } opacity-80 ${!isDisabled ? 'group-hover:opacity-70' : ''} transition-all duration-300`}></div>
                
                {/* Content */}
                <div className="relative h-full flex items-center justify-center z-10">
                  
                  {/* Icon */}
                  <div className={`p-4 lg:p-6 rounded-full transition-all duration-300 ${
                    isDisabled
                      ? 'bg-gray-500/30 backdrop-blur-sm'
                      : 'bg-white/20 backdrop-blur-sm group-hover:scale-110 group-hover:bg-white/30 shadow-2xl border border-white/30'
                  }`}>
                    <IconComponent className={`h-6 w-6 lg:h-8 lg:w-8 ${
                      isDisabled ? 'text-gray-400' : 'text-white drop-shadow-lg'
                    }`} />
                  </div>
                  
                  {/* Access Status Indicator */}
                  {isDisabled && (
                    <div className="absolute top-3 right-3 w-4 h-4 bg-gray-400 rounded-full border-2 border-gray-200 shadow-lg">
                    </div>
                  )}
                </div>
                
                {/* Tooltip on Hover */}
                <div className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2 translate-y-2 bg-gray-900/95 backdrop-blur-md text-white text-sm px-3 py-2 rounded-lg opacity-0 transition-all duration-500 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/30 ${
                  !isDisabled ? 'group-hover:translate-y-0 group-hover:opacity-100' : ''
                }`}>
                  {app.name}
                  {isDisabled && (
                    <div className="text-xs text-gray-400 mt-1">Desativado</div>
                  )}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-l border-t border-white/30"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppSelector;