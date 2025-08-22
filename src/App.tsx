import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import LoginForm from './components/LoginForm';
import AppSelector from './components/AppSelector';

// Cliente Supabase simples
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 App iniciando...');
    
    if (!supabase) {
      console.log('❌ Supabase não configurado');
      setLoading(false);
      return;
    }

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Sessão inicial:', session ? 'Encontrada' : 'Não encontrada');
      
      // Se houver erro de refresh token inválido, limpar sessão
      if (error && error.message && error.message.includes('Refresh Token Not Found')) {
        console.log('🧹 Limpando sessão inválida...');
        supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth mudou:', event);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  console.log('🎯 App render:', { user: !!user, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
          <p className="text-xs text-gray-400 mt-2">
            Supabase: {supabase ? 'Conectado' : 'Não configurado'}
          </p>
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