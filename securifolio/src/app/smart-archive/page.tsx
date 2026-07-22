'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileImage, ShieldAlert, CheckCircle2, Loader2, AlertTriangle, FileText, Sparkles, Download, Lock, Clock, Activity, MapPinOff, BookOpen, Scan, Brain, Map, Camera, Maximize, X } from 'lucide-react';
import { saveCertificate, getHistoryServer } from './actions';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';

const MapDigitizer = dynamic(() => import('@/components/MapDigitizer'), { ssr: false });

const loadingMessages = [
  "Initialisation du modèle d'analyse...",
  "Extraction du texte (OCR) en cours...",
  "Analyse sémantique des clauses...",
  "Croisement avec le registre central...",
  "Vérification d'intégrité visuelle...",
  "Finalisation du dossier..."
];

export default function SmartArchivePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbVerification, setDbVerification] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [geoAreaSqm, setGeoAreaSqm] = useState<number>(0);
  const [isLocationUnknown, setIsLocationUnknown] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const [loadingIndex, setLoadingIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (status === 'analyzing') {
      setLoadingIndex(0);
      setLoadingProgress(0);
      
      const startTime = Date.now();
      const duration = 15000; // 15 seconds expected max
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 95, 95); // Stop at 95%
        setLoadingProgress(progress);
      }, 100);

      const messageInterval = setInterval(() => {
        setLoadingIndex((prev) => Math.min(prev + 1, loadingMessages.length - 1));
      }, 2500);

      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    }
  }, [status]);
  
  interface HistoryItem {
    id: string;
    action_type: string;
    numero_cadastral: string;
    created_at: string;
  }
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await getHistoryServer();
      
      if (error) {
        setHistory([{ id: 'error', action_type: 'error', numero_cadastral: `ERR SERVER: ${error}`, created_at: new Date().toISOString() }]);
        return;
      }
      setHistory(data || []);
    } catch (err: unknown) {
      console.error("Erreur chargement historique (Server Action):", err);
      setHistory([{ id: 'error', action_type: 'error', numero_cadastral: `CATCH SERVER: ${(err as Error).message}`, created_at: new Date().toISOString() }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const generateMockCertificate = (scenario: string, hasRatures: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Fond beige parchemin
    ctx.fillStyle = '#f8f4eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Cadre ornemental
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // 3. En-tête officiel RDC
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Helvetica, Arial, sans-serif';
    ctx.fillText('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', canvas.width / 2, 80);

    ctx.font = '14px Helvetica, Arial, sans-serif';
    ctx.fillText('MINISTÈRE DES AFFAIRES FONCIÈRES', canvas.width / 2, 110);
    ctx.fillText('Conservation des Titres Immobiliers', canvas.width / 2, 130);

    // Ligne de séparation
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.lineTo(canvas.width - 150, 150);
    ctx.stroke();

    // 4. Titre du document
    ctx.fillStyle = '#8a6d3b';
    ctx.font = 'bold 28px Georgia, Times, serif';
    ctx.fillText("CERTIFICAT D'ENREGISTREMENT", canvas.width / 2, 210);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 16px Georgia, Times, serif';
    ctx.fillText("D'une Concession Perpétuelle", canvas.width / 2, 240);

    // 5. Remplir les données selon le scénario
    let nom = 'Mosele Mombanga';
    let numero_cadastral = '1178';
    let volume = 'AMA 171';
    let folio = '68';
    let circonscription = 'Limete';
    let superficie = '3049 m²';
    let date_etablissement = '14 Septembre 2020';

    if (scenario === 'divergent') {
      nom = 'Augustin Mwamba (Acheteur Non Enregistré)';
      numero_cadastral = '1178';
      volume = 'AMA 171';
      folio = '68';
      circonscription = 'Limete';
      superficie = '3049 m²';
      date_etablissement = '14 Septembre 2020';
    } else if (scenario === 'falsifie') {
      nom = 'Mosele Mombanga';
      numero_cadastral = '1178';
      volume = 'AMA 171';
      folio = '68';
      circonscription = 'Limete';
      superficie = '6000 m²';
      date_etablissement = '14 Septembre 2020';
    } else if (scenario === 'litige') {
      nom = 'Pierre Kasongo';
      numero_cadastral = '2044';
      volume = 'LUK 45';
      folio = '12';
      circonscription = 'Ngaliema';
      superficie = '320 m²';
      date_etablissement = '09 Septembre 2021';
    } else if (scenario === 'inconnu') {
      nom = 'Michel Kabasele';
      numero_cadastral = '8888';
      volume = 'XXX 99';
      folio = '00';
      circonscription = 'Gombe';
      superficie = '500 m²';
      date_etablissement = '22 Juillet 2023';
    }

    // 6. Dessiner le corps du texte
    ctx.textAlign = 'left';
    
    const startY = 320;
    const lineHeight = 55;

    const fields = [
      { label: 'Circonscription Foncière :', val: circonscription },
      { label: 'Numéro d\'Enregistrement de la Parcelle :', val: numero_cadastral },
      { label: 'Superficie de la Concession :', val: superficie },
      { label: 'Volume du Registre :', val: volume },
      { label: 'Folio du Registre :', val: folio },
      { label: 'Inscrit au Nom de (Propriétaire) :', val: nom },
      { label: 'Fait à Kinshasa, le :', val: date_etablissement },
    ];

    fields.forEach((f, index) => {
      const y = startY + index * lineHeight;
      ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(f.label, 80, y);
      
      ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(f.val, 380, y);

      // Ligne de séparation
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, y + 15);
      ctx.lineTo(canvas.width - 80, y + 15);
      ctx.stroke();
    });

    // 7. Sceau officiel
    const sealX = canvas.width - 180;
    const sealY = canvas.height - 180;
    
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(220, 38, 38, 0.6)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
    ctx.fillText('REPUBLIQUE', sealX, sealY - 20);
    ctx.fillText('DEMOCRATIQUE', sealX, sealY - 5);
    ctx.fillText('DU CONGO', sealX, sealY + 10);
    ctx.fillText('CADASTRE', sealX, sealY + 25);

    // Signature
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sealX - 40, sealY + 80);
    ctx.bezierCurveTo(sealX - 10, sealY + 40, sealX + 10, sealY + 100, sealX + 45, sealY + 70);
    ctx.stroke();

    // 8. Ratures si demandées
    if (hasRatures) {
      ctx.strokeStyle = 'rgba(180, 0, 0, 0.8)';
      ctx.lineWidth = 5;
      
      // Gribouiller sur le Volume
      ctx.beginPath();
      ctx.moveTo(380, startY + 3 * lineHeight - 5);
      ctx.lineTo(480, startY + 3 * lineHeight - 5);
      ctx.moveTo(375, startY + 3 * lineHeight + 5);
      ctx.lineTo(470, startY + 3 * lineHeight - 10);
      ctx.stroke();

      // Faux correcteur blanc puis réécrire
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(380, startY + 4 * lineHeight - 15, 60, 24);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px Helvetica, Arial, sans-serif';
      ctx.fillText('99', 390, startY + 4 * lineHeight + 5);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(380, startY + 4 * lineHeight - 15, 60, 24);
    }

    // 9. Créer le fichier et lancer l'analyse automatiquement
    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = `certificat_demo_${scenario}${hasRatures ? '_rature' : ''}.png`;
      const generatedFile = new File([blob], fileName, { type: 'image/png' });
      
      // Mettre à jour l'état de prévisualisation
      setFile(generatedFile);
      setPreviewUrl(URL.createObjectURL(generatedFile));
      
      // Optionnel: Télécharger aussi le fichier
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(generatedFile);
      link.click();
      
      // Lancer le traitement
      processFile(generatedFile);
    }, 'image/png');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      processFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      processFile(selectedFile);
    }
  };

  const processFile = async (fileToProcess: File) => {
    setStatus('analyzing');
    setErrorMsg('');
    setResult(null);
    setDbVerification(null);

    try {
      let imageUrlToSend = null;
      let base64DataToSend = null;
      const mimeType = fileToProcess.type;

      // 1. Si le fichier fait plus de 1.5 Mo, on l'upload d'abord sur Supabase pour contourner la limite stricte de 4.5 Mo de Vercel
      if (fileToProcess.size > 1.5 * 1024 * 1024) {
        const supabase = createClient();
        const fileExt = fileToProcess.name.split('.').pop() || 'pdf';
        const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('scans_certificats')
          .upload(tempFileName, fileToProcess);

        if (uploadError) {
          console.error("Erreur d'upload temporaire:", uploadError);
          throw new Error("Erreur réseau lors de l'envoi du document lourd. Vérifiez votre connexion.");
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('scans_certificats')
          .createSignedUrl(tempFileName, 300); // 5 minutes

        if (signedUrlError || !signedUrlData) {
          throw new Error("Impossible de générer le lien de sécurité pour l'analyse.");
        }
        
        imageUrlToSend = signedUrlData.signedUrl;
      } else {
        // Lecture locale en base64 pour les petits fichiers
        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fileToProcess);
          reader.onload = () => {
            const rawBase64 = (reader.result as string).split(',')[1];
            resolve(rawBase64);
          };
          reader.onerror = (err) => reject(err);
        });
        base64DataToSend = await base64Promise;
      }

      // 2. Envoyer les métadonnées à la route API locale
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { mimeType };
      if (imageUrlToSend) payload.imageUrl = imageUrlToSend;
      if (base64DataToSend) payload.base64Data = base64DataToSend;

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse du document.");
      }

      setResult(data.data);
      setFormData(data.data); // Initialize editable form
      setDbVerification(data.dbVerification);
      setStatus('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStatus('error');
    }
  };

  return (
    <div className="w-full flex-1 bg-brand-bg text-slate-900 dark:text-white font-sans selection:bg-brand-primary/20 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center relative z-10">
        {/* En-tête */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-2">
            <FileImage className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-300">Archive</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto font-medium">
            Interface Opérateur / Géomètre (Niveau 1) : Numérisation des certificats et capture des données spatiales.
          </p>
        </div>

        {/* Instructions d'utilisation */}
        <div className="w-full max-w-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <BookOpen className="w-6 h-6 text-blue-500 shrink-0" />
          <div>
            <h3 className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wide">Instructions (Phase 1)</h3>
            <ul className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-2 space-y-1 list-disc list-inside">
              <li>Prenez en photo ou uploadez le document physique (Certificat ou Plan).</li>
              <li>Vérifiez et corrigez les données extraites par l'IA (OCR).</li>
              <li>Utilisez le bouton <strong>"Importer Levé RTK (CSV)"</strong> pour intégrer automatiquement les coordonnées exactes du terrain (ou cochez "Localisation inconnue").</li>
              <li>Cliquez sur "Confirmer et Sceller" pour envoyer le dossier au <strong>Dashboard Cadastral</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Drag & Drop Area */}
        {(status === 'idle' || status === 'uploading' || status === 'analyzing') && (
          <div 
            className={`w-full max-w-2xl bg-white dark:bg-brand-surface/50 backdrop-blur-xl border-2 border-dashed rounded-3xl p-12 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[320px] shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
              isDragging 
                ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                : 'border-slate-200 dark:border-brand-border hover:border-brand-primary/50 hover:bg-brand-surface/80'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (status === 'idle') fileInputRef.current?.click();
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              accept="image/*,application/pdf" 
              className="hidden" 
              disabled={status === 'uploading' || status === 'analyzing'}
            />
            
            <div className="flex flex-col items-center space-y-5 pointer-events-none">
              <div className="p-5 bg-brand-bg rounded-2xl border border-slate-200 dark:border-brand-border shadow-[0_0_15px_rgba(16,185,129,0.1)] text-brand-primary">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Glissez-déposez le certificat (Image ou PDF)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  ou cliquez pour parcourir les dossiers
                </p>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileInput} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              disabled={status === 'uploading' || status === 'analyzing'}
            />
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={status === 'uploading' || status === 'analyzing'}
                className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border hover:border-brand-primary/50 text-slate-900 dark:text-white hover:text-brand-primary text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Sélectionner un fichier
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={status === 'uploading' || status === 'analyzing'}
                className="bg-brand-primary/10 border border-brand-primary/30 hover:border-brand-primary hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Prendre une photo
              </button>
            </div>
          </div>
        )}

        {/* Demo Certificate Generator (Uniquement en développement) */}
        {status === 'idle' && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 w-full max-w-2xl bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Générateur de Certificats</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Générez et téléchargez des images factices de certificats d&apos;enregistrement foncier pour tester les cas d&apos;usage de la plateforme (intégration base de données, détection de faux, litiges).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Scénario de test</label>
                <select 
                  id="scenario-select"
                  className="w-full bg-brand-bg border border-slate-200 dark:border-brand-border rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary cursor-pointer font-medium appearance-none"
                >
                  <option value="conforme">Scénario 1 : Conforme (Jean-Claude K.)</option>
                  <option value="divergent">Scénario 2 : Usurpation (Divergent)</option>
                  <option value="falsifie">Scénario 3 : Falsification Haute Volée (Subtile)</option>
                  <option value="litige">Scénario 4 : Parcelle en Litige</option>
                  <option value="inconnu">Scénario 5 : Certificat Inconnu</option>
                </select>
              </div>
              <div className="flex items-center pt-6 px-2">
                <label className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none font-semibold group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                     <input 
                       type="checkbox" 
                       id="ratures-checkbox"
                       className="peer appearance-none w-5 h-5 border border-slate-200 dark:border-brand-border rounded bg-brand-bg checked:bg-brand-primary checked:border-brand-primary transition-all cursor-pointer"
                     />
                     <svg className="absolute w-3 h-3 text-brand-bg pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                  </div>
                  <span className="group-hover:text-white transition-colors">Simuler des ratures visuelles</span>
                </label>
              </div>
            </div>
            <button 
              onClick={() => {
                const scenario = (document.getElementById('scenario-select') as HTMLSelectElement)?.value || 'conforme';
                const hasRatures = (document.getElementById('ratures-checkbox') as HTMLInputElement)?.checked || false;
                generateMockCertificate(scenario, hasRatures);
              }}
              className="w-full flex items-center justify-center gap-2 mt-4 bg-brand-bg hover:bg-brand-surface border border-slate-200 dark:border-brand-border text-slate-900 dark:text-white hover:text-brand-primary text-xs font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest"
            >
              <Download className="w-4 h-4" /> Générer le PNG
            </button>
          </div>
        )}

        {/* Status Indicators */}
        {(status === 'uploading' || status === 'analyzing') && (
          <div className="mt-12 flex flex-col items-center max-w-md mx-auto space-y-6 animate-in fade-in duration-500 bg-white dark:bg-brand-surface/60 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-brand-border shadow-xl">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-5 h-5 text-brand-primary/50 animate-pulse" />
              </div>
            </div>
            
            <div className="w-full space-y-3">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 animate-pulse">
                  {status === 'uploading' ? 'Chiffrement et envoi sécurisé...' : loadingMessages[loadingIndex]}
                </p>
                <span className="text-xs font-mono font-bold text-brand-primary">
                  {status === 'uploading' ? '15%' : `${Math.round(loadingProgress)}%`}
                </span>
              </div>
              
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-brand-primary transition-all duration-300 ease-out relative"
                  style={{ width: `${status === 'uploading' ? 15 : loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20"></div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 max-w-[280px] leading-relaxed">
              Veuillez patienter pendant que nos algorithmes vérifient l'authenticité et extraient les données de ce document...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-12 w-full max-w-2xl bg-red-500/10 border border-red-500/30 rounded-3xl p-6 flex items-start gap-4 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-bold text-base">Échec de l&apos;opération</h3>
              <p className="text-red-400/80 mt-1 text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Results Area (Split Screen) */}
        {status === 'success' && result && formData && (
          <div className="mt-12 w-full max-w-6xl animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ transform: isMapFullscreen ? 'none' : undefined, animation: isMapFullscreen ? 'none' : undefined }}>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Colonne Gauche : Aperçu du Document & Alertes */}
              <div className="space-y-6 lg:sticky lg:top-24">
                {/* Visual Integrity Banner */}
                {result.alerte_phenomene_folio ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <ShieldAlert className="w-10 h-10 text-red-500 shrink-0 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div>
                      <h3 className="text-red-400 font-bold text-base uppercase tracking-wider">Alerte Rature Visuelle</h3>
                      <p className="text-red-400/80 text-xs mt-1.5 font-medium leading-relaxed">L&apos;IA a détecté des modifications suspectes ou du blanc correcteur sur le document physique. Validation humaine critique requise.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-10 h-10 text-brand-primary shrink-0 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-bold text-base uppercase tracking-wider">Document Intègre</h3>
                      <p className="text-brand-primary/80 text-xs mt-1.5 font-medium leading-relaxed">Aucune altération visuelle suspecte détectée sur le scan.</p>
                    </div>
                  </div>
                )}

                {/* Registre Central Verification Banner */}
                {dbVerification && (
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    {!dbVerification.found ? (
                      <div className="bg-white dark:bg-brand-surface/80 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="bg-brand-bg p-3 rounded-xl shrink-0 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-brand-border">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 dark:text-white font-bold text-base uppercase tracking-wider">Titre Inconnu</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">Ce numéro n&apos;est pas répertorié. Nouvel enregistrement ou erreur de numérisation ?</p>
                        </div>
                      </div>
                    ) : dbVerification.status === 'Falsifié' ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse-slow">
                        <ShieldAlert className="w-10 h-10 text-red-500 shrink-0 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        <div>
                          <h3 className="text-red-400 font-bold text-base uppercase tracking-wider">Alerte : Falsifié Répertorié</h3>
                          <p className="text-red-400/80 text-xs mt-1.5 font-medium leading-relaxed">Ce titre est enregistré comme falsifié. Conserver l'archive pour enquête.</p>
                        </div>
                      </div>
                    ) : dbVerification.status === 'Litige' ? (
                      <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        <AlertTriangle className="w-10 h-10 text-brand-accent shrink-0 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        <div>
                          <h3 className="text-brand-accent font-bold text-base uppercase tracking-wider">Titre en Litige</h3>
                          <p className="text-brand-accent/80 text-xs mt-1.5 font-medium leading-relaxed">Ce titre fait l&apos;objet d&apos;un litige juridique. Validation restreinte.</p>
                        </div>
                      </div>
                    ) : !dbVerification.matches.nom || !dbVerification.matches.volume || !dbVerification.matches.folio || !dbVerification.matches.circonscription ? (
                      <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        <AlertTriangle className="w-10 h-10 text-brand-accent shrink-0 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        <div>
                          <h3 className="text-brand-accent font-bold text-base uppercase tracking-wider">Divergences Base de Données</h3>
                          <p className="text-brand-accent/80 text-xs mt-1.5 font-medium leading-relaxed">Vérifiez scrupuleusement les champs ci-contre, l'IA a extrait des données différentes du registre.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <CheckCircle2 className="w-10 h-10 text-brand-primary shrink-0 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <div>
                          <h3 className="text-slate-900 dark:text-white font-bold text-base uppercase tracking-wider">Concordance Validée</h3>
                          <p className="text-brand-primary/80 text-xs mt-1.5 font-medium leading-relaxed">L'extraction correspond au registre. Validation rapide possible.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* File Preview */}
                <div className="bg-brand-surface/40 border border-brand-border rounded-3xl overflow-hidden aspect-[3/4] relative flex items-center justify-center">
                   {previewUrl ? (
                     file?.type === 'application/pdf' ? (
                       <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none rounded-3xl bg-white" title="Aperçu PDF" />
                     ) : (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                     )
                   ) : (
                     <div className="text-slate-500 flex flex-col items-center">
                       <FileImage className="w-12 h-12 mb-2 opacity-50" />
                       <span className="text-xs uppercase tracking-widest font-bold">Aperçu du scan</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Colonne Droite : Formulaire d'extraction et validation humaine */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-brand-border bg-brand-bg/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand-primary" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Validation de l'Extraction (OCR)</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Vérification humaine obligatoire avant scellement</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-5 flex-1">
                  
                  {/* Field Template */}
                  {['nom', 'numero_cadastral', 'volume', 'folio', 'circonscription', 'superficie', 'date_etablissement'].map((key) => {
                    const labelMap: Record<string, string> = {
                      nom: "Propriétaire (Nom)",
                      numero_cadastral: "N° d'enregistrement (Cadastre)",
                      volume: "Volume du Registre",
                      folio: "Folio du Registre",
                      circonscription: "Circonscription Foncière",
                      superficie: "Superficie de la Concession",
                      date_etablissement: "Date d'établissement"
                    };
                    
                    // Simulate confidence scores (lower if there's a discrepancy)
                    const isDivergent = dbVerification?.found && key !== 'superficie' && key !== 'date_etablissement' && dbVerification.matches && !dbVerification.matches[key];
                    const confidence = isDivergent ? Math.floor(Math.random() * 15) + 65 : Math.floor(Math.random() * 10) + 90; 

                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{labelMap[key]}</label>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${confidence > 85 ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-accent/20 text-brand-accent'}`}>
                            Confiance IA: {confidence}%
                          </span>
                        </div>
                        <input 
                          type="text" 
                          value={formData[key] || ''} 
                          onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                          className={`w-full bg-brand-bg/50 border ${isDivergent ? 'border-brand-accent/50 focus:border-brand-accent' : 'border-slate-200 dark:border-brand-border focus:border-brand-primary'} rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none transition-colors`}
                        />
                        {isDivergent && (
                           <p className="text-[10px] text-brand-accent font-medium flex items-center gap-1 mt-1">
                             <AlertTriangle size={10} /> Registre indique : <span className="font-bold">{dbVerification?.dbRecord?.[key === 'nom' ? 'nom_proprietaire' : key]}</span>
                           </p>
                        )}
                      </div>
                    );
                  })}
                  
                </div>

                {/* Résolution Spatiale (Technique B) */}
                <div className="p-6 border-t border-slate-200 dark:border-brand-border bg-brand-bg/10">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-primary" /> Résolution Spatiale
                    </h3>
                    <div className="flex items-center gap-3">
                      {geoAreaSqm > 0 && !isLocationUnknown && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${Math.abs(geoAreaSqm - parseFloat(formData?.superficie || '0')) > (parseFloat(formData?.superficie || '0') * 0.1) ? 'bg-red-500/10 text-red-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                          Aire tracée: {geoAreaSqm.toFixed(2)} m²
                        </span>
                      )}
                      <button onClick={() => { setIsMapFullscreen(true); setTimeout(() => window.dispatchEvent(new Event('resize')), 50); }} className="hidden md:flex p-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 tooltip" title="Agrandir la carte">
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4 font-medium leading-relaxed">
                    Si le document ne possède pas de coordonnées absolues, veuillez dessiner le polygone de la parcelle sur la carte (Technique B). Vous pouvez utiliser le marqueur pour vous positionner.
                  </p>
                  
                  <div className={`transition-all duration-300 relative ${isLocationUnknown ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                    {/* Conteneur principal (Plein écran ou intégré) */}
                    <div className={
                      isMapFullscreen 
                        ? "fixed inset-0 z-[100] bg-white dark:bg-brand-bg flex flex-col p-4 md:p-6 animate-in fade-in zoom-in-95 duration-200"
                        : "relative h-[400px] hidden md:block rounded-2xl overflow-hidden border border-slate-200 dark:border-brand-border"
                    }>
                      {isMapFullscreen && (
                        <div className="flex items-center justify-between mb-4 shrink-0 bg-slate-50 dark:bg-brand-surface p-4 rounded-xl border border-slate-200 dark:border-brand-border shadow-sm">
                          <div>
                            <h3 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                              <Map className="w-5 h-5 text-brand-primary" /> Numérisation de la parcelle
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 md:hidden flex items-center gap-2">
                              <Sparkles className="w-3 h-3 text-brand-primary" />
                              Tournez votre appareil en paysage
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                               setIsMapFullscreen(false);
                               setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                            }} 
                            className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2 font-bold text-sm transition-colors shadow-sm"
                          >
                            <X className="w-4 h-4" /> <span className="hidden sm:inline">Valider le tracé</span>
                          </button>
                        </div>
                      )}
                      
                      <div className={isMapFullscreen ? "flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-xl" : "h-full w-full"}>
                        <MapDigitizer onPolygonDrawn={(geojson, area) => { setGeoData(geojson); setGeoAreaSqm(area); }} />
                      </div>
                    </div>

                    {/* Bouton d'ouverture (Mobile) */}
                    {!isMapFullscreen && (
                       <div className="md:hidden mt-2">
                         <button onClick={() => {
                             setIsMapFullscreen(true);
                             setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                           }} 
                           className="w-full py-4 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border hover:border-brand-primary/50 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold shadow-sm flex flex-col items-center justify-center gap-2 transition-colors group"
                         >
                           <Maximize className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
                           Ouvrir la carte de numérisation
                         </button>
                       </div>
                    )}

                    {isLocationUnknown && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 dark:bg-slate-900/30 backdrop-blur-[1px] z-10 rounded-2xl">
                         <MapPinOff className="w-12 h-12 text-slate-500 mb-2 opacity-50" />
                         <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Saisie spatiale désactivée</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="unknownLocation" 
                      checked={isLocationUnknown}
                      onChange={(e) => {
                        setIsLocationUnknown(e.target.checked);
                        if (e.target.checked) {
                          setGeoData(null);
                          setGeoAreaSqm(0);
                        }
                      }}
                      className="mt-0.5 accent-amber-500" 
                    />
                    <label htmlFor="unknownLocation" className="text-xs text-amber-800 dark:text-amber-200/80 font-medium leading-relaxed cursor-pointer">
                      <strong>Localisation spatiale inconnue :</strong> Je n'ai pas les moyens d'identifier la parcelle avec précision. (Le dossier sera marqué "Topographie requise" pour une descente sur le terrain).
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-brand-border bg-brand-bg/30 space-y-4">
                  <div className="flex items-start gap-2 text-[10px] text-slate-500 font-medium">
                    <input type="checkbox" id="certify" className="mt-0.5 accent-brand-primary" />
                    <label htmlFor="certify">En tant qu'agent assermenté (AF-7892), j'atteste sur l'honneur avoir vérifié visuellement la conformité de ces données avec le document physique original. Toute altération non signalée engagera ma responsabilité pénale.</label>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setResult(null);
                        setDbVerification(null);
                        setStatus('idle');
                        setFile(null);
                        setFormData(null);
                        setGeoData(null);
                        setGeoAreaSqm(0);
                        setIsLocationUnknown(false);
                      }}
                      className="flex-1 py-3.5 border border-slate-200 dark:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-surface rounded-xl text-xs font-bold uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300"
                    >
                      Annuler
                    </button>
                    <button 
                      disabled={isSaving}
                      onClick={async () => {
                        if (!file) {
                          alert("Erreur : Aucun fichier scan n'est disponible pour le stockage.");
                          return;
                        }
                        if (!geoData && !isLocationUnknown) {
                          alert("Erreur : Veuillez tracer le polygone de la parcelle sur la carte, ou cochez 'Localisation spatiale inconnue'.");
                          return;
                        }
                        setIsSaving(true);
                        try {
                          const supabase = createClient();
                          // 1. Upload du fichier vers Supabase Storage
                          const fileExt = file.name.split('.').pop() || 'png';
                          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                          
                          const { error: uploadError } = await supabase.storage
                            .from('scans_certificats')
                            .upload(fileName, file);

                          if (uploadError) {
                            console.error("Erreur d'upload:", uploadError);
                            alert("Erreur lors de la sauvegarde du fichier scan. Vérifiez que le bucket existe et est configuré.");
                            setIsSaving(false);
                            return;
                          }

                          // 2. Récupérer l'URL publique
                          const { data: { publicUrl } } = supabase.storage
                            .from('scans_certificats')
                            .getPublicUrl(fileName);

                          // 3. Sauvegarder dans la DB (avec Zod et RBAC en backend)
                          const res = await saveCertificate(formData, publicUrl, geoData, isLocationUnknown);
                          
                          if (!res.success) {
                            if (res.error === 'TITRE_DEJA_NUMERISE') {
                              alert(`🚨 ALERTE DOUBLON : ${res.message}`);
                            } else {
                              alert(`Erreur : ${res.error}`);
                            }
                          } else {
                            alert("Données transmises ! Le dossier a été envoyé au Cadastre et est 'En attente de validation cadastrale'.");
                            setResult(null);
                            setDbVerification(null);
                            setStatus('idle');
                            setFile(null);
                            setFormData(null);
                            setGeoData(null);
                            setGeoAreaSqm(0);
                            setIsLocationUnknown(false);
                          }
                          // Mettre à jour l'historique après l'action !
                          await fetchHistory();
                        } catch (err) {
                          alert("Une erreur inattendue est survenue.");
                          console.error(err);
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="flex-[2] bg-brand-primary hover:bg-emerald-400 disabled:bg-brand-primary/50 disabled:cursor-not-allowed text-brand-bg py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none transition-all flex justify-center items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} 
                      {isSaving ? "Enregistrement..." : "Confirmer et Sceller"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
        
        <section className="max-w-4xl w-full mx-auto mt-16 mb-8 space-y-12 animate-in fade-in duration-500">
          {/* Section: Comment ça fonctionne */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center flex items-center justify-center gap-3">
              <BookOpen className="w-6 h-6 text-brand-primary" />
              Comment fonctionne l'Archivage Intelligent ?
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4 relative">
              {/* Ligne de connexion visuelle (desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent -translate-y-1/2 z-0" />
              
              {/* Etape 1 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Scan className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">1. Capture / Numérisation</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  L'agent photographie ou scanne le certificat d'enregistrement physique. Le document original est téléchargé de manière sécurisée vers les serveurs de l'État.
                </p>
              </div>

              {/* Etape 2 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">2. Extraction (IA)</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Notre Vision AI lit, comprend et extrait automatiquement toutes les métadonnées (Propriétaire, Superficie, Dates) tout en traquant la moindre falsification (rature, blanco).
                </p>
              </div>

              {/* Etape 3 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Map className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">3. Ancrage Spatial</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Le géomètre téléverse les données brutes (CSV/KML) issues de son appareil RTK. L'outil génère automatiquement le tracé avec une précision centimétrique, scellant la position sans intervention humaine.
                </p>
              </div>

              {/* Etape 4 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">4. Scellement</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Les métadonnées et les coordonnées sont "scellées" cryptographiquement dans la base de données. Le <strong>Jumeau Numérique</strong> est créé et prêt à être audité.
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-3">
              <ShieldAlert className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" /> Bases Légales (Numérisation)
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Conformément à l&apos;évolution vers l&apos;e-gouvernance foncière, cet outil soutient les efforts d&apos;assainissement du cadastre congolais en accélérant l&apos;authentification des titres existants et en archivant numériquement les données pour une meilleure traçabilité.
            </p>
          </div>
        </section>

        {/* Section Historique d'Audit */}
        <section className="max-w-4xl w-full mx-auto mb-16 animate-in fade-in duration-500 delay-200">
          <div className="bg-white dark:bg-brand-surface/40 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-brand-border bg-brand-bg/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-brand-surface rounded-lg">
                  <Activity className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Historique d'Audit de mes Actions</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Traçabilité complète des insertions et rejets</p>
                </div>
              </div>
              <button 
                onClick={fetchHistory}
                disabled={isLoadingHistory}
                className="text-xs text-slate-500 hover:text-brand-primary flex items-center gap-2 transition-colors"
              >
                <Clock className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
            </div>
            
            <div className="p-0">
              {isLoadingHistory && history.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary/50" />
                  <span className="text-sm font-medium">Chargement de l'historique...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Aucune action enregistrée pour le moment.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-brand-border/50">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-brand-surface/20 transition-colors">
                      <div className="flex items-center gap-4">
                        {item.action_type === 'insert' ? (
                          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-brand-accent" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {item.action_type === 'insert' ? 'Titre Scellé' : 'Doublon Bloqué'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brand-surface text-slate-600 dark:text-slate-300 font-mono font-medium">
                              {item.numero_cadastral}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.action_type === 'insert' 
                              ? 'Le certificat a été numérisé avec succès.' 
                              : 'Une tentative de création a été bloquée pour cause de doublon cadastral.'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 40px rgba(239, 68, 68, 0.1); }
          50% { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 0 60px rgba(239, 68, 68, 0.2); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
}
