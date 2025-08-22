import { 
  Settings, Users, Image, DollarSign, FileText, Shield, Bell,
  Zap, Bot, Cpu, Database, Server, Workflow, GitBranch,
  Calendar, Clock, Mail, Phone, MessageSquare, Video,
  Camera, Music, Play, Pause, Download, Upload,
  Search, Filter, SortAsc as Sort, Grid, List, Map,
  Home, Building, Car, Truck, Plane, Ship,
  Heart, Star, Award, Trophy, Target, Flag,
  Lock, Unlock, Key, Eye, EyeOff, Fingerprint,
  Wifi, Bluetooth, Radio, Signal, Battery, Power,
  Lightbulb, Sun, Moon, Cloud, Umbrella, Thermometer,
  Activity, BarChart, PieChart, TrendingUp, TrendingDown, LineChart,
  User, LogOut, CheckSquare
} from 'lucide-react';

export const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    // Básicos
    Image, DollarSign, FileText, Settings, Users,
    // Automação & Tecnologia
    Zap, Bot, Cpu, Database, Server, Workflow, GitBranch,
    // Comunicação & Tempo
    Calendar, Clock, Mail, Phone, MessageSquare, Video,
    // Mídia
    Camera, Music, Play, Pause, Download, Upload,
    // Navegação
    Search, Filter, Sort, Grid, List, Map,
    // Locais & Transporte
    Home, Building, Car, Truck, Plane, Ship,
    // Gamificação
    Heart, Star, Award, Trophy, Target, Flag,
    // Segurança
    Lock, Unlock, Key, Eye, EyeOff, Fingerprint,
    // Conectividade
    Wifi, Bluetooth, Radio, Signal, Battery, Power,
    // Ambiente
    Lightbulb, Shield, Bell, Cloud, Umbrella, Thermometer,
    // Analytics
    BarChart, PieChart, TrendingUp, TrendingDown, LineChart, Activity,
    // Outros
    User, Moon, Sun, LogOut, CheckSquare
  };
  
  return iconMap[iconName] || Settings; // Fallback para Settings se não encontrar
};