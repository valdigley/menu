import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, X } from 'lucide-react';
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

      const taskForList: Task = {
        id: data.id,
        title: newTask.title.trim(),
        date: newTask.date,
        service_type: newTask.service_type,
        completed: false,
        created_at: data.created_at
      };

      setTasks(prev => [...prev, taskForList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      
      setNewTask({
        title: '',
        date: '',
        service_type: 'Ensaio Fotográfico'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
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
    if (!supabase) return;

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const isOverdue = (dateString: string, completed: boolean) => {
    if (completed) return false;
    return new Date(dateString) < new Date();
  };

  const getServiceColor = (serviceType: string) => {
    const colors = {
      'Ensaio Fotográfico': '#3b82f6',
      'Casamento': '#ec4899',
      'Aniversário': '#f59e0b',
      'Formatura': '#8b5cf6',
      'Corporativo': '#6b7280',
      'Produto': '#10b981',
      'Evento': '#f97316',
      'Edição de Fotos': '#6366f1',
      'Entrega de Álbum': '#ef4444',
      'Reunião com Cliente': '#14b8a6'
    };
    return colors[serviceType as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header minimalista */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-medium text-white">
                Tarefas
              </h1>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Formulário de adicionar tarefa */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome da tarefa..."
                  className="w-full bg-transparent border-none text-lg placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
                
                <div className="flex gap-4">
                  <input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  
                  <select
                    value={newTask.service_type}
                    onChange={(e) => setNewTask(prev => ({ ...prev, service_type: e.target.value }))}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addTask}
                    disabled={!newTask.title.trim() || !newTask.date}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de tarefas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <Check className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-lg mb-2">Nenhuma tarefa ainda</p>
              <p className="text-sm">Adicione sua primeira tarefa para começar</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group flex items-center gap-4 p-4 rounded-lg hover:bg-gray-800 transition-colors ${
                  task.completed ? 'opacity-60' : ''
                } ${isOverdue(task.date, task.completed) ? 'bg-red-900/20' : ''}`}
              >
                <button
                  onClick={() => toggleTask(task.id, !task.completed)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-600 hover:border-green-500'
                  }`}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${
                      task.completed ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </span>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="px-2 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: getServiceColor(task.service_type) }}
                      >
                        {task.service_type}
                      </span>
                      
                      <span className={`text-xs ${
                        isOverdue(task.date, task.completed) 
                          ? 'text-red-400 font-medium' 
                          : 'text-gray-400'
                      }`}>
                        {formatDate(task.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all rounded-lg hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTaskList;