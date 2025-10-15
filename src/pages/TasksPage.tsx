import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  CheckSquare,
  Clock,
  User,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X,
  Eye,
  Building,
  Mail,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  CalendarDays,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  type: 'manual' | 'campaign';
  status: 'pending' | 'in-progress' | 'completed';
  userId: string;
  createdBy: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  completedAt?: string;
  campaign?: string;
  campaignId?: string | {
    _id: string;
    name: string;
  };
  projectId?: string;
  executionId?: string;
  prospectId?: string;
  campaignDetails?: {
    id: string;
    name: string;
  };
}

const TasksPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Unified sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'task' | 'prospect'>('task');
  const [selectedProspectDetail, setSelectedProspectDetail] = useState<any>(null);
  const [isLoadingProspectDetail, setIsLoadingProspectDetail] = useState(false);

  // Edit task states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    status: 'pending' as Task['status']
  });



  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    campaign: '',
    dueDate: '',
    overdue: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    type: 'manual' as Task['type']
  });

  const sacoreFont = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);

      // Build filter params for API
      const filterParams = {
        ...filters,
        // Handle overdue filter
        overdue: filters.overdue ? 'true' : undefined,
        // Only send non-empty values
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        campaign: filters.campaign || undefined,
        dueDate: filters.dueDate || undefined,
      };

      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(filterParams).filter(([_, value]) => value !== undefined && value !== '')
      );

      const response = await authService.getTasks(cleanFilters);
      console.log('getTasks response:', response);

      if (response && response.tasks && Array.isArray(response.tasks)) {
        // Use all tasks from API response since filtering is now handled by status filter
        setTasks(response.tasks);

        // Update pagination data
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        console.log('Unexpected response structure:', response);
        // Fallback: try to set empty array
        setTasks([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      setLoading(true);
      const newTaskResponse = await authService.createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        type: newTask.type
      });

      console.log('Task created successfully:', newTaskResponse);
      console.log('Adding task to list:', newTaskResponse);

      // Add the new task to the list
      setTasks([...tasks, newTaskResponse]);

      // Reset form and close modal
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', type: 'manual' });
      setIsCreateMode(false);

      // Show success toast
      toast({
        title: "Success",
        description: "Task created successfully",
      });

    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (id: string) => {
    try {
      setLoading(true);
      const response = await authService.bulkCompleteTasks({
        taskIds: [id],
        updates: {
          status: 'completed'
        }
      });
      console.log('Complete task response:', response);

      // Update the task status to completed in the local state
      const updatedTasks = tasks.map(task =>
        task._id === id
          ? { ...task, status: 'completed' as Task['status'], completedAt: new Date().toISOString() }
          : task
      );
      setTasks(updatedTasks);

      // Close the sidebar if the completed task is currently selected
      if (selectedTask?._id === id) {
        setSelectedTask(null);
        setIsSidebarOpen(false);
      }

      toast({
        title: "Success",
        description: "Task completed successfully",
      });

      // Check if there are next tasks created
      if (response.modifiedCount && response.modifiedCount > 0) {
        toast({
          title: "New tasks created",
          description: `${response.modifiedCount} follow-up task(s) were created`,
        });
        // Reload tasks to get the new ones
        loadTasks();
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setLoading(true);
      const response = await authService.deleteTask(id);
      console.log('Delete task response:', response);

      const updatedTasks = tasks.filter(task => task._id !== id);
      setTasks(updatedTasks);
      setDeleteConfirmId(null);

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(task => task._id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const response = await authService.bulkDeleteTasks(selectedTaskIds);

      const updatedTasks = tasks.filter(task => !selectedTaskIds.includes(task._id));
      setTasks(updatedTasks);
      setSelectedTaskIds([]);

      toast({
        title: "Success",
        description: `${response.deletedCount || selectedTaskIds.length} tasks deleted successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tasks",
        variant: "destructive",
      });
      console.error('Error deleting tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkComplete = async () => {
    try {
      setLoading(true);
      const response = await authService.bulkCompleteTasks({
        taskIds: selectedTaskIds,
        updates: {
          status: 'completed'
        }
      });

      // Update completed tasks status in the local state
      const updatedTasks = tasks.map(task =>
        selectedTaskIds.includes(task._id)
          ? { ...task, status: 'completed' as Task['status'], completedAt: new Date().toISOString() }
          : task
      );
      setTasks(updatedTasks);
      setSelectedTaskIds([]);

      toast({
        title: "Success",
        description: `${response.completedCount || selectedTaskIds.length} tasks completed successfully`,
      });

      if (response.modifiedCount && response.modifiedCount > 0) {
        toast({
          title: "New tasks created",
          description: `${response.modifiedCount} follow-up task(s) were created`,
        });
        // Reload tasks to get the new ones
        loadTasks();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete tasks",
        variant: "destructive",
      });
      console.error('Error completing tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // ======================== EDIT TASK HANDLERS ========================

  const handleEditTask = async (taskId: string) => {
    try {
      setLoading(true);
      console.log('Loading task for edit:', taskId);

      const taskData = await authService.getTask(taskId);
      console.log('Get task response:', taskData);

      if (taskData) {
        const editFormData = {
          title: taskData.title || '',
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : '', // Convert to date input format
          status: taskData.status || 'pending'
        };

        console.log('Setting edit form data:', editFormData);
        setEditTask(editFormData);
        setEditingTaskId(taskId);
        setIsEditMode(true);
      }
    } catch (error: any) {
      console.error('Error loading task for edit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load task for editing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !editTask.title.trim()) return;

    try {
      setLoading(true);
      console.log('Updating task:', editingTaskId, editTask);

      const updatedTask = await authService.updateTask(editingTaskId, {
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        dueDate: editTask.dueDate,
        status: editTask.status
      });

      console.log('Update task response:', updatedTask);

      if (updatedTask) {
        // Update the task in the local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === editingTaskId ? { ...task, ...updatedTask } : task
          )
        );

        // Reset edit state
        setIsEditMode(false);
        setEditingTaskId(null);
        setEditTask({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          status: 'pending'
        });

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingTaskId(null);
    setEditTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      status: 'pending'
    });
  };

  // Handle prospect click to show detailed information
  const handleProspectClick = async (task: Task) => {
    if (!task.prospectId || !task.campaignDetails?.id) {
      toast({
        title: "No prospect data",
        description: "This task doesn't have associated prospect information.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingProspectDetail(true);

    try {
      const response = await authService.getProspectDetail(task.campaignDetails.id, task.prospectId);
      setSelectedProspectDetail(response.prospect);
    } catch (error) {
      console.error('Error fetching prospect details:', error);
      toast({
        title: "Error",
        description: "Failed to load prospect details. Please try again.",
        variant: "destructive"
      });
      // Switch back to task tab on error
      setSidebarContent('task');
    } finally {
      setIsLoadingProspectDetail(false);
    }
  };

  // Handle task click to show task details in sidebar
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSidebarContent('task');
    setIsSidebarOpen(true);
    // Clear previous prospect data when switching to a new task
    if (selectedTask?._id !== task._id) {
      setSelectedProspectDetail(null);
    }
  };

  // Helper function to format activity results
  const formatActivityResult = (result: any, stepType: string) => {
    if (!result) return 'No details available';
    if (typeof result === 'string') return result;

    // Handle different result types
    if (result.message) return result.message;
    if (result.title) return `Task: ${result.title}`;
    if (result.connectionStatus) return `Connection status: ${result.connectionStatus}`;
    if (result.reason) return result.reason;
    if (result.jobCompleted) return 'LinkedIn invitation sent successfully';
    if (result.waitingForJob) return 'LinkedIn invitation queued';
    if (result.success) return 'Completed successfully';

    return 'Action completed';
  };

  const getStatusBadge = (status: Task['status']) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      'in_progress': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: String(status) || 'Unknown' };

    return (
      <Badge className={`${config.color} text-xs px-2 py-1 border`} style={sacoreFont}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const priorityConfig = {
      'low': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Low' },
      'medium': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Medium' },
      'high': { color: 'bg-red-100 text-red-800 border-red-200', label: 'High' }
    };

    const config = priorityConfig[priority] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: String(priority) || 'Unknown' };

    return (
      <Badge className={`${config.color} text-xs px-2 py-1 border`} style={sacoreFont}>
        {config.label}
      </Badge>
    );
  };

  // Filter helper functions
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      campaign: '',
      dueDate: '',
      overdue: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20
    });
  };

  // Pagination helper functions
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing limit
    }));
  };

  const hasActiveFilters = () => {
    return filters.status || filters.priority || filters.campaign || filters.dueDate || filters.overdue;
  };

  return (
    <div className={`w-full h-full p-6 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-black'}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
            Tasks
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={sacoreFont}>
            Manage tasks from campaigns and create manual tasks
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
              {pagination.totalCount > 0 ? pagination.totalCount : tasks.length} task{(pagination.totalCount > 0 ? pagination.totalCount : tasks.length) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {selectedTaskIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={sacoreFont}>
              {selectedTaskIds.length} selected
            </span>
            <Button
              onClick={handleBulkComplete}
              size="sm"
              className="bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black"
              style={sacoreFont}
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button
              onClick={() => setBulkDeleteConfirm(true)}
              size="sm"
              className="bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-black"
              style={sacoreFont}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
        <Dialog open={isCreateMode} onOpenChange={setIsCreateMode}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
              style={sacoreFont}
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
            <DialogHeader>
              <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                Create New Task
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                  Task Title
                </Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title..."
                  className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  style={sacoreFont}
                />
              </div>
              <div>
                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                  Description
                </Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description..."
                  rows={3}
                  className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  style={sacoreFont}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                    Priority
                  </Label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    className={`mt-1 w-full px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    style={sacoreFont}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    style={sacoreFont}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateTask}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                  style={sacoreFont}
                >
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateMode(false)}
                  className="flex-1"
                  style={sacoreFont}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
          <DialogHeader>
            <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
              Edit Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                Task Title
              </Label>
              <Input
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                placeholder="Enter task title..."
                className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                style={sacoreFont}
              />
            </div>
            <div>
              <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                Description
              </Label>
              <Textarea
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                placeholder="Enter task description..."
                rows={3}
                className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                style={sacoreFont}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                  Priority
                </Label>
                <select
                  value={editTask.priority}
                  onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as Task['priority'] })}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  style={sacoreFont}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                  Status
                </Label>
                <select
                  value={editTask.status}
                  onChange={(e) => setEditTask({ ...editTask, status: e.target.value as Task['status'] })}
                  className={`mt-1 w-full px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  style={sacoreFont}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={sacoreFont}>
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={editTask.dueDate}
                  onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                  className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  style={sacoreFont}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdateTask}
                className="flex-1 bg-black hover:bg-gray-800 text-white"
                style={sacoreFont}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Task'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
                style={sacoreFont}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-6"
      >
        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                  Filters
                </span>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="text-xs">
                    {Object.values(filters).filter(v => v && v !== 'createdAt' && v !== 'desc').length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs"
                  style={sacoreFont}
                >
                  <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-red-600 hover:text-red-700"
                    style={sacoreFont}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {/* Status Filter */}
                <div>
                  <Label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                    Status
                  </Label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
                    <SelectTrigger className={`mt-1 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div>
                  <Label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                    Priority
                  </Label>
                  <Select value={filters.priority || 'all'} onValueChange={(value) => handleFilterChange('priority', value === 'all' ? '' : value)}>
                    <SelectTrigger className={`mt-1 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campaign Search */}
                <div>
                  <Label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                    Campaign
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      value={filters.campaign}
                      onChange={(e) => handleFilterChange('campaign', e.target.value)}
                      placeholder="Search campaigns..."
                      className={`pl-7 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      style={sacoreFont}
                    />
                  </div>
                </div>

                {/* Due Date Filter */}
                <div>
                  <Label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.dueDate}
                    onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                    className={`mt-1 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    style={sacoreFont}
                  />
                </div>

                {/* Sort By */}
                <div>
                  <Label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                    Sort By
                  </Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger className={`mt-1 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="updatedAt">Updated Date</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order & Overdue */}
                <div className="space-y-2">
                  <div>
                    <Label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                      Order
                    </Label>
                    <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                      <SelectTrigger className={`mt-1 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="overdue"
                      checked={filters.overdue}
                      onChange={(e) => handleFilterChange('overdue', e.target.checked)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <Label
                      htmlFor="overdue"
                      className={`text-xs font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={sacoreFont}
                    >
                      Overdue only
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tasks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm`}>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <TableHeader className={isDarkMode ? "bg-gray-950" : "bg-gray-50"}>
                  <TableRow className={`${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                    <TableHead className={`py-2 w-12 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-4 h-4 border-2 rounded-sm cursor-pointer flex items-center justify-center transition-colors ${selectedTaskIds.length === tasks.length && tasks.length > 0
                            ? 'bg-black border-black'
                            : selectedTaskIds.length > 0
                              ? 'bg-black border-black'
                              : 'bg-white border-gray-400 hover:border-black'
                            }`}
                          onClick={handleSelectAll}
                        >
                          {selectedTaskIds.length === tasks.length && tasks.length > 0 ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : selectedTaskIds.length > 0 ? (
                            <div className="w-2 h-0.5 bg-white rounded-full" />
                          ) : null}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className={`py-2 text-xs font-medium border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`} style={sacoreFont}>Task</TableHead>
                    <TableHead className={`py-2 text-xs font-medium border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`} style={sacoreFont}>Priority</TableHead>
                    <TableHead className={`py-2 text-xs font-medium border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`} style={sacoreFont}>Due Date</TableHead>
                    <TableHead className={`py-2 text-xs font-medium border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`} style={sacoreFont}>Campaign</TableHead>
                    <TableHead className={`py-2 text-xs font-medium border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`} style={sacoreFont}>Status</TableHead>
                    <TableHead className={`py-2 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task._id} className={`${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'} ${selectedTaskIds.includes(task._id) ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}>
                      <TableCell className={`py-3 w-12 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-4 h-4 border-2 rounded-sm cursor-pointer flex items-center justify-center transition-colors ${selectedTaskIds.includes(task._id)
                              ? 'bg-black border-black'
                              : 'bg-white border-gray-400 hover:border-black'
                              }`}
                            onClick={() => handleSelectTask(task._id)}
                          >
                            {selectedTaskIds.includes(task._id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`py-3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} cursor-pointer`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                            {task.title}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`} style={sacoreFont}>
                            {task.description}
                          </p>

                        </div>
                      </TableCell>
                      <TableCell className={`py-3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        {getPriorityBadge(task.priority)}
                      </TableCell>
                      <TableCell className={`py-3 text-sm border-r ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`} style={sacoreFont}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className={`py-3 text-sm border-r ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`} style={sacoreFont}>
                        {task.campaign || '-'}
                      </TableCell>
                      <TableCell className={`py-3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                            <DropdownMenuItem onClick={() => handleTaskClick(task)}>
                              <Eye className="h-3 w-3 mr-2" />
                              <span className="text-xs" style={sacoreFont}>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTask(task._id)}>
                              <Edit className="h-3 w-3 mr-2" />
                              <span className="text-xs" style={sacoreFont}>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteConfirmId(task._id)}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              <span className="text-xs" style={sacoreFont}>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`} style={sacoreFont}>
                    No tasks yet
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} style={sacoreFont}>
                    Create your first task to get started
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6"
        >
          <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                    Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of {pagination.totalCount} tasks
                  </span>

                  <div className="flex items-center gap-2">
                    <Label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>
                      Per page:
                    </Label>
                    <Select value={filters.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                      <SelectTrigger className={`w-20 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="text-xs"
                    style={sacoreFont}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        const start = Math.max(1, pagination.currentPage - 2);
                        const end = Math.min(pagination.totalPages, start + 4);
                        const adjustedStart = Math.max(1, end - 4);
                        pageNum = adjustedStart + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 p-0 text-xs ${pagination.currentPage === pageNum
                            ? 'bg-black text-white hover:bg-gray-800'
                            : ''
                            }`}
                          style={sacoreFont}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="text-xs"
                    style={sacoreFont}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}


      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'} style={sacoreFont}>
              Delete {selectedTaskIds.length} Tasks
            </AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} style={sacoreFont}>
              Are you sure you want to delete {selectedTaskIds.length} selected task{selectedTaskIds.length !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' : ''} style={sacoreFont}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleBulkDelete();
                setBulkDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={sacoreFont}
            >
              Delete {selectedTaskIds.length} Task{selectedTaskIds.length !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'} style={sacoreFont}>
              Delete Task
            </AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} style={sacoreFont}>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' : ''} style={sacoreFont}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteTask(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={sacoreFont}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unified Detail Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className={`fixed top-0 right-0 h-full w-[500px] z-50 transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            } ${isDarkMode ? 'bg-gray-900 border-l border-gray-700' : 'bg-white border-l border-gray-300'} shadow-xl flex flex-col`}>

            {/* Header */}
            <div className={`sticky top-0 z-10 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/95 backdrop-blur-sm' : 'border-gray-200 bg-white/95 backdrop-blur-sm'}`}>
              {/* Title Bar */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <CheckSquare className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>
                      {selectedTask?.title || 'Details'}
                    </h2>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                      Task & Prospect Information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setSidebarContent('task')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${sidebarContent === 'task'
                    ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }`}
                  style={sacoreFont}
                >
                  <CheckSquare className="h-4 w-4" />
                  Task Details
                </button>
                {selectedTask?.prospectId && selectedTask?.campaignDetails && (
                  <button
                    onClick={() => {
                      setSidebarContent('prospect');
                      if (!selectedProspectDetail && !isLoadingProspectDetail) {
                        handleProspectClick(selectedTask);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${sidebarContent === 'prospect'
                      ? `border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                      }`}
                    style={sacoreFont}
                  >
                    <User className="h-4 w-4" />
                    Prospect Details
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {sidebarContent === 'task' ? (
                /* Task Details Content */
                selectedTask ? (
                  <div className="space-y-8">
                    {/* Task Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Building className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Task Information</h3>
                      </div>
                      <div className={`rounded-lg border p-4 space-y-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                        {/* Title - Full width */}
                        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                          <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</span>
                          <div className={`mt-1 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTask.title}</div>
                        </div>

                        {/* Description - Full width if exists */}
                        {selectedTask.description && (
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</span>
                            <div className="mt-1">{selectedTask.description}</div>
                          </div>
                        )}

                        {/* Two-column grid for other fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Priority</span>
                            <div className="mt-2">
                              {getPriorityBadge(selectedTask.priority)}
                            </div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                            <div className="mt-2">
                              <Badge variant={
                                selectedTask.status === 'completed' ? 'default' :
                                  selectedTask.status === 'in-progress' ? 'secondary' : 'outline'
                              }>
                                {selectedTask.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Due Date</span>
                            <div className="mt-1">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}</div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</span>
                            <div className="mt-1 capitalize">{selectedTask.type}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Information */}
                    {selectedTask.campaignDetails && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Campaign Information</h3>
                        </div>
                        <div className={`rounded-lg border p-4 space-y-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Campaign Name</span>
                            <div className="mt-1 font-medium">{selectedTask.campaignDetails.name}</div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                    No task selected
                  </div>
                )
              ) : (
                /* Prospect Details Content */
                isLoadingProspectDetail ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                      Loading prospect details...
                    </p>
                  </div>
                ) : selectedProspectDetail ? (
                  <div className="space-y-8">
                    {/* Basic Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Building className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Basic Information</h3>
                      </div>
                      <div className={`rounded-lg border p-4 space-y-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                        <div className="grid grid-cols-1 gap-4">
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</span>
                            <div className={`mt-1 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProspectDetail.name || 'Not available'}</div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</span>
                            <div className="mt-1">{selectedProspectDetail.email || 'Not available'}</div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Company</span>
                            <div className="mt-1">{selectedProspectDetail.company || 'Not available'}</div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Position</span>
                            <div className="mt-1">{selectedProspectDetail.position || 'Not available'}</div>
                          </div>
                          {selectedProspectDetail.linkedin && (
                            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                              <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>LinkedIn</span>
                              <div className="mt-1">
                                <a href={selectedProspectDetail.linkedin} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                                  <ExternalLink className="w-3 h-3" />
                                  View Profile
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Campaign Status */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Campaign Status</h3>
                      </div>
                      <div className={`rounded-lg border p-4 space-y-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                        <div className="grid grid-cols-1 gap-4">
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                            <div className="mt-2">
                              <Badge variant={
                                selectedProspectDetail.status === 'completed' ? 'default' :
                                  selectedProspectDetail.status === 'active' ? 'secondary' :
                                    selectedProspectDetail.status === 'manual_action_required' ? 'destructive' : 'outline'
                              }>
                                {selectedProspectDetail.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Contacted</span>
                            <div className="mt-1">{selectedProspectDetail.lastContacted ? new Date(selectedProspectDetail.lastContacted).toLocaleDateString() : 'Never'}</div>
                          </div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={sacoreFont}>
                            <span className={`font-medium text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Interactions</span>
                            <div className="mt-1 font-semibold text-lg">{selectedProspectDetail.metadata?.totalInteractions || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Step */}
                    {selectedProspectDetail.currentStep && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <CheckSquare className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Current Step</h3>
                        </div>
                        <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-3 h-3 rounded-full ${selectedProspectDetail.currentStep.status === 'completed' ? 'bg-green-500' :
                              selectedProspectDetail.currentStep.status === 'active' ? 'bg-blue-500' :
                                selectedProspectDetail.currentStep.status === 'waiting' ? 'bg-yellow-500' :
                                  selectedProspectDetail.currentStep.status === 'paused_for_manual_task' ? 'bg-orange-500' : 'bg-gray-300'
                              }`}></div>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>{selectedProspectDetail.currentStep.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">{selectedProspectDetail.currentStep.stepType}</Badge>
                            <Badge variant={
                              selectedProspectDetail.currentStep.status === 'completed' ? 'default' :
                                selectedProspectDetail.currentStep.status === 'active' ? 'secondary' :
                                  selectedProspectDetail.currentStep.status === 'paused_for_manual_task' ? 'destructive' : 'outline'
                            } className="text-xs">
                              {selectedProspectDetail.currentStep.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    {selectedProspectDetail.stats && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Statistics</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-200'}`}>
                            <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} style={sacoreFont}>{selectedProspectDetail.stats.emailsSent || 0}</div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>Emails Sent</div>
                          </div>
                          <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-green-900/10 border-green-800/30' : 'bg-green-50 border-green-200'}`}>
                            <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} style={sacoreFont}>{selectedProspectDetail.stats.emailsOpened || 0}</div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>Emails Opened</div>
                          </div>
                          <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-purple-900/10 border-purple-800/30' : 'bg-purple-50 border-purple-200'}`}>
                            <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} style={sacoreFont}>{selectedProspectDetail.stats.openRate || '0'}%</div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>Open Rate</div>
                          </div>
                          <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-orange-900/10 border-orange-800/30' : 'bg-orange-50 border-orange-200'}`}>
                            <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} style={sacoreFont}>{selectedProspectDetail.stats.replyRate || '0'}%</div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={sacoreFont}>Reply Rate</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {selectedProspectDetail.timeline && selectedProspectDetail.timeline.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <h3 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>Activity Timeline</h3>
                        </div>
                        <div className="space-y-3">
                          {selectedProspectDetail.timeline.map((activity: any, index: number) => (
                            <div key={index} className={`relative flex items-start gap-4 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'}`}>
                              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${activity.status === 'completed' ? 'bg-green-500' :
                                activity.status === 'failed' ? 'bg-red-500' :
                                  activity.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                                }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={sacoreFont}>{activity.stepName}</div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} style={sacoreFont}>
                                    {activity.executedAt ? new Date(activity.executedAt).toLocaleString() : 'No date'}
                                  </div>
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`} style={sacoreFont}>
                                  {formatActivityResult(activity.result, activity.stepType)}
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">{activity.stepType}</Badge>
                                  <Badge variant={
                                    activity.status === 'completed' ? 'default' :
                                      activity.status === 'failed' ? 'destructive' :
                                        activity.status === 'pending' ? 'secondary' : 'outline'
                                  } className="text-xs">
                                    {activity.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={sacoreFont}>
                    No prospect details available
                  </div>
                )
              )}
            </div>

            {/* Sticky Actions Footer */}
            {sidebarContent === 'task' && selectedTask && (
              <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700 bg-gray-900/95 backdrop-blur-sm' : 'border-gray-200 bg-white/95 backdrop-blur-sm'}`}>
                <Button
                  onClick={() => handleToggleCompleted(selectedTask._id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  style={sacoreFont}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Complete Task
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TasksPage; 