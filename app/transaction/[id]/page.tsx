'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, Send, Paperclip,
  CheckCircle2, AlertTriangle,
  ArrowLeft, AlertOctagon,
  AlertCircle, Loader2, FileText, XCircle, Clock
} from 'lucide-react';

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!user || !transactionId) return;
      try {
        const { data: tx, error: txError } = await supabase
          .from('transactions')
          .select('*, services(*), buyer:buyer_id(*), seller:seller_id(*)')
          .eq('id', transactionId)
          .single();

        if (txError) throw txError;
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

    fetchTransactionData();

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSendingMsg) return;

    const blocked = ['whatsapp', 'telegram', 'телеграм', 'ватсап', '+7', 'номер', 'instagram', 'instagramm'];
    if (blocked.some(w => newMessage.toLowerCase().includes(w))) {
      alert('⚠️ Обмен контактами запрещён для вашей безопасности. Сообщение заблокировано Safety AI.');
      return;
    }

    setIsSendingMsg(true);
    try {
      const { error } = await supabase.from('messages').insert({
        transaction_id: transactionId,
        sender_id: user.id,
        text: newMessage
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Ошибка при отправке сообщения.');
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Send as a system message indicating file upload
    const fileMsg = `📎 Файл загружен: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    const { error } = await supabase.from('messages').insert({
      transaction_id: transactionId,
      sender_id: user.id,
      text: fileMsg
    });

    if (error) {
      alert('Ошибка при отправке файла.');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateStatus = async (newStatus: string, note?: string) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;
      setTransaction({ ...transaction, status: newStatus });

      // Send system message for status change
      if (user) {
        const statusMessages: Record<string, string> = {
          COMPLETED: '✅ Заказчик подтвердил выполнение работы. Сделка закрыта!',
          FROZEN: '🚨 Сделка заморожена. Команда поддержки уведомлена.',
          DISPUTED: `⚖️ Открыт спор. Причина: ${note || 'Не указана'}`,
        };
        if (statusMessages[newStatus]) {
          await supabase.from('messages').insert({
            transaction_id: transactionId,
            sender_id: user.id,
            text: statusMessages[newStatus]
          });
        }
      }

      if (newStatus === 'FROZEN') {
        setShowPanicModal(false);
        alert('🚨 Сделка ЗАМОРОЖЕНА. Команда поддержки уведомлена.');
      }
      if (newStatus === 'DISPUTED') {
        setShowDisputeModal(false);
        alert('⚖️ Спор открыт. Ожидайте связи от модератора.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Ошибка при обновлении статуса.');
    } finally {
      setIsUpdatingStatus(false);
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
  const isFrozen = transaction.status === 'FROZEN';
  const isCompleted = transaction.status === 'COMPLETED';
  const isDisputed = transaction.status === 'DISPUTED';
  const isActive = transaction.status === 'ACTIVE';

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    ACTIVE:    { label: 'АКТИВНА', color: 'bg-success text-white', icon: CheckCircle2 },
    COMPLETED: { label: 'ЗАВЕРШЕНА', color: 'bg-primary text-white', icon: CheckCircle2 },
    FROZEN:    { label: 'ЗАМОРОЖЕНА', color: 'bg-destructive text-white', icon: AlertCircle },
    DISPUTED:  { label: 'СПОР', color: 'bg-warning text-white', icon: AlertTriangle },
  };
  const statusInfo = statusConfig[transaction.status] || statusConfig.ACTIVE;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-6 pb-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white p-6 rounded-[32px] border border-border shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={() => router.back()} className="p-3 hover:bg-accent rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 overflow-hidden flex items-center justify-center font-black">
              {otherUser?.avatar
                ? <img src={otherUser.avatar} className="w-full h-full object-cover" />
                : otherUser?.name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-xl font-black flex items-center gap-3">
                {transaction.services?.title}
                <span className={`text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5 font-black tracking-widest uppercase ${statusInfo.color}`}>
                  <statusInfo.icon size={12} strokeWidth={3} />
                  {statusInfo.label}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground font-bold flex items-center gap-2">
                {isSeller ? 'Заказчик' : 'Исполнитель'}: {otherUser?.name}
                <span className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isFrozen && !isCompleted && (
            <button
              onClick={() => setShowPanicModal(true)}
              className="px-6 py-3 rounded-2xl font-black transition-all active:scale-95 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest border border-destructive/20 shadow-lg shadow-destructive/5"
            >
              <AlertOctagon size={18} />
              SOS
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-border overflow-hidden shadow-premium">
          {/* Frozen/Completed Banner */}
          {(isFrozen || isCompleted || isDisputed) && (
            <div className={`px-8 py-4 flex items-center gap-3 text-sm font-bold ${
              isFrozen ? 'bg-destructive/10 text-destructive border-b border-destructive/20' :
              isDisputed ? 'bg-warning/10 text-warning border-b border-warning/20' :
              'bg-success/10 text-success border-b border-success/20'
            }`}>
              {isFrozen && <><AlertCircle size={18} /> Чат заморожен. Общение временно заблокировано.</>}
              {isCompleted && <><CheckCircle2 size={18} /> Сделка успешно завершена! Средства выплачены.</>}
              {isDisputed && <><AlertTriangle size={18} /> Открыт спор. Ожидайте решения модератора.</>}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                <div className="w-16 h-16 bg-primary/5 rounded-[20px] flex items-center justify-center">
                  <ShieldCheck size={32} className="text-primary/30" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Начните разговор с исполнителем</p>
                <p className="text-xs text-muted-foreground/70 font-medium">Все сообщения фильтруются Safety AI</p>
              </div>
            )}
            {messages.map((msg) => {
              const fromMe = msg.sender_id === user?.id;
              const date = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isSystem = msg.text?.startsWith('✅') || msg.text?.startsWith('🚨') || msg.text?.startsWith('⚖️') || msg.text?.startsWith('📎');

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center animate-in fade-in">
                    <div className="bg-accent/80 px-6 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground max-w-sm text-center">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className="max-w-[70%] space-y-2">
                    <div className={`px-6 py-4 rounded-[28px] shadow-sm ${
                      fromMe
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white border border-border/60 rounded-tl-none text-foreground'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                    <p className={`text-[10px] text-muted-foreground ${fromMe ? 'text-right' : 'text-left'} font-black uppercase tracking-widest px-1`}>
                      {date}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-border flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.zip,.rar"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isFrozen || isCompleted}
              className="p-4 text-muted-foreground hover:bg-accent rounded-2xl transition-all border border-transparent hover:border-border/60 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Прикрепить файл"
            >
              <Paperclip size={22} />
            </button>
            <input
              type="text"
              placeholder={isFrozen ? 'Чат заморожен...' : isCompleted ? 'Сделка завершена' : 'Под защитой OPENwork Safety AI...'}
              className="flex-1 p-4 bg-slate-100/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 border border-border/40 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isFrozen || isCompleted}
            />
            <button
              type="submit"
              className="p-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              disabled={isFrozen || isCompleted || isSendingMsg || !newMessage.trim()}
            >
              {isSendingMsg ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6 overflow-y-auto pr-1">
          {/* Escrow Card */}
          <div className="bg-white p-8 rounded-[40px] border border-border shadow-premium space-y-6">
            <div>
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Финансы эскроу</h3>
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-1">
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">К выплате</p>
                <h2 className="text-3xl font-black text-primary">{transaction.amount?.toLocaleString()} ₸</h2>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className={isCompleted ? 'text-primary' : isFrozen ? 'text-destructive' : 'text-success'} />
                  <span className="text-xs font-black uppercase tracking-widest">Статус</span>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                  isCompleted ? 'bg-primary/10 text-primary' :
                  isFrozen ? 'bg-destructive/10 text-destructive' :
                  isDisputed ? 'bg-warning/10 text-warning' :
                  'bg-success/10 text-success'
                }`}>{transaction.status}</span>
              </div>

              {/* Buyer actions */}
              {isActive && !isSeller && (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    disabled={isUpdatingStatus}
                    className="w-full py-4 bg-success text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-success/90 transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Подтвердить выполнение
                  </button>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-3 bg-warning/10 text-warning text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-warning hover:text-white transition-all border border-warning/20 flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Открыть спор
                  </button>
                </div>
              )}

              {/* Seller: waiting */}
              {isActive && isSeller && (
                <div className="bg-accent/10 p-4 rounded-2xl flex items-center gap-3">
                  <Clock size={18} className="text-muted-foreground shrink-0" />
                  <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                    Ожидайте, пока заказчик подтвердит выполнение работы.
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="bg-primary/5 p-4 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <p className="text-[11px] font-bold text-primary leading-relaxed">
                    Средства успешно выплачены исполнителю!
                  </p>
                </div>
              )}

              {isFrozen && (
                <div className="bg-destructive/5 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={18} className="text-destructive shrink-0" />
                  <p className="text-[11px] font-bold text-destructive leading-relaxed">
                    Сделка заморожена. Поддержка уведомлена.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Safety Card */}
          <div className="bg-secondary/5 p-6 rounded-[32px] border border-secondary/20 border-dashed space-y-4">
            <h4 className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} />
              Safety AI активен
            </h4>
            <ul className="text-[11px] leading-relaxed text-muted-foreground font-bold space-y-2 italic">
              <li className="flex gap-2"><span>•</span> <span>Никогда не переходите в сторонние мессенджеры</span></li>
              <li className="flex gap-2"><span>•</span> <span>Все оплаты только через платформу</span></li>
              <li className="flex gap-2"><span>•</span> <span>AI мониторит чат на наличие угроз</span></li>
              <li className="flex gap-2"><span>•</span> <span>Вы можете прикрепить файл как доказательство работы</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* SOS / Panic Modal */}
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
                Вы чувствуете себя небезопасно? Мы немедленно заморозим сделку и уведомим родителей.
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

      {/* Dispute Modal */}
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
              placeholder="Исполнитель не сдал работу / результат не соответствует описанию..."
              className="w-full p-4 rounded-2xl border border-border bg-slate-50 focus:outline-none focus:ring-4 focus:ring-warning/10 focus:border-warning/30 text-sm font-medium resize-none"
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
  );
}
