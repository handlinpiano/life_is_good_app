import { Link, useLocation } from 'react-router-dom';
import { Home, Sprout } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
    const location = useLocation();
    const path = location.pathname;

    // Don't show navbar on Intake (initial page) if we assume it's for pre-registered users,
    // BUT user requested "persistent tabs at the top for page navigation after we've done the first form".
    // So we show it on everything EXCEPT main intake route '/'
    if (path === '/') return null;

    const tabs = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Garden', path: '/garden', icon: Sprout },
        // Guru link could be dynamic (last visited?) or just a list. For now, maybe just "Guru" taking to dashboard's guru list or a specific page.
        // Let's stick to Dashboard/Garden for now as they are the main "Places". Gurus are accessed from Dashboard.
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm z-50 border-b border-stone-200 dark:border-stone-800">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/dashboard" className="font-serif font-bold text-xl text-amber-600 dark:text-amber-500">
                        Life Guru
                    </Link>

                    <div className="flex gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = path === tab.path;

                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                                        isActive
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                            : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon size={18} />
                                    <span>{tab.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
