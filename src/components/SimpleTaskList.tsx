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
  due_date: string;
  service_type: string;
  completed: boolean;
  created_at: string;
}

const SimpleTaskList: React.FC<SimpleTaskListProps> = ({ user, supabase, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Data de hoje como padrão
    service_type: ''
  });

  const [eventTypes, setEventTypes] = useState<any[]>([]);

  // Carregar tipos de eventos das configurações
  useEffect(() => {
    console.log('🔄 Carregando tipos de eventos...');
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('📋 Configurações carregadas:', parsedSettings);
        if (parsedSettings.eventTypes?.types) {
          console.log('✅ Tipos de eventos encontrados:', parsedSettings.eventTypes.types);
          setEventTypes(parsedSettings.eventTypes.types);
        } else {
          console.log('⚠️ Usando tipos padrão - configurações não encontradas');
          // Fallback para tipos padrão
          setEventTypes([
            { id: 'ensaio', name: 'Ensaio Fotográfico', days: 7, color: '#3b82f6' },
            { id: 'casamento', name: 'Casamento', days: 30, color: '#ec4899' },
            { id: 'aniversario', name: 'Aniversário', days: 14, color: '#f59e0b' },
            { id: 'formatura', name: 'Formatura', days: 21, color: '#8b5cf6' },
            { id: 'corporativo', name: 'Corporativo', days: 10, color: '#6b7280' },
            { id: 'produto', name: 'Produto', days: 5, color: '#10b981' },
            { id: 'evento', name: 'Evento', days: 14, color: '#f97316' },
            { id: 'edicao', name: 'Edição de Fotos', days: 3, color: '#6366f1' },
            { id: 'album', name: 'Entrega de Álbum', days: 45, color: '#ef4444' },
            { id: 'reuniao', name: 'Reunião com Cliente', days: 1, color: '#14b8a6' }
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de eventos:', error);
        console.log('⚠️ Usando tipos padrão - erro no parse');
        // Fallback para tipos padrão em caso de erro
        setEventTypes([
          { id: 'ensaio', name: 'Ensaio Fotográfico', days: 7, color: '#3b82f6' },
          { id: 'casamento', name: 'Casamento', days: 30, color: '#ec4899' },
          { id: 'aniversario', name: 'Aniversário', days: 14, color: '#f59e0b' },
          { id: 'formatura', name: 'Formatura', days: 21, color: '#8b5cf6' },
          { id: 'corporativo', name: 'Corporativo', days: 10, color: '#6b7280' },
          { id: 'produto', name: 'Produto', days: 5, color: '#10b981' },
          { id: 'evento', name: 'Evento', days: 14, color: '#f97316' },
          { id: 'edicao', name: 'Edição de Fotos', days: 3, color: '#6366f1' },
          { id: 'album', name: 'Entrega de Álbum', days: 45, color: '#ef4444' },
          { id: 'reuniao', name: 'Reunião com Cliente', days: 1, color: '#14b8a6' }
        ]);
      }
    } else {
      console.log('⚠️ Usando tipos padrão - sem configurações salvas');
      // Fallback para tipos padrão se não há configurações
      setEventTypes([
        { id: 'ensaio', name: 'Ensaio Fotográfico', days: 7, color: '#3b82f6' },
        { id: 'casamento', name: 'Casamento', days: 30, color: '#ec4899' },
        { id: 'aniversario', name: 'Aniversário', days: 14, color: '#f59e0b' },
        { id: 'formatura', name: 'Formatura', days: 21, color: '#8b5cf6' },
        { id: 'corporativo', name: 'Corporativo', days: 10, color: '#6b7280' },
        { id: 'produto', name: 'Produto', days: 5, color: '#10b981' },
        { id: 'evento', name: 'Evento', days: 14, color: '#f97316' },
        { id: 'edicao', name: 'Edição de Fotos', days: 3, color: '#6366f1' },
        { id: 'album', name: 'Entrega de Álbum', days: 45, color: '#ef4444' },
        { id: 'reuniao', name: 'Reunião com Cliente', days: 1, color: '#14b8a6' }
      ]);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 Carregando tarefas e definindo tipo padrão...');
    loadTasks();
    
    // Definir primeiro tipo como padrão quando eventTypes carrega
    if (eventTypes.length > 0 && !newTask.service_type) {
      console.log('✅ Definindo tipo padrão:', eventTypes[0].name);
      setNewTask(prev => ({ ...prev, service_type: eventTypes[0].name }));
    }
  }, [eventTypes]);

  const loadTasks = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!supabase || !newTask.title.trim()) return;

    // Calcular data baseada no tipo de evento
    let taskDate = newTask.date;
    
    if (!taskDate) {
      // Se não tem data, calcular baseado no tipo de evento
      const selectedEventType = eventTypes.find(type => type.name === newTask.service_type);
      const daysToAdd = selectedEventType?.days || 7;
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysToAdd);
      taskDate = futureDate.toISOString().split('T')[0];
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: newTask.title.trim(),
          description: `Tarefa: ${newTask.service_type}`,
          status: 'pending',
          priority: 'medium',
          due_date: new Date(taskDate).toISOString(),
          category_id: null
        }])
        .select()
        .single();

      if (error) throw error;

      const taskForList: Task = {
        id: data.id,
        title: newTask.title.trim(),
        due_date: taskDate,
        service_type: newTask.service_type,
        completed: false,
        created_at: data.created_at
      };

      setTasks(prev => [taskForList, ...prev]);
      
      setNewTask({
        title: '',
        date: new Date().toISOString().split('T')[0], // Sempre usar data de hoje
        service_type: newTask.service_type // Manter o tipo selecionado
      });
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
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
    const eventType = eventTypes.find(type => type.name === serviceType);
    return eventType?.color || '#6b7280';
  };

  const getEventTypeDays = (serviceType: string) => {
    const eventType = eventTypes.find(type => type.name === serviceType);
    return eventType?.days || 7;
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Campo de entrada sempre visível */}
        <div className="mb-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma nova tarefa e pressione Enter..."
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none"
              autoFocus
            />
            
            <input
              type="date"
              value={newTask.date}
              onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
            />
            
            <select
              value={newTask.service_type}
              onChange={(e) => setNewTask(prev => ({ ...prev, service_type: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
            >
              {eventTypes.length === 0 && (
                <option value="">Carregando...</option>
              )}
              {eventTypes.map(type => (
                <option key={type.id} value={type.name}>
                  {type.name} ({type.days} {type.days === 1 ? 'dia' : 'dias'})
                </option>
              ))}
            </select>
            
            {!newTask.date && newTask.service_type && (
              <div className="text-xs text-gray-400 ml-2">
                Previsão: +{getEventTypeDays(newTask.service_type)} dias
              </div>
            )}
          </div>
        </div>

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
                } ${isOverdue(task.due_date, task.completed) ? 'bg-red-900/20' : ''}`}
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
                        isOverdue(task.due_date, task.completed) 
                          ? 'text-red-400 font-medium' 
                          : 'text-gray-400'
                      }`}>
                        {formatDate(task.due_date)}
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