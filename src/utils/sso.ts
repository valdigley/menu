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

    // Codifica o payload em base64 (em produção, use JWT real com assinatura)
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
    // Remove token expirado
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
    const token = this.generateToken(user);
    this.saveToken(token);
    
    const ssoUrl = this.generateSSOUrl(baseUrl, token);
    
    // Abrir em nova aba
    window.open(ssoUrl, '_blank');
  }

  /**
   * Verifica se o usuário está logado via SSO
   */
  static isLoggedIn(): boolean {
    const token = this.getToken();
    return token !== null;
  }

  /**
   * Obtém dados do usuário do token SSO
   */
  static getUserFromToken(): SSOToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }
}