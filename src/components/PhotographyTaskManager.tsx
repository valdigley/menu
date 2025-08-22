import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Star, Calendar, User, Camera, Image, Album, Package, Link, DollarSign, Clock, CheckCircle, Circle, MoreHorizontal, Bell, Paperclip, MessageSquare, X, Edit3, Trash2, Save, Filter, SortAsc, Eye, Phone, Mail, MapPin, Hash, FileText, Upload, Download, Moon, Sun } from 'lucide-react';
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

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const PhotographyTaskManager: React.FC<PhotographyTaskManagerProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detectar preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Aplicar classe dark ao documento
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
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

  const projects: Project[] = [
    { id: 'all', name: 'Todas as Tarefas', icon: '📋', color: 'blue', count: 0 },
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
          task_type: selectedProject === 'all' ? 'photo_editing' : selectedProject,
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
      setSelectedTask(data);
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

    if (selectedProject !== 'all') {
      if (['wedding', 'birthday', 'corporate', 'portrait'].includes(selectedProject)) {
        filtered = filtered.filter(task => task.event_type === selectedProject);
      } else {
        filtered = filtered.filter(task => task.task_type === selectedProject);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    return filtered;
  };

  const getProjectCounts = () => {
    return projects.map(project => ({
      ...project,
      count: project.id === 'all' 
        ? tasks.length 
        : ['wedding', 'birthday', 'corporate', 'portrait'].includes(project.id)
          ? tasks.filter(task => task.event_type === project.id).length
          : tasks.filter(task => task.task_type === project.id).length
    }));
  };

  const getTaskIcon = (task: Task) => {
    const icons = {
      photo_editing: '🎨',
      album_creation: '📚',
      production_delivery: '📦',
      link_sharing: '🔗',
      other: '📋'
    };
    return icons[task.task_type] || '📋';
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      wedding: 'bg-pink-100 text-pink-800',
      birthday: 'bg-yellow-100 text-yellow-800',
      corporate: 'bg-gray-100 text-gray-800',
      portrait: 'bg-purple-100 text-purple-800',
      other: 'bg-blue-100 text-blue-800'
    };
    return colors[eventType as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-gray-500',
      in_progress: 'text-blue-500',
      review: 'text-yellow-500',
      completed: 'text-green-500',
      delivered: 'text-purple-500'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityStars = (priority: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < priority ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (task: Task) => {
    if (!task.delivery_date || task.status === 'completed' || task.status === 'delivered') return false;
    return new Date(task.delivery_date) < new Date();
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Obrigações</h1>
            <button
              onClick={toggleDarkMode}
              className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{user.user_metadata?.full_name || 'Fotógrafo'}</div>
              <div>{user.email}</div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {getProjectCounts().map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedProject === project.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{project.icon}</span>
                  <span className="flex-1 font-medium">{project.name}</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selectedProject === project.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {project.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Project Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="text-sm">Adicionar projeto</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {projects.find(p => p.id === selectedProject)?.name || 'Todas as Tarefas'}
              </h2>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none outline-none text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  showCompleted 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {showCompleted ? 'Ocultar concluídas' : 'Mostrar concluídas'}
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <SortAsc className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 flex">
          <div className="flex-1 overflow-y-auto">
            {/* Add Task Input */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              {showNewTask ? (
                <div className="flex items-center gap-3">
                  <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Adicionar uma tarefa..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createTask()}
                    onBlur={() => {
                      if (!newTaskTitle.trim()) setShowNewTask(false);
                    }}
                    className="flex-1 border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
                    autoFocus
                  />
                  <button
                    onClick={createTask}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTask(true)}
                  className="flex items-center gap-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
                >
                  <Plus className="h-5 w-5" />
                  <span>Adicionar uma tarefa...</span>
                </button>
              )}
            </div>

            {/* Tasks */}
            <div className="bg-white dark:bg-gray-800">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
                </div>
              ) : getFilteredTasks().length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Nenhuma tarefa encontrada</p>
                  <p className="text-sm">Adicione uma nova tarefa para começar</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {getFilteredTasks().map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedTask?.id === task.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                      } ${isOverdue(task) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(task);
                          }}
                          className="flex-shrink-0"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getTaskIcon(task)}</span>
                            <h3 className={`font-medium truncate ${
                              task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {task.title}
                            </h3>
                            {isOverdue(task) && (
                              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                                Atrasado
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{task.client_name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getEventTypeColor(task.event_type)}`}>
                              {task.event_type === 'wedding' && 'Casamento'}
                              {task.event_type === 'birthday' && 'Aniversário'}
                              {task.event_type === 'corporate' && 'Corporativo'}
                              {task.event_type === 'portrait' && 'Retrato'}
                              {task.event_type === 'other' && 'Outro'}
                            </span>
                            {task.delivery_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(task.delivery_date)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {getPriorityStars(task.priority)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                          {task.files && task.files.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span className="text-xs">{task.files.length}</span>
                            </div>
                          )}
                          {task.notes && (
                            <MessageSquare className="h-3 w-3" />
                          )}
                          <span className={`h-2 w-2 rounded-full ${getStatusColor(task.status)}`}></span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Task Details Panel */}
          <AnimatePresence>
            {selectedTask && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
              >
                {/* Task Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTaskIcon(selectedTask)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTask.client_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => toggleTaskComplete(selectedTask)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {selectedTask.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                      <span className="text-sm">
                        {selectedTask.status === 'completed' ? 'Concluída' : 'Marcar como concluída'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Criada em {formatDate(selectedTask.created_at)}</span>
                    </div>
                    {selectedTask.delivery_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span>Entrega: {formatDate(selectedTask.delivery_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Details */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Client Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informações do Cliente</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">{selectedTask.client_name}</span>
                      </div>
                      {selectedTask.client_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">{selectedTask.client_email}</span>
                        </div>
                      )}
                      {selectedTask.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">{selectedTask.client_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detalhes da Tarefa</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status === 'pending' && 'Pendente'}
                          {selectedTask.status === 'in_progress' && 'Em Progresso'}
                          {selectedTask.status === 'review' && 'Em Revisão'}
                          {selectedTask.status === 'completed' && 'Concluída'}
                          {selectedTask.status === 'delivered' && 'Entregue'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Prioridade</span>
                        <div className="flex items-center gap-1">
                          {getPriorityStars(selectedTask.priority)}
                        </div>
                      </div>

                      {selectedTask.photos_count && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fotos</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.photos_count}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pagamento</span>
                        <span className={`text-sm font-medium ${
                          selectedTask.payment_status === 'paid' ? 'text-green-600' :
                          selectedTask.payment_status === 'partial' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {selectedTask.payment_status === 'paid' && 'Pago'}
                          {selectedTask.payment_status === 'partial' && 'Parcial'}
                          {selectedTask.payment_status === 'pending' && 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Link */}
                  {selectedTask.gallery_link && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Link da Galeria</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Link className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <a 
                            href={selectedTask.gallery_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm truncate"
                          >
                            {selectedTask.gallery_link}
                          </a>
                        </div>
                        {selectedTask.link_sent_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Enviado em {formatDate(selectedTask.link_sent_at)}
                          </p>
                        )}
                        {selectedTask.client_viewed_at && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Visualizado em {formatDate(selectedTask.client_viewed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedTask.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Observações</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTask.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {selectedTask.files && selectedTask.files.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Arquivos</h4>
                      <div className="space-y-2">
                        {selectedTask.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.file_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{file.file_type}</p>
                            </div>
                            <button className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
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
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
                      <Edit3 className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button 
                      onClick={() => deleteTask(selectedTask.id)}
                      className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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