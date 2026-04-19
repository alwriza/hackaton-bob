'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { recalcTrustScore } from '@/lib/trust';
import { analyzeSafety } from '@/lib/safety';
import {
  ShieldCheck, Send, Paperclip,
  CheckCircle2, AlertTriangle,
  ArrowLeft, AlertOctagon,
  AlertCircle, Loader2, Clock,
  ChevronDown, ChevronUp,
  FileText, Upload, X, Star
} from 'lucide-react';
import WithVerification from '@/components/WithVerification';

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  // Modals
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [disputeReason, setDisputeReason] = useState('');
  const [workResult, setWorkResult] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !transactionId) return;

    const fetchData = async () => {
      try {
        const { data: tx, error } = await supabase
          .from('transactions')
          .select('*, services(*), buyer:buyer_id(*), seller:seller_id(*)')
          .eq('id', transactionId)
          .single();

        if (error) throw error;
        setTransaction(tx);

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('transaction_id', transactionId)
          .order('created_at', { ascending: true });

        setMessages(msgs || []);
      } catch (err) {
        console.error('Error loading transaction:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`chat:${transactionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `transaction_id=eq.${transactionId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [transactionId, user]);

  // Send system message helper
  const sendSystemMessage = async (text: string) => {
    if (!user) return;
    await supabase.from('messages').insert({
      transaction_id: transactionId,
      sender_id: user.id,
      text
    });
  };

  // Create parent alert helper
  const notifyParent = async (type: string, message: string, childId: string) => {
    try {
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('parent_email')
        .eq('id', childId)
        .single();

      if (!childProfile?.parent_email) return;

      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', childProfile.parent_email)
        .single();

      if (!parentProfile) return;

      await supabase.from('parent_alerts').insert({
        parent_id: parentProfile.id,
        child_id: childId,
        transaction_id: transactionId,
        type,
        message
      });
    } catch (err) {
      // Table may not exist yet — fail silently
      console.warn('Parent alert failed (table may not exist):', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSendingMsg) return;

    setSafetyWarning(null);
    const safety = analyzeSafety(newMessage);

    if (safety.blocked) {
      setSafetyWarning(safety.warning);
      // For HIGH risk, also notify parent
      if (safety.level === 'HIGH') {
        await notifyParent('SAFETY', `Попытка поделиться контактами в чате сделки`, user.id);
      }
      return;
    }

    if (safety.warning) {
      setSafetyWarning(safety.warning);
      // Non-blocking: still send but show warn
    }

    setIsSendingMsg(true);
    try {
      await supabase.from('messages').insert({
        transaction_id: transactionId,
        sender_id: user.id,
        text: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const fileMsg = `📎 Файл прикреплён: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    await sendSystemMessage(fileMsg);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateStatus = async (newStatus: string, note?: string) => {
    setIsUpdatingStatus(true);
    try {
      const updates: any = { status: newStatus };
      await supabase.from('transactions').update(updates).eq('id', transactionId);
      setTransaction((prev: any) => ({ ...prev, status: newStatus }));

      const msgs: Record<string, string> = {
        COMPLETED:      '✅ Заказчик подтвердил выполнение. Сделка закрыта!',
        FROZEN:         '🚨 Сделка заморожена. Поддержка уведомлена.',
        DISPUTED:       `⚖️ Открыт спор: ${note || 'Причина не указана'}`,
        PENDING_REVIEW: '📤 Исполнитель сдал работу. Ожидает проверки заказчиком.',
      };
      if (msgs[newStatus]) await sendSystemMessage(msgs[newStatus]);

      // Trigger trust score recalc on final states
      if (newStatus === 'COMPLETED' && transaction) {
        recalcTrustScore(transaction.buyer_id);
        recalcTrustScore(transaction.seller_id);
      }
      if (newStatus === 'DISPUTED' && transaction) {
        recalcTrustScore(transaction.seller_id);
        // Notify parent
        await notifyParent('DISPUTE', `Открыт спор по сделке: ${transaction.services?.title}`, transaction.buyer_id);
      }
      if (newStatus === 'FROZEN') {
        setShowPanicModal(false);
        if (transaction) {
          await notifyParent('SOS', `SOS! Сделка заморожена: ${transaction.services?.title}`, user!.id);
        }
      }
      if (newStatus === 'DISPUTED') setShowDisputeModal(false);

    } catch (err) {
      console.error('Error updating status:', err);
      alert('Ошибка при обновлении статуса.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!workResult.trim()) return;
    setIsUpdatingStatus(true);
    try {
      await supabase.from('transactions')
        .update({ result: workResult, status: 'PENDING_REVIEW' })
        .eq('id', transactionId);
      setTransaction((prev: any) => ({ ...prev, result: workResult, status: 'PENDING_REVIEW' }));
      await sendSystemMessage('📤 Исполнитель сдал работу на проверку заказчику.');
      setShowSubmitModal(false);
      setWorkResult('');
    } catch (err) {
      console.error('Error submitting work:', err);
      alert('Ошибка при сдаче работы. Возможно, нужно выполнить SQL миграцию в Supabase.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmWork = async () => {
    await handleUpdateStatus('COMPLETED');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!transaction || !user) return;
    try {
      await supabase.from('reviews').insert({
        service_id: transaction.service_id,
        transaction_id: transactionId,
        reviewer_id: user.id,
        rating: reviewRating,
        comment: reviewComment
      });
      // Update service rating average
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('service_id', transaction.service_id);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length;
        await supabase.from('services').update({
          rating: Math.round(avg * 10) / 10,
          reviews_count: allReviews.length
        }).eq('id', transaction.service_id);
      }
    } catch (err) {
      console.warn('Review insert failed (table may not exist):', err);
    } finally {
      setShowReviewModal(false);
    }
  };

  const updateMilestoneStatus = async (milestoneIdx: number, newMilestoneStatus: string) => {
    if (!transaction) return;
    const milestones = Array.isArray(transaction.milestones_progress)
      ? [...transaction.milestones_progress]
      : Array.isArray(transaction.services?.milestones)
        ? transaction.services.milestones.map((m: any, i: number) => ({ ...m, id: i, status: 'pending' }))
        : [];

    milestones[milestoneIdx] = { ...milestones[milestoneIdx], status: newMilestoneStatus };

    try {
      await supabase.from('transactions')
        .update({ milestones_progress: milestones })
        .eq('id', transactionId);
      setTransaction((prev: any) => ({ ...prev, milestones_progress: milestones }));
      await sendSystemMessage(`📋 Этап "${milestones[milestoneIdx].title}" → ${newMilestoneStatus === 'done' ? 'Готово ✅' : 'Одобрено ✅'}`);
    } catch (err) {
      console.warn('Milestone update failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 size={64} className="animate-spin text-primary" />
        <p className="text-xl font-black text-muted-foreground animate-pulse tracking-wide uppercase">Входим в защищенный чат...</p>
      </div>
    );
  }

  if (!transaction) {
    return <div className="p-20 text-center font-black">Сделка не найдена</div>;
  }

  const isSeller = user?.id === transaction.seller_id;
  const otherUser = isSeller ? transaction.buyer : transaction.seller;
  const status = transaction.status;

  const isFrozen    = status === 'FROZEN';
  const isCompleted = status === 'COMPLETED';
  const isDisputed  = status === 'DISPUTED';
  const isActive    = status === 'ACTIVE';
  const isPendingReview = status === 'PENDING_REVIEW';

  const chatDisabled = isFrozen || isCompleted;

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    ACTIVE:         { label: 'АКТИВНА',    color: 'bg-success text-white',     icon: CheckCircle2 },
    PENDING_REVIEW: { label: 'НА ПРОВЕРКЕ', color: 'bg-blue-500 text-white',   icon: FileText },
    COMPLETED:      { label: 'ЗАВЕРШЕНА',  color: 'bg-primary text-white',     icon: CheckCircle2 },
    FROZEN:         { label: 'ЗАМОРОЖЕНА', color: 'bg-destructive text-white', icon: AlertCircle },
    DISPUTED:       { label: 'СПОР',       color: 'bg-warning text-white',     icon: AlertTriangle },
  };
  const statusInfo = statusConfig[status] || statusConfig.ACTIVE;

  // Milestones: prefer progress version, fall back to service milestones
  const milestones: any[] = Array.isArray(transaction.milestones_progress)
    ? transaction.milestones_progress
    : Array.isArray(transaction.services?.milestones)
      ? transaction.services.milestones.map((m: any, i: number) => ({ ...m, id: i, status: 'pending' }))
      : [];

  const milestoneStatusConfig: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Ожидает', color: 'text-muted-foreground bg-slate-100' },
    done:     { label: 'Сдано',   color: 'text-blue-600 bg-blue-50' },
    approved: { label: 'Принято', color: 'text-success bg-success/10' },
  };

  return (
    <WithVerification>
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-4 pb-4 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0 bg-white p-5 rounded-[28px] border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 hover:bg-accent rounded-2xl transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/5 border border-primary/10 overflow-hidden flex items-center justify-center font-black">
              {otherUser?.avatar
                ? <img src={otherUser.avatar} className="w-full h-full object-cover" />
                : otherUser?.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2 flex-wrap">
                {transaction.services?.title}
                <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-black tracking-widest uppercase ${statusInfo.color}`}>
                  <statusInfo.icon size={10} strokeWidth={3} />
                  {statusInfo.label}
                </span>
              </h1>
              <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                {isSeller ? 'Заказчик' : 'Исполнитель'}: {otherUser?.name}
                <span className="w-2 h-2 bg-success rounded-full shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFrozen && !isCompleted && (
            <button
              onClick={() => setShowPanicModal(true)}
              className="px-4 py-2.5 rounded-2xl font-black transition-all active:scale-95 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center gap-1.5 text-[11px] uppercase tracking-widest border border-destructive/20"
            >
              <AlertOctagon size={16} />
              SOS
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* ── Chat ── */}
        <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-border overflow-hidden shadow-sm">

          {/* Status Banner */}
          {(isFrozen || isCompleted || isDisputed || isPendingReview) && (
            <div className={`px-6 py-3 flex items-center gap-2 text-sm font-bold ${
              isFrozen        ? 'bg-destructive/10 text-destructive border-b border-destructive/20' :
              isDisputed      ? 'bg-warning/10 text-warning border-b border-warning/20' :
              isPendingReview ? 'bg-blue-50 text-blue-700 border-b border-blue-200' :
              'bg-success/10 text-success border-b border-success/20'
            }`}>
              {isFrozen        && <><AlertCircle size={16} /> Чат заморожен. Общение временно заблокировано.</>}
              {isCompleted     && <><CheckCircle2 size={16} /> Сделка завершена! Средства выплачены исполнителю.</>}
              {isDisputed      && <><AlertTriangle size={16} /> Открыт спор. Ожидайте решения модератора.</>}
              {isPendingReview && <><FileText size={16} /> Работа сдана на проверку. Заказчик должен принять или открыть спор.</>}
            </div>
          )}

          {/* Safety Warning */}
          {safetyWarning && (
            <div className="mx-4 mt-3 px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-2xl flex items-start gap-2 text-xs font-bold text-destructive animate-in slide-in-from-top-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{safetyWarning}</span>
              <button onClick={() => setSafetyWarning(null)} className="ml-auto text-destructive/60 hover:text-destructive">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {/* ТЗ Pinned Block */}
            {transaction.requirements && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                  <FileText size={12} /> Техническое задание
                </p>
                <p className="text-sm font-medium text-blue-900 leading-relaxed whitespace-pre-wrap">
                  {transaction.requirements}
                </p>
              </div>
            )}

            {/* Result block (for buyer, when PENDING_REVIEW) */}
            {isPendingReview && transaction.result && !isSeller && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-700 flex items-center gap-1.5">
                  <Upload size={12} /> Сданная работа
                </p>
                <p className="text-sm font-medium text-green-900 leading-relaxed whitespace-pre-wrap">
                  {transaction.result}
                </p>
              </div>
            )}

            {messages.length === 0 && !transaction.requirements && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
                <div className="w-14 h-14 bg-primary/5 rounded-[18px] flex items-center justify-center">
                  <ShieldCheck size={28} className="text-primary/30" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Начните общение</p>
                <p className="text-xs text-muted-foreground/60 font-medium">Safety AI мониторит чат в реальном времени</p>
              </div>
            )}

            {messages.map((msg) => {
              const fromMe = msg.sender_id === user?.id;
              const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isSystem = /^[✅🚨⚖️📎📤📋]/.test(msg.text || '');

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-white border border-border/60 px-5 py-2 rounded-2xl text-[11px] font-bold text-muted-foreground max-w-xs text-center shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}>
                  <div className="max-w-[72%] space-y-1">
                    <div className={`px-5 py-3.5 rounded-[24px] shadow-sm ${
                      fromMe
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-white border border-border/60 rounded-tl-sm text-foreground'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                    <p className={`text-[10px] text-muted-foreground ${fromMe ? 'text-right' : ''} font-bold uppercase tracking-widest px-1`}>
                      {time}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-border flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" accept="image/*,.pdf,.doc,.docx,.zip,.rar" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={chatDisabled}
              className="p-3 text-muted-foreground hover:bg-accent rounded-xl transition-all border border-transparent hover:border-border/40 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Прикрепить файл"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              placeholder={chatDisabled ? (isFrozen ? 'Чат заморожен...' : 'Сделка завершена') : 'Под защитой OPENwork Safety AI...'}
              className="flex-1 p-3.5 bg-slate-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 border border-border/40 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); if (safetyWarning) setSafetyWarning(null); }}
              disabled={chatDisabled}
            />
            <button
              type="submit"
              className="p-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
              disabled={chatDisabled || isSendingMsg || !newMessage.trim()}
            >
              {isSendingMsg ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-72 space-y-4 overflow-y-auto">

          {/* Escrow Card */}
          <div className="bg-white p-6 rounded-[28px] border border-border shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Финансы эскроу</p>
              <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 text-center space-y-0.5">
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">К выплате</p>
                <h2 className="text-3xl font-black text-primary">{transaction.amount?.toLocaleString()} ₸</h2>
                <p className="text-[10px] font-bold text-muted-foreground">
                  {isCompleted ? '💳 Выплачено' : isFrozen ? '🔒 Заморожено' : '🔒 В эскроу'}
                </p>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* ── Buyer Actions (ACTIVE) ── */}
            {isActive && !isSeller && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Действия заказчика</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-medium text-amber-800">
                  ⏳ Ожидаем сдачи работы от исполнителя.
                </div>
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="w-full py-3 bg-warning/10 text-warning text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-warning hover:text-white transition-all border border-warning/20 flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} /> Открыть спор
                </button>
              </div>
            )}

            {/* ── Buyer Actions (PENDING_REVIEW) ── */}
            {isPendingReview && !isSeller && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Проверка работы</p>
                {transaction.requirements && (
                  <div className="bg-blue-50 rounded-xl p-3 text-[11px] font-medium text-blue-800">
                    <span className="font-black">ТЗ:</span> {transaction.requirements.slice(0, 80)}{transaction.requirements.length > 80 ? '...' : ''}
                  </div>
                )}
                {transaction.result && (
                  <div className="bg-green-50 rounded-xl p-3 text-[11px] font-medium text-green-800">
                    <span className="font-black">Результат:</span> {transaction.result.slice(0, 80)}{transaction.result.length > 80 ? '...' : ''}
                  </div>
                )}
                <button
                  onClick={handleConfirmWork}
                  disabled={isUpdatingStatus}
                  className="w-full py-3.5 bg-success text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-success/90 transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Принять работу
                </button>
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="w-full py-3 bg-warning/10 text-warning text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-warning hover:text-white transition-all border border-warning/20 flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} /> Работа не принята
                </button>
              </div>
            )}

            {/* ── Seller Actions ── */}
            {isActive && isSeller && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-3.5 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Сдать работу
                </button>
                <p className="text-[10px] text-center text-muted-foreground font-medium">
                  После сдачи заказчик проверит результат
                </p>
              </div>
            )}

            {isPendingReview && isSeller && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center gap-2">
                <Clock size={16} className="text-blue-600 shrink-0" />
                <p className="text-[11px] font-bold text-blue-700">Работа сдана. Ожидаем решения заказчика.</p>
              </div>
            )}

            {isCompleted && (
              <div className="bg-success/5 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <p className="text-[11px] font-bold text-success leading-relaxed">Средства выплачены исполнителю!</p>
              </div>
            )}

            {isFrozen && (
              <div className="bg-destructive/5 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle size={16} className="text-destructive shrink-0" />
                <p className="text-[11px] font-bold text-destructive leading-relaxed">Сделка заморожена. Поддержка уведомлена.</p>
              </div>
            )}
          </div>

          {/* Milestones Card */}
          {milestones.length > 0 && (
            <div className="bg-white p-5 rounded-[28px] border border-border shadow-sm space-y-3">
              <button
                onClick={() => setShowMilestones(!showMilestones)}
                className="w-full flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]"
              >
                <span>Этапы работы ({milestones.filter((m: any) => m.status === 'approved').length}/{milestones.length})</span>
                {showMilestones ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showMilestones && (
                <div className="space-y-2">
                  {milestones.map((ms: any, i: number) => {
                    const cfg = milestoneStatusConfig[ms.status] || milestoneStatusConfig.pending;
                    return (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-border/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">{i + 1}</div>
                            <span className="text-xs font-bold leading-tight">{ms.title}</span>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary">{parseInt(ms.amount || 0).toLocaleString()} ₸</span>
                          <div className="flex gap-1">
                            {isActive && isSeller && ms.status === 'pending' && (
                              <button
                                onClick={() => updateMilestoneStatus(i, 'done')}
                                className="text-[9px] px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-black hover:bg-blue-200 transition-all"
                              >
                                Готово
                              </button>
                            )}
                            {isActive && !isSeller && ms.status === 'done' && (
                              <button
                                onClick={() => updateMilestoneStatus(i, 'approved')}
                                className="text-[9px] px-2 py-1 bg-success/20 text-success rounded-lg font-black hover:bg-success/30 transition-all"
                              >
                                Принять
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Progress bar */}
                  <div className="pt-1">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-500"
                        style={{ width: `${milestones.length ? (milestones.filter((m: any) => m.status === 'approved').length / milestones.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety Card */}
          <div className="bg-secondary/5 p-5 rounded-[28px] border border-secondary/20 border-dashed space-y-3">
            <h4 className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Safety AI активен
            </h4>
            <ul className="text-[11px] leading-relaxed text-muted-foreground font-medium space-y-1.5">
              <li className="flex gap-2"><span>•</span><span>Не переходите в сторонние мессенджеры</span></li>
              <li className="flex gap-2"><span>•</span><span>Все оплаты только через платформу</span></li>
              <li className="flex gap-2"><span>•</span><span>AI анализирует сообщения на угрозы</span></li>
              <li className="flex gap-2"><span>•</span><span>При опасности нажмите кнопку SOS</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Submit Work Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-[40px] p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Upload size={28} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Сдать работу</h2>
                <p className="text-sm text-muted-foreground font-medium">Опишите что вы сделали + ссылку или описание результата</p>
              </div>
            </div>

            {transaction.requirements && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">ТЗ заказчика</p>
                <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap">{transaction.requirements}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ваш результат</label>
              <textarea
                rows={5}
                value={workResult}
                onChange={e => setWorkResult(e.target.value)}
                placeholder="Опишите что именно вы сделали, добавьте ссылку на результат, Google Drive, GitHub и т.д."
                className="w-full p-4 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-sm font-medium resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-4 rounded-2xl border border-border font-black hover:bg-accent transition-all text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={!workResult.trim() || isUpdatingStatus}
                className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Сдать на проверку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-white rounded-[40px] p-8 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto">
                <Star size={32} className="text-warning" />
              </div>
              <h2 className="text-2xl font-black">Оцените исполнителя</h2>
              <p className="text-sm text-muted-foreground font-medium">Ваш отзыв поможет другим заказчикам</p>
            </div>

            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= reviewRating ? 'text-warning fill-warning' : 'text-border'}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="Расскажите о своём опыте работы с исполнителем..."
              className="w-full p-4 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-warning/20 text-sm font-medium resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-4 rounded-2xl border border-border font-black hover:bg-accent transition-all text-sm"
              >
                Пропустить
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-[2] py-4 rounded-2xl bg-warning text-white font-black hover:bg-warning/90 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-warning/20"
              >
                <Star size={16} /> Отправить отзыв
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOS Modal ── */}
      {showPanicModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPanicModal(false)} />
          <div className="relative bg-white rounded-[48px] p-10 max-w-sm w-full space-y-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-[32px] flex items-center justify-center mx-auto border border-destructive/20 shadow-xl shadow-destructive/5">
              <AlertTriangle size={48} strokeWidth={3} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-tight">SOS СИСТЕМА</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Вы чувствуете себя небезопасно? Мы заморозим сделку и немедленно уведомим родителей.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleUpdateStatus('FROZEN')}
                disabled={isUpdatingStatus}
                className="w-full py-5 bg-destructive text-white font-black rounded-3xl hover:bg-destructive/90 transition-all shadow-2xl shadow-destructive/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingStatus ? <Loader2 size={18} className="animate-spin" /> : null}
                ДА, МНЕ НУЖНА ПОМОЩЬ
              </button>
              <button
                onClick={() => setShowPanicModal(false)}
                className="w-full py-4 bg-slate-100 text-foreground font-black rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dispute Modal ── */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDisputeModal(false)} />
          <div className="relative bg-white rounded-[48px] p-10 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-warning/10 text-warning rounded-[28px] flex items-center justify-center border border-warning/20 mx-auto">
              <AlertTriangle size={40} strokeWidth={2} />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-black">Открыть спор</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Опишите проблему. Модератор рассмотрит её в течение 24 часов.
              </p>
            </div>
            <textarea
              rows={4}
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="Исполнитель не сдал работу / результат не соответствует ТЗ..."
              className="w-full p-4 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-warning/10 focus:border-warning/30 text-sm font-medium resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-4 rounded-2xl border border-border font-black hover:bg-accent transition-all text-sm"
              >
                Отмена
              </button>
              <button
                onClick={() => handleUpdateStatus('DISPUTED', disputeReason)}
                disabled={!disputeReason.trim() || isUpdatingStatus}
                className="flex-[2] py-4 rounded-2xl bg-warning text-white font-black hover:bg-warning/90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                Открыть спор
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </WithVerification>
  );
}
