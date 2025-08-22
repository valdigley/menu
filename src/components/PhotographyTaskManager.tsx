import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Calendar, Clock, Camera, Image, Package, Link, DollarSign, Eye, Phone, Mail, FileText, Upload, Download, Edit, Trash2, Save, X, CheckCircle, AlertCircle, Star, Users, Zap, Target, Play, Pause, Grid, List, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotographyTaskManagerProps {
  user: any;
  supabase: any;
  onBack: () => void;
}

interface PhotographyTask {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_type: string;
  event_date?: string;
  task_type: 'photo_editing' | 'album_creation' | 'production_delivery' | 'link_sharing' | 'other';
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'delivered';
  priority: number;
  photos_count: number;
  delivery_date?: string;
  actual_delivery_date?: string;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_amount: number;
  payment_received: number;
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
  payment_method: string;
  notes?: string;
  created_at: string;
}

const PhotographyTaskManager: React.FC<PhotographyTaskManagerProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<PhotographyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTaskType, setFilterTaskType] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<PhotographyTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<PhotographyTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedTask, setDraggedTask] = useState<PhotographyTask | null>(null);

  const eventTypes = [
    { value: 'wedding', label: 'Casamento', icon: '💒' },
    { value: 'birthday', label: 'Aniversário', icon: '🎂' },
    { value: 'corporate', label: 'Corporativo', icon: '🏢' },
    { value: 'family', label: 'Família', icon: '👨‍👩‍👧‍👦' },
    { value: 'maternity', label: 'Gestante', icon: '🤱' },
    { value: 'newborn', label: 'Newborn', icon: '👶' },
    { value: 'engagement', label: 'Noivado', icon: '💍' },
    { value: 'graduation', label: 'Formatura', icon: '🎓' },
    { value: 'other', label: 'Outro', icon: '📸' }
  ];

  const taskTypes = [
    { value: 'photo_editing', label: 'Edição de Fotos', icon: <Image className="h-4 w-4" />, color: 'bg-blue-500' },
    { value: 'album_creation', label: 'Criação de Álbum', icon: <Package className="h-4 w-4" />, color: 'bg-purple-500' },
    { value: 'production_delivery', label: 'Produção e Entrega', icon: <Zap className="h-4 w-4" />, color: 'bg-orange-500' },
    { value: 'link_sharing', label: 'Envio de Link', icon: <Link className="h-4 w-4" />, color: 'bg-green-500' },
    { value: 'other', label: 'Outro', icon: <Target className="h-4 w-4" />, color: 'bg-gray-500' }
  ];

  const statusColumns = [
    { id: 'pending', title: 'Pendente', color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> },
    { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500', icon: <Play className="h-4 w-4" /> },
    { id: 'review', title: 'Revisão', color: 'bg-purple-500', icon: <Eye className="h-4 w-4" /> },
    { id: 'completed', title: 'Concluído', color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'delivered', title: 'Entregue', color: 'bg-gray-500', icon: <Package className="h-4 w-4" /> }
  ];

  useEffect(() => {
    if (user && supabase) {
      loadTasks();
    }
  }, [user, supabase]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photography_tasks')
        .select(`
          *,
          files:task_files(*),
          payments:task_payments(*)
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Partial<PhotographyTask>) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('photography_tasks')
        .insert([{
          ...taskData,
          user_id: user.id,
          priority: taskData.priority || 3
        }])
        .select(`
          *,
          files:task_files(*),
          payments:task_payments(*)
        `)
        .single();

      if (error) throw error;
      setTasks(prev => [data, ...prev]);
      setShowAddTask(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Erro ao criar tarefa');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<PhotographyTask>) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('photography_tasks')
        .update(updates)
        .eq('id', taskId)
        .select(`
          *,
          files:task_files(*),
          payments:task_payments(*)
        `)
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(task => task.id === taskId ? data : task));
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      alert('Erro ao atualizar tarefa');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!supabase) return;
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const { error } = await supabase
        .from('photography_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      alert('Erro ao excluir tarefa');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { 
      status: newStatus as any,
      actual_delivery_date: newStatus === 'delivered' ? new Date().toISOString() : undefined
    });
  };

  const updateTaskPriority = async (taskId: string, newPriority: number) => {
    await updateTask(taskId, { priority: newPriority });
  };

  const addPayment = async (taskId: string, amount: number, method: string, notes?: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('task_payments')
        .insert([{
          task_id: taskId,
          amount,
          payment_method: method,
          notes,
          payment_date: new Date().toISOString()
        }]);

      if (error) throw error;
      await loadTasks(); // Recarregar para atualizar os totais
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      alert('Erro ao adicionar pagamento');
    }
  };

  const markLinkSent = async (taskId: string, galleryLink: string) => {
    await updateTask(taskId, {
      gallery_link: galleryLink,
      link_sent_at: new Date().toISOString()
    });
  };

  const getTaskTypeInfo = (type: string) => {
    return taskTypes.find(t => t.value === type) || taskTypes[0];
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(e => e.value === type) || eventTypes[eventTypes.length - 1];
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const isOverdue = (task: PhotographyTask) => {
    return task.delivery_date && 
           new Date(task.delivery_date) < new Date() && 
           task.status !== 'completed' && 
           task.status !== 'delivered';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesTaskType = filterTaskType === 'all' || task.task_type === filterTaskType;
    const matchesPaymentStatus = filterPaymentStatus === 'all' || task.payment_status === filterPaymentStatus;

    return matchesSearch && matchesStatus && matchesTaskType && matchesPaymentStatus;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    delivered: tasks.filter(t => t.status === 'delivered').length,
    overdue: tasks.filter(t => isOverdue(t)).length,
    totalRevenue: tasks.reduce((sum, t) => sum + t.payment_received, 0),
    pendingRevenue: tasks.reduce((sum, t) => sum + (t.payment_amount - t.payment_received), 0)
  };

  // Drag and Drop handlers
  const handleDragStart = (task: PhotographyTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskStatus(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gestão de Tarefas Fotográficas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Organize seu workflow de fotografia
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pendente</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Progresso</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Concluído</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Entregue</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Atrasado</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Recebido</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">R$ {stats.totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pendente</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">R$ {stats.pendingRevenue.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="all">Todos os Status</option>
                {statusColumns.map(status => (
                  <option key={status.id} value={status.id}>{status.title}</option>
                ))}
              </select>

              <select
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="all">Todos os Tipos</option>
                {taskTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="all">Todos os Pagamentos</option>
                <option value="pending">Pendente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'kanban' ? (
          <KanbanView
            tasks={filteredTasks}
            statusColumns={statusColumns}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowTaskDetails(true);
            }}
            onEditTask={setEditingTask}
            onDeleteTask={deleteTask}
            onUpdatePriority={updateTaskPriority}
            getTaskTypeInfo={getTaskTypeInfo}
            getEventTypeInfo={getEventTypeInfo}
            getPaymentStatusColor={getPaymentStatusColor}
            isOverdue={isOverdue}
          />
        ) : (
          <ListView
            tasks={filteredTasks}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowTaskDetails(true);
            }}
            onEditTask={setEditingTask}
            onDeleteTask={deleteTask}
            onUpdatePriority={updateTaskPriority}
            getTaskTypeInfo={getTaskTypeInfo}
            getEventTypeInfo={getEventTypeInfo}
            getPaymentStatusColor={getPaymentStatusColor}
            isOverdue={isOverdue}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddTask && (
          <TaskModal
            onClose={() => setShowAddTask(false)}
            onSave={createTask}
            eventTypes={eventTypes}
            taskTypes={taskTypes}
            title="Nova Tarefa Fotográfica"
          />
        )}

        {editingTask && (
          <TaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(data) => updateTask(editingTask.id, data)}
            eventTypes={eventTypes}
            taskTypes={taskTypes}
            title="Editar Tarefa"
          />
        )}

        {showTaskDetails && selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={() => {
              setShowTaskDetails(false);
              setSelectedTask(null);
            }}
            onUpdate={loadTasks}
            onAddPayment={addPayment}
            onMarkLinkSent={markLinkSent}
            supabase={supabase}
            getTaskTypeInfo={getTaskTypeInfo}
            getEventTypeInfo={getEventTypeInfo}
            getPaymentStatusColor={getPaymentStatusColor}
            isOverdue={isOverdue}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente KanbanView
const KanbanView: React.FC<{
  tasks: PhotographyTask[];
  statusColumns: any[];
  onDragStart: (task: PhotographyTask) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onTaskClick: (task: PhotographyTask) => void;
  onEditTask: (task: PhotographyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  getTaskTypeInfo: (type: string) => any;
  getEventTypeInfo: (type: string) => any;
  getPaymentStatusColor: (status: string) => string;
  isOverdue: (task: PhotographyTask) => boolean;
}> = ({ 
  tasks, 
  statusColumns, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onTaskClick, 
  onEditTask, 
  onDeleteTask, 
  onUpdatePriority,
  getTaskTypeInfo,
  getEventTypeInfo,
  getPaymentStatusColor,
  isOverdue
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statusColumns.map((column) => (
        <div
          key={column.id}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, column.id)}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 ${column.color} rounded-lg`}>
              {column.icon}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {column.title}
            </h3>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
              {tasks.filter(t => t.status === column.id).length}
            </span>
          </div>

          <div className="space-y-3">
            {tasks
              .filter(task => task.status === column.id)
              .sort((a, b) => b.priority - a.priority)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => onDragStart(task)}
                  onClick={() => onTaskClick(task)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  onUpdatePriority={onUpdatePriority}
                  getTaskTypeInfo={getTaskTypeInfo}
                  getEventTypeInfo={getEventTypeInfo}
                  getPaymentStatusColor={getPaymentStatusColor}
                  isOverdue={isOverdue}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente ListView
const ListView: React.FC<{
  tasks: PhotographyTask[];
  onTaskClick: (task: PhotographyTask) => void;
  onEditTask: (task: PhotographyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  getTaskTypeInfo: (type: string) => any;
  getEventTypeInfo: (type: string) => any;
  getPaymentStatusColor: (status: string) => string;
  isOverdue: (task: PhotographyTask) => boolean;
}> = ({ 
  tasks, 
  onTaskClick, 
  onEditTask, 
  onDeleteTask, 
  onUpdatePriority,
  getTaskTypeInfo,
  getEventTypeInfo,
  getPaymentStatusColor,
  isOverdue
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cliente / Tarefa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Prioridade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Entrega
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks
              .sort((a, b) => b.priority - a.priority)
              .map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  onUpdatePriority={onUpdatePriority}
                  getTaskTypeInfo={getTaskTypeInfo}
                  getEventTypeInfo={getEventTypeInfo}
                  getPaymentStatusColor={getPaymentStatusColor}
                  isOverdue={isOverdue}
                />
              ))}
          </tbody>
        </table>
        
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhuma tarefa encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando sua primeira tarefa fotográfica.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente TaskCard (para Kanban)
const TaskCard: React.FC<{
  task: PhotographyTask;
  onDragStart: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  getTaskTypeInfo: (type: string) => any;
  getEventTypeInfo: (type: string) => any;
  getPaymentStatusColor: (status: string) => string;
  isOverdue: (task: PhotographyTask) => boolean;
}> = ({ 
  task, 
  onDragStart, 
  onClick, 
  onEdit, 
  onDelete, 
  onUpdatePriority,
  getTaskTypeInfo,
  getEventTypeInfo,
  getPaymentStatusColor,
  isOverdue
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const taskTypeInfo = getTaskTypeInfo(task.task_type);
  const eventTypeInfo = getEventTypeInfo(task.event_type);
  const overdue = isOverdue(task);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      draggable
      onDragStart={onDragStart}
      className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 cursor-move hover:shadow-md transition-all border-l-4 ${
        overdue ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
            {task.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {task.client_name} • {eventTypeInfo.icon} {eventTypeInfo.label}
          </p>
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
              >
                <Eye className="h-3 w-3" />
                Ver
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit className="h-3 w-3" />
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
              >
                <Trash2 className="h-3 w-3" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${taskTypeInfo.color} text-white`}>
          {taskTypeInfo.icon}
          <span>{taskTypeInfo.label}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePriority(task.id, star);
              }}
              className={`h-3 w-3 ${
                star <= task.priority ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            >
              <Star className="h-3 w-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {task.photos_count > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              📸 {task.photos_count}
            </span>
          )}
          
          {task.delivery_date && (
            <span className={`${overdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
              📅 {new Date(task.delivery_date).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <div className={`px-2 py-1 rounded-full text-xs border ${getPaymentStatusColor(task.payment_status)}`}>
          R$ {task.payment_received}/{task.payment_amount}
        </div>
      </div>
    </motion.div>
  );
};

// Componente TaskRow (para ListView)
const TaskRow: React.FC<{
  task: PhotographyTask;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  getTaskTypeInfo: (type: string) => any;
  getEventTypeInfo: (type: string) => any;
  getPaymentStatusColor: (status: string) => string;
  isOverdue: (task: PhotographyTask) => boolean;
}> = ({ 
  task, 
  onClick, 
  onEdit, 
  onDelete, 
  onUpdatePriority,
  getTaskTypeInfo,
  getEventTypeInfo,
  getPaymentStatusColor,
  isOverdue
}) => {
  const taskTypeInfo = getTaskTypeInfo(task.task_type);
  const eventTypeInfo = getEventTypeInfo(task.event_type);
  const overdue = isOverdue(task);

  return (
    <tr 
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
        overdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''
      }`}
      onClick={onClick}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {task.client_name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {task.title}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {eventTypeInfo.icon} {eventTypeInfo.label}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${taskTypeInfo.color} text-white`}>
          {taskTypeInfo.icon}
          <span>{taskTypeInfo.label}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {task.status.replace('_', ' ')}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePriority(task.id, star);
              }}
              className={`h-4 w-4 ${
                star <= task.priority ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            >
              <Star className="h-4 w-4 fill-current" />
            </button>
          ))}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {task.delivery_date ? (
          <span className={overdue ? 'text-red-600' : ''}>
            {new Date(task.delivery_date).toLocaleDateString('pt-BR')}
          </span>
        ) : (
          '-'
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(task.payment_status)}`}>
          R$ {task.payment_received}/{task.payment_amount}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Componente TaskModal
const TaskModal: React.FC<{
  task?: PhotographyTask;
  onClose: () => void;
  onSave: (data: Partial<PhotographyTask>) => void;
  eventTypes: any[];
  taskTypes: any[];
  title: string;
}> = ({ task, onClose, onSave, eventTypes, taskTypes, title }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    client_name: task?.client_name || '',
    client_email: task?.client_email || '',
    client_phone: task?.client_phone || '',
    event_type: task?.event_type || 'other',
    event_date: task?.event_date ? task.event_date.split('T')[0] : '',
    task_type: task?.task_type || 'photo_editing',
    priority: task?.priority || 3,
    photos_count: task?.photos_count || 0,
    delivery_date: task?.delivery_date ? task.delivery_date.split('T')[0] : '',
    payment_amount: task?.payment_amount || 0,
    notes: task?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client_name.trim()) return;

    const data: Partial<PhotographyTask> = {
      ...formData,
      event_date: formData.event_date ? new Date(formData.event_date).toISOString() : undefined,
      delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : undefined
    };

    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título da Tarefa *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Ex: Edição de fotos do casamento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Nome completo do cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email do Cliente
              </label>
              <input
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="cliente@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone do Cliente
              </label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Evento
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data do Evento
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Tarefa
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              >
                {taskTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade (1-5 estrelas)
              </label>
              <div className="flex items-center gap-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: star }))}
                    className={`h-6 w-6 ${
                      star <= formData.priority ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de Fotos
              </label>
              <input
                type="number"
                min="0"
                value={formData.photos_count}
                onChange={(e) => setFormData(prev => ({ ...prev, photos_count: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Entrega
              </label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor Total (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.payment_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Detalhes adicionais sobre a tarefa..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações Internas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Notas internas (não visíveis ao cliente)..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              {task ? 'Atualizar' : 'Criar'} Tarefa
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Componente TaskDetailsModal
const TaskDetailsModal: React.FC<{
  task: PhotographyTask;
  onClose: () => void;
  onUpdate: () => void;
  onAddPayment: (taskId: string, amount: number, method: string, notes?: string) => void;
  onMarkLinkSent: (taskId: string, galleryLink: string) => void;
  supabase: any;
  getTaskTypeInfo: (type: string) => any;
  getEventTypeInfo: (type: string) => any;
  getPaymentStatusColor: (status: string) => string;
  isOverdue: (task: PhotographyTask) => boolean;
}> = ({ 
  task, 
  onClose, 
  onUpdate, 
  onAddPayment, 
  onMarkLinkSent, 
  supabase,
  getTaskTypeInfo,
  getEventTypeInfo,
  getPaymentStatusColor,
  isOverdue
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'cash',
    notes: ''
  });
  const [galleryLink, setGalleryLink] = useState(task.gallery_link || '');

  const taskTypeInfo = getTaskTypeInfo(task.task_type);
  const eventTypeInfo = getEventTypeInfo(task.event_type);
  const overdue = isOverdue(task);

  const handleAddPayment = () => {
    if (paymentForm.amount <= 0) return;
    
    onAddPayment(task.id, paymentForm.amount, paymentForm.method, paymentForm.notes);
    setPaymentForm({ amount: 0, method: 'cash', notes: '' });
    setShowAddPayment(false);
  };

  const handleSendLink = () => {
    if (!galleryLink.trim()) return;
    
    onMarkLinkSent(task.id, galleryLink);
    setShowLinkForm(false);
  };

  const tabs = [
    { id: 'details', label: 'Detalhes', icon: <FileText className="h-4 w-4" /> },
    { id: 'payments', label: 'Pagamentos', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'files', label: 'Arquivos', icon: <Upload className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="h-4 w-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {task.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {task.client_name} • {eventTypeInfo.icon} {eventTypeInfo.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${
          overdue ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-gray-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${taskTypeInfo.color} text-white`}>
                {taskTypeInfo.icon}
                <span>{taskTypeInfo.label}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= task.priority ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {overdue && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Atrasado</span>
                </div>
              )}
            </div>

            <div className={`px-3 py-1 rounded-full text-sm border ${getPaymentStatusColor(task.payment_status)}`}>
              R$ {task.payment_received}/{task.payment_amount}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Informações do Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                      <span className="text-gray-900 dark:text-white">{task.client_name}</span>
                    </div>
                    {task.client_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="text-gray-900 dark:text-white">{task.client_email}</span>
                      </div>
                    )}
                    {task.client_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Telefone:</span>
                        <span className="text-gray-900 dark:text-white">{task.client_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Detalhes da Tarefa</h3>
                  <div className="space-y-2 text-sm">
                    {task.event_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Evento:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(task.event_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {task.delivery_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Entrega:</span>
                        <span className={`${overdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {new Date(task.delivery_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {task.photos_count > 0 && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Fotos:</span>
                        <span className="text-gray-900 dark:text-white">{task.photos_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {task.description && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Descrição</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{task.description}</p>
                </div>
              )}

              {task.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Observações Internas</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{task.notes}</p>
                </div>
              )}

              {/* Link da Galeria */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Link da Galeria</h3>
                  {!task.gallery_link && (
                    <button
                      onClick={() => setShowLinkForm(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Adicionar Link
                    </button>
                  )}
                </div>
                
                {task.gallery_link ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <a
                        href={task.gallery_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm break-all"
                      >
                        {task.gallery_link}
                      </a>
                      <button
                        onClick={() => setShowLinkForm(true)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                    {task.link_sent_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Enviado em: {new Date(task.link_sent_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {task.client_viewed_at && (
                      <p className="text-xs text-green-600 mt-1">
                        Visualizado em: {new Date(task.client_viewed_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                ) : showLinkForm ? (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={galleryLink}
                      onChange={(e) => setGalleryLink(e.target.value)}
                      placeholder="https://galeria.exemplo.com/cliente"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendLink}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Salvar Link
                      </button>
                      <button
                        onClick={() => setShowLinkForm(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum link adicionado</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">Histórico de Pagamentos</h3>
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Pagamento
                </button>
              </div>

              {/* Resumo de Pagamentos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Valor Total</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    R$ {task.payment_amount.toFixed(2)}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-green-600 dark:text-green-400">Recebido</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    R$ {task.payment_received.toFixed(2)}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="text-sm text-orange-600 dark:text-orange-400">Pendente</div>
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    R$ {(task.payment_amount - task.payment_received).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Lista de Pagamentos */}
              <div className="space-y-3">
                {task.payments && task.payments.length > 0 ? (
                  task.payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            R$ {payment.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.payment_method} • {new Date(payment.payment_date).toLocaleDateString('pt-BR')}
                          </div>
                          {payment.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhum pagamento registrado
                  </p>
                )}
              </div>

              {/* Form de Adicionar Pagamento */}
              {showAddPayment && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Adicionar Pagamento</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Método
                      </label>
                      <select
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="cash">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="card">Cartão</option>
                        <option value="transfer">Transferência</option>
                        <option value="check">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Observações sobre o pagamento..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPayment}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => setShowAddPayment(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">Arquivos da Tarefa</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Upload className="h-4 w-4" />
                  Upload Arquivo
                </button>
              </div>

              {task.files && task.files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.files.map((file) => (
                    <div key={file.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {file.file_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {file.file_type} • {new Date(file.uploaded_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-1 text-blue-600 hover:text-blue-700">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhum arquivo enviado
                </p>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900 dark:text-white">Timeline da Tarefa</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Tarefa criada</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(task.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {task.link_sent_at && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Link enviado ao cliente</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(task.link_sent_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}

                {task.client_viewed_at && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Cliente visualizou galeria</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(task.client_viewed_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}

                {task.actual_delivery_date && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Tarefa entregue</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(task.actual_delivery_date).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PhotographyTaskManager;