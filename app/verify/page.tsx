'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, UploadCloud, Camera, CheckCircle2, 
  Loader2, ArrowRight, FileText, AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';

type Step = 'UPLOAD_DOC' | 'SELFIE' | 'PROCESSING' | 'RESULT';

export default function VerifyPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('UPLOAD_DOC');
  const [docUploaded, setDocUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  
  // States for final result
  const [confidence, setConfidence] = useState(0);

  // If already verified, maybe skip?
  useEffect(() => {
    if (user?.is_verified) {
      if (user.is_minor && !user.parent_id) {
        router.push('/parent-link');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mock upload
      setTimeout(() => setDocUploaded(true), 1500);
    }
  };

  const handleSelfieUpload = () => {
    // Mock upload
    setTimeout(() => {
      setSelfieUploaded(true);
    }, 1000);
  };

  const startProcessing = async () => {
    setStep('PROCESSING');
    
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          document: 'mock_doc_data',
          selfie: 'mock_selfie_data'
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setConfidence(data.confidence);
        await refreshProfile();
        setStep('RESULT');
      } else {
        alert('Ошибка профилирования. Попробуйте снова.');
        setStep('UPLOAD_DOC');
      }
    } catch (e) {
      console.error(e);
      setStep('UPLOAD_DOC');
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white rounded-[48px] p-10 border border-border/40 shadow-premium">
        
        {/* Header Setup */}
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-4">
             <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black">Верификация Личности</h1>
          <p className="text-muted-foreground font-medium text-sm px-6">
            Мы не храним ваши документы. 
            AI-система просто сравнит документ с лицом и сразу удалит файлы с серверов.
          </p>
        </div>

        {/* STEP 1: UPLOAD DOC */}
        {step === 'UPLOAD_DOC' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className={`relative border-2 border-dashed rounded-[32px] p-10 text-center transition-all ${docUploaded ? 'border-success bg-success/5' : 'border-border hover:border-primary/50 bg-slate-50'}`}>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleDocUpload}
                accept="image/*"
              />
              
              {docUploaded ? (
                <div className="space-y-3 pointer-events-none text-success flex flex-col items-center">
                  <CheckCircle2 size={48} />
                  <p className="font-black">Документ загружен</p>
                </div>
              ) : (
                <div className="space-y-3 pointer-events-none text-muted-foreground flex flex-col items-center">
                  <UploadCloud size={48} className="text-primary/40 mb-2" />
                  <p className="font-black text-foreground">Загрузите ID / Паспорт</p>
                  <p className="text-xs font-bold">Нажмите или перетащите файл</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setStep('SELFIE')} 
              disabled={!docUploaded}
              className="w-full btn-primary py-5 group disabled:opacity-50 flex items-center justify-center gap-3"
            >
              Продолжить <ArrowRight size={20} className="group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* STEP 2: SELFIE */}
        {step === 'SELFIE' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className={`relative rounded-[32px] overflow-hidden aspect-[4/3] flex items-center justify-center border-4 ${selfieUploaded ? 'border-success' : 'border-border bg-slate-900'}`}>
               {selfieUploaded ? (
                 <div className="absolute inset-0 bg-success/20 flex items-center justify-center backdrop-blur-md">
                   <div className="bg-white p-4 rounded-full text-success shadow-lg"><CheckCircle2 size={40} /></div>
                 </div>
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white/50 space-y-4">
                    <Camera size={64} />
                    <p className="font-bold text-sm uppercase tracking-widest">Камера активна</p>
                 </div>
               )}
            </div>

            <div className="flex gap-4">
              {!selfieUploaded ? (
                <button 
                  onClick={handleSelfieUpload} 
                  className="flex-1 btn-primary py-5 bg-slate-900 border-none shadow-xl hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <Camera size={20} /> Сделать фото
                </button>
              ) : (
                <button 
                  onClick={startProcessing} 
                  className="flex-1 btn-primary py-5 bg-primary group flex items-center justify-center gap-2"
                >
                  Начать проверку <ArrowRight size={20} className="group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'PROCESSING' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95">
             <div className="relative flex items-center justify-center">
               <div className="absolute w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <ShieldCheck size={48} className="text-primary animate-pulse" />
             </div>
             <div className="text-center space-y-2">
               <p className="text-xl font-black">Проверяем вашу личность...</p>
               <p className="text-sm font-bold text-muted-foreground animate-pulse">Анализ биометрии и документа</p>
             </div>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === 'RESULT' && (
          <div className="py-10 flex flex-col items-center text-center space-y-6 animate-in slide-in-from-bottom-8">
             <div className="w-24 h-24 bg-success/10 text-success rounded-[32px] flex items-center justify-center relative shadow-xl shadow-success/10">
               <ShieldCheck size={48} />
               <div className="absolute -bottom-2 -right-2 bg-success text-white p-1 rounded-full"><CheckCircle2 size={16} /></div>
             </div>
             
             <div className="space-y-2">
               <h2 className="text-3xl font-black text-success">Верификация Пройдена</h2>
               <p className="text-muted-foreground font-medium">Ваша личность подтверждена.</p>
             </div>

             <div className="w-full bg-slate-50 border border-border/60 rounded-3xl p-6 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confidence Score</p>
                  <p className="text-2xl font-black text-foreground">{confidence}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Статус</p>
                  <p className="text-sm font-black text-success bg-success/10 px-3 py-1 rounded-full inline-block mt-1">VERIFIED</p>
                </div>
             </div>

             <button 
                onClick={() => {
                  if (user?.is_minor) router.push('/parent-link');
                  else router.push('/');
                }}
                className="w-full btn-primary py-5 group mt-4 flex items-center justify-center gap-2"
             >
               Продолжить <ArrowRight size={20} className="group-hover:translate-x-1" />
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
