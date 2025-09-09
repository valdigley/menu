import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, FileText, FolderOpen, GraduationCap, Settings, Shield,
  ExternalLink, Clock, Users, Activity, AlertCircle, CheckCircle
} from 'lucide-react';
import { redirectToSystem, getUserActiveSessions, invalidateSession } from '../utils/sessionManager';

interface SystemsMenuProps {
  user: any;
}

interface SystemConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  url: string;
  isActive: boolean;
}

const SystemsMenu: React.FC<SystemsMenuProps> = ({ user }) => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showSessions, setShowSessions] = useState(false);

  const systems: SystemConfig[] = [
    { 
      id: 'triagem', 
      name: 'Triagem', 
      description: 'Seleção e organização de fotos',
      icon: Camera, 
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      url: 'https://triagem.fotografo.site',
      isActive: true
    },
    { 
      id: 'contrato', 
      name: 'Contratos', 
      description: 'Gestão de contratos e propostas',
      icon: FileText, 
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      url: 'https://contrato.fotografo.site',
      isActive: true
    },
    { 
      id: 'drive', 
      name: 'Drive', 
      description: 'Gerenciamento de arquivos',
      icon: FolderOpen, 
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      url: 'https://drive.fotografo.site',
      isActive: true
    },
    { 
      id: 'formatura', 
      name: 'Formatura', 
      description: 'Sessões de formatura e eventos',
      icon: GraduationCap, 
      color: 'orange',
      gradient: 'from-orange-500 to-amber-600',
      url: 'https://formatura.fotografo.site',
      isActive: true
    },
    { 
      id: 'admin', 
      name: 'Admin', 
      description: 'Painel administrativo',
      icon: Shield, 
      color: 'red',
      gradient: 'from-red-500 to-pink-600',
      url: 'https://admin.fotografo.site',
      isActive: user?.email === 'valdigley2007@gmail.com' // Apenas para master
    }
  ];

  useEffect(() => {
    if (user) {
      loadActiveSessions();
    }
  }, [user]);

  const loadActiveSessions = async () => {
    if (!user) return;
    
    try {
      const sessions = await getUserActiveSessions(user.id);
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const handleSystemAccess = async (systemName: string) => {
    if (!user) {
      alert('Você precisa estar logado para acessar os sistemas.');
      return;
    }
    
    setLoading(prev => ({ ...prev, [systemName]: true }));
    
    try {
      const success = await redirectToSystem(user.id, systemName);
      if (success) {
        // Recarregar sessões após criar nova
        setTimeout(loadActiveSessions, 1000);
      }
    } catch (error) {
      console.error('Erro ao acessar sistema:', error);
    } finally {
      setLoading(prev => ({ ...prev, [systemName]: false }));
    }
  };

  const handleInvalidateSession = async (sessionId: string) => {
    try {
      const success = await invalidateSession(sessionId);
      if (success) {
        loadActiveSessions();
      }
    } catch (error) {
      console.error('Erro ao invalidar sessão:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeSystemsCount = systems.filter(s => s.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header com estatísticas */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Sistemas Disponíveis
        </h2>
        <div className="flex justify-center gap-6 text-white/80">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span>{activeSystemsCount} sistemas ativos</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{activeSessions.length} sessões ativas</span>
          </div>
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Ver sessões</span>
          </button>
        </div>
      </div>

      {/* Sessões Ativas */}
      {showSessions && activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sessões Ativas ({activeSessions.length})
          </h3>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium">
                      Token: {session.session_token.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="text-sm text-white/60 space-y-1">
                    <p>Criado: {formatDate(session.created_at)}</p>
                    <p>Expira: {formatDate(session.expires_at)}</p>
                    {session.ip_address && (
                      <p>IP: {session.ip_address}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleInvalidateSession(session.id)}
                  className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  Invalidar
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grid de Sistemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systems.filter(system => system.isActive).map((system, index) => {
          const IconComponent = system.icon;
          const isLoading = loading[system.id];
          
          return (
            <motion.div
              key={system.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <button
                onClick={() => handleSystemAccess(system.id)}
                disabled={isLoading}
                className={`w-full p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-center">
                  {/* Ícone com gradiente */}
                  <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${system.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <IconComponent className="h-8 w-8 text-white" />
                    )}
                  </div>
                  
                  {/* Nome do sistema */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90">
                    {system.name}
                  </h3>
                  
                  {/* Descrição */}
                  <p className="text-white/70 text-sm mb-4 group-hover:text-white/80">
                    {system.description}
                  </p>
                  
                  {/* URL e status */}
                  <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate max-w-32">
                      {system.url.replace('https://', '')}
                    </span>
                  </div>
                  
                  {/* Indicador de status */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/60">
                      {isLoading ? 'Conectando...' : 'Disponível'}
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Informações adicionais */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-white/80 text-sm">
            <p className="font-medium mb-2">Como funciona o SSO:</p>
            <ul className="space-y-1 text-white/60">
              <li>• Ao clicar em um sistema, uma sessão compartilhada é criada automaticamente</li>
              <li>• Você será redirecionado e logado automaticamente no sistema escolhido</li>
              <li>• As sessões expiram em 24 horas por segurança</li>
              <li>• Você pode invalidar sessões ativas a qualquer momento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemsMenu;