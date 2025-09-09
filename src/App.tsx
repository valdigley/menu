import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase - projeto "armazenamento"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('🔗 Conectado ao projeto armazenamento:', supabaseUrl);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.log('❌ Supabase não configurado');
      setLoading(false);
      return;
    }

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao verificar sessão:', error);
      }
      
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setLoginError('Sistema não configurado');
      return;
    }

    setLoginError('');
    setLoginLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      console.log('✅ Login bem-sucedido:', data.user?.email);
      
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      setLoginError(err.message || 'Erro ao fazer login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const systems = [
    { 
      id: 'triagem', 
      name: 'Triagem', 
      url: 'https://triagem.fotografo.site',
      color: 'bg-blue-500',
      icon: '📸'
    },
    { 
      id: 'contrato', 
      name: 'Contratos', 
      url: 'https://contrato.fotografo.site',
      color: 'bg-green-500',
      icon: '📋'
    },
    { 
      id: 'drive', 
      name: 'Drive', 
      url: 'https://drive.fotografo.site',
      color: 'bg-purple-500',
      icon: '📁'
    },
    { 
      id: 'formatura', 
      name: 'Formatura', 
      url: 'https://formatura.fotografo.site',
      color: 'bg-orange-500',
      icon: '🎓'
    },
    { 
      id: 'admin', 
      name: 'Admin', 
      url: 'https://admin.fotografo.site',
      color: 'bg-red-500',
      icon: '🛡️'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Menu Valdigley
            </h1>
            <p className="text-gray-600">
              Acesse seus sistemas de fotografia
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sua senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Login master: valdigley2007@gmail.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-white">
          <h1 className="text-2xl font-bold">Bem-vindo, {user.email}</h1>
          <p className="text-white/80">Escolha um sistema para acessar</p>
        </div>
        
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Sistemas */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((system) => (
            <div
              key={system.id}
              onClick={() => window.open(system.url, '_blank')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-center">
                <div className={`mx-auto w-16 h-16 ${system.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{system.icon}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {system.name}
                </h3>
                
                <p className="text-white/70 text-sm mb-4">
                  {system.url.replace('https://', '')}
                </p>
                
                <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Disponível</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Informações */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="text-center text-white/80">
            <p className="text-sm">
              🔗 Conectado ao projeto: <strong>armazenamento</strong>
            </p>
            <p className="text-xs text-white/60 mt-2">
              Clique em qualquer sistema para acessar diretamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;