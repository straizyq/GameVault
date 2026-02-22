import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, LogOut, Gamepad2, Search, Menu, X, Star, ShieldCheck, LayoutDashboard } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore, useCartStore } from './store';
import { Game, User, Order, Review } from './types';
import { cn, formatPrice } from './utils';

import { GENRES, CATEGORIES, PLATFORMS } from './constants';

// --- Components ---

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">GAME<span className="text-indigo-500">VAULT</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Каталог</Link>
            <Link to="/about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">О нас</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                <ShieldCheck className="w-4 h-4" />
                Админ
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 p-1 pl-3 pr-1 bg-zinc-900 rounded-full border border-white/10 hover:border-white/20 transition-all">
                  <span className="text-sm font-medium text-zinc-300">{user.username}</span>
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                </Link>
                <button onClick={() => { logout(); navigate('/'); toast.success('Вы вышли из системы'); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                Войти
              </Link>
            )}

            <button className="md:hidden p-2 text-zinc-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/" className="block text-lg font-medium text-zinc-300" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
              <Link to="/about" className="block text-lg font-medium text-zinc-300" onClick={() => setIsMenuOpen(false)}>О нас</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="block text-lg font-medium text-indigo-400" onClick={() => setIsMenuOpen(false)}>Админ Панель</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const HomePage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'sale' | 'bestsellers'>('all');
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      });
  }, []);

  const getFilteredGames = () => {
    let filtered = [...games];

    // Search
    if (search) {
      filtered = filtered.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
    }

    // Tabs
    if (filter === 'new') {
      filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filter === 'sale') {
      filtered = filtered.filter(g => g.discount_price !== null);
    } else if (filter === 'bestsellers') {
      filtered = filtered.filter(g => g.is_best_seller === 1);
    }

    // Dropdowns
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(g => g.genre === selectedGenre);
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(g => g.category.includes(selectedCategory));
    }
    if (selectedPlatform !== 'All') {
      filtered = filtered.filter(g => g.platform.includes(selectedPlatform));
    }

    return showAll ? filtered : filtered.slice(0, 6);
  };

  const displayGames = getFilteredGames();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/seed/gaming/1920/1080?blur=4"
            className="w-full h-full object-cover opacity-40"
            alt="Hero"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
              Новое поступление
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
              ИГРАЙ БЕЗ <br /> <span className="text-indigo-500">ГРАНИЦ</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
              Лучшие мировые хиты, эксклюзивные предложения и мгновенная доставка. Начни свое приключение прямо сейчас в GameVault.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all transform hover:scale-105">
                В каталог
              </button>
              <Link to="/about" className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                Узнать больше
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Каталог игр</h2>
              <div className="flex flex-wrap gap-4 mt-4">
                <button onClick={() => { setFilter('all'); setShowAll(false); }} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'all' ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>Все</button>
                <button onClick={() => { setFilter('new'); setShowAll(false); }} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'new' ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>Новинки</button>
                <button onClick={() => { setFilter('sale'); setShowAll(false); }} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'sale' ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>Со скидкой</button>
                <button onClick={() => { setFilter('bestsellers'); setShowAll(false); }} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'bestsellers' ? "bg-indigo-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>Лидеры продаж</button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 w-full md:w-80"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-zinc-900/30 rounded-2xl border border-white/5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Жанр</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="All">Все жанры</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="All">Все категории</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Платформа</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="All">Все платформы</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayGames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <Link to={`/game/${game.id}`} className="block relative aspect-video overflow-hidden">
                <img
                  src={game.image_url}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold">{game.rating}</span>
                </div>
                {game.discount_price && (
                  <div className="absolute top-4 left-4 px-2 py-1 bg-red-600 rounded-lg text-[10px] font-black uppercase">
                    -{Math.round((1 - game.discount_price / game.price) * 100)}%
                  </div>
                )}
              </Link>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{game.genre}</span>
                  <span className="text-xs text-zinc-500">{game.platform.split(',')[0]}</span>
                </div>
                <Link to={`/game/${game.id}`} className="block text-xl font-bold mb-4 hover:text-indigo-400 transition-colors">
                  {game.title}
                </Link>
                <div className="flex items-center justify-between">
                  <div>
                    {game.discount_price ? (
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-sm line-through">{formatPrice(game.price)}</span>
                        <span className="text-2xl font-black text-white">{formatPrice(game.discount_price)}</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-black">{formatPrice(game.price)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => { addItem(game); toast.success(`${game.title} добавлена в корзину`); }}
                    className="p-3 bg-white text-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!showAll && games.length > 6 && (
          <div className="mt-16 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="px-12 py-4 bg-zinc-900 border border-white/10 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all"
            >
              Показать все игры
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

const GameDetailPage = () => {
  const { id } = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [steamData, setSteamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    const fetchData = async () => {
      const gameRes = await fetch(`/api/games/${id}`);
      const gameData = await gameRes.json();
      setGame(gameData);

      const reviewsRes = await fetch(`/api/reviews/${id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData);

      if (gameData.steam_id) {
        const steamRes = await fetch(`/api/steam/reviews/${gameData.steam_id}`);
        const steamJson = await steamRes.json();
        setSteamData(steamJson);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Войдите, чтобы оставить отзыв');

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        gameId: id,
        rating: newReview.rating,
        comment: newReview.comment
      })
    });

    if (res.ok) {
      toast.success('Отзыв опубликован');
      setNewReview({ rating: 5, comment: '' });
      // Refresh reviews
      fetch(`/api/reviews/${id}`).then(res => res.json()).then(setReviews);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!game) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Игра не найдена</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="relative h-[60vh]">
        <img src={game.image_url} className="w-full h-full object-cover opacity-50" alt={game.title} referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <span className="px-3 py-1 bg-indigo-600 rounded-lg text-xs font-bold uppercase mb-4 inline-block">{game.genre}</span>
            <h1 className="text-5xl md:text-7xl font-black mb-4">{game.title}</h1>
            <div className="flex items-center gap-6 text-zinc-300">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold">
                  {steamData?.query_summary?.total_reviews > 0 
                    ? `${(steamData.query_summary.total_positive / steamData.query_summary.total_reviews * 5).toFixed(1)} / 5.0 (Steam)`
                    : `${game.rating} / 5.0`}
                </span>
              </div>
              <span>Издатель: {game.publisher}</span>
              {game.steam_id && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-bold border border-blue-500/20">Steam ID: {game.steam_id}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4">Об игре</h2>
            <p className="text-zinc-400 leading-relaxed text-lg">{game.description}</p>
          </section>

          <section className="p-8 bg-zinc-900 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-bold mb-6">Подробная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-zinc-500 text-sm uppercase font-bold block mb-1">Категории</span>
                  <div className="flex flex-wrap gap-2">
                    {game.category.split(',').map((cat, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">{cat.trim()}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-sm uppercase font-bold block mb-1">Платформы</span>
                  <div className="flex flex-wrap gap-2">
                    {game.platform.split(',').map((plat, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded text-xs font-bold border border-indigo-500/20">{plat.trim()}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Системные требования</h3>
                <div className="grid grid-cols-1 gap-4">
                  {game.system_requirements ? game.system_requirements.split(',').map((req, i) => {
                    const parts = req.split(':');
                    if (parts.length < 2) return null;
                    return (
                      <div key={i} className="flex flex-col border-b border-white/5 pb-2">
                        <span className="text-zinc-500 text-[10px] uppercase font-black">{parts[0].trim()}</span>
                        <span className="text-zinc-200 text-sm">{parts.slice(1).join(':').trim()}</span>
                      </div>
                    );
                  }) : <p className="text-zinc-500 italic text-sm">Требования не указаны</p>}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-8">Отзывы</h2>
            
            {steamData?.reviews && (
              <div className="mb-12 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Последние отзывы из Steam
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {steamData.reviews.slice(0, 3).map((r: any, i: number) => (
                    <div key={i} className="p-4 bg-blue-900/10 border border-blue-500/10 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-xs font-bold uppercase", r.voted_up ? "text-green-400" : "text-red-400")}>
                          {r.voted_up ? "Рекомендую" : "Не рекомендую"}
                        </span>
                        <span className="text-[10px] text-zinc-500">Steam User</span>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-3 italic">"{r.review}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-lg font-bold mb-6">Отзывы GameVault</h3>
            {user && (
              <form onSubmit={handleReviewSubmit} className="mb-12 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold mb-4">Оставить отзыв</h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-zinc-400">Оценка:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={cn("p-1", newReview.rating >= star ? "text-yellow-500" : "text-zinc-600")}
                      >
                        <Star className={cn("w-6 h-6", newReview.rating >= star && "fill-yellow-500")} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Ваш отзыв..."
                  className="w-full p-4 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-4 h-32"
                  required
                />
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors">
                  Опубликовать
                </button>
              </form>
            )}

            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="p-6 bg-zinc-900/30 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                        {review.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{review.username}</p>
                        <p className="text-xs text-zinc-500">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-zinc-700")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-zinc-400">{review.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-zinc-500 italic">Отзывов пока нет. Будьте первым!</p>}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 p-8 bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl shadow-indigo-500/5">
            <div className="mb-8">
              <span className="text-zinc-500 text-sm font-bold uppercase block mb-2">Цена</span>
              <span className="text-5xl font-black">{formatPrice(game.price)}</span>
            </div>
            <button
              onClick={() => { addItem(game); toast.success(`${game.title} добавлена в корзину`); }}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 mb-4"
            >
              <ShoppingCart className="w-5 h-5" />
              В корзину
            </button>
            <div className="flex items-center gap-2 text-zinc-500 text-sm justify-center">
              <ShieldCheck className="w-4 h-4" />
              Мгновенная доставка ключа
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, removeItem, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) return navigate('/login');
    if (items.length === 0) return;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        items: items,
        totalPrice: total
      })
    });

    if (res.ok) {
      toast.success('Заказ успешно оформлен!');
      clearCart();
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black mb-12">Корзина</h1>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900 rounded-3xl border border-white/5">
            <ShoppingCart className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
            <p className="text-zinc-400 text-xl mb-8">Ваша корзина пуста</p>
            <Link to="/" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors">
              Перейти к покупкам
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex gap-6 p-4 bg-zinc-900 rounded-2xl border border-white/5 items-center">
                  <img src={item.image_url} className="w-24 h-24 object-cover rounded-xl" alt={item.title} referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-zinc-500 text-sm">{item.genre}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl">{formatPrice(item.price)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm hover:underline mt-2">Удалить</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-zinc-900 rounded-2xl border border-white/10 h-fit space-y-6">
              <h2 className="text-xl font-bold">Итого</h2>
              <div className="flex justify-between text-zinc-400">
                <span>Товары ({items.length})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Скидка</span>
                <span className="text-green-500">0 ₽</span>
              </div>
              <div className="h-px bg-white/10 my-4"></div>
              <div className="flex justify-between text-2xl font-black">
                <span>Всего</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`/api/orders/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Пожалуйста, войдите в систему</div>;

  return (
    <div className="min-h-screen bg-black text-white py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-8 mb-16">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-black">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-black mb-2">{user.username}</h1>
            <p className="text-zinc-500">{user.email}</p>
            <span className="inline-block mt-4 px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold uppercase text-zinc-400">
              {user.role === 'admin' ? 'Администратор' : 'Покупатель'}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-8">История заказов</h2>
        {loading ? (
          <div className="flex justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : orders.length === 0 ? (
          <p className="text-zinc-500 italic">У вас пока нет заказов</p>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="p-6 bg-zinc-900 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Заказ #{order.id}</p>
                    <p className="font-bold text-lg">{order.items}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl">{formatPrice(order.total_price)}</p>
                    <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-500 font-bold uppercase">Выполнено</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data);
      toast.success(isLogin ? 'С возвращением!' : 'Регистрация успешна!');
      navigate('/');
    } else {
      toast.error(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <Gamepad2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black">{isLogin ? 'С возвращением' : 'Создать аккаунт'}</h1>
          <p className="text-zinc-500 mt-2">{isLogin ? 'Войдите в свой профиль GameVault' : 'Присоединяйтесь к сообществу игроков'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Имя пользователя</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-4 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Пароль</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-4 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 hover:underline text-sm font-medium">
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'games'>('stats');
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);

  const refreshData = () => {
    fetch('/api/admin/stats').then(res => res.json()).then(setStats);
    fetch('/api/admin/users').then(res => res.json()).then(setUsers);
    fetch('/api/games').then(res => res.json()).then(setGames);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      refreshData();
    }
  }, [user]);

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingGame?.id ? 'PUT' : 'POST';
    const url = editingGame?.id ? `/api/admin/games/${editingGame.id}` : '/api/admin/games';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingGame)
    });

    if (res.ok) {
      toast.success('Игра сохранена');
      setEditingGame(null);
      refreshData();
    }
  };

  const handleDeleteGame = async (id: number) => {
    if (!confirm('Удалить эту игру?')) return;
    const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Игра удалена');
      refreshData();
    }
  };

  if (user?.role !== 'admin') return <div className="min-h-screen bg-black text-white flex items-center justify-center">Доступ запрещен</div>;

  return (
    <div className="min-h-screen bg-black text-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-black">Панель администратора</h1>
          </div>
          {activeTab === 'games' && (
            <button 
              onClick={() => setEditingGame({ title: '', price: 0, genre: '', category: '', platform: '', publisher: '', description: '', image_url: '', system_requirements: '', is_best_seller: 0 })}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all"
            >
              Добавить игру
            </button>
          )}
        </div>

        <div className="flex gap-4 mb-12 border-b border-white/10">
          <button onClick={() => setActiveTab('stats')} className={cn("px-6 py-4 font-bold border-b-2 transition-all", activeTab === 'stats' ? "border-indigo-600 text-white" : "border-transparent text-zinc-500")}>Статистика</button>
          <button onClick={() => setActiveTab('users')} className={cn("px-6 py-4 font-bold border-b-2 transition-all", activeTab === 'users' ? "border-indigo-600 text-white" : "border-transparent text-zinc-500")}>Пользователи</button>
          <button onClick={() => setActiveTab('games')} className={cn("px-6 py-4 font-bold border-b-2 transition-all", activeTab === 'games' ? "border-indigo-600 text-white" : "border-transparent text-zinc-500")}>Игры</button>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5">
                <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Общие продажи</p>
                <p className="text-4xl font-black">{formatPrice(stats.totalSales)}</p>
              </div>
              <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5">
                <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Всего заказов</p>
                <p className="text-4xl font-black">{stats.totalOrders}</p>
              </div>
              <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5">
                <p className="text-zinc-500 font-bold uppercase text-xs mb-2">Пользователей</p>
                <p className="text-4xl font-black">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5">
              <h2 className="text-2xl font-bold mb-8">Популярные игры</h2>
              <div className="space-y-4">
                {stats.popularGames.map((g: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black rounded-xl">
                    <span className="font-bold">{g.title}</span>
                    <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-bold">{g.sales} продаж</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/50">
                  <th className="p-6 font-bold text-zinc-400 uppercase text-xs">ID</th>
                  <th className="p-6 font-bold text-zinc-400 uppercase text-xs">Имя</th>
                  <th className="p-6 font-bold text-zinc-400 uppercase text-xs">Email</th>
                  <th className="p-6 font-bold text-zinc-400 uppercase text-xs">Роль</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="p-6 text-zinc-500">{u.id}</td>
                    <td className="p-6 font-bold">{u.username}</td>
                    <td className="p-6 text-zinc-400">{u.email}</td>
                    <td className="p-6">
                      <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase", u.role === 'admin' ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400")}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="grid grid-cols-1 gap-4">
            {games.map(game => (
              <div key={game.id} className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex items-center gap-6">
                <img src={game.image_url} className="w-16 h-16 object-cover rounded-lg" alt="" />
                <div className="flex-1">
                  <h3 className="font-bold">{game.title}</h3>
                  <p className="text-xs text-zinc-500">{game.genre} • {game.publisher}</p>
                </div>
                <div className="text-right">
                  <p className="font-black">{formatPrice(game.price)}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditingGame(game)} className="text-xs text-indigo-400 hover:underline">Изменить</button>
                    <button onClick={() => handleDeleteGame(game.id)} className="text-xs text-red-500 hover:underline">Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editingGame && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-black mb-8">{editingGame.id ? 'Редактировать игру' : 'Добавить игру'}</h2>
                <form onSubmit={handleSaveGame} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Название</label>
                    <input required value={editingGame.title} onChange={e => setEditingGame({...editingGame, title: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Цена (USD)</label>
                    <input type="number" step="0.01" required value={editingGame.price} onChange={e => setEditingGame({...editingGame, price: parseFloat(e.target.value)})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Цена со скидкой (USD)</label>
                    <input type="number" step="0.01" value={editingGame.discount_price || ''} onChange={e => setEditingGame({...editingGame, discount_price: e.target.value ? parseFloat(e.target.value) : null})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Жанр</label>
                    <select 
                      required 
                      value={editingGame.genre} 
                      onChange={e => setEditingGame({...editingGame, genre: e.target.value})} 
                      className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="">Выберите жанр</option>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Издатель</label>
                    <input value={editingGame.publisher} onChange={e => setEditingGame({...editingGame, publisher: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Категории</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-black rounded-xl border border-white/5">
                      {CATEGORIES.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={editingGame.category?.includes(cat)} 
                            onChange={e => {
                              const current = editingGame.category ? editingGame.category.split(',').map(s => s.trim()).filter(Boolean) : [];
                              const next = e.target.checked ? [...current, cat] : current.filter(c => c !== cat);
                              setEditingGame({...editingGame, category: next.join(', ')});
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-zinc-800 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Платформы</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-black rounded-xl border border-white/5">
                      {PLATFORMS.map(plat => (
                        <label key={plat} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={editingGame.platform?.includes(plat)} 
                            onChange={e => {
                              const current = editingGame.platform ? editingGame.platform.split(',').map(s => s.trim()).filter(Boolean) : [];
                              const next = e.target.checked ? [...current, plat] : current.filter(p => p !== plat);
                              setEditingGame({...editingGame, platform: next.join(', ')});
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-zinc-800 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{plat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Steam App ID</label>
                    <input placeholder="Например: 1245620" value={editingGame.steam_id || ''} onChange={e => setEditingGame({...editingGame, steam_id: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <p className="text-[10px] text-zinc-500 mt-1">Если указан, отзывы и рейтинг будут подгружаться из Steam автоматически.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">URL Изображения</label>
                    <input value={editingGame.image_url} onChange={e => setEditingGame({...editingGame, image_url: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Описание</label>
                    <textarea value={editingGame.description} onChange={e => setEditingGame({...editingGame, description: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none h-24" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-4">Системные требования</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black rounded-xl border border-white/5">
                      {['OS', 'Processor', 'Ram', 'Memory', 'Graphics'].map(key => {
                        const requirements = editingGame.system_requirements ? 
                          Object.fromEntries(editingGame.system_requirements.split(',').map(s => {
                            const [k, ...v] = s.split(':');
                            if (!k) return ['', ''];
                            return [k.trim(), v.join(':').trim()];
                          }).filter(([k]) => k)) : {};
                        
                        return (
                          <div key={key}>
                            <label className="block text-[10px] font-black text-zinc-600 uppercase mb-1">{key}</label>
                            <input 
                              placeholder={key === 'OS' ? 'Windows 10' : key === 'Ram' ? '16 GB' : key === 'Memory' ? '100 GB SSD' : '...'}
                              value={requirements[key] || ''} 
                              onChange={e => {
                                const nextReqs = { ...requirements, [key]: e.target.value };
                                const joined = Object.entries(nextReqs)
                                  .filter(([_, v]) => v)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ');
                                setEditingGame({...editingGame, system_requirements: joined});
                              }}
                              className="w-full p-2 bg-zinc-900 border border-white/5 rounded-lg text-sm focus:ring-1 focus:ring-indigo-600 outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editingGame.is_best_seller === 1} onChange={e => setEditingGame({...editingGame, is_best_seller: e.target.checked ? 1 : 0})} className="w-4 h-4" />
                    <label className="text-sm font-bold">Лидер продаж</label>
                  </div>
                  <div className="md:col-span-2 flex gap-4 mt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all">Сохранить</button>
                    <button type="button" onClick={() => setEditingGame(null)} className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all">Отмена</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:id" element={<GameDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/about" element={<div className="min-h-screen bg-black text-white flex items-center justify-center px-4"><div className="max-w-2xl text-center"><h1 className="text-4xl font-black mb-8">О проекте GameVault</h1><p className="text-zinc-400 text-lg leading-relaxed">GameVault — это современная платформа для геймеров, созданная в рамках дипломной работы. Мы объединяем передовые технологии веб-разработки (React, Node.js, SQLite) с любовью к видеоиграм, чтобы предоставить лучший пользовательский опыт.</p></div></div>} />
          </Routes>
        </main>
        <footer className="bg-zinc-900 border-t border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Gamepad2 className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold tracking-tighter text-white">GAME<span className="text-indigo-500">VAULT</span></span>
            </div>
            <p className="text-zinc-500 text-sm">© 2026 Дипломная работа. Все права защищены.</p>
          </div>
        </footer>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        }} />
      </div>
    </Router>
  );
}
