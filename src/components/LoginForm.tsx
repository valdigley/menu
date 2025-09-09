import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { SSOManager } from '../utils/sso';

interface LoginFormProps {
  supabase: any;
}

const LoginForm: React.FC<LoginFormProps> = ({ supabase }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState<any>(null);

  useEffect(() => {
    // Configurar SSO
    if (supabase) {
      SSOManager.setSupabaseClient(supabase);
    }
    
    // Carregar configurações do sistema para tela de login
    const loadLoginSettings = async () => {
      try {
        // Tentar carregar configurações do master do Supabase
        if (supabase) {
          const { data: masterData } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', (
              await supabase
                .from('users')
                .select('id')
                .eq('email', 'valdigley2007@gmail.com')
                .limit(1)
            ).data?.[0]?.id)
            .limit(1);

          if (masterData && masterData.length > 0 && masterData[0].settings?.appearance) {
            setWallpaperSettings(masterData[0].settings.appearance);
            return;
          }
        }

        // Fallback para localStorage
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings.appearance) {
              setWallpaperSettings(parsedSettings.appearance);
            }
          } catch (error) {
            console.error('Erro ao carregar configurações:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de login:', error);
      }
    };

    loadLoginSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setError('Sistema não configurado');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Nome completo é obrigatório');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        
        // Criar sessão SSO após login bem-sucedido
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await SSOManager.createSSOSession(user);
          }
        }
        
        setSuccess('Conta criada com sucesso! Verifique seu email e confirme sua conta antes de fazer login.');
        // Limpar formulário
        setEmail('');
        setPassword('');
        setFullName('');
        // Voltar para tela de login após 2 segundos
        setTimeout(() => {
          setIsSignUp(false);
          setSuccess('');
        }, 2000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        // Criar sessão SSO após login bem-sucedido
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await SSOManager.createSSOSession(user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Sistema não configurado');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  // Determinar qual wallpaper usar para tela de bloqueio
  const getBackgroundStyle = () => {
    if (wallpaperSettings?.lockScreenWallpaper) {
      return {
        backgroundImage: `url(${wallpaperSettings.lockScreenWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Fallback para gradiente ou imagem padrão
    const gradientFrom = wallpaperSettings?.gradientFrom || '#1e293b';
    const gradientTo = wallpaperSettings?.gradientTo || '#374151';
    
    return {
      background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
    };
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Overlay para melhorar legibilidade quando há wallpaper personalizado */}
      {wallpaperSettings?.lockScreenWallpaper && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-gray-900/95 z-10"></div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-4 relative z-20"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8"
            >
              {isSignUp ? (
                <UserPlusIcon className="h-8 w-8 text-white" />
              ) : (
                <LockClosedIcon className="h-8 w-8 text-white" />
              )}
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </h2>
            <p className="text-white/60 text-sm">
              {isSignUp ? 'Crie sua conta para acessar os sistemas' : 'Acesse sua conta'}
            </p>
          </div>

          <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
            {success && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl text-sm text-center"
              >
                {success}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              {isSignUp && (
                <div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60 transition-all"
                    placeholder="Nome completo"
                  />
                </div>
              )}

              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60 transition-all"
                  placeholder="Email"
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 pr-12 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60 transition-all"
                    placeholder="Senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {!loading && (isSignUp ? 'Criar Conta' : 'Entrar')}
              </motion.button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-white/60">ou</span>
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </motion.button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
                className="text-white/60 hover:text-white/80 text-sm transition-colors"
              >
                {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar uma'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;