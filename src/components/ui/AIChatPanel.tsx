import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions, httpsCallable } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getEffectivePlan, getPlanLimits } from '../../lib/access';
import { useTrackedLists } from '../../hooks/useChecklistsFirestore';

type MatchedList = {
  id: string;
  name: string;
  year: number;
  brand: string;
  category: string;
  totalCars: number;
};

type AskAIResponse = {
  reply: string;
  matchedLists?: MatchedList[];
  intent: 'find_list' | 'billing_help' | 'collection_advice' | 'general';
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  matchedLists?: MatchedList[];
  trackedId?: string;
};

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I can help you find checklists, answer billing questions, or chat about diecast collecting. What are you looking for?",
};

async function autoTrackList(uid: string, list: MatchedList): Promise<void> {
  await setDoc(
    doc(db, 'usr', uid, 'trackedLists', list.id),
    {
      userId: uid,
      listId: list.id,
      brandId: list.brand.toLowerCase().replace(/\s+/g, '-'),
      brandName: list.brand,
      listTitle: list.name,
      year: list.year,
      category: list.category,
      listType: list.category,
      itemCount: list.totalCars,
      pinned: false,
      activatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export default function AIChatPanel() {
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const effectivePlan = userDoc ? getEffectivePlan(userDoc) : 'free';
  const limits = getPlanLimits(effectivePlan);
  const { trackedLists } = useTrackedLists(user?.uid);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const trackedSet = new Set(trackedLists.map((l) => l.listId));
  const canTrackMore = trackedLists.length < limits.maxTrackedLists;

  const sendMessage = async () => {
    if (!input.trim() || loading || !user?.uid || !functions) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const askAI = httpsCallable<
        { message: string; userContext: { plan: string; trackedListIds: string[]; trackedCount: number } },
        AskAIResponse
      >(functions, 'askAI');

      const result = await askAI({
        message: userMsg.content,
        userContext: {
          plan: effectivePlan,
          trackedListIds: trackedLists.map((l) => l.listId),
          trackedCount: trackedLists.length,
        },
      });

      const data = result.data;
      let trackedId: string | undefined;

      // Auto-track the best matched list if user hasn't already tracked it
      if (
        data.intent === 'find_list' &&
        data.matchedLists?.length &&
        canTrackMore
      ) {
        const bestMatch = data.matchedLists.find((l) => !trackedSet.has(l.id));
        if (bestMatch) {
          await autoTrackList(user.uid, bestMatch);
          trackedId = bestMatch.id;
        }
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply,
        matchedLists: data.matchedLists,
        trackedId,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Something went wrong. Try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry — ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open AI assistant"
        className={`fixed bottom-24 right-4 z-50 lg:bottom-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all ${
          isOpen
            ? 'bg-stone-700 border border-stone-600'
            : 'bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500'
        }`}
      >
        {isOpen ? '✕' : '✨'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-4 z-50 lg:bottom-20 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 200px)', minHeight: 280 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-700 bg-stone-800 flex-shrink-0">
            <span className="text-lg">✨</span>
            <div>
              <p className="text-sm font-bold text-stone-100">AI Assistant</p>
              <p className="text-xs text-stone-500">Powered by Gemini · Pro feature</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-stone-900 font-medium rounded-br-sm'
                        : 'bg-stone-800 text-stone-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Matched list cards */}
                  {msg.matchedLists && msg.matchedLists.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.matchedLists.map((list) => (
                        <div
                          key={list.id}
                          className="bg-stone-800 border border-stone-700 rounded-xl p-3"
                        >
                          <p className="text-xs text-stone-500 mb-0.5">
                            {list.brand} · {list.year}
                          </p>
                          <p className="text-sm font-bold text-stone-100 leading-tight">
                            {list.name}
                          </p>
                          <p className="text-xs text-stone-400 mb-2">
                            {list.category} · {list.totalCars} cars
                          </p>
                          <div className="flex gap-2">
                            {msg.trackedId === list.id && (
                              <span className="text-xs text-green-400 font-semibold">
                                ✓ Added to your lists
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/checklists/${list.id}`);
                              }}
                              className="text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold px-2.5 py-1 transition-colors"
                            >
                              Open List
                            </button>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/choose-lists');
                              }}
                              className="text-xs rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-300 px-2.5 py-1 transition-colors"
                            >
                              Browse All
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-stone-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-stone-400 italic">
                  Thinking…
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 py-3 border-t border-stone-700 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Ask me anything…"
              className="flex-1 rounded-xl border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-900 font-bold px-3 py-2 text-sm transition-colors"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
