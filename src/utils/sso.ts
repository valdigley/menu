// Utilitários para Single Sign-On entre sistemas

interface SSOSession {
  id: string;
  user_id: string;
  email: string;
  name: string;
  token: string;
  expires_at: string;
  system_permissions: any;
}

export interface SSOToken {
  user_id: string;
  email: string;
  name: string;
  exp: number;
  iat: number;
}

export class SSOManager {
  private static readonly TOKEN_KEY = 'sso_token';
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
  private static supabase: any = null;

  /**
   * Configurar cliente Supabase para SSO
   */
  static setSupabaseClient(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Criar sessão SSO no banco de dados
   */
  static async createSSOSession(user: any): Promise<string | null> {
    if (!this.supabase) {
      console.warn('Supabase não configurado para SSO');
      return this.generateToken(user);
    }

    try {
      // Obter informações do navegador
      const userAgent = navigator.userAgent || '';
      const ipAddress = ''; // IP será obtido pelo servidor
      
      // Obter permissões do usuário
      const permissions = await this.getUserPermissions(user);

      // Chamar função do banco para criar token
      const { data, error } = await this.supabase.rpc('create_sso_token', {
        p_user_id: user.id,
        p_email: user.email,
        p_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        p_user_agent: userAgent,
        p_ip_address: ipAddress,
        p_permissions: permissions
      });

      if (error) {
        console.error('Erro ao criar sessão SSO:', error);
        return this.generateToken(user);
      }

      // Salvar token localmente também
      this.saveToken(data);
      
      return data;
    } catch (error) {
      console.error('Erro ao criar sessão SSO:', error);
      return this.generateToken(user);
    }
  }

  /**
   * Validar token SSO no banco de dados
   */
  static async validateSSOToken(token: string): Promise<any | null> {
    if (!this.supabase) {
      return this.isTokenValid(token) ? JSON.parse(atob(token)) : null;
    }

    try {
      const { data, error } = await this.supabase.rpc('validate_sso_token', {
        token_input: token
      });

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Erro ao validar token SSO:', error);
      return null;
    }
  }

  /**
   * Obter permissões do usuário
   */
  static async getUserPermissions(user: any): Promise<any> {
    if (!this.supabase) {
      return {};
    }

    try {
      // Buscar assinatura do usuário
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Buscar acessos do sistema
      const { data: systemAccess } = await this.supabase
        .from('user_system_access')
        .select('*')
        .eq('user_id', user.id);

      return {
        subscription: subscription || null,
        system_access: systemAccess || [],
        is_master: user.email === 'valdigley2007@gmail.com',
        has_active_subscription: subscription?.status === 'active' || subscription?.manual_access === true
      };
    } catch (error) {
      console.error('Erro ao obter permissões:', error);
      return {};
    }
  }

  /**
   * Invalidar sessão SSO
   */
  static async invalidateSSOSession(token?: string): Promise<void> {
    const tokenToInvalidate = token || this.getToken();
    
    if (!tokenToInvalidate || !this.supabase) {
      this.removeToken();
      return;
    }

    try {
      // Desativar token no banco
      await this.supabase
        .from('sso_sessions')
        .update({ is_active: false })
        .eq('token', tokenToInvalidate);
    } catch (error) {
      console.error('Erro ao invalidar sessão SSO:', error);
    } finally {
      this.removeToken();
    }
  }

  /**
   * Listar sessões ativas do usuário
   */
  static async getUserSessions(userId: string): Promise<SSOSession[]> {
    if (!this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('sso_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      return [];
    }
  }

  /**
   * Gera um token SSO para o usuário atual
   */
  static generateToken(user: any): string {
    const payload: SSOToken = {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      exp: Date.now() + this.TOKEN_EXPIRY,
      iat: Date.now()
    };

    return btoa(JSON.stringify(payload));
  }

  /**
   * Valida se o token ainda é válido
   */
  static isTokenValid(token: string): boolean {
    try {
      const payload: SSOToken = JSON.parse(atob(token));
      return payload.exp > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Salva o token no localStorage
   */
  static saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Recupera o token do localStorage
   */
  static getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && this.isTokenValid(token)) {
      return token;
    }
    this.removeToken();
    return null;
  }

  /**
   * Remove o token do localStorage
   */
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Gera URL com token SSO para sistema externo
   */
  static generateSSOUrl(baseUrl: string, token: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('sso_token', token);
    url.searchParams.set('timestamp', Date.now().toString());
    return url.toString();
  }

  /**
   * Abre sistema externo com SSO
   */
  static async openSystemWithSSO(baseUrl: string, user: any): Promise<void> {
    // Verificar se a URL é válida
    if (!baseUrl || baseUrl === '#' || !baseUrl.startsWith('http')) {
      console.warn('URL inválida para SSO:', baseUrl);
      return;
    }

    // Criar ou obter token SSO
    const token = await this.createSSOSession(user);
    if (!token) {
      console.error('Não foi possível criar sessão SSO');
      return;
    }
    
    const ssoUrl = this.generateSSOUrl(baseUrl, token);
    window.open(ssoUrl, '_blank');
  }

  /**
   * Verificar se usuário tem acesso a um sistema específico
   */
  static async hasSystemAccess(user: any, systemId: string): Promise<boolean> {
    if (!this.supabase) {
      return true; // Fallback: permitir acesso se não há verificação
    }

    try {
      // Verificar se é master
      if (user.email === 'valdigley2007@gmail.com') {
        return true;
      }

      // Verificar acesso específico do sistema
      const { data, error } = await this.supabase
        .from('user_system_access')
        .select('has_access')
        .eq('user_id', user.id)
        .eq('system_id', systemId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.has_access === true;
    } catch (error) {
      console.error('Erro ao verificar acesso do sistema:', error);
      return false;
    }
  }

  /**
   * API para outros sistemas validarem token
   */
  static async validateTokenForExternalSystem(token: string): Promise<{
    valid: boolean;
    user?: any;
    permissions?: any;
    error?: string;
  }> {
    try {
      const userData = await this.validateSSOToken(token);
      
      if (!userData) {
        return {
          valid: false,
          error: 'Token inválido ou expirado'
        };
      }

      return {
        valid: true,
        user: {
          id: userData.user_id,
          email: userData.email,
          name: userData.name
        },
        permissions: userData.permissions || {}
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Erro ao validar token'
      };
    }
  }

  /**
   * Verifica se o usuário atual é master
   */
  static isMasterUser(user: any): boolean {
    return user?.email === 'valdigley2007@gmail.com';
  }

  /**
   * Gera configurações padrão para novo usuário
   */
  static getDefaultSettings(): any {
    return {
      appearance: {
        mainWallpaper: '',
        lockScreenWallpaper: '',
        gradientFrom: '#3b82f6',
        gradientTo: '#1e40af',
        buttons: [
          {
            id: 'fotografias',
            name: 'Fotografias',
            icon: 'Heart',
            color: 'green',
            backgroundImage: 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800',
            url: 'https://fotografias.exemplo.com',
            isActive: true
          },
          {
            id: 'financeiro',
            name: 'Financeiro',
            icon: 'DollarSign',
            color: 'yellow',
            backgroundImage: 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=800',
            url: 'https://financeiro.exemplo.com',
            isActive: true
          },
          {
            id: 'clientes',
            name: 'Clientes',
            icon: 'FileText',
            color: 'blue',
            backgroundImage: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=800',
            url: 'https://clientes.exemplo.com',
            isActive: true
          },
          {
            id: 'agenda',
            name: 'Agenda',
            icon: 'Zap',
            color: 'purple',
            backgroundImage: 'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
            url: 'https://agenda.exemplo.com',
            isActive: true
          },
          {
            id: 'portfolio',
            name: 'Portfólio',
            icon: 'CheckSquare',
            color: 'orange',
            backgroundImage: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
            url: 'https://portfolio.exemplo.com',
            isActive: true
          }
        ]
      }
    };
  }

  /**
   * Cria configurações iniciais para um novo usuário baseadas no master
   */
  static async createUserSettingsFromMaster(supabase: any, userId: string, masterSettings?: any): Promise<void> {
    try {
      let settingsToUse = masterSettings;

      // Se não foram fornecidas configurações do master, buscar
      if (!settingsToUse && supabase) {
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

        if (masterData && masterData.length > 0) {
          settingsToUse = masterData[0].settings;
        }
      }

      // Se ainda não há configurações, usar padrões
      if (!settingsToUse) {
        settingsToUse = this.getDefaultSettings();
      }

      // Criar configurações para o novo usuário
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          settings: settingsToUse,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

    } catch (error) {
      console.error('Erro ao criar configurações do usuário:', error);
    }
  }
}