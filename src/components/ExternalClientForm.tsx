import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientForm from './ClientForm';

// Componente para formulário externo acessível via URL
const ExternalClientForm: React.FC = () => {
  // Carregar configurações da empresa do localStorage ou API
  const loadCompanySettings = () => {
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
    
    // Configurações padrão se não houver dados salvos
    return {
      company: {
        name: 'Fotografia Profissional',
        owner: 'Fotógrafo',
        phone: '',
        email: '',
        whatsapp: '',
        website: ''
      }
    };
  };

  const handleFormSubmit = async (formData: any) => {
    console.log('Dados do formulário recebidos:', formData);
    
    // Aqui você pode:
    // 1. Enviar para uma API
    // 2. Salvar no Supabase
    // 3. Enviar por email
    // 4. Integrar com webhook
    
    try {
      // Exemplo de integração com API
      const response = await fetch('/api/client-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        console.log('Formulário enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  const companySettings = loadCompanySettings();

  return (
    <Router>
      <Routes>
        <Route 
          path="/formulario-cliente" 
          element={
            <ClientForm 
              companySettings={companySettings}
              onSubmit={handleFormSubmit}
            />
          } 
        />
        <Route 
          path="/" 
          element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Formulário de Cliente
                </h1>
                <p className="text-gray-600 mb-6">
                  Acesse o formulário através do link fornecido pelo fotógrafo.
                </p>
                <a 
                  href="/formulario-cliente"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Acessar Formulário
                </a>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  );
};

export default ExternalClientForm;