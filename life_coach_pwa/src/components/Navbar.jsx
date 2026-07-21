import { Link, useLocation } from 'react-router-dom';
import { Home, Sprout, BookOpen, MessageCircle, LogOut } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useConvexAuth } from 'convex/react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const location = useLocation();
    const path = location.pathname;
    const { isAuthenticated } = useConvexAuth();
    const { authMode, signOut, user } = useAuth();

    // Don't show navbar on public routes
    if (path === '/' || path === '/auth' || path === '/dev-login') return null;

    const tabs = [
        { name: 'Home', path: '/dashboard', icon: Home },
        { name: 'Garden', path: '/garden', icon: Sprout },
        { name: 'Wisdom', path: '/wisdom', icon: BookOpen },
        { name: 'Chat', path: '/chat', icon: MessageCircle },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm z-50 border-b border-stone-200 dark:border-stone-800">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    <Link to="/dashboard" className="font-serif font-bold text-xl text-amber-600 dark:text-amber-500">
                        Vedicas
                        {authMode === 'test' && (
                            <span className="ml-2 text-[10px] font-sans font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-200 px-1.5 py-0.5 rounded">
                                test
                            </span>
                        )}
                    </Link>

                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = path === tab.path;

                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                                        isActive
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                            : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon size={18} />
                                    <span className="hidden sm:inline">{tab.name}</span>
                                </Link>
                            );
                        })}

                        {isAuthenticated && (
                            <div className="ml-2 pl-2 border-l border-stone-200 dark:border-stone-700">
                                {authMode === 'test' ? (
                                    <button
                                        type="button"
                                        onClick={() => signOut()}
                                        title={`Sign out (${user?.email || 'test'})`}
                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                                    >
                                        <LogOut size={16} />
                                        <span className="hidden sm:inline max-w-[8rem] truncate">
                                            {user?.name || 'Test'}
                                        </span>
                                    </button>
                                ) : (
                                    <UserButton
                                        afterSignOutUrl="/"
                                        appearance={{
                                            elements: {
                                                avatarBox: "w-8 h-8"
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
