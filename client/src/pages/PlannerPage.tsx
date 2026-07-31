import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import { CheckSquare, Plus, Clock, User, Shield, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface PlannerTask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string | null;
    is_private: boolean;
    owner_id: string;
    owner_email: string;
    assigned_to_email: string | null;
    initiative_name: string | null;
    created_at: string;
}

export const PlannerPage = () => {
    const { token, user } = useAuth();
    const [tasks, setTasks] = useState<PlannerTask[]>([]);
    const [usersList, setUsersList] = useState<{email: string}[]>([]);
    const [view, setView] = useState<'my_tasks' | 'team_tasks'>('my_tasks');

    // New task form state
    const [isCreating, setIsCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        due_date: '',
        is_private: true,
        assigned_to_email: ''
    });

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_URL}/api/planner`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTasks(data);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    useEffect(() => {
        const fetchUsersList = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users/list`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) setUsersList(data);
            } catch (err) {
                console.error(err);
            }
        };

        if (token) {
            fetchTasks();
            fetchUsersList();
        }
    }, [token]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/planner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newTask)
            });
            if (res.ok) {
                setIsCreating(false);
                setNewTask({ title: '', description: '', due_date: '', is_private: true, assigned_to_email: '' });
                fetchTasks();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_URL}/api/planner/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta tarea?')) return;
        try {
            const res = await fetch(`${API_URL}/api/planner/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (view === 'my_tasks') {
            return t.owner_email === user?.email || t.assigned_to_email === user?.email;
        } else {
            return !t.is_private || t.owner_email === user?.email;
        }
    });

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
                        <CheckSquare size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Mi Planner</h1>
                        <p className="text-sm text-[var(--text-tertiary)]">Gestión ágil de tareas personales y del equipo</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setView('my_tasks')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'my_tasks' ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700")}
                        >
                            Mis Tareas
                        </button>
                        <button 
                            onClick={() => setView('team_tasks')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'team_tasks' ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700")}
                        >
                            Equipo
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Nueva Tarea
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex gap-6">
                {/* Pending Column */}
                <div className="flex-1 bg-gray-50/50 dark:bg-[#1A2332]/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex justify-between items-center">
                        Por Hacer 
                        <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">{filteredTasks.filter(t => t.status === 'pending').length}</span>
                    </h3>
                    <div className="space-y-3">
                        {filteredTasks.filter(t => t.status === 'pending').map(t => (
                            <TaskCard key={t.id} task={t} onStatusChange={handleUpdateStatus} onDelete={handleDelete} userEmail={user?.email} />
                        ))}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="flex-1 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100/50 dark:border-indigo-800/30">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-4 flex justify-between items-center">
                        En Proceso
                        <span className="bg-indigo-200 dark:bg-indigo-800 px-2 py-0.5 rounded-full text-xs">{filteredTasks.filter(t => t.status === 'in_progress').length}</span>
                    </h3>
                    <div className="space-y-3">
                        {filteredTasks.filter(t => t.status === 'in_progress').map(t => (
                            <TaskCard key={t.id} task={t} onStatusChange={handleUpdateStatus} onDelete={handleDelete} userEmail={user?.email} />
                        ))}
                    </div>
                </div>

                {/* Completed Column */}
                <div className="flex-1 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100/50 dark:border-emerald-800/30">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex justify-between items-center">
                        Completado
                        <span className="bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full text-xs">{filteredTasks.filter(t => t.status === 'completed').length}</span>
                    </h3>
                    <div className="space-y-3">
                        {filteredTasks.filter(t => t.status === 'completed').map(t => (
                            <TaskCard key={t.id} task={t} onStatusChange={handleUpdateStatus} onDelete={handleDelete} userEmail={user?.email} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Task Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1A2332] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="font-bold text-lg text-gray-800 dark:text-white">Nueva Tarea</h2>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
                                <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2" placeholder="Ej. Revisar documento de diseño..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                                <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2" rows={3}></textarea>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Límite</label>
                                    <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Visibilidad</label>
                                    <select value={newTask.is_private ? 'true' : 'false'} onChange={e => setNewTask({...newTask, is_private: e.target.value === 'true'})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2">
                                        <option value="true">Privada (Sólo yo)</option>
                                        <option value="false">Pública (Equipo)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Asignar a (Opcional)</label>
                                <select 
                                    value={newTask.assigned_to_email} 
                                    onChange={e => setNewTask({...newTask, assigned_to_email: e.target.value})} 
                                    className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2"
                                >
                                    <option value="">Sin asignar</option>
                                    {usersList.map(u => (
                                        <option key={u.email} value={u.email}>{u.email}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Crear Tarea</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TaskCard = ({ task, onStatusChange, onDelete, userEmail }: { task: PlannerTask, onStatusChange: (id: string, s: string) => void, onDelete: (id: string) => void, userEmail?: string }) => {
    const isOwner = task.owner_email === userEmail;

    return (
        <div className="bg-white dark:bg-[#0D1520] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800/50 hover:shadow-md transition-shadow group relative">
            
            {/* Status Change Controls */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {task.status !== 'pending' && <button onClick={() => onStatusChange(task.id, 'pending')} className="p-1 text-gray-400 hover:text-amber-500 rounded"><Clock size={14}/></button>}
                {task.status !== 'in_progress' && <button onClick={() => onStatusChange(task.id, 'in_progress')} className="p-1 text-gray-400 hover:text-indigo-500 rounded"><Loader2 size={14}/></button>}
                {task.status !== 'completed' && <button onClick={() => onStatusChange(task.id, 'completed')} className="p-1 text-gray-400 hover:text-emerald-500 rounded"><CheckCircle2 size={14}/></button>}
                {isOwner && <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 rounded ml-1"><Trash2 size={14}/></button>}
            </div>

            <div className="flex items-start gap-3">
                <div className="mt-1">
                    {task.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-500" /> : 
                     task.status === 'in_progress' ? <Loader2 size={18} className="text-indigo-500" /> : 
                     <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                </div>
                <div className="flex-1 min-w-0 pr-16">
                    <h4 className={clsx("text-sm font-semibold mb-1 truncate", task.status === 'completed' ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200")}>{task.title}</h4>
                    {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{task.description}</p>}
                    
                    <div className="flex flex-wrap gap-2 text-[10px] font-medium items-center mt-2">
                        {task.due_date && (
                            <span className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded", new Date(task.due_date) < new Date() && task.status !== 'completed' ? "bg-red-100 text-red-700" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400")}>
                                <Clock size={10} /> {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                        )}
                        {task.is_private ? (
                            <span className="flex items-center gap-1 text-gray-400" title="Privado"><Shield size={10}/> Privado</span>
                        ) : (
                            <span className="flex items-center gap-1 text-blue-500" title="Público"><User size={10}/> Equipo</span>
                        )}
                        {task.assigned_to_email && (
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                @{task.assigned_to_email.split('@')[0]}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
