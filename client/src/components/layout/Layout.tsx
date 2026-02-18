import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useYear } from '../../context/YearContext';
import { LayoutDashboard, ListTodo, LogOut, Upload, ChevronLeft, ChevronRight, Sun, Moon, MonitorPlay, MonitorOff, FileText } from 'lucide-react';
import { clsx } from 'clsx';

export const Layout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isSidebarOpen, toggleSidebar, isPresentationMode, togglePresentationMode } = useTheme();
    const { year, setYear } = useYear();
    const location = useLocation();

    const navItems = [
        { label: 'Roadmap', path: '/', icon: ListTodo },
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'One Pager', path: '/one-pager', icon: FileText },
    ];

    if (user?.role === 'admin') {
        navItems.push({ label: 'Import', path: '/import', icon: Upload });
    }

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-200">
            {/* Sidebar - Hidden in Presentation Mode */}
            {!isPresentationMode && (
                <aside
                    className={clsx(
                        "bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] shadow-xl flex flex-col transition-all duration-300 relative z-20",
                        isSidebarOpen ? "w-64" : "w-20"
                    )}
                >
                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-10 bg-[#E10600] text-white p-1 rounded-full shadow-lg hover:bg-red-700 z-30 transition-transform hover:scale-110"
                    >
                        {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {/* Header Logo */}
                    <div className={clsx(
                        "border-b border-[var(--border-color)] flex items-center justify-center transition-all duration-300",
                        isSidebarOpen ? "h-24 p-6" : "h-20 p-6",
                        (theme === 'dark' && isSidebarOpen) && "bg-white"
                    )}>
                        {isSidebarOpen ? (
                            <img
                                src={theme === 'dark' ? '/assets/logo-light.png' : '/assets/logo-dark.png'}
                                alt="Coca-Cola FEMSA"
                                className="h-auto max-h-16 w-auto object-contain transition-opacity duration-300"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-[#E10600] rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20 flex-shrink-0 text-sm">
                                TF
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={!isSidebarOpen ? item.label : ''}
                                    className={clsx(
                                        'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                                        isSidebarOpen ? "px-4 py-3 space-x-3" : "justify-center py-3 px-2",
                                        isActive
                                            ? 'bg-gradient-to-r from-[#E10600] to-red-800 text-white shadow-md shadow-red-900/20'
                                            : 'text-[var(--text-sidebar-secondary)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-primary)]'
                                    )}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)]">
                        <div className={clsx("flex items-center", isSidebarOpen ? "pb-4" : "justify-center pb-2")}>
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                                {user?.email[0].toUpperCase()}
                            </div>
                            {isSidebarOpen && (
                                <div className="ml-3 overflow-hidden fade-in animate-in">
                                    <p className="text-sm font-medium text-[var(--text-sidebar-primary)] truncate w-32" title={user?.email}>{user?.email}</p>
                                    <p className="text-xs text-[var(--text-sidebar-secondary)] capitalize">{user?.role}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className={clsx(
                                "flex items-center text-sm text-[var(--text-sidebar-secondary)] hover:text-[var(--text-sidebar-primary)] rounded transition-colors hover:bg-[var(--bg-sidebar-hover)]",
                                isSidebarOpen ? "w-full px-2 py-1.5 space-x-2" : "justify-center p-2"
                            )}
                            title="Cerrar Sesión"
                        >
                            <LogOut size={16} />
                            {isSidebarOpen && <span>Salir</span>}
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)]">
                {/* Top Controls Bar (Sticky) */}
                <header className="flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] z-10">
                    <div className="flex items-center space-x-3">
                        {/* Toggle Button in Header if Sidebar is closed/mobile? No, Sidebar has its own toggle. Just Title here. */}
                        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                            {location.pathname === '/' ? 'Roadmap de Iniciativas' :
                                location.pathname === '/dashboard' ? 'Dashboard Transformación' : 'Importación'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Global Year Selector */}
                        <div className="hidden md:flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-2 py-1">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mr-2 tracking-wider">AÑO</span>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none cursor-pointer"
                            >
                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                    <option key={y} value={y} className="text-gray-900 bg-white dark:bg-zinc-800 dark:text-gray-100">
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-[var(--border-color)] mx-1"></div>

                        {/* Presentation Toggle */}
                        <button
                            onClick={togglePresentationMode}
                            className={clsx(
                                "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                isPresentationMode
                                    ? "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--border-color)]"
                            )}
                            title={isPresentationMode ? "Salir Modo Presentación" : "Modo Presentación"}
                        >
                            {isPresentationMode ? <MonitorOff size={14} /> : <MonitorPlay size={14} />}
                            <span>{isPresentationMode ? "Salir" : "Presentar"}</span>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] transition-colors border border-[var(--border-color)]"
                            title={theme === 'light' ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
                        >
                            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-6 w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
