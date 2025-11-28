import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { TaskModal } from '../components/TaskModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { Plus, Search, Edit, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, [retryCount]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        setLoading(false);
        return;
      }

      console.log('Fetching tasks from API...');
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const tasksData = await response.json();
        console.log(`Successfully fetched ${tasksData.length} tasks`);
        setTasks(tasksData);
        toast.success(`Loaded ${tasksData.length} tasks`);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch tasks:', response.status, errorText);
        toast.error('Failed to load tasks. Please check server connection.');
        setTasks([]);
      }
    } catch (error) {
      console.error('Network error fetching tasks:', error);
      toast.error('Cannot connect to server. Please make sure the backend is running.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = () => {
    fetchTasks(); // Refresh the task list
  };

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      setDeleteLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login again');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          toast.success(data.message);
          fetchTasks(); // Refresh the task list
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to delete task' }));
          toast.error(errorData.message);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Network error. Please check server connection.');
      } finally {
        setDeleteLoading(false);
        setTaskToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and track progress</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button onClick={handleAddTask} className="gap-2">
            <Plus size={18} />
            Add New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardContent className="p-12 text-center">
              
                <p className="text-muted-foreground">No tasks match your filters.</p>
              
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task._id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <p className="text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </Badge>
                      {task.dueDate && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(task.dueDate)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDate(task.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditTask(task)}
                      className="hover:bg-primary hover:text-white"
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(task._id)}
                      className="hover:bg-destructive hover:text-white"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
}