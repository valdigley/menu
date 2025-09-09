import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import LoginForm from './components/LoginForm';
import AppSelector from './components/AppSelector';
import ClientForm from './components/ClientForm';
import { createSharedSession, invalidateAllUserSessions } from './utils/sessionManager';

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
  const location = useLocation();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Verificar sessão inicial
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error && error.message && error.message.includes('Refresh Token Not Found')) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      
      // Criar sessão compartilhada se usuário logado
      if (session?.user) {
        createSharedSession(session.user.id);
      }
      
      setLoading(false);
    });

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        // Gerenciar sessões compartilhadas baseado no evento
        if (event === 'SIGNED_IN' && session?.user) {
          await createSharedSession(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          // Invalidar todas as sessões do usuário ao fazer logout
          const userData = user || session?.user;
          if (userData) {
            await invalidateAllUserSessions(userData.id);
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Se estiver na rota do formulário de cliente, mostrar sem autenticação
  if (location.pathname === '/formulario-cliente') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Formulário de Cliente
          </h2>
          <p className="text-gray-600">
            Esta funcionalidade será implementada em breve.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm supabase={supabase} />;
  }

  return <AppSelector user={user} supabase={supabase} />;
}

export default App;