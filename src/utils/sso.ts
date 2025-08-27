// Utilitários para Single Sign-On entre sistemas
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
  static openSystemWithSSO(baseUrl: string, user: any): void {
    // Verificar se a URL é válida
    if (!baseUrl || baseUrl === '#' || !baseUrl.startsWith('http')) {
      console.warn('URL inválida para SSO:', baseUrl);
      return;
    }

    const token = this.generateToken(user);
    this.saveToken(token);
    
    const ssoUrl = this.generateSSOUrl(baseUrl, token);
    window.open(ssoUrl, '_blank');
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