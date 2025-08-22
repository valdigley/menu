import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Star, Calendar, User, Camera, Image, Album, Package, Link, DollarSign, Clock, CheckCircle, Circle, MoreHorizontal, Bell, Paperclip, MessageSquare, X, Edit3, Trash2, Save, Filter, SortAsc, Eye, Phone, Mail, MapPin, Hash, FileText, Upload, Download, Moon, Sun, Grid3X3, List, Kanban, BarChart3, Users, Tag, Flag, Zap, ChevronDown, ChevronRight, Settings, Home, Folder, Target, TrendingUp, Activity, AlertCircle, CheckSquare, PlayCircle, PauseCircle, RotateCcw, Archive, Copy, Share2, ExternalLink, Bookmark, Heart, ThumbsUp, Clock4, Calendar as CalendarIcon, Timer, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotographyTaskManagerProps {
  user: any;
  supabase: any;
  onBack: () => void;
}

interface Task {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_type: 'wedding' | 'birthday' | 'corporate' | 'portrait' | 'other';
  event_date?: string;
  task_type: 'photo_editing' | 'album_creation' | 'production_delivery' | 'link_sharing' | 'other';
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'delivered';
  priority: number;
  photos_count?: number;
  delivery_date?: string;
  actual_delivery_date?: string;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_amount?: number;
  payment_received?: number;
  gallery_link?: string;
  link_sent_at?: string;
  client_viewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  files?: TaskFile[];
  payments?: TaskPayment[];
  assignee?: string;
  tags?: string[];
  time_tracked?: number;
  estimated_time?: number;
}

interface TaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: 'raw' | 'edited' | 'album' | 'contract' | 'other';
  uploaded_at: string;
}

interface TaskPayment {
  id: string;
  task_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

interface Space {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  isExpanded?: boolean;
}

const PhotographyTaskManager: React.FC<PhotographyTaskManagerProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar' | 'gantt'>('board');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all'
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const spaces: Space[] = [
    { id: 'all', name: 'Todas as Tarefas', icon: '🏠', color: 'blue', count: 0, isExpanded: true },
    { id: 'photo_editing', name: 'Edição de Fotos', icon: '🎨', color: 'purple', count: 0 },
    { id: 'album_creation', name: 'Criação de Álbuns', icon: '📚', color: 'green', count: 0 },
    { id: 'production_delivery', name: 'Produção e Entrega', icon: '📦', color: 'orange', count: 0 },
    { id: 'link_sharing', name: 'Envio de Links', icon: '🔗', color: 'blue', count: 0 },
    { id: 'wedding', name: 'Casamentos', icon: '💒', color: 'pink', count: 0 },
    { id: 'birthday', name: 'Aniversários', icon: '🎂', color: 'yellow', count: 0 },
    { id: 'corporate', name: 'Corporativo', icon: '🏢', color: 'gray', count: 0 },
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const loadTasks = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data: tasksData, error } = await supabase
        .from('photography_tasks')
        .select(`
          *,
          task_files (*),
          task_payments (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('priority', { ascending: false });

      if (error) throw error;
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!supabase || !newTaskTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('photography_tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle,
          client_name: 'Cliente',
          task_type: selectedSpace === 'all' ? 'photo_editing' : selectedSpace,
          status: 'pending',
          priority: 3,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      setNewTaskTitle('');
      setShowNewTask(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('photography_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const { error } = await supabase
        .from('photography_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { 
      status: newStatus,
      actual_delivery_date: newStatus === 'completed' ? new Date().toISOString() : null
    });
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by space
    if (selectedSpace !== 'all') {
      if (['wedding', 'birthday', 'corporate', 'portrait'].includes(selectedSpace)) {
        filtered = filtered.filter(task => task.event_type === selectedSpace);
      } else {
        filtered = filtered.filter(task => task.task_type === selectedSpace);
      }
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (selectedFilters.status !== 'all') {
      filtered = filtered.filter(task => task.status === selectedFilters.status);
    }

    if (selectedFilters.priority !== 'all') {
      const priorityNum = parseInt(selectedFilters.priority);
      filtered = filtered.filter(task => task.priority === priorityNum);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'delivery_date':
          aValue = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
          bValue = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getSpaceCounts = () => {
    return spaces.map(space => ({
      ...space,
      count: space.id === 'all' 
        ? tasks.length 
        : ['wedding', 'birthday', 'corporate', 'portrait'].includes(space.id)
          ? tasks.filter(task => task.event_type === space.id).length
          : tasks.filter(task => task.task_type === space.id).length
    }));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      delivered: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-500';
    if (priority >= 4) return 'text-orange-500';
    if (priority >= 3) return 'text-yellow-500';
    if (priority >= 2) return 'text-blue-500';
    return 'text-gray-400';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 5) return <Flag className="h-4 w-4 text-red-500" />;
    if (priority >= 4) return <Flag className="h-4 w-4 text-orange-500" />;
    if (priority >= 3) return <Flag className="h-4 w-4 text-yellow-500" />;
    if (priority >= 2) return <Flag className="h-4 w-4 text-blue-500" />;
    return <Flag className="h-4 w-4 text-gray-400" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const isOverdue = (task: Task) => {
    if (!task.delivery_date || task.status === 'completed' || task.status === 'delivered') return false;
    return new Date(task.delivery_date) < new Date();
  };

  const getTaskTypeIcon = (taskType: string) => {
    const icons = {
      photo_editing: <Image className="h-4 w-4" />,
      album_creation: <Album className="h-4 w-4" />,
      production_delivery: <Package className="h-4 w-4" />,
      link_sharing: <Link className="h-4 w-4" />,
      other: <FileText className="h-4 w-4" />
    };
    return icons[taskType as keyof typeof icons] || icons.other;
  };

  const renderListView = () => (
    <div className="flex-1 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-4">Tarefa</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Cliente</div>
          <div className="col-span-1">Prioridade</div>
          <div className="col-span-2">Entrega</div>
          <div className="col-span-1">Ações</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : getFilteredTasks().length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</p>
            <p className="text-sm">Crie uma nova tarefa para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {getFilteredTasks().map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 ${
                  selectedTask?.id === task.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500' : ''
                } ${isOverdue(task) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Task Title */}
                  <div className="col-span-4 flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskComplete(task);
                      }}
                      className="flex-shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(task.task_type)}
                      <span className={`font-medium truncate ${
                        task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'pending' && 'Pendente'}
                      {task.status === 'in_progress' && 'Em Progresso'}
                      {task.status === 'review' && 'Em Revisão'}
                      {task.status === 'completed' && 'Concluída'}
                      {task.status === 'delivered' && 'Entregue'}
                    </span>
                  </div>

                  {/* Client */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.client_name}</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 flex justify-center">
                    {getPriorityIcon(task.priority)}
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2">
                    {task.delivery_date && (
                      <div className={`flex items-center gap-1 text-sm ${
                        isOverdue(task) ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.delivery_date)}</span>
                        {isOverdue(task) && <AlertCircle className="h-3 w-3" />}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-center">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBoardView = () => {
    const statusColumns = [
      { id: 'pending', name: 'Pendente', color: 'gray' },
      { id: 'in_progress', name: 'Em Progresso', color: 'blue' },
      { id: 'review', name: 'Em Revisão', color: 'yellow' },
      { id: 'completed', name: 'Concluída', color: 'green' }
    ];

    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {statusColumns.map((column) => {
            const columnTasks = getFilteredTasks().filter(task => task.status === column.id);
            
            return (
              <div key={column.id} className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{column.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      column.color === 'gray' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                      column.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                      column.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
                      'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    }`}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-0">
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task);
                            }}
                            className="flex-shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                            )}
                          </button>
                          <h4 className={`font-semibold text-sm leading-tight ${
                            task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {getPriorityIcon(task.priority)}
                        </div>
                      </div>
                      
                      {/* Cliente */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {task.client_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{task.client_name}</span>
                      </div>

                      {/* Tipo de Tarefa */}
                      <div className="flex items-center gap-2 mb-3">
                        {getTaskTypeIcon(task.task_type)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {task.task_type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Seção de Anotações */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-3 w-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Anotações</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-h-[60px]">
                          {task.notes ? (
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {task.notes.length > 80 ? `${task.notes.substring(0, 80)}...` : task.notes}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                              Clique para adicionar anotações...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Seção de Processos */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="h-3 w-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Processos</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === 'completed' || task.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Edição</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.payment_status === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Pagamento</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.gallery_link ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Entrega</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer do Card */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          {/* Data de Entrega */}
                          {task.delivery_date && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                              isOverdue(task) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(task.delivery_date)}</span>
                              {isOverdue(task) && <AlertCircle className="h-3 w-3" />}
                            </div>
                          )}
                          
                          {/* Status de Pagamento */}
                          <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                            task.payment_status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            task.payment_status === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}>
                            {task.payment_status === 'paid' ? '💰 Pago' :
                             task.payment_status === 'partial' ? '⏳ Parcial' : '❌ Pendente'}
                          </div>
                        </div>
                        
                        {/* Arquivos */}
                        <div className="flex items-center gap-1">
                          {task.files && task.files.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Paperclip className="h-3 w-3" />
                              <span>{task.files.length}</span>
                            </div>
                          )}
                          
                          {/* Botão de ações */}
                          <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all">
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Botão para adicionar nova tarefa na coluna */}
                  {column.id === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowNewTask(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Adicionar tarefa</span>
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Obrigações</h1>
            <button
              onClick={toggleDarkMode}
              className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-xs">
                {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {user.user_metadata?.full_name || 'Usuário'}
              </div>
              <div className="text-xs">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {getSpaceCounts().map((space) => (
              <button
                key={space.id}
                onClick={() => setSelectedSpace(space.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                  selectedSpace === space.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{space.icon}</span>
                <span className="flex-1 font-medium text-sm">{space.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedSpace === space.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {space.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowNewTask(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {spaces.find(s => s.id === selectedSpace)?.name || 'Todas as Tarefas'}
              </h2>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Visualização em Lista"
                >
                  <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Visualização em Quadro"
                >
                  <Kanban className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
                title="Filtros"
              >
                <Filter className="h-4 w-4" />
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at-desc">Mais Recentes</option>
                  <option value="created_at-asc">Mais Antigas</option>
                  <option value="priority-desc">Maior Prioridade</option>
                  <option value="priority-asc">Menor Prioridade</option>
                  <option value="delivery_date-asc">Entrega Próxima</option>
                  <option value="title-asc">Nome A-Z</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={selectedFilters.status}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="review">Em Revisão</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                    <select
                      value={selectedFilters.priority}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todas</option>
                      <option value="5">Urgente</option>
                      <option value="4">Alta</option>
                      <option value="3">Média</option>
                      <option value="2">Baixa</option>
                      <option value="1">Muito Baixa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                    <select
                      value={selectedFilters.assignee}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, assignee: e.target.value }))}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todos</option>
                      <option value="me">Eu</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo</label>
                    <select
                      value={selectedFilters.dueDate}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todos</option>
                      <option value="overdue">Atrasadas</option>
                      <option value="today">Hoje</option>
                      <option value="week">Esta Semana</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Task Input */}
        <AnimatePresence>
          {showNewTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <Circle className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome da tarefa e pressione Enter..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') createTask();
                    if (e.key === 'Escape') setShowNewTask(false);
                  }}
                  onBlur={() => {
                    if (!newTaskTitle.trim()) setShowNewTask(false);
                  }}
                  className="flex-1 border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 bg-transparent text-lg"
                  autoFocus
                />
                <button
                  onClick={createTask}
                  className="text-blue-500 hover:text-blue-600 p-1"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowNewTask(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'list' ? renderListView() : renderBoardView()}

          {/* Task Details Panel */}
          <AnimatePresence>
            {selectedTask && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col"
              >
                {/* Task Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTaskTypeIcon(selectedTask.task_type)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">#{selectedTask.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => toggleTaskComplete(selectedTask)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        selectedTask.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {selectedTask.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedTask.status === 'completed' ? 'Concluída' : 'Marcar como concluída'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status === 'pending' && 'Pendente'}
                          {selectedTask.status === 'in_progress' && 'Em Progresso'}
                          {selectedTask.status === 'review' && 'Em Revisão'}
                          {selectedTask.status === 'completed' && 'Concluída'}
                          {selectedTask.status === 'delivered' && 'Entregue'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Prioridade</span>
                      <div className="mt-1 flex items-center gap-1">
                        {getPriorityIcon(selectedTask.priority)}
                        <span className="text-gray-900 dark:text-white">
                          {selectedTask.priority === 5 && 'Urgente'}
                          {selectedTask.priority === 4 && 'Alta'}
                          {selectedTask.priority === 3 && 'Média'}
                          {selectedTask.priority === 2 && 'Baixa'}
                          {selectedTask.priority === 1 && 'Muito Baixa'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Details */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Client Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{selectedTask.client_name}</span>
                      </div>
                      {selectedTask.client_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{selectedTask.client_email}</span>
                        </div>
                      )}
                      {selectedTask.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{selectedTask.client_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datas
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Criada</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(selectedTask.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      {selectedTask.delivery_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Entrega</span>
                          <span className={`text-sm ${
                            isOverdue(selectedTask) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {new Date(selectedTask.delivery_date).toLocaleDateString('pt-BR')}
                            {isOverdue(selectedTask) && ' (Atrasado)'}
                          </span>
                        </div>
                      )}

                      {selectedTask.actual_delivery_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Entregue em</span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {new Date(selectedTask.actual_delivery_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pagamento
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`text-sm font-medium ${
                          selectedTask.payment_status === 'paid' ? 'text-green-600 dark:text-green-400' :
                          selectedTask.payment_status === 'partial' ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedTask.payment_status === 'paid' && 'Pago'}
                          {selectedTask.payment_status === 'partial' && 'Parcial'}
                          {selectedTask.payment_status === 'pending' && 'Pendente'}
                        </span>
                      </div>
                      
                      {selectedTask.payment_amount && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Valor</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            R$ {selectedTask.payment_amount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {selectedTask.payment_received && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Recebido</span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            R$ {selectedTask.payment_received.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gallery Link */}
                  {selectedTask.gallery_link && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Galeria
                      </h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <a 
                          href={selectedTask.gallery_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver Galeria
                        </a>
                        {selectedTask.link_sent_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Enviado em {new Date(selectedTask.link_sent_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {selectedTask.client_viewed_at && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Visualizado em {new Date(selectedTask.client_viewed_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedTask.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Observações
                      </h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTask.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {selectedTask.files && selectedTask.files.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Arquivos ({selectedTask.files.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedTask.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.file_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{file.file_type}</p>
                            </div>
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium">
                      <Edit3 className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteTask(selectedTask.id)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PhotographyTaskManager;