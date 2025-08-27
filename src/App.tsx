import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import LoginForm from './components/LoginForm';
import AppSelector from './components/AppSelector';
import ClientForm from './components/ClientForm';

// Cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && error.message && error.message.includes('Refresh Token Not Found')) {
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
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Se estiver na rota do formulário de cliente, mostrar sem autenticação
  if (location.pathname === '/formulario-cliente') {
    const loadCompanySettings = () => {
      try {
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          return JSON.parse(savedSettings);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
      return {
        company: {
          name: 'Fotografia Profissional',
          owner: 'Fotógrafo'
        }
      };
    };

    return <ClientForm companySettings={loadCompanySettings()} />;
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