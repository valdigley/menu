import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  ArrowLeft, Plus, Search, Filter, Calendar, Clock, DollarSign, 
  User, Mail, Phone, Camera, Edit, Trash2, Eye, CheckCircle, 
  AlertCircle, XCircle, Star, Upload, Download, Link, Send,
  MoreHorizontal, Tag, FileText, Image as ImageIcon
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

const PhotographyTaskManager: React.FC<PhotographyTaskManagerProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const columns = {
    pending: { id: 'pending', title: 'Pendente', color: 'bg-yellow-500' },
    in_progress: { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-500' },
    review: { id: 'review', title: 'Revisão', color: 'bg-purple-500' },
    completed: { id: 'completed', title: 'Concluído', color: 'bg-green-500' },
    delivered: { id: 'delivered', title: 'Entregue', color: 'bg-gray-500' }
  };

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !supabase) return;

    const { source, destination, draggableId } = result;
    
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

      if (error) throw error;

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

  const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md transition-all ${
            snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-blue-500' : ''
          }`}
          onClick={() => {
            setSelectedTask(task);
            setShowTaskDetails(true);
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              <Star className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
              <span className="text-xs text-gray-500">{task.priority}</span>
            </div>
          </div>

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
      )}
    </Draggable>
  );

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
            {Object.values(columns).map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              
              return (
                <div key={column.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`${column.color} px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{column.title}</h3>
                      <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
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
                          <TaskCard key={task.id} task={task} index={index} />
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

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma tarefa encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando sua primeira tarefa fotográfica.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </button>
            </div>
          </div>
        )}
      </div>

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
                    // TODO: Implementar edição
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