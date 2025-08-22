import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  ArrowLeft, Plus, Search, Filter, Calendar, Clock, DollarSign, 
  User, Mail, Phone, Camera, Edit, Trash2, Eye, CheckCircle, 
  AlertCircle, XCircle, Star, Upload, Download, Link, Send,
  MoreHorizontal, Tag, FileText, Image as ImageIcon, Save, X
} from 'lucide-react';
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
  event_type: string;
  event_date?: string;
  task_type: string;
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
}

interface NewTaskForm {
  title: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_type: string;
  event_date: string;
  task_type: string;
  description: string;
  priority: number;
  photos_count: number;
  delivery_date: string;
  payment_amount: number;
  notes: string;
}

const PhotographyTaskManager: React.FC<PhotographyTaskManagerProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    event_type: 'wedding',
    event_date: '',
    task_type: 'photo_editing',
    description: '',
    priority: 3,
    photos_count: 0,
    delivery_date: '',
    payment_amount: 0,
    notes: ''
  });

  const columns = {
    pending: { id: 'pending', title: 'Pendente', color: 'bg-yellow-500' },
    in_progress: { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500' },
    review: { id: 'review', title: 'Revisão', color: 'bg-purple-500' },
    completed: { id: 'completed', title: 'Concluído', color: 'bg-green-500' },
    delivered: { id: 'delivered', title: 'Entregue', color: 'bg-gray-500' }
  };

  const eventTypes = [
    { value: 'wedding', label: 'Casamento' },
    { value: 'birthday', label: 'Aniversário' },
    { value: 'corporate', label: 'Corporativo' },
    { value: 'portrait', label: 'Retrato' },
    { value: 'family', label: 'Família' },
    { value: 'other', label: 'Outros' }
  ];

  const taskTypes = [
    { value: 'photo_editing', label: 'Edição de Fotos' },
    { value: 'album_creation', label: 'Criação de Álbum' },
    { value: 'production_delivery', label: 'Entrega de Produção' },
    { value: 'link_sharing', label: 'Compartilhamento de Link' },
    { value: 'other', label: 'Outros' }
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photography_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar tarefas:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!supabase || !newTask.title.trim() || !newTask.client_name.trim()) {
      alert('Por favor, preencha pelo menos o título e nome do cliente');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        user_id: user.id,
        title: newTask.title.trim(),
        client_name: newTask.client_name.trim(),
        client_email: newTask.client_email.trim() || null,
        client_phone: newTask.client_phone.trim() || null,
        event_type: newTask.event_type,
        event_date: newTask.event_date || null,
        task_type: newTask.task_type,
        description: newTask.description.trim() || null,
        status: 'pending' as const,
        priority: newTask.priority,
        photos_count: newTask.photos_count || null,
        delivery_date: newTask.delivery_date || null,
        payment_status: 'pending' as const,
        payment_amount: newTask.payment_amount || null,
        payment_received: 0,
        notes: newTask.notes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('photography_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        alert('Erro ao criar tarefa: ' + error.message);
        return;
      }

      // Adicionar nova tarefa ao estado
      setTasks(prev => [data, ...prev]);
      
      // Resetar formulário
      setNewTask({
        title: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        event_type: 'wedding',
        event_date: '',
        task_type: 'photo_editing',
        description: '',
        priority: 3,
        photos_count: 0,
        delivery_date: '',
        payment_amount: 0,
        notes: ''
      });
      
      setShowAddTask(false);
      alert('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Erro ao criar tarefa');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !supabase) return;

    const { source, destination, draggableId } = result;
    
    // Se não mudou de coluna, não faz nada
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as Task['status'];
    
    try {
      const { error } = await supabase
        .from('photography_tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        return;
      }

      // Atualizar estado local
      setTasks(prev => prev.map(task => 
        task.id === draggableId 
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-blue-500';
      case 5: return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgente';
      case 2: return 'Alta';
      case 3: return 'Média';
      case 4: return 'Baixa';
      case 5: return 'Muito Baixa';
      default: return 'Não definida';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      partial: { color: 'bg-orange-100 text-orange-800', label: 'Parcial' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Pago' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestão de Tarefas Fotográficas
                </h1>
                <p className="text-sm text-gray-500">
                  Organize suas sessões e entregas
                </p>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Progresso</option>
                <option value="review">Revisão</option>
                <option value="completed">Concluído</option>
                <option value="delivered">Entregue</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Todos os Tipos</option>
                <option value="photo_editing">Edição de Fotos</option>
                <option value="album_creation">Criação de Álbum</option>
                <option value="production_delivery">Entrega de Produção</option>
                <option value="link_sharing">Compartilhamento de Link</option>
                <option value="other">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(columns).map(([columnId, column]) => {
              const columnTasks = getTasksByStatus(columnId);
              
              return (
                <div key={columnId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`${column.color} px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{column.title}</h3>
                      <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-4 min-h-[200px] transition-all ${
                          snapshot.isDraggingOver
                            ? 'bg-blue-50 border-2 border-dashed border-blue-300'
                            : ''
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-3 transition-all ${
                                  snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-blue-500' : 'hover:shadow-md'
                                }`}
                              >
                                {/* Drag Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between p-3 pb-2 cursor-grab active:cursor-grabbing border-b border-gray-100"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-1">
                                      <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
                                      <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
                                      <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
                                    </div>
                                    <span className="text-xs text-gray-500">Arrastar</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                                    <span className="text-xs text-gray-500">{task.priority}</span>
                                  </div>
                                </div>

                                {/* Clickable Content Area */}
                                <div
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskDetails(true);
                                  }}
                                  className="p-3 pt-2 cursor-pointer"
                                >
                                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                                    {task.title}
                                  </h3>

                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-600 truncate">{task.client_name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Tag className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-600">{task.event_type}</span>
                                    </div>

                                    {task.event_date && (
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">{formatDate(task.event_date)}</span>
                                      </div>
                                    )}

                                    {task.photos_count && (
                                      <div className="flex items-center gap-2">
                                        <Camera className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">{task.photos_count} fotos</span>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                      {getPaymentStatusBadge(task.payment_status)}
                                      
                                      {task.delivery_date && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">
                                            {formatDate(task.delivery_date)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Nova Tarefa
                </h2>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título da Tarefa *
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Edição de fotos do casamento João e Maria"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      value={newTask.client_name}
                      onChange={(e) => setNewTask(prev => ({ ...prev, client_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email do Cliente
                    </label>
                    <input
                      type="email"
                      value={newTask.client_email}
                      onChange={(e) => setNewTask(prev => ({ ...prev, client_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone do Cliente
                    </label>
                    <input
                      type="tel"
                      value={newTask.client_phone}
                      onChange={(e) => setNewTask(prev => ({ ...prev, client_phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Evento
                    </label>
                    <select
                      value={newTask.event_type}
                      onChange={(e) => setNewTask(prev => ({ ...prev, event_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data do Evento
                    </label>
                    <input
                      type="date"
                      value={newTask.event_date}
                      onChange={(e) => setNewTask(prev => ({ ...prev, event_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Tarefa
                    </label>
                    <select
                      value={newTask.task_type}
                      onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {taskTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridade
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1 - Urgente</option>
                      <option value={2}>2 - Alta</option>
                      <option value={3}>3 - Média</option>
                      <option value={4}>4 - Baixa</option>
                      <option value={5}>5 - Muito Baixa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade de Fotos
                    </label>
                    <input
                      type="number"
                      value={newTask.photos_count}
                      onChange={(e) => setNewTask(prev => ({ ...prev, photos_count: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Entrega
                    </label>
                    <input
                      type="date"
                      value={newTask.delivery_date}
                      onChange={(e) => setNewTask(prev => ({ ...prev, delivery_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Pagamento (R$)
                    </label>
                    <input
                      type="number"
                      value={newTask.payment_amount}
                      onChange={(e) => setNewTask(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detalhes adicionais sobre a tarefa..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={newTask.notes}
                      onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Observações internas..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={saving || !newTask.title.trim() || !newTask.client_name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalhes da Tarefa
                </h2>
                <button
                  onClick={() => {
                    setShowTaskDetails(false);
                    setSelectedTask(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{selectedTask.title}</h3>
                  {selectedTask.description && (
                    <p className="text-gray-600 text-sm">{selectedTask.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Cliente</label>
                    <p className="font-medium text-gray-900">{selectedTask.client_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">Tipo de Evento</label>
                    <p className="font-medium text-gray-900">{selectedTask.event_type}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <p className="font-medium text-gray-900">{columns[selectedTask.status]?.title}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Prioridade</label>
                    <p className={`font-medium ${getPriorityColor(selectedTask.priority)}`}>
                      {getPriorityLabel(selectedTask.priority)}
                    </p>
                  </div>

                  {selectedTask.event_date && (
                    <div>
                      <label className="text-sm text-gray-500">Data do Evento</label>
                      <p className="font-medium text-gray-900">{formatDate(selectedTask.event_date)}</p>
                    </div>
                  )}

                  {selectedTask.delivery_date && (
                    <div>
                      <label className="text-sm text-gray-500">Data de Entrega</label>
                      <p className="font-medium text-gray-900">{formatDate(selectedTask.delivery_date)}</p>
                    </div>
                  )}

                  {selectedTask.photos_count && (
                    <div>
                      <label className="text-sm text-gray-500">Quantidade de Fotos</label>
                      <p className="font-medium text-gray-900">{selectedTask.photos_count}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-500">Status do Pagamento</label>
                    <div className="mt-1">
                      {getPaymentStatusBadge(selectedTask.payment_status)}
                    </div>
                  </div>
                </div>

                {selectedTask.gallery_link && (
                  <div>
                    <label className="text-sm text-gray-500">Link da Galeria</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={selectedTask.gallery_link}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => window.open(selectedTask.gallery_link, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Link className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {selectedTask.notes && (
                  <div>
                    <label className="text-sm text-gray-500">Observações</label>
                    <p className="text-gray-900 text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedTask.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTaskDetails(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    console.log('Editar tarefa:', selectedTask.id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Editar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographyTaskManager;