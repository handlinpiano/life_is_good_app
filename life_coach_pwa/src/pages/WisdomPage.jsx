import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { WISDOM_CATEGORIES } from '../store';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';

const CATEGORY_COLORS = {
    Recipe: 'bg-orange-100 text-orange-800 border-orange-200',
    Practice: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Insight: 'bg-violet-100 text-violet-800 border-violet-200',
    Mantra: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Reminder: 'bg-amber-100 text-amber-800 border-amber-200',
    General: 'bg-stone-100 text-stone-800 border-stone-200'
};

const GURU_NAMES = {
    'health_ayurveda': 'Vaidya Jiva',
    'health_yoga': 'Yogini Shakti',
    'spiritual_sadhana': 'Swami Prana',
    'spiritual_wisdom': 'Acharya Satya',
    'life_romance': 'Devi Kama',
    'life_career': 'Raja Dharma'
};

function AddWisdomModal({ isOpen, onClose }) {
    const upsertWisdom = useMutation(api.wisdom.upsert);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [content, setContent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        await upsertWisdom({
            localId: String(Date.now()),
            title,
            category,
            content,
        });
        setTitle('');
        setContent('');
        setCategory('General');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-violet-900 dark:text-violet-100 mb-4 flex items-center gap-2">
                    <BookOpen size={24} className="text-violet-600" /> Add Wisdom Note
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Turmeric Golden Milk Recipe"
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500"
                        >
                            {Object.values(WISDOM_CATEGORIES).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your wisdom note here..."
                            rows={6}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-stone-500 hover:text-stone-700 dark:text-stone-400">Cancel</button>
                        <button type="submit" className="flex-1 bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 font-medium">Save Wisdom</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function WisdomCard({ wisdom }) {
    const removeWisdom = useMutation(api.wisdom.remove);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this wisdom note?')) {
            await removeWisdom({ localId: wisdom.localId });
        }
    };

    const guruName = wisdom.guruId ? GURU_NAMES[wisdom.guruId] : null;
    const createdDate = wisdom._creationTime ? new Date(wisdom._creationTime).toLocaleDateString() : '';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden"
        >
            <div
                className="p-5 cursor-pointer flex items-start justify-between gap-3"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border", CATEGORY_COLORS[wisdom.category] || CATEGORY_COLORS.General)}>
                            {wisdom.category}
                        </span>
                        {guruName && (
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                                from {guruName}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg">{wisdom.title}</h3>
                    {!isExpanded && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                            {wisdom.content}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} className="text-stone-400" /> : <ChevronDown size={20} className="text-stone-400" />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5">
                            <div className="bg-stone-50 dark:bg-slate-900 rounded-lg p-4 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap border border-stone-100 dark:border-stone-700">
                                {wisdom.content}
                            </div>
                            {createdDate && (
                                <p className="text-xs text-stone-400 mt-3">Saved on {createdDate}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function WisdomPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const { isAuthenticated } = useConvexAuth();

    // Use Convex query directly
    const wisdom = useQuery(api.wisdom.list, isAuthenticated ? {} : "skip") || [];

    // Sort by _creationTime descending
    const sortedWisdom = [...wisdom].sort((a, b) =>
        (b._creationTime || 0) - (a._creationTime || 0)
    );

    // Filter wisdom based on search and category
    const filteredWisdom = sortedWisdom.filter(w => {
        const matchesSearch = searchQuery === '' ||
            w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || w.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-slate-900 pb-20">
            <Navbar />
            <div className="pt-16">
                <header className="bg-white dark:bg-slate-800 shadow-sm p-6 mb-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <div className="bg-violet-100 dark:bg-violet-900/30 p-3 rounded-xl text-violet-600 dark:text-violet-400">
                            <BookOpen size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Wisdom Library</h1>
                            <p className="text-stone-500 dark:text-stone-400">Insights, recipes, and notes from your Guide.</p>
                        </div>
                    </div>
                </header>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Search and Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search wisdom..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="All">All</option>
                        {Object.values(WISDOM_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Wisdom Count */}
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-stone-600 dark:text-stone-300 uppercase text-xs tracking-wider">Your Wisdom</h3>
                    <span className="text-xs text-stone-400">{filteredWisdom.length} notes</span>
                </div>

                {/* Wisdom Cards */}
                <div className="space-y-3 pb-24">
                    {filteredWisdom.length === 0 && (
                        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-stone-300 dark:border-stone-700">
                            <BookOpen size={48} className="mx-auto text-stone-300 mb-3" />
                            <p className="text-stone-500 font-medium">No wisdom notes yet.</p>
                            <p className="text-stone-400 text-sm mb-4">Ask your Guide to save recipes, insights, or mantras.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-violet-600 font-bold text-sm hover:underline"
                            >
                                + Add Your Own Note
                            </button>
                        </div>
                    )}

                    {filteredWisdom.map(w => (
                        <WisdomCard key={w._id} wisdom={w} />
                    ))}
                </div>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20"
            >
                <Plus size={28} />
            </button>

            <AddWisdomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
