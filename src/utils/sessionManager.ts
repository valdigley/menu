import { createClient } from '@supabase/supabase-js';

// Cliente Supabase - usar as mesmas credenciais em todos os sistemas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Criar sessão compartilhada após login bem-sucedido
 */
export async function createSharedSession(userId: string): Promise<string | null> {
  if (!supabase) {
    console.error('❌ Supabase não configurado');
    return null;
  }

  try {
    console.log('🔐 Criando sessão compartilhada para usuário:', userId);
    
    // Gerar token único e seguro
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}_${Math.random().toString(36).substring(2)}`;
    
    // Definir expiração (24 horas)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Obter informações do navegador para segurança
    let ipAddress = 'unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (error) {
      console.warn('Não foi possível obter IP:', error);
    }

    const userAgent = navigator.userAgent;

    // Invalidar sessões antigas do mesmo usuário (máximo 1 sessão ativa por usuário)
    await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Criar nova sessão
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Sessão compartilhada criada:', sessionToken.substring(0, 20) + '...');
    return sessionToken;

  } catch (error) {
    console.error('❌ Erro ao criar sessão compartilhada:', error);
    return null;
  }
}

/**
 * Validar token de sessão (usado pelos outros sistemas)
 */
export async function validateSessionToken(token: string): Promise<any | null> {
  if (!supabase || !token) {
    return null;
  }

  try {
    console.log('🔍 Validando token de sessão:', token.substring(0, 20) + '...');

    // Buscar sessão ativa e não expirada
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .eq('session_token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      console.log('❌ Token inválido ou expirado');
      return null;
    }

    // Atualizar último uso
    await supabase
      .from('user_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.id);

    console.log('✅ Token válido para usuário:', data.user?.email);
    return {
      session: data,
      user: data.user
    };

  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    return null;
  }
}

/**
 * Gerar URLs para sistemas com token de sessão
 */
export function generateSystemUrl(sessionToken: string, systemName: string): string | null {
  const systemUrls: { [key: string]: string } = {
    'triagem': 'https://triagem.fotografo.site',
    'contrato': 'https://contrato.fotografo.site', 
    'drive': 'https://drive.fotografo.site',
    'formatura': 'https://formatura.fotografo.site',
    'principal': 'https://fotografo.site',
    'admin': 'https://admin.fotografo.site'
  };
  
  const baseUrl = systemUrls[systemName];
  if (!baseUrl) {
    console.error('Sistema não encontrado:', systemName);
    return null;
  }
  
  const url = new URL(baseUrl);
  url.searchParams.set('session_token', sessionToken);
  url.searchParams.set('timestamp', Date.now().toString());
  return url.toString();
}

/**
 * Redirecionar para sistema específico
 */
export async function redirectToSystem(userId: string, systemName: string): Promise<boolean> {
  try {
    console.log('🚀 Redirecionando para sistema:', systemName);
    
    // Criar sessão compartilhada
    const sessionToken = await createSharedSession(userId);
    
    if (!sessionToken) {
      alert('Erro ao criar sessão. Tente novamente.');
      return false;
    }
    
    // Gerar URL do sistema
    const systemUrl = generateSystemUrl(sessionToken, systemName);
    
    if (!systemUrl) {
      alert('Sistema não encontrado. Verifique o nome.');
      return false;
    }
    
    console.log('🔗 Redirecionando para:', systemUrl);
    
    // Redirecionar
    window.open(systemUrl, '_blank');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao redirecionar:', error);
    alert('Erro ao acessar sistema. Tente novamente.');
    return false;
  }
}

/**
 * Obter sessões ativas do usuário
 */
export async function getUserActiveSessions(userId: string): Promise<any[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar sessões:', error);
    return [];
  }
}

/**
 * Invalidar sessão específica
 */
export async function invalidateSession(sessionId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
    console.log('✅ Sessão invalidada:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao invalidar sessão:', error);
    return false;
  }
}

/**
 * Invalidar todas as sessões do usuário
 */
export async function invalidateAllUserSessions(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    console.log('✅ Todas as sessões invalidadas para usuário:', userId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao invalidar sessões:', error);
    return false;
  }
}

/**
 * Limpeza manual de sessões expiradas
 */
export async function cleanupExpiredSessions(): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.rpc('cleanup_expired_sessions');
    if (error) throw error;
    console.log('🧹 Limpeza de sessões expiradas concluída');
  } catch (error) {
    console.error('❌ Erro na limpeza de sessões:', error);
  }
}