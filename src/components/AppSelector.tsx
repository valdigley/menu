import React, { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import ConfigurationPage from './ConfigurationPage';
import UserManagement from './UserManagement';
import SimpleTaskList from './SimpleTaskList';
import ContractIntegration from './ContractIntegration';
import ContractSystem from './ContractSystem';
import { getIconComponent } from '../utils/icons';
import { SSOManager } from '../utils/sso';

interface AppSelectorProps {
  user: any;
  supabase: any;
}

const AppSelector: React.FC<AppSelectorProps> = ({ user, supabase }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profile, setProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);
  const [showContractIntegration, setShowContractIntegration] = useState(false);
  const [showContractSystem, setShowContractSystem] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState<any>(null);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [systemAccess, setSystemAccess] = useState<{[key: string]: boolean}>({});

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
      loadSystemAccess();
    }
  }, [user]);

  const loadSystemAccess = async () => {
    if (!supabase || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_system_access')
        .select('system_id, has_access')
        .eq('user_id', user.id);
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao carregar acessos específicos:', error);
        return;
      }
      
      const accessMap: {[key: string]: boolean} = {};
      data?.forEach(access => {
        accessMap[access.system_id] = access.has_access;
      });
      
      setSystemAccess(accessMap);
    } catch (error) {
      console.warn('Erro ao carregar acessos específicos:', error);
    }
  };

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
    
    // Sistemas exclusivos do master
    if (systemId === 'admin' || systemId === 'configuracao') {
      return false; // Apenas master pode acessar
    }
    
    // Verificar se tem assinatura ativa geral
    const hasGeneralAccess = subscriptions.some(sub => 
      sub.manual_access === true ||
      (
        sub.status === 'active' && 
        (sub.plan_type === 'paid' || sub.plan_type === 'trial') &&
        (!sub.expires_at || new Date(sub.expires_at) > new Date())
      )
    );
    
    // Se não tem acesso geral, não pode acessar nenhum sistema
    if (!hasGeneralAccess) return false;
    
    // Por enquanto, se tem assinatura ativa, tem acesso a todos os sistemas
    // TODO: Implementar verificação específica por sistema via user_system_access
    return hasGeneralAccess;
  };

  const checkSpecificSystemAccess = async (systemId: string): Promise<boolean> => {
    if (!profile || !supabase) return false;
    
    // Master tem acesso a tudo
    if (profile.is_master) return true;
    
    // Sistemas exclusivos do master
    if (systemId === 'admin' || systemId === 'configuracao') {
      return false; // Apenas master pode acessar
    }
    
    try {
      // Primeiro verificar se tem assinatura ativa geral
      const hasGeneralAccess = subscriptions.some(sub => 
        sub.manual_access === true ||
        (
          sub.status === 'active' && 
          (sub.plan_type === 'paid' || sub.plan_type === 'trial') &&
          (!sub.expires_at || new Date(sub.expires_at) > new Date())
        )
      );
      
      // Se não tem acesso geral, não pode acessar nenhum sistema
      if (!hasGeneralAccess) return false;
      
      // Verificar acesso específico ao sistema
      const { data, error } = await supabase
        .from('user_system_access')
        .select('has_access, expires_at')
        .eq('user_id', profile.id)
        .eq('system_id', systemId)
        .maybeSingle();
      
      if (error) {
        console.warn('Erro ao verificar acesso específico:', error);
        return true; // Fallback para permitir acesso
      }
      
      // Se não existe registro (data é null), por padrão tem acesso (para compatibilidade)
      if (!data) {
        return true;
      }
      
      // Verificar se o acesso não expirou
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return false;
      }
      
      return data.has_access || false;
    } catch (error) {
      console.warn('Erro ao verificar acesso específico:', error);
      return true; // Fallback para permitir acesso em caso de erro
    }
  };

  // Função auxiliar para verificação básica (mantém compatibilidade)
  const hasBasicSystemAccess = (systemId: string): boolean => {
    if (!profile) return false;
    
    // Master tem acesso a tudo
    if (profile.is_master) return true;
    
    // Sistemas exclusivos do master
    if (systemId === 'admin' || systemId === 'configuracao') {
      return false; // Apenas master pode acessar
    }
    
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

  // Usar botões customizados se disponíveis, senão usar padrões
  const defaultApps = [
    {
      id: 'triagem',
      name: 'Triagem',
      description: 'Sistema de triagem médica',
      icon: 'Image',
      color: 'green',
      backgroundImage: 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://triagem.exemplo.com',
      hasAccess: hasBasicSystemAccess('triagem'),
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
      hasAccess: hasBasicSystemAccess('grana'),
      isActive: false
    },
    {
      id: 'contrato',
      name: 'Contratos',
      description: 'Sistema de contratos',
      icon: 'FileText',
      color: 'blue',
      backgroundImage: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'internal:contratos',
      hasAccess: hasBasicSystemAccess('contrato'),
      isActive: true
    },
    {
      id: 'automacao',
      name: 'Automação',
      description: 'Sistema de automação',
      icon: 'Settings',
      color: 'purple',
      backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'https://automacao.exemplo.com',
      hasAccess: hasBasicSystemAccess('automacao'),
      isActive: false
    },
    {
      id: 'obrigacoes',
      name: 'Obrigações',
      description: 'Gestão de tarefas diárias de edição',
      icon: 'CheckSquare',
      color: 'orange',
      backgroundImage: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'internal:obrigacoes',
      hasAccess: hasBasicSystemAccess('obrigacoes'),
      isActive: true
    }
  ];

  // Mapear botões customizados para o formato esperado
  const customApps = customButtons.length > 0 ? customButtons.map(button => ({
    id: button.id,
    name: button.name,
    description: `Sistema ${button.name}`,
    icon: getIconComponent(button.icon),
    color: button.color,
    backgroundImage: button.backgroundImage,
    url: button.url,
    hasAccess: true, // Sempre true para não afetar o visual, controle real é feito no clique
    isActive: button.isActive !== false
  })) : defaultApps;

  const apps = [...customApps];

  // Adicionar botões exclusivos para masters
  if (profile?.is_master) {
    apps.push({
      id: 'admin',
      name: 'Gerenciar',
      description: 'Gerenciar assinaturas e usuários',
      icon: 'Users',
      color: 'red',
      backgroundImage: 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: '/admin',
      hasAccess: true,
      isActive: true
    });
    
    // Configuração deve ser o último botão
    apps.push({
      id: 'configuracao',
      name: 'Configuração',
      description: 'Configurações do sistema',
      icon: 'Settings',
      color: 'gray',
      backgroundImage: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: 'internal:configuracao',
      hasAccess: true,
      isActive: true
    });
  }

  const handleAppClick = (app: typeof apps[0]) => {
    // Prevenir múltiplas execuções
    if (app.isProcessing) return;
    
    // Verificar URLs internas PRIMEIRO, antes de qualquer outra verificação
    if (app.url === 'internal:obrigacoes') {
      setShowTaskList(true);
      return;
    }
    
    if (app.id === 'obrigacoes') {
      setShowTaskList(true);
      return;
    }
    
    if (app.url === 'internal:configuracao') {
      setShowConfiguration(true);
      return;
    }
    
    if (app.url === 'internal:contratos' || app.id === 'contrato') {
      setShowContractSystem(true);
      return;
    }
    
    // Verificar se é o sistema de contratos para usar SSO
    if (app.id === 'contrato' && user) {
      // Abrir sistema de contratos diretamente com SSO
      SSOManager.openSystemWithSSO(app.url, user);
      return;
    }
    
    // Master sempre tem acesso a tudo
    if (profile?.is_master) {
      if (app.id === 'admin') {
        setShowUserManagement(true);
        return;
      }
      
      window.open(app.url, '_blank');
      return;
    }
    
    // Verificar se o sistema está desabilitado ou sem acesso
    if (app.isActive === false || !app.hasAccess) {
      return; // Não faz nada, sem mensagens
    }
    
    // Para sistemas que requerem verificação específica, fazer verificação assíncrona
    // Abrir URL externa para todos os outros casos
    if (app.id === 'admin') {
      setShowUserManagement(true);
      return;
    }
    
    // Abrir link externo
    window.open(app.url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showConfiguration) {
    return (
      <ConfigurationPage
        user={user}
        supabase={supabase}
        onBack={() => setShowConfiguration(false)}
        onSettingsChange={(settings) => {
          setWallpaperSettings(settings.appearance);
          setCustomButtons(settings.appearance.buttons || []);
          // As configurações já são salvas automaticamente no ConfigurationPage
        }}
      />
    );
  }

  if (showTaskList) {
    return (
      <SimpleTaskList
        user={user}
        supabase={supabase}
        onBack={() => setShowTaskList(false)}
      />
    );
  }

  if (showContractIntegration) {
    return (
      <ContractIntegration
        user={user}
        supabase={supabase}
        onBack={() => setShowContractIntegration(false)}
      />
    );
  }

  if (showContractSystem) {
    return (
      <ContractSystem
        user={user}
        supabase={supabase}
        onBack={() => setShowContractSystem(false)}
      />
    );
  }

  if (showUserManagement) {
    return (
      <UserManagement
        user={user}
        supabase={supabase}
        onBack={() => setShowUserManagement(false)}
      />
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
            const IconComponent = app.icon;
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
                    {(() => {
                      const IconComponent = typeof app.icon === 'string' ? getIconComponent(app.icon) : app.icon;
                      return <IconComponent className={`h-6 w-6 lg:h-8 lg:w-8 ${
                        isDisabled ? 'text-gray-400' : 'text-white drop-shadow-lg'
                      }`} />;
                    })()}
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