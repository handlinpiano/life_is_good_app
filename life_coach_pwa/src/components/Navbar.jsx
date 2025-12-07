import { Link, useLocation } from 'react-router-dom';
import { Home, Sprout, BookOpen, MessageCircle } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useConvexAuth } from 'convex/react';
import clsx from 'clsx';

export default function Navbar() {
    const location = useLocation();
    const path = location.pathname;
    const { isAuthenticated } = useConvexAuth();

    // Don't show navbar on public routes
    if (path === '/' || path === '/auth') return null;

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
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8"
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
