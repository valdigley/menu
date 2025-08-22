import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Camera, Edit, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleTaskListProps {
  user: any;
  supabase: any;
  onBack: () => void;
}

interface Task {
  id: string;
  title: string;
  date: string;
  service_type: string;
  completed: boolean;
  created_at: string;
}

const SimpleTaskList: React.FC<SimpleTaskListProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    date: '',
    service_type: 'Ensaio Fotográfico'
  });

  const serviceTypes = [
    'Ensaio Fotográfico',
    'Casamento',
    'Aniversário',
    'Formatura',
    'Corporativo',
    'Produto',
    'Evento',
    'Edição de Fotos',
    'Entrega de Álbum',
    'Reunião com Cliente'
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!supabase || !newTask.title.trim() || !newTask.date) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: newTask.title.trim(),
          description: `Tarefa: ${newTask.service_type}`,
          status: 'pending',
          priority: 'medium',
          due_date: new Date(newTask.date).toISOString(),
          category_id: null
        }])
        .select()
        .single();

      if (error) throw error;

      // Adicionar à lista local
      const taskForList: Task = {
        id: data.id,
        title: newTask.title.trim(),
        date: newTask.date,
        service_type: newTask.service_type,
        completed: false,
        created_at: data.created_at
      };

      setTasks(prev => [...prev, taskForList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      
      // Limpar formulário
      setNewTask({
        title: '',
        date: '',
        service_type: 'Ensaio Fotográfico'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      alert('Erro ao adicionar tarefa');
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: completed ? 'completed' : 'pending',
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    if (serviceType.includes('Foto') || serviceType.includes('Ensaio') || serviceType.includes('Casamento')) {
      return <Camera className="h-4 w-4" />;
    }
    return <Calendar className="h-4 w-4" />;
  };

  const getServiceColor = (serviceType: string) => {
    const colors = {
      'Ensaio Fotográfico': 'bg-blue-100 text-blue-800',
      'Casamento': 'bg-pink-100 text-pink-800',
      'Aniversário': 'bg-yellow-100 text-yellow-800',
      'Formatura': 'bg-purple-100 text-purple-800',
      'Corporativo': 'bg-gray-100 text-gray-800',
      'Produto': 'bg-green-100 text-green-800',
      'Evento': 'bg-orange-100 text-orange-800',
      'Edição de Fotos': 'bg-indigo-100 text-indigo-800',
      'Entrega de Álbum': 'bg-red-100 text-red-800',
      'Reunião com Cliente': 'bg-teal-100 text-teal-800'
    };
    return colors[serviceType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (dateString: string, completed: boolean) => {
    if (completed) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Lista de Tarefas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie suas tarefas fotográficas
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Task Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Nova Tarefa
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título da Tarefa
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Ensaio da Maria Silva"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      value={newTask.date}
                      onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Serviço
                    </label>
                    <select
                      value={newTask.service_type}
                      onChange={(e) => setNewTask(prev => ({ ...prev, service_type: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    >
                      {serviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addTask}
                    disabled={!newTask.title.trim() || !newTask.date}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma tarefa encontrada
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comece adicionando sua primeira tarefa.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    task.completed ? 'opacity-60' : ''
                  } ${isOverdue(task.date, task.completed) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleTask(task.id, !task.completed)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-medium ${
                            task.completed 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(task.service_type)}`}>
                            {getServiceIcon(task.service_type)}
                            {task.service_type}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className={isOverdue(task.date, task.completed) ? 'text-red-600 font-medium' : ''}>
                              {formatDate(task.date)}
                              {isOverdue(task.date, task.completed) && ' (Atrasada)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleTaskList;