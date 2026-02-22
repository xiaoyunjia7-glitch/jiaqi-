/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  Info, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  Suit, 
  Rank, 
  CardData, 
  SUITS, 
  RANKS, 
  SUIT_SYMBOLS, 
  SUIT_COLORS,
  SUIT_NAMES_ZH,
  GamePhase,
  Turn 
} from './types';

// --- Utils ---
const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ id: `${rank}-${suit}`, suit, rank });
    });
  });
  return deck;
};

const shuffle = (deck: CardData[]): CardData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// --- Components ---

const Card = ({ 
  card, 
  isFaceDown = false, 
  onClick, 
  isPlayable = false,
  className = "",
  style = {}
}: { 
  card: CardData; 
  isFaceDown?: boolean; 
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  key?: React.Key;
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      style={style}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-lg border border-zinc-200 
        flex flex-col items-center justify-between p-2 cursor-pointer select-none
        ${isPlayable ? 'ring-2 ring-emerald-400 shadow-lg' : 'shadow-sm'}
        ${isFaceDown ? 'bg-zinc-800 border-zinc-700' : ''}
        ${className}
      `}
    >
      {isFaceDown ? (
        <div className="w-full h-full rounded bg-zinc-700 flex items-center justify-center border border-zinc-600">
          <div className="w-12 h-12 rounded-full border-2 border-zinc-500 opacity-20 flex items-center justify-center">
            <span className="text-zinc-400 font-display font-bold text-xl">T</span>
          </div>
        </div>
      ) : (
        <>
          <div className={`self-start flex flex-col items-center leading-none ${SUIT_COLORS[card.suit]}`}>
            <span className="text-sm sm:text-lg font-bold">{card.rank}</span>
            <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className={`text-2xl sm:text-4xl ${SUIT_COLORS[card.suit]}`}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className={`self-end flex flex-col items-center leading-none rotate-180 ${SUIT_COLORS[card.suit]}`}>
            <span className="text-sm sm:text-lg font-bold">{card.rank}</span>
            <span className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default function App() {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [aiHand, setAiHand] = useState<CardData[]>([]);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<Turn>('player');
  const [phase, setPhase] = useState<GamePhase>('dealing');
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingEightCard, setPendingEightCard] = useState<CardData | null>(null);
  const [message, setMessage] = useState<string>("欢迎来到 Tina 的疯狂 8 点！");

  // --- Game Logic ---

  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const pHand = fullDeck.splice(0, 8);
    const aHand = fullDeck.splice(0, 8);
    const firstDiscard = fullDeck.pop()!;
    
    setDeck(fullDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setTurn('player');
    setPhase('playing');
    setMessage("轮到你了！请出相同花色或点数的牌。");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const topDiscard = discardPile[discardPile.length - 1];

  const isValidMove = (card: CardData) => {
    if (card.rank === '8') return true;
    if (currentSuit && card.suit === currentSuit) return true;
    if (card.rank === topDiscard.rank) return true;
    return false;
  };

  const handleDraw = () => {
    if (turn !== 'player' || phase !== 'playing' || showSuitPicker) return;
    
    if (deck.length === 0) {
      setMessage("牌堆已空！跳过本回合。");
      setTimeout(() => setTurn('ai'), 1500);
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.pop()!;
    setDeck(newDeck);
    setPlayerHand([...playerHand, drawnCard]);
    setMessage("你摸了一张牌。");
    
    // Check if drawn card can be played immediately
    if (!isValidMove(drawnCard)) {
      setTimeout(() => setTurn('ai'), 1000);
    }
  };

  const playCard = (card: CardData, isPlayer: boolean) => {
    if (isPlayer) {
      if (card.rank === '8') {
        setPendingEightCard(card);
        setShowSuitPicker(true);
        return;
      }
      
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
      setDiscardPile(prev => [...prev, card]);
      setCurrentSuit(card.suit);
      
      if (playerHand.length === 1) {
        setPhase('gameOver');
        setMessage("你赢了！ 🎉");
      } else {
        setTurn('ai');
        setMessage("AI 正在思考...");
      }
    } else {
      // AI Logic
      setAiHand(prev => prev.filter(c => c.id !== card.id));
      setDiscardPile(prev => [...prev, card]);
      
      if (card.rank === '8') {
        // AI picks most frequent suit in hand
        const suitCounts = aiHand.reduce((acc, c) => {
          if (c.id !== card.id) acc[c.suit] = (acc[c.suit] || 0) + 1;
          return acc;
        }, {} as Record<Suit, number>);
        
        const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || 'hearts';
        setCurrentSuit(bestSuit);
        setMessage(`AI 出了一个 8，并选择了 ${SUIT_NAMES_ZH[bestSuit]}！`);
      } else {
        setCurrentSuit(card.suit);
        setMessage(`AI 出了 ${SUIT_NAMES_ZH[card.suit]} ${card.rank}。`);
      }

      if (aiHand.length === 1) {
        setPhase('gameOver');
        setMessage("AI 赢了！下次再接再厉。");
      } else {
        setTurn('player');
      }
    }
  };

  const handleSuitPick = (suit: Suit) => {
    if (!pendingEightCard) return;
    
    setPlayerHand(prev => prev.filter(c => c.id !== pendingEightCard.id));
    setDiscardPile(prev => [...prev, pendingEightCard]);
    setCurrentSuit(suit);
    setPendingEightCard(null);
    setShowSuitPicker(false);
    
    if (playerHand.length === 1) {
      setPhase('gameOver');
      setMessage("你赢了！ 🎉");
    } else {
      setTurn('ai');
      setMessage(`你选择了 ${SUIT_NAMES_ZH[suit]}。轮到 AI 了。`);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn === 'ai' && phase === 'playing') {
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(isValidMove);
        
        if (playableCards.length > 0) {
          // AI strategy: play 8s last, otherwise random valid card
          const nonEight = playableCards.filter(c => c.rank !== '8');
          const cardToPlay = nonEight.length > 0 
            ? nonEight[Math.floor(Math.random() * nonEight.length)]
            : playableCards[0];
          
          playCard(cardToPlay, false);
        } else {
          // AI draws
          if (deck.length > 0) {
            const newDeck = [...deck];
            const drawnCard = newDeck.pop()!;
            setDeck(newDeck);
            setAiHand(prev => [...prev, drawnCard]);
            setMessage("AI 摸了一张牌。");
            
            if (isValidMove(drawnCard)) {
              setTimeout(() => playCard(drawnCard, false), 1000);
            } else {
              setTurn('player');
            }
          } else {
            setMessage("AI 无牌可出且牌堆已空。跳过。");
            setTurn('player');
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, phase, deck, currentSuit]);

  return (
    <div className="h-screen w-full felt-bg flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-display font-bold text-xl">T</span>
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-lg leading-none">Tina 的疯狂 8 点</h1>
            <p className="text-emerald-300/70 text-xs mt-1">标准 52 张牌规则</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <div className={`w-2 h-2 rounded-full ${turn === 'player' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            <span className="text-white text-xs font-medium">{turn === 'player' ? '你的回合' : "AI 的回合"}</span>
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            title="重新开始"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-between p-4 relative">
        
        {/* AI Hand */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-widest">
            <Cpu size={14} />
            <span>对手 ({aiHand.length})</span>
          </div>
          <div className="flex justify-center -space-x-8 sm:-space-x-12 h-32 sm:h-40">
            <AnimatePresence>
              {aiHand.map((card, i) => (
                <Card key={card.id} card={card} isFaceDown className="z-0" />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Table */}
        <div className="flex items-center justify-center gap-8 sm:gap-16 my-4">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-2">
            <div 
              onClick={handleDraw}
              className={`
                relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 border-dashed border-white/20 
                flex items-center justify-center cursor-pointer transition-all
                ${deck.length > 0 ? 'bg-zinc-800 border-solid border-zinc-700 hover:scale-105 active:scale-95' : 'opacity-50'}
              `}
            >
              {deck.length > 0 ? (
                <div className="w-full h-full rounded bg-zinc-700 flex items-center justify-center border border-zinc-600 shadow-xl">
                   <span className="text-white/20 font-display font-bold text-2xl">{deck.length}</span>
                </div>
              ) : (
                <span className="text-white/20 text-xs font-medium">已空</span>
              )}
            </div>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-tighter">摸牌堆</span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-28 sm:w-24 sm:h-36">
              <AnimatePresence mode="popLayout">
                {discardPile.slice(-3).map((card, i) => (
                  <Card 
                    key={card.id} 
                    card={card} 
                    className="absolute inset-0 shadow-2xl" 
                    style={{ 
                      zIndex: i,
                      transform: `rotate(${(i - 1) * 5}deg) translate(${i * 2}px, ${i * 2}px)`
                    }} 
                  />
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-tighter">弃牌堆</span>
              {currentSuit && (
                <div className={`px-2 py-0.5 rounded bg-white/10 border border-white/20 text-xs font-bold ${SUIT_COLORS[currentSuit]}`}>
                  {SUIT_SYMBOLS[currentSuit]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex justify-center -space-x-8 sm:-space-x-12 h-32 sm:h-40 max-w-full overflow-x-auto pb-4 no-scrollbar">
            <AnimatePresence>
              {playerHand.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  isPlayable={turn === 'player' && phase === 'playing' && isValidMove(card) && !showSuitPicker}
                  onClick={() => playCard(card, true)}
                />
              ))}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-widest">
            <User size={14} />
            <span>你的手牌 ({playerHand.length})</span>
          </div>
        </div>
      </main>

      {/* Message Bar */}
      <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
          <Info size={16} />
        </div>
        <p className="text-white text-sm font-medium">{message}</p>
      </div>

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {showSuitPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-xs w-full shadow-2xl text-center"
            >
              <h2 className="text-white font-display font-bold text-2xl mb-2">万能 8 点！</h2>
              <p className="text-zinc-400 text-sm mb-8">请选择接下来的花色。</p>
              
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitPick(suit)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 
                      bg-white/5 hover:bg-white/10 transition-all active:scale-95
                      ${SUIT_COLORS[suit]}
                    `}
                  >
                    <span className="text-3xl mb-1">{SUIT_SYMBOLS[suit]}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{SUIT_NAMES_ZH[suit]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {phase === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-emerald-400" size={40} />
              </div>
              <h2 className="text-white font-display font-bold text-3xl mb-2">
                {playerHand.length === 0 ? '大获全胜！' : '游戏结束'}
              </h2>
              <p className="text-zinc-400 mb-8">
                {playerHand.length === 0 
                  ? '你清空了所有手牌，赢得了比赛！' 
                  : 'AI 这次更快一步。想再来一局吗？'}
              </p>
              
              <button
                onClick={initGame}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                再来一局
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Orientation Warning */}
      <div className="fixed inset-0 z-[100] bg-zinc-900 flex flex-col items-center justify-center p-8 text-center sm:hidden landscape:flex hidden">
        <AlertCircle className="text-amber-400 mb-4" size={48} />
        <h2 className="text-white font-display font-bold text-xl mb-2">建议使用竖屏模式</h2>
        <p className="text-zinc-400 text-sm">在移动设备上，竖屏模式能提供最佳的游戏体验。</p>
      </div>
    </div>
  );
}
