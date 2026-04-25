import { useState, useEffect, FormEvent } from 'react';
import { 
  Users, 
  Activity, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Edit2, 
  UserPlus,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Wallet,
  PieChart,
  X,
  Check,
  History,
  Trophy,
  Target,
  Clock,
  LayoutGrid,
  Shuffle,
  Dices,
  RotateCcw,
  Lock,
  Unlock,
  ArrowLeftRight,
  RefreshCcw,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadCSV } from './lib/exportUtils';
import { Atleta, AppDatabase, LancamentoFinanceiro, Gol } from './types';
import { 
  auth, 
  firestore, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider,
  collection,
  onSnapshot,
  setDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  User,
  testConnection
} from './lib/firebase';

const STORAGE_KEY = 'clubAmigosDB_v2';

// --- Helpers ---
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateAge = (birthDate: string | undefined) => {
  if (!birthDate) return '';
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  // dateStr is expected to be YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  
  // Create date using local time components to avoid timezone shifts
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR');
};

const renderHistorico = (historico: ('Azul' | 'Vermelho')[] | undefined) => {
  if (!historico || historico.length === 0) return null;
  return (
    <div className="flex -space-x-1 ml-2 items-center">
      {historico.slice(-5).map((t, i) => (
        <div 
          key={i} 
          className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 ${t === 'Azul' ? 'bg-blue-500' : 'bg-red-500'}`}
          title={`Passou pelo Time ${t}`}
        />
      ))}
    </div>
  );
};

const SoccerBall = ({ className, active, colorClass }: { className?: string; active?: boolean; colorClass?: string; key?: any }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={`${className} ${active ? (colorClass || 'text-amber-500') : 'text-gray-200'} transition-all duration-300`}
    fill="currentColor"
  >
    <path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M12,18l-3.5-2.5l1.5-4h4l1.5,4L12,18z M18.06,14.66 L15.5,11.5l1-4.16c1.07,1.16,1.8,2.61,2.06,4.22c0.06,0.37,0.1,0.74,0.1,1.11C18.66,13.29,18.43,14.05,18.06,14.66z M12,4 c1.8,0,3.46,0.59,4.81,1.58L15.5,7.5h-7L7.19,5.58C8.54,4.59,10.2,4,12,4z M5.44,7.34l1,4.16L3.94,14.66 C3.57,14.05,3.34,13.29,3.34,12.5c0-0.37,0.04-0.74,0.1-1.11C3.69,9.78,4.43,8.33,5.44,7.34z M6.5,15.5L8.5,11.5L5.44,14.66 c0.44,0.79,1.01,1.49,1.68,2.07L6.5,15.5z M17.5,15.5l-1.5,4c0.67-0.58,1.24-1.28,1.68-2.07L17.5,15.5z" />
  </svg>
);

const PONTUACAO_COLORS: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-emerald-500',
  5: 'text-blue-600'
};

const RenderPontuacao = ({ pontuacao, className = "w-3.5 h-3.5" }: { pontuacao?: number; className?: string }) => {
  if (!pontuacao || pontuacao === 0) return <span className="text-[10px] text-gray-300 font-bold italic ml-1 select-none">S/P</span>;
  return (
    <div className="flex gap-0.5 ml-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <SoccerBall 
          key={star} 
          className={className} 
          active={star <= pontuacao} 
          colorClass={PONTUACAO_COLORS[star]}
        />
      ))}
    </div>
  );
};

const PontuacaoInput = ({ value, onChange, label, theme }: { value: number; onChange: (v: number) => void; label: string; theme: string }) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
      <div className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${value === 0 ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          RESET
        </button>
        <div className="h-4 w-[1px] bg-gray-200 mx-1" />
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`p-1 rounded-lg transition-all ${value === num ? 'scale-125' : value >= num ? 'scale-105' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
          >
            <SoccerBall 
              className="w-5 h-5" 
              active={value >= num} 
              colorClass={PONTUACAO_COLORS[num]}
            />
          </button>
        ))}
        <span className={`ml-auto text-xs font-black mr-2 ${
          PONTUACAO_COLORS[value] || 'text-gray-400'
        }`}>{value}/5</span>
      </div>
    </div>
  );
};

const INITIAL_DB: AppDatabase = {
  atletas: [],
  financeiro: [],
  gols: []
};

const POSICOES = [
  'FIXO (ZAGUEIRO)',
  'ALA ESQUERDO',
  'ALA DIREITO',
  'MEIO-CAMPO',
  'PIVÔ (ATACANTE)'
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'atletas' | 'financeiro' | 'artilharia' | 'resultados' | 'sorteio'>('atletas');
  const [db, setDb] = useState<AppDatabase>(INITIAL_DB);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [quickGoalModal, setQuickGoalModal] = useState<{
    isOpen: boolean;
    atleta: Atleta | null;
  }>({
    isOpen: false,
    atleta: null
  });

  // Global Editing State for Atletas
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCodigo, setEditingCodigo] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) testConnection();
    });
    return () => unsub();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      // LocalStorage fallback when not logged in
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setDb(JSON.parse(saved));
        } catch (e) {
          setDb(INITIAL_DB);
        }
      }
      return;
    }

    const unsubAtletas = onSnapshot(collection(firestore, 'atletas'), (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.id })) as any;
      setDb(prev => ({ ...prev, atletas: docs }));
    });

    const unsubFinanceiro = onSnapshot(collection(firestore, 'financeiro'), (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.id })) as any;
      setDb(prev => ({ ...prev, financeiro: docs }));
    });

    const unsubGols = onSnapshot(collection(firestore, 'gols'), (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.id })) as any;
      setDb(prev => ({ ...prev, gols: docs }));
    });

    return () => {
      unsubAtletas();
      unsubFinanceiro();
      unsubGols();
    };
  }, [user]);

  // Persist to LocalStorage only if NOT logged in
  useEffect(() => {
    if (!user && db !== INITIAL_DB) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  }, [db, user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => auth.signOut();

  // --- Handlers ---
  const addAtleta = async (atleta: Omit<Atleta, 'id' | 'codigo'>) => {
    const nextNum = db.atletas.length > 0 
      ? Math.max(...db.atletas.map(a => {
          const num = parseInt(a.codigo || '0');
          return isNaN(num) ? 0 : num;
        })) + 1 
      : 1;
    const codigo = nextNum.toString().padStart(4, '0');
    
    if (user) {
      await addDoc(collection(firestore, 'atletas'), { ...atleta, codigo });
    } else {
      const novo: Atleta = { ...atleta, id: Date.now(), codigo };
      setDb(prev => ({ ...prev, atletas: [...prev.atletas, novo] }));
    }
  };

  const updateAtleta = async (atleta: Atleta) => {
    const antigo = db.atletas.find(a => a.id === atleta.id);
    let finalAtleta = { ...atleta };
    
    if (antigo && atleta.time !== antigo.time) {
      const historico = antigo.historicoTimes || [];
      finalAtleta.historicoTimes = [...historico, antigo.time];
    }

    if (user) {
      const { id, ...data } = finalAtleta;
      await setDoc(doc(firestore, 'atletas', id.toString()), data, { merge: true });
    } else {
      setDb(prev => ({
        ...prev,
        atletas: prev.atletas.map(a => a.id === atleta.id ? finalAtleta : a)
      }));
    }
  };

  const updateAtletas = async (novos: Atleta[]) => {
    if (user) {
      for (const novo of novos) {
        const antigo = db.atletas.find(a => a.id === novo.id);
        let finalAtleta = { ...novo };
        if (antigo && novo.time !== antigo.time) {
          const historico = antigo.historicoTimes || [];
          finalAtleta.historicoTimes = [...historico, antigo.time];
        }
        const { id, ...data } = finalAtleta;
        await setDoc(doc(firestore, 'atletas', id.toString()), data, { merge: true });
      }
    } else {
      setDb(prev => {
        const finalAtletas = novos.map(novo => {
          const antigo = prev.atletas.find(a => a.id === novo.id);
          if (antigo && novo.time !== antigo.time) {
            const historico = antigo.historicoTimes || [];
            return {
              ...novo,
              historicoTimes: [...historico, antigo.time]
            };
          }
          return novo;
        });
        return { ...prev, atletas: finalAtletas };
      });
    }
  };

  const removeAtleta = (id: string | number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Atleta',
      message: 'Tem certeza que deseja excluir este atleta?',
      onConfirm: async () => {
        if (user) {
          await deleteDoc(doc(firestore, 'atletas', id.toString()));
        } else {
          setDb(prev => ({
            ...prev,
            atletas: prev.atletas.filter(a => a.id !== id)
          }));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addFinanceiro = async (lancamento: any) => {
    if (user) {
      await addDoc(collection(firestore, 'financeiro'), lancamento);
    } else {
      const novo = { ...lancamento, id: Date.now() };
      setDb(prev => ({ ...prev, financeiro: [...prev.financeiro, novo] }));
    }
  };

  const updateFinanceiro = async (lancamento: any) => {
    if (user) {
      const { id, ...data } = lancamento;
      await setDoc(doc(firestore, 'financeiro', id.toString()), data, { merge: true });
    } else {
      setDb(prev => ({
        ...prev,
        financeiro: prev.financeiro.map(l => l.id === lancamento.id ? lancamento : l)
      }));
    }
  };

  const removeFinanceiro = async (id: string | number) => {
    if (user) {
      await deleteDoc(doc(firestore, 'financeiro', id.toString()));
    } else {
      setDb(prev => ({
        ...prev,
        financeiro: prev.financeiro.filter(l => l.id !== id)
      }));
    }
  };

  const addGol = async (gol: Omit<Gol, 'id'>) => {
    if (user) {
      await addDoc(collection(firestore, 'gols'), gol);
    } else {
      const novo = { ...gol, id: Date.now() };
      setDb(prev => ({ ...prev, gols: [...(prev.gols || []), novo] }));
    }
  };

  const removeGol = async (id: string | number) => {
    if (user) {
      await deleteDoc(doc(firestore, 'gols', id.toString()));
    } else {
      setDb(prev => ({
        ...prev,
        gols: (prev.gols || []).filter(g => g.id !== id)
      }));
    }
  };

  const updateGol = async (gol: Gol) => {
    if (user) {
      const { id, ...data } = gol;
      await setDoc(doc(firestore, 'gols', id.toString()), data, { merge: true });
    } else {
      setDb(prev => ({
        ...prev,
        gols: (prev.gols || []).map(g => g.id === gol.id ? gol : g)
      }));
    }
  };

  const removeRodada = (rodada: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Resultado',
      message: `Tem certeza que deseja excluir todos os registros da ${rodada}ª Rodada? Esta ação é irreversível.`,
      onConfirm: async () => {
        if (user) {
          const q = query(collection(firestore, 'gols'), where('rodada', '==', rodada));
          const snap = await getDocs(q);
          const batch = writeBatch(firestore);
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        } else {
          setDb(prev => ({
            ...prev,
            gols: (prev.gols || []).filter(g => g.rodada !== rodada)
          }));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditAtleta = (atleta: Atleta) => {
    setEditingId(atleta.id);
    setEditingCodigo(atleta.codigo);
    setActiveTab('atletas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-3 md:py-4 gap-3 md:gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <Activity className="text-white w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="flex-grow">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 leading-tight">Club dos Amigos</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Arena Osman Loureiro</p>
              </div>
            </div>
            
            <nav className="flex space-x-1 bg-gray-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'atletas', icon: Users, label: 'Atletas' },
                { id: 'financeiro', icon: CreditCard, label: 'Financeiro' },
                { id: 'artilharia', icon: Trophy, label: 'Artilharia' },
                { id: 'resultados', icon: LayoutGrid, label: 'Resultados' },
                { id: 'sorteio', icon: Shuffle, label: 'Sorteio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              {isAuthReady && (
                user ? (
                  <div className="flex items-center gap-3 bg-gray-50 p-1 pr-3 rounded-xl border border-gray-200 w-full md:w-auto">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-lg shadow-sm" referrerpolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 md:max-w-[120px]">
                      <p className="text-xs font-bold text-gray-900 truncate leading-none">{user.displayName || 'Usuário'}</p>
                      <p className="text-[10px] text-green-600 font-bold">Online</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Sair"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50 transition-all w-full md:w-auto shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    ACESSAR CLUBE
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'atletas' && (
              <AtletasSection 
                atletas={db.atletas} 
                onAdd={addAtleta} 
                onUpdate={updateAtleta}
                onRemove={removeAtleta} 
                onShowAlert={(title, message) => setAlertModal({ isOpen: true, title, message })}
                onQuickGoal={(atleta) => setQuickGoalModal({ isOpen: true, atleta })}
                editingId={editingId}
                setEditingId={setEditingId}
                editingCodigo={editingCodigo}
                setEditingCodigo={setEditingCodigo}
              />
            )}
            {activeTab === 'financeiro' && (
              <FinanceiroSection 
                atletas={db.atletas}
                lancamentos={db.financeiro}
                onAdd={addFinanceiro}
                onUpdate={updateFinanceiro}
                onRemove={removeFinanceiro}
              />
            )}
            {activeTab === 'artilharia' && (
              <ArtilhariaSection 
                atletas={db.atletas}
                gols={db.gols || []}
                onAdd={addGol}
                onUpdate={updateGol}
                onRemove={removeGol}
              />
            )}
            {activeTab === 'resultados' && (
              <ResultadosSection 
                atletas={db.atletas}
                gols={db.gols || []}
                onRemoveGol={removeGol}
                onUpdateGol={updateGol}
                onRemoveRodada={removeRodada}
              />
            )}
            {activeTab === 'sorteio' && (
              <SorteioSection 
                atletas={db.atletas}
                onUpdateAtletas={updateAtletas}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Club dos Amigos - Arena Osman Loureiro</p>
        </div>
      </footer>

      {/* Custom Modals */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                <p className="text-gray-600">{confirmModal.message}</p>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-200 transition-all"
                >
                  EXCLUIR
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {alertModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{alertModal.title}</h3>
                <p className="text-gray-600">{alertModal.message}</p>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <QuickGoalModal 
          isOpen={quickGoalModal.isOpen}
          atleta={quickGoalModal.atleta}
          goals={db.gols || []}
          onClose={() => setQuickGoalModal({ isOpen: false, atleta: null })}
          onConfirm={(gol) => {
            addGol(gol);
            setQuickGoalModal({ isOpen: false, atleta: null });
          }}
        />
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function AtletaEditModal({ 
  isOpen, 
  atleta, 
  onClose, 
  onConfirm,
  onRemove
}: {
  isOpen: boolean;
  atleta: Atleta | null;
  onClose: () => void;
  onConfirm: (a: Atleta) => void;
  onRemove: (id: string | number) => void;
}) {
  const [formData, setFormData] = useState<Omit<Atleta, 'id' | 'codigo'>>({
    nome: '',
    time: '' as any,
    camisa: '',
    status: 'Ativo',
    dataCadastro: '',
    dataInativacao: undefined,
    obs: '',
    dataNascimento: '',
    posicaoPrincipal: '',
    posicaoSecundaria: '',
    classificacao: 'Atleta',
    pontuacao: 0
  });

  useEffect(() => {
    if (atleta && isOpen) {
      setFormData({
        nome: atleta.nome,
        time: atleta.time,
        camisa: atleta.camisa,
        status: atleta.status || 'Ativo',
        dataCadastro: atleta.dataCadastro || '',
        dataInativacao: atleta.dataInativacao,
        obs: atleta.obs,
        dataNascimento: atleta.dataNascimento || '',
        posicaoPrincipal: atleta.posicaoPrincipal || '',
        posicaoSecundaria: atleta.posicaoSecundaria || '',
        classificacao: atleta.classificacao || 'Atleta',
        pontuacao: atleta.pontuacao || 0
      });
    }
  }, [atleta, isOpen]);

  if (!isOpen || !atleta) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Lógica de inativação
    let dataInativacao = formData.dataInativacao;
    if (formData.status === 'Inativo' && atleta.status !== 'Inativo') {
      dataInativacao = getLocalDate();
    } else if (formData.status !== 'Inativo') {
      dataInativacao = undefined;
    }

    onConfirm({ ...formData, id: atleta.id, codigo: atleta.codigo, dataInativacao });
  };

  const themeColor = formData.time === 'Azul' ? 'blue' : formData.time === 'Vermelho' ? 'red' : 'gray';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className={`p-6 border-b border-gray-100 flex items-center justify-between border-t-4 flex-none ${
          themeColor === 'blue' ? 'border-blue-600' : 
          themeColor === 'red' ? 'border-red-600' : 
          'border-gray-300'
        }`}>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Edit2 className={`w-5 h-5 mr-2 ${
              themeColor === 'blue' ? 'text-blue-600' : 
              themeColor === 'red' ? 'text-red-600' : 
              'text-gray-400'
            }`} />
            Editar Atleta
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Código</label>
              <input type="text" value={atleta.codigo} readOnly className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono outline-none" />
            </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
            <input 
              type="text" 
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
            <select 
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value as any})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Escolha o Time</option>
              <option value="Azul">Time Azul</option>
              <option value="Vermelho">Time Vermelho</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Camisa</label>
            <input 
              type="text" 
              value={formData.camisa}
              onChange={e => setFormData({...formData, camisa: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Depto. Médico">Depto. Médico</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Classificação</label>
            <select 
              value={formData.classificacao}
              onChange={e => setFormData({...formData, classificacao: e.target.value as any})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Atleta">Atleta</option>
              <option value="Membro Diretoria">Membro Diretoria</option>
            </select>
          </div>
          <PontuacaoInput 
            label="Pontuação"
            value={formData.pontuacao || 0}
            onChange={v => setFormData({...formData, pontuacao: v})}
            theme={themeColor}
          />
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Data Nasc.</label>
            <input 
              type="date" 
              value={formData.dataNascimento}
              onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Idade</label>
            <input type="text" value={calculateAge(formData.dataNascimento)} readOnly className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Posição Principal</label>
            <select 
              value={formData.posicaoPrincipal}
              onChange={e => setFormData({...formData, posicaoPrincipal: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Escolha a Posição</option>
              {POSICOES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Posição Secundária</label>
            <select 
              value={formData.posicaoSecundaria}
              onChange={e => setFormData({...formData, posicaoSecundaria: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Escolha a Posição (Opcional)</option>
              {POSICOES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Data Cadastro</label>
            <input 
              type="date" 
              value={formData.dataCadastro}
              onChange={e => setFormData({...formData, dataCadastro: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Observação</label>
            <input 
              type="text" 
              value={formData.obs}
              onChange={e => setFormData({...formData, obs: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-3 flex-none">
            <button 
              type="submit" 
              className={`flex-1 font-bold py-3 rounded-xl transition-all flex items-center justify-center text-white shadow-lg ${
                themeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 
                themeColor === 'red' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 
                'bg-gray-800 hover:bg-gray-900 shadow-gray-100'
              }`}
            >
              <Check className="w-5 h-5 mr-2" />
              ATUALIZAR ATLETA
            </button>
            <button 
              type="button"
              onClick={() => onRemove(atleta.id)}
              className="px-6 py-3 border-2 border-red-50 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              EXCLUIR
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AtletasSection({ atletas, onAdd, onUpdate, onRemove, onShowAlert, onQuickGoal, editingId, setEditingId, editingCodigo, setEditingCodigo }: { 
  atletas: Atleta[], 
  onAdd: (a: Omit<Atleta, 'id' | 'codigo'>) => void,
  onUpdate: (a: Atleta) => void,
  onRemove: (id: string | number) => void,
  onShowAlert: (title: string, message: string) => void,
  onQuickGoal: (atleta: Atleta) => void,
  editingId: string | number | null,
  setEditingId: (id: string | number | null) => void,
  editingCodigo: string | null,
  setEditingCodigo: (c: string | null) => void
}) {
  const [formData, setFormData] = useState<Omit<Atleta, 'id' | 'codigo'>>({
    nome: '',
    time: '' as any,
    camisa: '',
    status: 'Ativo',
    dataCadastro: '',
    dataInativacao: undefined,
    obs: '',
    dataNascimento: '',
    posicaoPrincipal: '',
    posicaoSecundaria: '',
    classificacao: 'Atleta',
    pontuacao: 0
  });

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTime, setFiltroTime] = useState<'Todos' | 'Azul' | 'Vermelho'>('Todos');

  // Sync form data - removed because we now use a Modal for editing
  useEffect(() => {
    // No longer syncing inline form with editingId
  }, [editingId, atletas]);

  const countAzul = atletas.filter(a => a.time === 'Azul').length;
  const countVermelho = atletas.filter(a => a.time === 'Vermelho').length;
  const countTotal = atletas.length;

  const countAtivo = atletas.filter(a => a.status === 'Ativo').length;
  const countInativo = atletas.filter(a => a.status === 'Inativo').length;
  const countDM = atletas.filter(a => a.status === 'Depto. Médico').length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
      onShowAlert('Atenção', 'Por favor, escolha o time do atleta.');
      return;
    }
    if (!formData.dataCadastro) {
      onShowAlert('Atenção', 'Por favor, preencha a data de cadastro.');
      return;
    }
    
    const dataInativacao = formData.status === 'Inativo' ? getLocalDate() : undefined;
    onAdd({ ...formData, dataInativacao });
    
    setFormData({ 
      nome: '', 
      time: '' as any, 
      camisa: '', 
      status: 'Ativo', 
      dataCadastro: '', 
      dataInativacao: undefined, 
      obs: '',
      dataNascimento: '',
      posicaoPrincipal: '',
      posicaoSecundaria: '',
      classificacao: 'Atleta',
      pontuacao: 0
    });
  };

  const handleEdit = (atleta: Atleta) => {
    setEditingId(atleta.id);
  };

  const handleExport = () => {
    const headers = ['id', 'codigo', 'nome', 'time', 'camisa', 'status', 'posicaoPrincipal', 'posicaoSecundaria', 'dataCadastro', 'classificacao', 'pontuacao', 'obs'];
    downloadCSV(atletas, 'atletas-clube', headers);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingCodigo(null);
    setFormData({ 
      nome: '', 
      time: '' as any, 
      camisa: '', 
      status: 'Ativo', 
      dataCadastro: getLocalDate(), 
      dataInativacao: undefined, 
      obs: '',
      dataNascimento: '',
      posicaoPrincipal: '',
      posicaoSecundaria: '',
      classificacao: 'Atleta',
      pontuacao: 0
    });
  };

  const themeColor = formData.time === 'Azul' ? 'blue' : formData.time === 'Vermelho' ? 'red' : 'gray';

  return (
    <div className="space-y-6">
      {/* Resumo de Atletas */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-600 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Azul</p>
              <p className="text-2xl font-black text-blue-600">{countAzul}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-red-600 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Vermelho</p>
              <p className="text-2xl font-black text-red-600">{countVermelho}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Atletas</p>
              <p className="text-2xl font-black text-gray-800">{countTotal}</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-800" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-green-600 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos</p>
              <p className="text-2xl font-black text-green-600">{countAtivo}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-orange-600 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Depto. Médico</p>
              <p className="text-2xl font-black text-orange-600">{countDM}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-gray-400 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inativos</p>
              <p className="text-2xl font-black text-gray-400">{countInativo}</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-2xl shadow-sm border-t-4 ${
        themeColor === 'blue' ? 'border-blue-600' : 
        themeColor === 'red' ? 'border-red-600' : 
        'border-gray-300'
      } overflow-hidden transition-all duration-300`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between font-bold">
          <h2 className="text-lg font-bold flex items-center">
            <UserPlus className={`w-5 h-5 mr-2 text-gray-400`} />
            Cadastrar Novo Atleta
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Código</label>
            <input 
              type="text" 
              value={'Automático'} 
              readOnly 
              className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none font-mono" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
            <input 
              type="text" 
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } focus:border-transparent outline-none transition-all`} 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
            <select 
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value as any})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
              required
            >
              <option value="">Escolha o Time</option>
              <option value="Azul">Time Azul</option>
              <option value="Vermelho">Time Vermelho</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nº Camisa</label>
            <input 
              type="text" 
              value={formData.camisa}
              onChange={e => setFormData({...formData, camisa: e.target.value})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`} 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Depto. Médico">Depto. Médico</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Classificação</label>
            <select 
              value={formData.classificacao}
              onChange={e => setFormData({...formData, classificacao: e.target.value as any})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
            >
              <option value="Atleta">Atleta</option>
              <option value="Membro Diretoria">Membro Diretoria</option>
            </select>
          </div>
          <PontuacaoInput 
            label="Pontuação"
            value={formData.pontuacao || 0}
            onChange={v => setFormData({...formData, pontuacao: v})}
            theme={themeColor}
          />
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Data Nasc.</label>
            <input 
              type="date" 
              value={formData.dataNascimento}
              onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Idade (Automático)</label>
            <input 
              type="text" 
              value={calculateAge(formData.dataNascimento)}
              readOnly
              placeholder="Preencha o nascimento"
              className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Posição Principal</label>
            <select 
              value={formData.posicaoPrincipal}
              onChange={e => setFormData({...formData, posicaoPrincipal: e.target.value})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
            >
              <option value="">Escolha a Posição</option>
              {POSICOES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Posição Secundária</label>
            <select 
              value={formData.posicaoSecundaria}
              onChange={e => setFormData({...formData, posicaoSecundaria: e.target.value})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
            >
              <option value="">Escolha a Posição (Opcional)</option>
              {POSICOES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Data Cadastro</label>
            <input 
              type="date" 
              value={formData.dataCadastro}
              onChange={e => setFormData({...formData, dataCadastro: e.target.value})}
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`}
              required
            />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Observação</label>
            <input 
              type="text" 
              value={formData.obs}
              onChange={e => setFormData({...formData, obs: e.target.value})}
              placeholder="Alguma nota importante..." 
              className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
                themeColor === 'blue' ? 'focus:ring-blue-500' : 
                themeColor === 'red' ? 'focus:ring-red-500' : 
                'focus:ring-gray-400'
              } outline-none transition-all`} 
            />
          </div>
          <div className="md:col-span-3 flex flex-col md:flex-row gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-gray-800 hover:bg-gray-900 shadow-gray-200 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              SALVAR ATLETA
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className={`bg-white rounded-2xl shadow-sm border-2 ${
        filtroTime === 'Azul' ? 'border-blue-100' : 
        filtroTime === 'Vermelho' ? 'border-red-100' : 
        'border-gray-100'
      } p-4 flex flex-col md:flex-row gap-4 items-center transition-all duration-300`}>
        <div className="relative flex-1 w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            filtroTime === 'Azul' ? 'text-blue-400' : 
            filtroTime === 'Vermelho' ? 'text-red-400' : 
            'text-gray-400'
          }`} />
          <input 
            type="text" 
            placeholder="Buscar atleta por nome..." 
            value={filtroNome}
            onChange={e => setFiltroNome(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ${
              filtroTime === 'Azul' ? 'focus:ring-blue-500' : 
              filtroTime === 'Vermelho' ? 'focus:ring-red-500' : 
              'focus:ring-blue-500'
            } outline-none transition-all text-sm`}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className={`w-4 h-4 ${
            filtroTime === 'Azul' ? 'text-blue-400' : 
            filtroTime === 'Vermelho' ? 'text-red-400' : 
            'text-gray-400'
          }`} />
          <select 
            value={filtroTime}
            onChange={e => setFiltroTime(e.target.value as any)}
            className={`flex-1 md:w-48 py-2 px-3 font-bold rounded-xl focus:ring-2 outline-none text-sm transition-all ${
              filtroTime === 'Azul' ? 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500' : 
              filtroTime === 'Vermelho' ? 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500' : 
              'bg-gray-50 border-gray-200 text-gray-700 focus:ring-blue-500'
            }`}
          >
            <option value="Todos">Todos os Times</option>
            <option value="Azul">Time Azul</option>
            <option value="Vermelho">Time Vermelho</option>
          </select>
          <button 
            onClick={handleExport}
            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center font-bold"
            title="Exportar Atletas para CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-2xl shadow-sm border-2 ${
        filtroTime === 'Azul' ? 'border-blue-100' : 
        filtroTime === 'Vermelho' ? 'border-red-100' : 
        'border-gray-100'
      } overflow-hidden transition-all duration-300`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`${
              filtroTime === 'Azul' ? 'bg-blue-50' : 
              filtroTime === 'Vermelho' ? 'bg-red-50' : 
              'bg-gray-50'
            } border-b border-gray-100 transition-colors duration-300`}>
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cód</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nome / Classif.</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Time</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Posição</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Idade</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {atletas.filter(a => {
                const matchNome = a.nome.toLowerCase().includes(filtroNome.toLowerCase());
                const matchTime = filtroTime === 'Todos' || a.time === filtroTime;
                return matchNome && matchTime;
              }).sort((a, b) => a.nome.localeCompare(b.nome)).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">Nenhum atleta encontrado com os filtros.</td>
                </tr>
              ) : (
                atletas.filter(a => {
                  const matchNome = a.nome.toLowerCase().includes(filtroNome.toLowerCase());
                  const matchTime = filtroTime === 'Todos' || a.time === filtroTime;
                  return matchNome && matchTime;
                }).sort((a, b) => a.nome.localeCompare(b.nome)).map(atleta => (
                  <tr key={atleta.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                    <td className="p-4 font-mono text-xs text-gray-400">#{atleta.codigo || atleta.id.toString().slice(-4)}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-gray-900">{atleta.nome}</p>
                        <div className="flex items-center">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{atleta.classificacao || 'Atleta'}</p>
                          <RenderPontuacao pontuacao={atleta.pontuacao} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        atleta.time === 'Azul' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {atleta.time}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-700">{atleta.posicaoPrincipal || '-'}</p>
                      {atleta.posicaoSecundaria && (
                        <p className="text-[10px] text-gray-400 italic font-medium">{atleta.posicaoSecundaria}</p>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {calculateAge(atleta.dataNascimento) || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          atleta.status === 'Ativo' ? 'bg-green-50 text-green-600' : 
                          atleta.status === 'Depto. Médico' ? 'bg-orange-50 text-orange-600' : 
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {atleta.status}
                        </span>
                        {renderHistorico(atleta.historicoTimes)}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button 
                        onClick={() => onQuickGoal(atleta)}
                        className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors" 
                        title="Registrar Gol"
                      >
                        <Target className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleEdit(atleta)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Editar Atleta"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onRemove(atleta.id)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Atleta"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AtletaEditModal 
        isOpen={editingId !== null}
        atleta={atletas.find(a => a.id === editingId) || null}
        onClose={() => setEditingId(null)}
        onConfirm={(updated) => {
          onUpdate(updated);
          setEditingId(null);
        }}
        onRemove={(id) => {
          onRemove(id);
          setEditingId(null);
        }}
      />
    </div>
  );
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function FinanceiroSection({ atletas, lancamentos, onAdd, onUpdate, onRemove }: { 
  atletas: Atleta[], 
  lancamentos: LancamentoFinanceiro[],
  onAdd: (l: Omit<LancamentoFinanceiro, 'id'>) => void,
  onUpdate: (l: LancamentoFinanceiro) => void,
  onRemove: (id: string | number) => void
}) {
  const [valores, setValores] = useState<Record<string | number, string>>({});
  const [statusRegistros, setStatusRegistros] = useState<Record<string | number, 'Pago' | 'Pendente'>>({});
  const [tiposRegistros, setTiposRegistros] = useState<Record<string | number, 'Normal' | 'Social'>>({});
  const [cestaBasicaRegistros, setCestaBasicaRegistros] = useState<Record<string | number, boolean>>({});
  const [datasPagamento, setDatasPagamento] = useState<Record<string | number, string>>({});
  const [mesReferencia, setMesReferencia] = useState(MESES[new Date().getMonth()]);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());
  const [filtroStatusTopo, setFiltroStatusTopo] = useState<'Todos' | 'Pago' | 'Pendente'>('Todos');
  const [filtroAtletaNomeTopo, setFiltroAtletaNomeTopo] = useState('');
  const [filtroAtletaIdTopo, setFiltroAtletaIdTopo] = useState<number | 'Todos'>('Todos');
  const [filtroAtleta, setFiltroAtleta] = useState('');
  const [filtroAtletaId, setFiltroAtletaId] = useState<number | 'Todos'>('Todos');
  const [filtroTime, setFiltroTime] = useState<'Todos' | 'Azul' | 'Vermelho'>('Todos');
  const [filtroMesHistorico, setFiltroMesHistorico] = useState<string | 'Todos'>('Todos');
  const [filtroAnoHistorico, setFiltroAnoHistorico] = useState<number | 'Todos'>('Todos');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<LancamentoFinanceiro | null>(null);

  // Limpar estados de registro ao mudar o mês ou ano de referência
  useEffect(() => {
    setValores({});
    setStatusRegistros({});
    setTiposRegistros({});
    setCestaBasicaRegistros({});
    setDatasPagamento({});
  }, [mesReferencia, anoReferencia]);

  const atletasAtivos = atletas.filter(a => {
    // 1. Verificar Data de Cadastro
    const dateCad = new Date(a.dataCadastro);
    const mesCadIndex = dateCad.getUTCMonth();
    const anoCad = dateCad.getUTCFullYear();
    const mesRefIndex = MESES.indexOf(mesReferencia);

    const cadastradoNoMesOuAntes = (anoReferencia > anoCad) || (anoReferencia === anoCad && mesRefIndex >= mesCadIndex);
    if (!cadastradoNoMesOuAntes) return false;

    // 2. Verificar Status e Inativação
    if (a.status === 'Ativo' || a.status === 'Depto. Médico') return true;
    if (a.status === 'Inativo' && a.dataInativacao) {
      const dateInat = new Date(a.dataInativacao);
      const mesInatIndex = dateInat.getUTCMonth();
      const anoInat = dateInat.getUTCFullYear();
      
      // Se o ano de referência for menor que o de inativação, ele aparece
      if (anoReferencia < anoInat) return true;
      
      // Se o ano for o mesmo
      if (anoReferencia === anoInat) {
        // Se o mês de referência for anterior ao de inativação, ele aparece
        if (mesRefIndex < mesInatIndex) return true;
        
        // Se o mês de referência for o mesmo da inativação
        if (mesRefIndex === mesInatIndex) {
          // Só aparece se realizou pagamento neste mês
          const temPagamentoNoMes = lancamentos.some(l => 
            l.atletaId === a.id && 
            l.mesReferencia === mesReferencia && 
            l.anoReferencia === anoReferencia && 
            l.status === 'Pago'
          );
          return temPagamentoNoMes;
        }
      }
      
      // Se o ano for maior ou o mês for posterior à inativação, ele não aparece
      return false;
    }
    return false;
  });

  const handleRegistrar = (atletaId: string | number) => {
    const valorStr = valores[atletaId] || '';
    const valor = parseFloat(valorStr);
    const status = statusRegistros[atletaId] || ((!isNaN(valor) && valor > 0) ? 'Pago' : 'Pendente');
    const tipo = tiposRegistros[atletaId] || (valor > getMensalidade(anoReferencia) ? 'Social' : 'Normal');
    const cestaBasica = cestaBasicaRegistros[atletaId] ?? (tipo === 'Social');
    const dataPagamento = datasPagamento[atletaId] || getLocalDate();
    
    const novoLancamento: Omit<LancamentoFinanceiro, 'id'> = {
      atletaId,
      valor: isNaN(valor) ? 0 : valor,
      dataPagamento: dataPagamento,
      mesReferencia: mesReferencia,
      anoReferencia: anoReferencia,
      status: status,
      tipo: tipo,
      cestaBasica: cestaBasica
    };

    onAdd(novoLancamento);
    // Limpar o campo após registrar
    setValores(prev => ({ ...prev, [atletaId]: '' }));
    setDatasPagamento(prev => {
      const next = { ...prev };
      delete next[atletaId];
      return next;
    });
    setStatusRegistros(prev => {
      const next = { ...prev };
      delete next[atletaId];
      return next;
    });
    setTiposRegistros(prev => {
      const next = { ...prev };
      delete next[atletaId];
      return next;
    });
    setCestaBasicaRegistros(prev => {
      const next = { ...prev };
      delete next[atletaId];
      return next;
    });
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (editData) {
      onUpdate(editData);
      setEditingId(null);
      setEditData(null);
    }
  };

  const limparFiltrosTopo = () => {
    setFiltroStatusTopo('Todos');
    setFiltroAtletaNomeTopo('');
    setFiltroAtletaIdTopo('Todos');
    setFiltroAtleta('');
    setFiltroAtletaId('Todos');
    setFiltroTime('Todos');
    setFiltroMesHistorico('Todos');
    setFiltroAnoHistorico('Todos');
    setMesReferencia(MESES[new Date().getMonth()]);
    setAnoReferencia(new Date().getFullYear());
  };

  const handleExport = () => {
    const dataToExport = lancamentos.map(l => {
      const atleta = atletas.find(a => a.id === l.atletaId);
      return {
        ...l,
        atletaNome: atleta?.nome || 'Excluído',
        atletaCodigo: atleta?.codigo || '---'
      };
    });
    const headers = ['id', 'atletaNome', 'atletaCodigo', 'valor', 'status', 'tipo', 'cestaBasica', 'mesReferencia', 'anoReferencia', 'dataPagamento'];
    downloadCSV(dataToExport, 'financeiro-clube', headers);
  };

  const getStatusNoMes = (atletaId: string | number, mes: string, ano: number) => {
    // Busca se existe algum lançamento para este atleta neste mês e ano de referência
    const registro = lancamentos.find(l => l.atletaId === atletaId && l.mesReferencia === mes && l.anoReferencia === ano);
    return registro;
  };

  const getMensalidade = (ano: number) => {
    if (ano === 2025) return 25.00;
    if (ano === 2026) return 30.00;
    return 30.00; // Default para outros anos
  };

  const receitaPrevista = atletasAtivos.length * getMensalidade(anoReferencia);
  const atletasAtivosIds = new Set(atletasAtivos.map(a => a.id));
  const receitaLiquida = lancamentos
    .filter(l => 
      l.mesReferencia === mesReferencia && 
      l.anoReferencia === anoReferencia && 
      l.status === 'Pago' &&
      atletasAtivosIds.has(l.atletaId)
    )
    .reduce((acc, curr) => acc + curr.valor, 0);

  const percentualReceita = receitaPrevista > 0 ? (receitaLiquida / receitaPrevista) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Receita Prevista */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receita Prevista</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">R$ {receitaPrevista.toFixed(2)}</h3>
            <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase">Baseada em atletas ativos</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card: Receita Líquida */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receita Líquida</p>
            <h3 className="text-2xl font-black text-emerald-600 leading-none">R$ {receitaLiquida.toFixed(2)}</h3>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${percentualReceita >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {percentualReceita.toFixed(1)}%
              </span>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Aproveitamento</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Card: Mensalidade Atual */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Mensalidade</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">R$ {getMensalidade(anoReferencia).toFixed(2)}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">Referente ao ano {anoReferencia}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card: Atletas Pendentes */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
          {(() => {
            const pendentes = atletasAtivos.length - lancamentos.filter(l => l.mesReferencia === mesReferencia && l.anoReferencia === anoReferencia && l.status === 'Pago' && atletasAtivosIds.has(l.atletaId)).length;
            return (
              <>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Atletas Pendentes</p>
                  <h3 className="text-2xl font-black text-red-600 leading-none">{pendentes}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">Ação necessária</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                  <CreditCard className="w-5 h-5" />
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-lg font-bold flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Gestão de Mensalidades
            </h2>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                {MESES.map(m => (
                  <button
                    key={m}
                    onClick={() => setMesReferencia(m)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${mesReferencia === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
              <select 
                value={anoReferencia}
                onChange={e => setAnoReferencia(Number(e.target.value))}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-50">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Filtrar por nome do atleta..." 
                value={filtroAtletaNomeTopo}
                onChange={e => setFiltroAtletaNomeTopo(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={filtroStatusTopo}
                onChange={e => setFiltroStatusTopo(e.target.value as any)}
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>

            <button 
              onClick={handleExport}
              className="p-2.5 text-green-600 hover:bg-green-50 border border-gray-200 rounded-xl transition-all"
              title="Exportar Financeiro para CSV"
            >
              <Download className="w-5 h-5" />
            </button>

            <button 
              onClick={limparFiltrosTopo}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-xl transition-all"
              title="Limpar Filtros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Time</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status no Mês</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Valor (R$)</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Cesta Básica</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data Pagto</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(() => {
                const filtered = atletasAtivos.filter(atleta => {
                  const registro = getStatusNoMes(atleta.id, mesReferencia, anoReferencia);
                  const statusNoMes = registro ? registro.status : 'Pendente';
                  const matchStatus = filtroStatusTopo === 'Todos' || statusNoMes === filtroStatusTopo;
                  const matchId = filtroAtletaIdTopo === 'Todos' || atleta.id === filtroAtletaIdTopo;
                  const matchNome = atleta.nome.toLowerCase().includes(filtroAtletaNomeTopo.toLowerCase());
                  return matchStatus && matchId && matchNome;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 italic">Nenhum atleta encontrado com este status no mês/ano.</td>
                    </tr>
                  );
                }

                return filtered.map(atleta => {
                  const registro = getStatusNoMes(atleta.id, mesReferencia, anoReferencia);
                  return (
                    <tr key={atleta.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{atleta.nome}</p>
                        <p className="text-[10px] text-gray-400 font-mono">#{atleta.codigo}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${atleta.time === 'Azul' ? 'bg-blue-600' : 'bg-red-600'}`}>
                          {atleta.time}
                        </span>
                      </td>
                      <td className="p-4">
                        {registro ? (
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold ${registro.status === 'Pago' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {registro.status} (R$ {registro.valor.toFixed(2)})
                            </span>
                            <span className="text-[9px] text-gray-400">Pago em: {formatDate(registro.dataPagamento)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-red-500 font-black uppercase italic">Pendente</span>
                        )}
                      </td>
                      <td className="p-4">
                        {!registro ? (
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            value={valores[atleta.id] || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setValores(prev => ({ ...prev, [atleta.id]: val }));
                              const numVal = parseFloat(val);
                              if (!isNaN(numVal)) {
                                if (numVal > getMensalidade(anoReferencia)) {
                                  setTiposRegistros(prev => ({ ...prev, [atleta.id]: 'Social' }));
                                  setCestaBasicaRegistros(prev => ({ ...prev, [atleta.id]: true }));
                                } else {
                                  setTiposRegistros(prev => ({ ...prev, [atleta.id]: 'Normal' }));
                                  setCestaBasicaRegistros(prev => ({ ...prev, [atleta.id]: false }));
                                }
                              }
                            }}
                            className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">R$ {registro.valor.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {!registro ? (
                          <select
                            value={statusRegistros[atleta.id] || (parseFloat(valores[atleta.id] || '0') > 0 ? 'Pago' : 'Pendente')}
                            onChange={e => setStatusRegistros(prev => ({ ...prev, [atleta.id]: e.target.value as 'Pago' | 'Pendente' }))}
                            className={`p-2 border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-green-500 ${
                              (statusRegistros[atleta.id] || (parseFloat(valores[atleta.id] || '0') > 0 ? 'Pago' : 'Pendente')) === 'Pago' 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                            }`}
                          >
                            <option value="Pago">Pago</option>
                            <option value="Pendente">Pendente</option>
                          </select>
                        ) : (
                          <span className={`text-[10px] font-black uppercase ${registro.status === 'Pago' ? 'text-green-600' : 'text-yellow-600'}`}>{registro.status}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {!registro ? (
                          <div className="flex justify-center">
                            <input 
                              type="checkbox"
                              checked={cestaBasicaRegistros[atleta.id] ?? (tiposRegistros[atleta.id] === 'Social' || (parseFloat(valores[atleta.id] || '0') > getMensalidade(anoReferencia)))}
                              onChange={e => setCestaBasicaRegistros(prev => ({ ...prev, [atleta.id]: e.target.checked }))}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            {registro.cestaBasica ? (
                              <div className="bg-blue-100 p-1 rounded-full">
                                <Check className="w-3 h-3 text-blue-600" />
                              </div>
                            ) : (
                              <X className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {!registro ? (
                          <select
                            value={tiposRegistros[atleta.id] || (parseFloat(valores[atleta.id] || '0') > getMensalidade(anoReferencia) ? 'Social' : 'Normal')}
                            onChange={e => {
                              const newTipo = e.target.value as 'Normal' | 'Social';
                              setTiposRegistros(prev => ({ ...prev, [atleta.id]: newTipo }));
                              // Auto check/uncheck based on requirement
                              setCestaBasicaRegistros(prev => ({ ...prev, [atleta.id]: newTipo === 'Social' }));
                            }}
                            className={`p-2 border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-green-500 ${
                              (tiposRegistros[atleta.id] || (parseFloat(valores[atleta.id] || '0') > getMensalidade(anoReferencia) ? 'Social' : 'Normal')) === 'Social'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                          >
                            <option value="Normal">Normal</option>
                            <option value="Social">Social</option>
                          </select>
                        ) : (
                          <span className={`text-[10px] font-black uppercase ${registro.tipo === 'Social' ? 'text-purple-600' : 'text-blue-600'}`}>{registro.tipo}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {!registro ? (
                          <input 
                            type="date" 
                            value={datasPagamento[atleta.id] || getLocalDate()}
                            onChange={e => setDatasPagamento(prev => ({ ...prev, [atleta.id]: e.target.value }))}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-green-500 transition-all"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400">{formatDate(registro.dataPagamento)}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!registro ? (
                          <button 
                            onClick={() => handleRegistrar(atleta.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-md shadow-green-100 transition-all flex items-center ml-auto"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            CONFIRMAR
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center justify-end">
                            <Check className="w-3 h-3 mr-1" />
                            Lançado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
            <History className="w-4 h-4 mr-2" />
            Histórico de Lançamentos
          </h3>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <button 
              onClick={limparFiltrosTopo}
              className="px-3 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest flex items-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </button>
            <select 
              value={filtroAtletaId}
              onChange={e => {
                const val = e.target.value;
                setFiltroAtletaId(val === 'Todos' ? 'Todos' : Number(val));
              }}
              className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xs"
            >
              <option value="Todos">Todos os Atletas</option>
              {atletas.sort((a, b) => a.nome.localeCompare(b.nome)).map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Filtrar por atleta..." 
                value={filtroAtleta}
                onChange={e => setFiltroAtleta(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xs w-full md:w-48"
              />
            </div>
            <select 
              value={filtroTime}
              onChange={e => setFiltroTime(e.target.value as any)}
              className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xs"
            >
              <option value="Todos">Todos os Times</option>
              <option value="Azul">Time Azul</option>
              <option value="Vermelho">Time Vermelho</option>
            </select>
            <select 
              value={filtroMesHistorico}
              onChange={e => setFiltroMesHistorico(e.target.value)}
              className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xs"
            >
              <option value="Todos">Todos os Meses</option>
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={filtroAnoHistorico}
              onChange={e => {
                const val = e.target.value;
                setFiltroAnoHistorico(val === 'Todos' ? 'Todos' : Number(val));
              }}
              className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xs"
            >
              <option value="Todos">Todos os Anos</option>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        
        <div className="space-y-3">
          {lancamentos.filter(f => {
            const atleta = atletas.find(a => a.id === f.atletaId);
            if (!atleta) return false;
            const matchAtletaId = filtroAtletaId === 'Todos' || f.atletaId === filtroAtletaId;
            const matchAtletaNome = atleta.nome.toLowerCase().includes(filtroAtleta.toLowerCase());
            const matchTime = filtroTime === 'Todos' || atleta.time === filtroTime;
            const matchMes = filtroMesHistorico === 'Todos' || f.mesReferencia === filtroMesHistorico;
            const matchAno = filtroAnoHistorico === 'Todos' || f.anoReferencia === filtroAnoHistorico;
            return matchAtletaId && matchAtletaNome && matchTime && matchMes && matchAno;
          }).length === 0 ? (
            <p className="text-center text-gray-400 py-8 italic">Nenhum pagamento encontrado com os filtros.</p>
          ) : (
            lancamentos.filter(f => {
              const atleta = atletas.find(a => a.id === f.atletaId);
              if (!atleta) return false;
              const matchAtletaId = filtroAtletaId === 'Todos' || f.atletaId === filtroAtletaId;
              const matchAtletaNome = atleta.nome.toLowerCase().includes(filtroAtleta.toLowerCase());
              const matchTime = filtroTime === 'Todos' || atleta.time === filtroTime;
              const matchMes = filtroMesHistorico === 'Todos' || f.mesReferencia === filtroMesHistorico;
              const matchAno = filtroAnoHistorico === 'Todos' || f.anoReferencia === filtroAnoHistorico;
              return matchAtletaId && matchAtletaNome && matchTime && matchMes && matchAno;
            }).sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime()).map(f => {
              const atleta = atletas.find(a => a.id === f.atletaId);
              const isEditing = editingId === f.id;

              if (isEditing && editData) {
                return (
                  <motion.form 
                    key={f.id} 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleUpdate}
                    className="p-4 bg-blue-50 rounded-2xl border border-blue-200 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Mês Ref.</label>
                      <select 
                        value={editData.mesReferencia}
                        onChange={e => setEditData({...editData, mesReferencia: e.target.value})}
                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                      >
                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Ano Ref.</label>
                      <select 
                        value={editData.anoReferencia}
                        onChange={e => setEditData({...editData, anoReferencia: Number(e.target.value)})}
                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                      >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={editData.valor}
                        onChange={e => setEditData({...editData, valor: Number(e.target.value), status: Number(e.target.value) > 0 ? 'Pago' : 'Pendente'})}
                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Data Pagto.</label>
                      <input 
                        type="date" 
                        value={editData.dataPagamento}
                        onChange={e => setEditData({...editData, dataPagamento: e.target.value})}
                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Tipo</label>
                      <select 
                        value={editData.tipo}
                        onChange={e => {
                          const newTipo = e.target.value as 'Normal' | 'Social';
                          setEditData({...editData, tipo: newTipo, cestaBasica: newTipo === 'Social'});
                        }}
                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                    <div className="space-y-1 flex flex-col items-center justify-center h-full">
                      <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Cesta Básica</label>
                      <input 
                        type="checkbox"
                        checked={editData.cestaBasica}
                        onChange={e => setEditData({...editData, cestaBasica: e.target.checked})}
                        className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg">SALVAR</button>
                      <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold py-2 rounded-lg">CANCELAR</button>
                    </div>
                  </motion.form>
                );
              }

              return (
                <div key={f.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group relative overflow-hidden">
                  {/* Accent bar based on team */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${atleta?.time === 'Azul' ? 'bg-blue-600' : 'bg-red-600'}`} />
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white font-black shadow-lg ${atleta?.time === 'Azul' ? 'bg-blue-600 shadow-blue-100' : 'bg-red-600 shadow-red-100'}`}>
                        {atleta?.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-900 leading-tight">{atleta?.nome || 'Atleta Excluído'}</p>
                          <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded-lg uppercase">#{atleta?.codigo || '---'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {f.mesReferencia}/{f.anoReferencia} • {atleta?.time}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Pagamento em {formatDate(f.dataPagamento)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <div className="text-left sm:text-right">
                        <p className={`text-xl font-black ${f.status === 'Pago' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          R$ {f.valor.toFixed(2)}
                        </p>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-1">
                          <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-lg shadow-sm border ${
                            f.status === 'Pago' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-orange-50 text-orange-700 border-orange-100'
                          }`}>
                            {f.status}
                          </span>
                           <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-lg shadow-sm border ${
                            f.tipo === 'Social' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {f.tipo}
                          </span>
                          {f.cestaBasica && (
                            <span className="text-[9px] uppercase font-black px-2 py-1 rounded-lg shadow-sm border bg-amber-50 text-amber-700 border-amber-100 flex items-center">
                              <History className="w-2.5 h-2.5 mr-1" />
                              Cesta
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingId(f.id);
                            setEditData(f);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                          title="Editar Registro"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onRemove(f.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function QuickGoalModal({ isOpen, atleta, goals, onClose, onConfirm }: {
  isOpen: boolean;
  atleta: Atleta | null;
  goals: Gol[];
  onClose: () => void;
  onConfirm: (gol: Omit<Gol, 'id'>) => void;
}) {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [tipo, setTipo] = useState<'Pró' | 'Contra'>('Pró');
  const [time, setTime] = useState<'Azul' | 'Vermelho'>('Azul');
  const [rodada, setRodada] = useState<number>(1);
  const [data, setData] = useState('');

  // Auto-calcular rodada com base na data
  useEffect(() => {
    if (!data) return;
    const datasExistentes = Array.from(new Set(goals.map(g => g.data)));
    if (!datasExistentes.includes(data)) {
      datasExistentes.push(data);
    }
    datasExistentes.sort();
    const novaRodada = datasExistentes.indexOf(data) + 1;
    setRodada(novaRodada);
  }, [data, goals]);

  useEffect(() => {
    if (isOpen) {
      setQuantidade(1);
      setTipo('Pró');
      setTime(atleta.time);
      setRodada(1);
      setData('');
    }
  }, [isOpen, atleta]);

  if (!isOpen || !atleta) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm({
      atletaId: atleta.id,
      quantidade: tipo === 'Pró' ? Math.abs(quantidade) : -Math.abs(quantidade),
      tipo,
      time,
      rodada,
      data
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-yellow-500" />
            Registrar Gol: {atleta.nome}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
              <select 
                value={time}
                onChange={e => setTime(e.target.value as any)}
                className={`w-full p-3 border rounded-xl outline-none font-bold ${
                  time === 'Azul' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <option value="Azul">Time Azul</option>
                <option value="Vermelho">Time Vermelho</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
              <select 
                value={tipo}
                onChange={e => setTipo(e.target.value as any)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              >
                <option value="Pró">Gol Pró (+)</option>
                <option value="Contra">Gol Contra (-)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                Rodada
                <span className="ml-1 text-[10px] text-yellow-600 normal-case">(Auto)</span>
              </label>
              <input 
                type="number" 
                min="1"
                value={rodada}
                readOnly
                className="w-full p-3 bg-gray-150 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed font-bold"
                title="Calculada automaticamente com base na data"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
              <input 
                type="date" 
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase text-center block">Quantidade de Gols</label>
              <div className="flex items-center justify-center gap-4">
                <button 
                  type="button" 
                  onClick={() => setQuantidade(prev => Math.max(1, prev - 1))}
                  className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                >-</button>
                <span className="text-3xl font-black">{quantidade}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantidade(prev => prev + 1)}
                  className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                >+</button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function GolEditModal({ 
  isOpen, 
  gol, 
  atletas, 
  goals,
  onClose, 
  onConfirm 
}: {
  isOpen: boolean;
  gol: Gol | null;
  atletas: Atleta[];
  goals: Gol[];
  onClose: () => void;
  onConfirm: (g: Gol) => void;
}) {
  const [atletaId, setAtletaId] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [tipo, setTipo] = useState<'Pró' | 'Contra'>('Pró');
  const [time, setTime] = useState<'Azul' | 'Vermelho'>('Azul');
  const [rodada, setRodada] = useState<number>(1);
  const [data, setData] = useState('');

  // Auto-calcular rodada com base na data
  useEffect(() => {
    if (!data) return;
    
    // Pegar todas as datas únicas dos gols existentes EXCLUINDO o gol que estamos editando para evitar loop ou confusão se mudarmos a data
    const outrasGols = goals.filter(g => g.id !== gol?.id);
    const datasExistentes = Array.from(new Set(outrasGols.map(g => g.data)));
    
    if (!datasExistentes.includes(data)) {
      datasExistentes.push(data);
    }
    datasExistentes.sort();
    
    const novaRodada = datasExistentes.indexOf(data) + 1;
    setRodada(novaRodada);
  }, [data, goals, gol]);

  useEffect(() => {
    if (gol && isOpen) {
      setAtletaId(gol.atletaId);
      setQuantidade(Math.abs(gol.quantidade));
      setTipo(gol.tipo);
      setTime(gol.time || 'Azul');
      setRodada(gol.rodada);
      setData(gol.data);
    }
  }, [gol, isOpen]);

  if (!isOpen || !gol) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!atletaId) return;
    onConfirm({
      ...gol,
      atletaId: Number(atletaId),
      quantidade: tipo === 'Pró' ? Math.abs(quantidade) : -Math.abs(quantidade),
      tipo,
      time,
      rodada,
      data
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Edit2 className="w-5 h-5 mr-2 text-blue-500" />
            Editar Registro de Gol
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Atleta</label>
            <select 
              value={atletaId}
              onChange={e => setAtletaId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
              required
            >
              <option value="">Selecione o Atleta</option>
              {atletas.filter(a => a.status === 'Ativo').sort((a, b) => a.nome.localeCompare(b.nome)).map(a => (
                <option key={a.id} value={a.id}>{a.nome} ({a.time})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
              <select 
                value={time}
                onChange={e => setTime(e.target.value as any)}
                className={`w-full p-3 border rounded-xl outline-none font-bold text-sm ${
                  time === 'Azul' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <option value="Azul">Time Azul</option>
                <option value="Vermelho">Time Vermelho</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
              <select 
                value={tipo}
                onChange={e => setTipo(e.target.value as any)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
              >
                <option value="Pró">Gol Pró (+)</option>
                <option value="Contra">Gol Contra (-)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Gols</label>
              <input 
                type="number" 
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
              <input 
                type="date" 
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                required
              />
            </div>
          </div>
          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center"
            >
              <Edit2 className="w-5 h-5 mr-2" />
              ATUALIZAR REGISTRO
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
function ArtilhariaSection({ atletas, gols, onAdd, onUpdate, onRemove }: { 
  atletas: Atleta[], 
  gols: Gol[],
  onAdd: (g: Omit<Gol, 'id'>) => void,
  onUpdate: (g: Gol) => void,
  onRemove: (id: string | number) => void
}) {
  const [atletaId, setAtletaId] = useState<string | number | ''>('');
  const [time, setTime] = useState<'Azul' | 'Vermelho'>('Azul');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [tipo, setTipo] = useState<'Pró' | 'Contra'>('Pró');
  const [rodada, setRodada] = useState<number>(1);
  const [data, setData] = useState('');

  // Auto-calcular rodada com base na data
  useEffect(() => {
    if (!data) return;
    
    // Pegar todas as datas únicas dos gols existentes
    const datasExistentes = Array.from(new Set(gols.map(g => g.data)));
    
    // Adicionar a data atual se não existir
    if (!datasExistentes.includes(data)) {
      datasExistentes.push(data);
    }
    
    // Ordenar cronologicamente
    datasExistentes.sort();
    
    // Encontrar o índice da data atual (Rodada = índice + 1)
    const novaRodada = datasExistentes.indexOf(data) + 1;
    setRodada(novaRodada);
  }, [data, gols]);

  const [editingGol, setEditingGol] = useState<Gol | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [quickRegisterAtleta, setQuickRegisterAtleta] = useState<Atleta | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!atletaId) return;
    
    onAdd({
      atletaId: Number(atletaId),
      quantidade: tipo === 'Pró' ? Math.abs(quantidade) : -Math.abs(quantidade),
      tipo,
      time,
      rodada,
      data
    });

    setAtletaId('');
    setTime('Azul');
    setQuantidade(1);
    setTipo('Pró');
    setRodada(1);
    setData('');
  };

  const handleEdit = (gol: Gol) => {
    setEditingGol(gol);
    setIsEditModalOpen(true);
  };

  const handleQuickRegister = (atletaId: string | number) => {
    const atleta = atletas.find(a => a.id === atletaId);
    if (atleta) {
      setQuickRegisterAtleta(atleta);
      setIsQuickModalOpen(true);
    }
  };

  const cancelEdit = () => {
    setEditingGol(null);
    setIsEditModalOpen(false);
  };

  const handleExportRanking = () => {
    const dataToExport = ranking.filter(a => a.hasActivity).map((a, index) => ({
      posicao: index + 1,
      nome: a.nome,
      time: a.time,
      totalGols: a.totalGols
    }));
    const headers = ['posicao', 'nome', 'time', 'totalGols'];
    downloadCSV(dataToExport, 'ranking-artilharia', headers);
  };

  const ranking = atletas.map(atleta => {
    const golsAtleta = gols.filter(g => g.atletaId === atleta.id);
    const totalGols = golsAtleta.reduce((acc, g) => acc + g.quantidade, 0);
    
    return { 
      ...atleta, 
      totalGols, 
      hasActivity: golsAtleta.length > 0
    };
  }).sort((a, b) => b.totalGols - a.totalGols);

  return (
    <div className="space-y-6">
      {/* Form to add goal */}
      <div className="bg-white rounded-2xl shadow-sm border-t-4 border-yellow-500 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center">
            <Target className="w-5 h-5 mr-2 text-yellow-500" />
            Registrar Novo Gol
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Atleta</label>
            <select 
              value={atletaId}
              onChange={e => {
                const id = e.target.value === '' ? '' : Number(e.target.value);
                setAtletaId(id);
                if (id !== '') {
                  const atleta = atletas.find(a => a.id === id);
                  if (atleta) setTime(atleta.time);
                }
              }}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              required
            >
              <option value="">Selecione o Atleta</option>
              {atletas.filter(a => a.status === 'Ativo').sort((a, b) => a.nome.localeCompare(b.nome)).map(a => (
                <option key={a.id} value={a.id}>{a.nome} ({a.time})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
            <select 
              value={time}
              onChange={e => setTime(e.target.value as any)}
              className={`w-full p-3 border rounded-xl outline-none font-bold ${
                time === 'Azul' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}
              required
            >
              <option value="Azul">Time Azul</option>
              <option value="Vermelho">Time Vermelho</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
              Rodada 
              <span className="ml-1 text-[10px] text-yellow-600 normal-case">(Auto)</span>
            </label>
            <input 
              type="number" 
              min="1"
              value={rodada}
              readOnly
              className="w-full p-3 bg-gray-150 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed font-bold"
              title="Calculada automaticamente com base na data"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
            <select 
              value={tipo}
              onChange={e => setTipo(e.target.value as any)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            >
              <option value="Pró">Gol Pró (+)</option>
              <option value="Contra">Gol Contra (-)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Gols</label>
            <input 
              type="number" 
              min="1"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
            <input 
              type="date" 
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              required
            />
          </div>
          <div className="md:col-span-6">
            <button 
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-yellow-100 transition-all flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              REGISTRAR GOL
            </button>
          </div>
        </form>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Ranking de Artilharia
          </h2>
          <button 
            onClick={handleExportRanking}
            className="p-2 bg-yellow-500 text-white border border-yellow-600 rounded-lg hover:bg-yellow-600 transition-all shadow-sm flex items-center text-xs font-bold"
            title="Exportar Ranking para CSV"
          >
            <Download className="w-4 h-4 mr-1" />
            EXPORTAR
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Pos</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Time</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ranking.filter(a => a.hasActivity).map((atleta, index) => (
                <tr key={atleta.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-400">#{index + 1}</td>
                  <td className="p-4 font-bold text-gray-900">{atleta.nome}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${atleta.time === 'Azul' ? 'bg-blue-600' : 'bg-red-600'}`}>
                      {atleta.time}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-lg font-black ${atleta.totalGols >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {atleta.totalGols}
                    </span>
                  </td>
                </tr>
              ))}
              {ranking.filter(a => a.hasActivity).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 italic">Nenhum gol registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Gols */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold flex items-center">
            <History className="w-5 h-5 mr-2 text-gray-400" />
            Histórico de Registros
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data da Partida</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Time Gol</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Rodada</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Tipo</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Qtd</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gols.slice().reverse().map(gol => {
                const atleta = atletas.find(a => a.id === gol.atletaId);
                return (
                  <tr key={gol.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-xs text-gray-500 font-medium">
                      {formatDate(gol.data)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${atleta?.time === 'Azul' ? 'bg-blue-600' : 'bg-red-600'}`}>
                          {atleta?.nome.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{atleta?.nome || 'Atleta Excluído'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${gol.time === 'Azul' ? 'bg-blue-600' : 'bg-red-600'}`}>
                        {gol.time}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm font-semibold text-gray-600">
                      {gol.rodada}ª
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${gol.tipo === 'Pró' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {gol.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-black ${gol.tipo === 'Pró' ? 'text-green-600' : 'text-red-600'}`}>
                        {gol.quantidade > 0 ? `+${gol.quantidade}` : gol.quantidade}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button 
                        onClick={() => handleQuickRegister(gol.atletaId)}
                        className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Registrar Novo Gol"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(gol)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Registro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onRemove(gol.id)}
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {gols.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">Nenhum registro no histórico.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GolEditModal 
        isOpen={isEditModalOpen}
        gol={editingGol}
        atletas={atletas}
        goals={gols}
        onClose={cancelEdit}
        onConfirm={(g) => {
          onUpdate(g);
          setIsEditModalOpen(false);
        }}
      />

      <QuickGoalModal 
        isOpen={isQuickModalOpen}
        atleta={quickRegisterAtleta}
        goals={gols}
        onClose={() => setIsQuickModalOpen(false)}
        onConfirm={(gol) => {
          onAdd(gol);
          setIsQuickModalOpen(false);
        }}
      />
    </div>
  );
}

function ResultadosSection({ 
  atletas, 
  gols, 
  onRemoveGol, 
  onUpdateGol, 
  onRemoveRodada 
}: { 
  atletas: Atleta[], 
  gols: Gol[],
  onRemoveGol: (id: string | number) => void,
  onUpdateGol: (g: Gol) => void,
  onRemoveRodada: (rodada: number) => void
}) {
  const [filtroRodada, setFiltroRodada] = useState<number | ''>('');
  const [managingRound, setManagingRound] = useState<any | null>(null);
  const [editingGol, setEditingGol] = useState<Gol | null>(null);

  const handleExport = () => {
    const dataToExport = gols.map(g => {
      const atleta = atletas.find(a => a.id === g.atletaId);
      return {
        ...g,
        atletaNome: atleta?.nome || 'Excluído',
        atletaTime: atleta?.time || '---'
      };
    });
    const headers = ['id', 'rodada', 'atletaNome', 'atletaTime', 'quantidade', 'tipo', 'data'];
    downloadCSV(dataToExport, 'gols-clube', headers);
  };

  // Group goals by round
  const rodadasMap = gols.reduce((acc, gol) => {
    if (!acc[gol.rodada]) {
      acc[gol.rodada] = {
        rodada: gol.rodada,
        data: gol.data,
        golsAzul: 0,
        golsVermelho: 0,
        artilheirosAzul: [] as { nome: string, qtd: number }[],
        artilheirosVermelho: [] as { nome: string, qtd: number }[],
        golsRaw: [] as Gol[]
      };
    }
    
    acc[gol.rodada].golsRaw.push(gol);
    const atleta = atletas.find(a => a.id === gol.atletaId);
    if (atleta) {
      const isPro = gol.tipo === 'Pró';
      const qtd = Math.abs(gol.quantidade);
      
      const updateArtilheiros = (list: { nome: string, qtd: number }[], nome: string, q: number) => {
        const art = list.find(a => a.nome === nome);
        if (art) art.qtd += q;
        else list.push({ nome, qtd: q });
      };

      if (atleta.time === 'Azul') {
        if (isPro) {
          acc[gol.rodada].golsAzul += qtd;
          updateArtilheiros(acc[gol.rodada].artilheirosAzul, atleta.nome, qtd);
        } else {
          acc[gol.rodada].golsVermelho += qtd;
          updateArtilheiros(acc[gol.rodada].artilheirosAzul, `${atleta.nome} (GC)`, qtd);
        }
      } else if (atleta.time === 'Vermelho') {
        if (isPro) {
          acc[gol.rodada].golsVermelho += qtd;
          updateArtilheiros(acc[gol.rodada].artilheirosVermelho, atleta.nome, qtd);
        } else {
          acc[gol.rodada].golsAzul += qtd;
          updateArtilheiros(acc[gol.rodada].artilheirosVermelho, `${atleta.nome} (GC)`, qtd);
        }
      }
    }
    
    // Keep the earliest date for the round
    if (new Date(gol.data) < new Date(acc[gol.rodada].data)) {
      acc[gol.rodada].data = gol.data;
    }
    
    return acc;
  }, {} as Record<number, any>);

  const rodadas = Object.values(rodadasMap).sort((a: any, b: any) => b.rodada - a.rodada);
  
  const stats = rodadas.reduce((acc, r: any) => {
    if (r.golsAzul > r.golsVermelho) acc.vAzul++;
    else if (r.golsVermelho > r.golsAzul) acc.vVermelho++;
    else acc.empates++;
    return acc;
  }, { vAzul: 0, vVermelho: 0, empates: 0 });

  const rodadasFiltradas = filtroRodada === '' ? rodadas : rodadas.filter((r: any) => r.rodada === filtroRodada);
  const listaRodadas = Array.from(new Set(gols.map(g => g.rodada))).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold flex items-center">
            <LayoutGrid className="w-5 h-5 mr-2 text-blue-600" />
            Resultados dos Jogos
          </h2>

          <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
            <div className="flex items-center px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-100 border border-blue-700">
              <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Azul: {stats.vAzul}
            </div>
            <div className="flex items-center px-3 py-2 md:px-4 md:py-2 bg-red-600 text-white rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider shadow-lg shadow-red-100 border border-red-700">
              <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Vermelho: {stats.vVermelho}
            </div>
            <div className="flex items-center px-3 py-2 md:px-4 md:py-2 bg-gray-800 text-white rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider shadow-lg shadow-gray-100 border border-gray-900">
              <History className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Empates: {stats.empates}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={filtroRodada}
            onChange={e => setFiltroRodada(e.target.value === '' ? '' : Number(e.target.value))}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">Todas as Rodadas</option>
            {listaRodadas.map(r => (
              <option key={r} value={r}>{r}ª Rodada</option>
            ))}
          </select>
          <button 
            onClick={handleExport}
            className="p-2 bg-green-600 text-white border border-green-700 rounded-lg hover:bg-green-700 transition-all shadow-sm"
            title="Exportar Gols para CSV"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid de Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rodadasFiltradas.map((r: any) => {
          const resultado = r.golsAzul > r.golsVermelho 
            ? { text: 'Vitória Azul', color: 'bg-blue-600' }
            : r.golsVermelho > r.golsAzul 
              ? { text: 'Vitória Vermelho', color: 'bg-red-600' }
              : { text: 'Empate', color: 'bg-gray-500' };

          return (
            <div key={r.rodada} className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden flex flex-col group hover:border-blue-200 transition-all">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">{r.rodada}ª Rodada</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-500">{formatDate(r.data)}</span>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setManagingRound(r)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      title="Gerenciar Gols"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onRemoveRodada(r.rodada)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir Rodada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-grow space-y-6">
                {/* Placar */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center space-y-2 flex-1">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">A</div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Azul</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 px-2">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">{r.golsAzul}</span>
                    <span className="text-lg font-black text-gray-300">X</span>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">{r.golsVermelho}</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2 flex-1">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-100">V</div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vermelho</span>
                  </div>
                </div>

                {/* Artilheiros */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2">Gols Azul</p>
                    {r.artilheirosAzul.map((a: any, i: number) => (
                      <p key={i} className="text-[11px] text-gray-600 flex justify-between">
                        <span className="truncate mr-1">{a.nome}</span>
                        <span className="font-bold flex-shrink-0">x{a.qtd}</span>
                      </p>
                    ))}
                    {r.artilheirosAzul.length === 0 && <p className="text-[10px] text-gray-400 italic">Sem gols</p>}
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">Gols Vermelho</p>
                    {r.artilheirosVermelho.map((a: any, i: number) => (
                      <p key={i} className="text-[11px] text-gray-600 flex justify-between flex-row-reverse">
                        <span className="truncate ml-1">{a.nome}</span>
                        <span className="font-bold flex-shrink-0">x{a.qtd}</span>
                      </p>
                    ))}
                    {r.artilheirosVermelho.length === 0 && <p className="text-[10px] text-gray-400 italic">Sem gols</p>}
                  </div>
                </div>
              </div>

              {/* Resultado Badge */}
              <div className={`p-3 ${resultado.color} text-center`}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white underline underline-offset-4 decoration-white/30">{resultado.text}</span>
              </div>
            </div>
          );
        })}
        {rodadasFiltradas.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <LayoutGrid className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhum resultado encontrado para esta rodada.</p>
          </div>
        )}
      </div>

      {/* Manage Round Modal */}
      <AnimatePresence>
        {managingRound && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    Gerenciar {managingRound.rodada}ª Rodada
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">{formatDate(managingRound.data)}</p>
                </div>
                <button 
                  onClick={() => setManagingRound(null)}
                  className="p-2 bg-white text-gray-400 hover:text-gray-600 rounded-xl shadow-sm border border-gray-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registros de Gols</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    {managingRound.golsRaw.length} registros
                  </span>
                </div>

                {managingRound.golsRaw.map((gol: Gol) => {
                  const atleta = atletas.find(a => a.id === gol.atletaId);
                  return (
                    <div key={gol.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all group">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${atleta?.time === 'Azul' ? 'bg-blue-600' : 'bg-red-600'}`}>
                          {atleta?.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                            {atleta?.nome || 'Atleta Excluído'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${gol.tipo === 'Pró' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {gol.tipo}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold tracking-wider">
                              Qtd: {gol.quantidade}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setEditingGol(gol)}
                          className="p-2 text-blue-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            onRemoveGol(gol.id);
                            // Refresh current managingRound raw list
                            setManagingRound((prev: any) => ({
                              ...prev,
                              golsRaw: prev.golsRaw.filter((g: any) => g.id !== gol.id)
                            }));
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {managingRound.golsRaw.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 italic text-sm">Sem registros nesta rodada.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setManagingRound(null)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-100 transition-all shadow-sm"
                >
                  FECHAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shared Edit Modal */}
      <GolEditModal 
        isOpen={!!editingGol}
        gol={editingGol}
        atletas={atletas}
        goals={gols}
        onClose={() => setEditingGol(null)}
        onConfirm={(updated) => {
          onUpdateGol(updated);
          setEditingGol(null);
          // Refresh managing round list
          if (managingRound) {
            setManagingRound((prev: any) => ({
              ...prev,
              golsRaw: prev.golsRaw.map((g: any) => g.id === updated.id ? updated : g)
            }));
          }
        }}
      />
    </div>
  );
}

function SorteioSection({ atletas, onUpdateAtletas }: { 
  atletas: Atleta[], 
  onUpdateAtletas: (novos: Atleta[]) => void 
}) {
  const [timeAzul, setTimeAzul] = useState<Atleta[]>([]);
  const [timeVermelho, setTimeVermelho] = useState<Atleta[]>([]);
  const [sorteioRealizado, setSorteioRealizado] = useState(false);

  // Captura automática inicial
  useEffect(() => {
    if (!sorteioRealizado) {
      const disponiveis = atletas.filter(a => a.status === 'Ativo' || a.status === 'Depto. Médico');
      setTimeAzul(disponiveis.filter(a => a.time === 'Azul'));
      setTimeVermelho(disponiveis.filter(a => a.time === 'Vermelho'));
    }
  }, [atletas, sorteioRealizado]);

  const handleReset = () => {
    // 1. Limpa o status de "Fixo" no Banco de Dados (Cadastro Original)
    const resetAtletas = atletas.map(a => ({ 
      ...a, 
      isFixo: false 
    }));
    onUpdateAtletas(resetAtletas);
    
    // 2. Reseta o estado do sorteio para voltar à "etapa anterior" (Captura Original)
    setSorteioRealizado(false);

    // 3. Força a atualização das listas locais com base nos dados do cadastro (disponíveis)
    const disponiveis = resetAtletas.filter(a => a.status === 'Ativo' || a.status === 'Depto. Médico');
    setTimeAzul(disponiveis.filter(a => a.time === 'Azul'));
    setTimeVermelho(disponiveis.filter(a => a.time === 'Vermelho'));
  };

  const toggleFix = (atletaId: string | number) => {
    const novosAtletas = atletas.map(a => 
      a.id === atletaId ? { ...a, isFixo: !a.isFixo } : a
    );
    onUpdateAtletas(novosAtletas);
  };

  const moverAtleta = (atletaId: string | number, deOnde: 'Azul' | 'Vermelho') => {
    if (deOnde === 'Azul') {
      const atleta = timeAzul.find(a => a.id === atletaId);
      if (atleta) {
        setTimeAzul(timeAzul.filter(a => a.id !== atletaId));
        setTimeVermelho([...timeVermelho, atleta]);
      }
    } else {
      const atleta = timeVermelho.find(a => a.id === atletaId);
      if (atleta) {
        setTimeVermelho(timeVermelho.filter(a => a.id !== atletaId));
        setTimeAzul([...timeAzul, atleta]);
      }
    }
  };

  const realizarSorteio = () => {
    const disponiveis = atletas.filter(a => a.status === 'Ativo' || a.status === 'Depto. Médico');
    
    // Separar os fixos
    const fixosAzul = disponiveis.filter(a => a.isFixo && a.time === 'Azul');
    const fixosVermelho = disponiveis.filter(a => a.isFixo && a.time === 'Vermelho');
    
    // Atletas que serão sorteados
    let paraSortear = disponiveis.filter(a => !a.isFixo);
    
    // Ordenar por critérios de equilíbrio (Preponderância: 1. Pontuação, 2. Idade, 3. Posição)
    paraSortear.sort((a, b) => {
      // 1. Pontuação (DESC - Maior para menor)
      const pB = b.pontuacao || 0;
      const pA = a.pontuacao || 0;
      if (pB !== pA) return pB - pA;

      // 2. Idade (DESC - Mais velhos primeiro para equilibrar experiência)
      const idadeA = calculateAge(a.dataNascimento) || 0;
      const idadeB = calculateAge(b.dataNascimento) || 0;
      if (idadeB !== idadeA) return (idadeB as number) - (idadeA as number);

      // 3. Posição (Equilibrar por tipo de posição)
      return (a.posicaoPrincipal || '').localeCompare(b.posicaoPrincipal || '');
    });

    const azul: Atleta[] = [...fixosAzul];
    const vermelho: Atleta[] = [...fixosVermelho];
    
    // Distribuição balanceada (Snake alternado)
    paraSortear.forEach((atleta, index) => {
      // Prioridade para quem tem menos jogadores no momento
      if (azul.length < vermelho.length) {
        azul.push(atleta);
      } else if (vermelho.length < azul.length) {
        vermelho.push(atleta);
      } else {
        // Quantidade igual, sorteia lado ou alterna
        if (Math.random() > 0.5) {
          azul.push(atleta);
        } else {
          vermelho.push(atleta);
        }
      }
    });

    setTimeAzul(azul);
    setTimeVermelho(vermelho);
    setSorteioRealizado(true);
  };

  const confirmarSorteio = () => {
    const novosAtletas = atletas.map(a => {
      let novoTime = a.time; // Por padrão, mantém o atual
      
      const emAzul = timeAzul.find(ta => ta.id === a.id);
      if (emAzul) novoTime = 'Azul';
      
      const emVermelho = timeVermelho.find(tv => tv.id === a.id);
      if (emVermelho) novoTime = 'Vermelho';
      
      // Apenas passamos o novo time. O App lidará com o histórico se houver mudança.
      return { ...a, time: novoTime };
    });
    
    onUpdateAtletas(novosAtletas);
    setSorteioRealizado(false);
    alert('Times atualizados com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center">
            <Shuffle className="w-5 h-5 mr-2 text-blue-600" />
            Sorteio de Equipes
          </h2>
          <p className="text-sm text-gray-500 font-medium">Capture inicial automático habilitado. Respeita atletas fixos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleReset}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-gray-100 transition-all flex items-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            RESETAR
          </button>
          <button 
            onClick={realizarSorteio}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center"
          >
            <Dices className="w-5 h-5 mr-2" />
            REALIZAR SORTEIO
          </button>
          {sorteioRealizado && (
            <button 
              onClick={confirmarSorteio}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all flex items-center"
            >
              <Check className="w-5 h-5 mr-2" />
              CONFIRMAR TIMES
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Time Azul */}
        <div className="bg-white rounded-2xl shadow-sm border-t-4 border-blue-600 overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <h3 className="text-blue-700 font-black uppercase tracking-widest flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded-full mr-2"></div>
              Time Azul ({timeAzul.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fixar</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Pont.</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Posição</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Idade</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ajustar</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Hist.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timeAzul.sort((a, b) => a.nome.localeCompare(b.nome)).map(atleta => (
                  <tr key={atleta.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3">
                      <button 
                        onClick={() => toggleFix(atleta.id)}
                        className={`p-1.5 rounded-lg transition-all ${atleta.isFixo ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                        title={atleta.isFixo ? "Atleta Fixo" : "Fixar Atleta"}
                      >
                        {atleta.isFixo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <p className="font-bold text-gray-900 text-sm">{atleta.nome}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-gray-400 font-mono">#{atleta.codigo}</p>
                          <RenderPontuacao pontuacao={atleta.pontuacao} className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-[10px] font-bold text-gray-700">{atleta.posicaoPrincipal || '-'}</p>
                      {atleta.posicaoSecundaria && (
                        <p className="text-[9px] text-gray-400 italic">{atleta.posicaoSecundaria}</p>
                      )}
                    </td>
                    <td className="p-3 text-xs font-bold text-gray-700">
                      {calculateAge(atleta.dataNascimento) || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => moverAtleta(atleta.id, 'Azul')}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Mover para Vermelho"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold ${atleta.status === 'Ativo' ? 'text-green-600' : 'text-orange-600'}`}>
                          {atleta.status}
                        </span>
                        {renderHistorico(atleta.historicoTimes)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Vermelho */}
        <div className="bg-white rounded-2xl shadow-sm border-t-4 border-red-600 overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
            <h3 className="text-red-700 font-black uppercase tracking-widest flex items-center">
              <div className="w-6 h-6 bg-red-600 rounded-full mr-2"></div>
              Time Vermelho ({timeVermelho.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fixar</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Pont.</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Posição</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Idade</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ajustar</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Hist.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timeVermelho.sort((a, b) => a.nome.localeCompare(b.nome)).map(atleta => (
                  <tr key={atleta.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="p-3">
                      <button 
                        onClick={() => toggleFix(atleta.id)}
                        className={`p-1.5 rounded-lg transition-all ${atleta.isFixo ? 'bg-red-100 text-red-600' : 'text-gray-300 hover:text-gray-500'}`}
                        title={atleta.isFixo ? "Atleta Fixo" : "Fixar Atleta"}
                      >
                        {atleta.isFixo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <p className="font-bold text-gray-900 text-sm">{atleta.nome}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-gray-400 font-mono">#{atleta.codigo}</p>
                          <RenderPontuacao pontuacao={atleta.pontuacao} className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-[10px] font-bold text-gray-700">{atleta.posicaoPrincipal || '-'}</p>
                      {atleta.posicaoSecundaria && (
                        <p className="text-[9px] text-gray-400 italic">{atleta.posicaoSecundaria}</p>
                      )}
                    </td>
                    <td className="p-3 text-xs font-bold text-gray-700">
                      {calculateAge(atleta.dataNascimento) || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => moverAtleta(atleta.id, 'Vermelho')}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Mover para Azul"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold ${atleta.status === 'Ativo' ? 'text-green-600' : 'text-orange-600'}`}>
                          {atleta.status}
                        </span>
                        {renderHistorico(atleta.historicoTimes)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


