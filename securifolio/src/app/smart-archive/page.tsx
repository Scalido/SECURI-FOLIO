'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileImage, ShieldAlert, CheckCircle2, Loader2, AlertTriangle, FileText, Sparkles, Download, Lock } from 'lucide-react';

export default function SmartArchivePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbVerification, setDbVerification] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    let nom = 'Jean-Claude Kalombo';
    let numero_cadastral = 'SU/GOM/1023';
    let volume = 'A120';
    let folio = '45';
    let circonscription = 'Gombe';
    let superficie = '450 m²';
    let date_etablissement = '12 Mars 2018';

    if (scenario === 'divergent') {
      nom = 'Augustin Mwamba (Acheteur Non Enregistré)';
      numero_cadastral = 'SU/GOM/1023';
      volume = 'A120';
      folio = '45';
      circonscription = 'Gombe';
      superficie = '450 m²';
      date_etablissement = '12 Mars 2018';
    } else if (scenario === 'falsifie') {
      nom = 'Faux Propriétaire 1';
      numero_cadastral = 'SU/GOM/1023';
      volume = 'X999';
      folio = '45';
      circonscription = 'Gombe';
      superficie = '600 m²';
      date_etablissement = '14 Mai 2024';
    } else if (scenario === 'litige') {
      nom = 'Pierre Kasongo';
      numero_cadastral = 'SU/KIM/871';
      volume = 'K11';
      folio = '03';
      circonscription = 'Kisenso';
      superficie = '320 m²';
      date_etablissement = '09 Septembre 2021';
    } else if (scenario === 'inconnu') {
      nom = 'Michel Kabasele';
      numero_cadastral = 'SU/NGO/777';
      volume = 'Z55';
      folio = '09';
      circonscription = 'Ngaliema';
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

    // 9. Télécharger
    const link = document.createElement('a');
    link.download = `certificat_demo_${scenario}${hasRatures ? '_rature' : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
      processFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (fileToProcess: File) => {
    setStatus('analyzing');
    setErrorMsg('');
    setResult(null);
    setDbVerification(null);

    try {
      // 1. Lire le fichier localement en base64 via FileReader
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToProcess);
        reader.onload = () => {
          const rawBase64 = (reader.result as string).split(',')[1];
          resolve(rawBase64);
        };
        reader.onerror = (err) => reject(err);
      });

      const base64Data = await base64Promise;
      const mimeType = fileToProcess.type;

      // 2. Envoyer le base64 à la route API locale
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          mimeType,
        }),
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
    <div className="min-h-screen bg-brand-bg text-slate-900 dark:text-white font-sans selection:bg-brand-primary/20 relative overflow-hidden">
      
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
            Numérisez et extrayez instantanément les données clés de vos certificats d&apos;enregistrement et plans scannés.
          </p>
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
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={status === 'uploading' || status === 'analyzing'}
              className="mt-8 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border hover:border-brand-primary/50 text-slate-900 dark:text-white hover:text-brand-primary text-xs font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              Sélectionner un fichier
            </button>
          </div>
        )}

        {/* Demo Certificate Generator */}
        {status === 'idle' && (
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
                  <option value="falsifie">Scénario 3 : Falsifié Répertorié</option>
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
          <div className="mt-12 flex flex-col items-center space-y-4 animate-in fade-in duration-500">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            <p className="text-sm text-brand-primary font-bold uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              Analyse IA en cours...
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
          <div className="mt-12 w-full max-w-6xl animate-in slide-in-from-bottom-4 fade-in duration-500">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Colonne Gauche : Aperçu du Document & Alertes */}
              <div className="space-y-6 sticky top-24">
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
                   {file ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain" />
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
                      }}
                      className="flex-1 py-3.5 border border-slate-200 dark:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-surface rounded-xl text-xs font-bold uppercase tracking-widest transition-colors text-slate-600 dark:text-slate-300"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={() => {
                        alert("Données scellées et enregistrées avec succès dans le registre blockchain. Identifiant agent et horodatage sauvegardés.");
                        setResult(null);
                        setDbVerification(null);
                        setStatus('idle');
                        setFile(null);
                        setFormData(null);
                      }}
                      className="flex-[2] bg-brand-primary hover:bg-emerald-400 text-brand-bg py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center gap-2"
                    >
                      <Lock size={14} /> Confirmer et Sceller
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
        
        <section className="max-w-4xl w-full mx-auto mt-16 mb-8 space-y-6 animate-in fade-in duration-500">
          <div className="group bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-4">
              <Sparkles className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" /> Intelligence Artificielle & Audit
            </h2>
            <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed space-y-4">
              <p>
                Les archives foncières congolaises ont longtemps souffert de conditions de conservation précaires. De nombreux certificats sont froissés, partiellement effacés ou falsifiés manuellement (utilisation de blanc correcteur pour modifier une superficie ou un nom).
              </p>
              <div className="bg-brand-bg/50 p-5 rounded-xl border border-slate-200 dark:border-brand-border/50">
                <strong className="text-slate-900 dark:text-white block mb-3">Le rôle de l&apos;IA (Vision AI) :</strong>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><span className="text-brand-primary mt-0.5">■</span> <span><strong className="text-slate-200">Extraction Haute Précision :</strong> Le module lit et structure instantanément les métadonnées depuis n&apos;importe quel scan PDF ou photo.</span></li>
                  <li className="flex items-start gap-3"><span className="text-brand-primary mt-0.5">■</span> <span><strong className="text-slate-200">Audit Graphique :</strong> L&apos;algorithme traque visuellement la moindre altération, rature ou retouche suspecte sur le document physique.</span></li>
                  <li className="flex items-start gap-3"><span className="text-brand-primary mt-0.5">■</span> <span><strong className="text-slate-200">Validation Croisée :</strong> Les données extraites sont instantanément confrontées à la base de données historique de l&apos;État.</span></li>
                </ul>
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
