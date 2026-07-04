'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileImage, ShieldAlert, CheckCircle2, Loader2, AlertTriangle, FileText, Sparkles, Download } from 'lucide-react';

export default function SmartArchivePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
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
        throw new Error(data.error || 'Erreur lors de l\'analyse du document.');
      }

      setResult(data.data);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-[#007FFF]/20 transition-colors duration-200">
      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center">
        {/* En-tête */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-900 text-slate-850 dark:text-white rounded-2xl mb-3 shadow-sm dark:shadow-md border border-slate-200 dark:border-slate-880">
            <FileImage className="w-8 h-8 text-[#F7D618]" />
          </div>
          <h1 className="font-display text-4xl font-black text-[#0a192f] dark:text-white tracking-tight leading-tight">
            Smart Archive
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-medium">
            Numérisez et extrayez instantanément les données clés de vos certificats d&apos;enregistrement et plans scannés.
          </p>
        </div>

        {/* Drag & Drop Area */}
        {(status === 'idle' || status === 'uploading' || status === 'analyzing') && (
          <div 
            className={`w-full max-w-2xl bg-white dark:bg-slate-900/30 border-2 border-dashed rounded-3xl p-12 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[320px] shadow-sm ${
              isDragging 
                ? 'border-[#007FFF] bg-[#007FFF]/5 dark:bg-[#007FFF]/5' 
                : 'border-slate-300 dark:border-slate-800 hover:border-[#007FFF]/50 hover:bg-slate-50 dark:hover:bg-slate-900/50'
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
            
            <div className="flex flex-col items-center space-y-4 pointer-events-none">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm text-slate-400 dark:text-slate-500">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Glissez-déposez le certificat (Image ou PDF)
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
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
              className="mt-6 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              Sélectionner un fichier
            </button>
          </div>
        )}

        {/* Demo Certificate Generator */}
        {status === 'idle' && (
          <div className="mt-8 w-full max-w-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-750 dark:text-slate-200">Générateur de Certificats de Démo</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-405">
              Générez et téléchargez des images factices de certificats d&apos;enregistrement foncier pour tester les cas d&apos;usage de la plateforme (intégration base de données, détection de faux, litiges).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Scénario de test</label>
                <select 
                  id="scenario-select"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-355 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="conforme">Scénario 1 : Certificat Conforme (Jean-Claude Kalombo)</option>
                  <option value="divergent">Scénario 2 : Usurpation (Nom du propriétaire divergent)</option>
                  <option value="falsifie">Scénario 3 : Certificat Falsifié Répertorié</option>
                  <option value="litige">Scénario 4 : Parcelle en Litige Juridique</option>
                  <option value="inconnu">Scénario 5 : Certificat Inconnu (Hors-registre)</option>
                </select>
              </div>
              <div className="flex items-center pt-5 px-1">
                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none font-semibold">
                  <input 
                    type="checkbox" 
                    id="ratures-checkbox"
                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-[#007FFF] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Simuler des ratures / anomalies visuelles</span>
                </label>
              </div>
            </div>
            <button 
              onClick={() => {
                const scenario = (document.getElementById('scenario-select') as HTMLSelectElement)?.value || 'conforme';
                const hasRatures = (document.getElementById('ratures-checkbox') as HTMLInputElement)?.checked || false;
                generateMockCertificate(scenario, hasRatures);
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#112240]/40 dark:hover:bg-[#112240]/80 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-200 text-xs font-bold py-3 rounded-xl transition-all"
            >
              <Download className="w-4 h-4" /> Générer & Télécharger le Certificat (PNG)
            </button>
          </div>
        )}

        {/* Status Indicators */}
        {(status === 'uploading' || status === 'analyzing') && (
          <div className="mt-12 flex flex-col items-center space-y-4 animate-in fade-in duration-500">
            <Loader2 className="w-8 h-8 text-[#007FFF] animate-spin" />
            <p className="text-sm text-[#007FFF] font-semibold">
              Analyse en cours par Gemini Vision...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-12 w-full max-w-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 flex items-start gap-4 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-6 h-6 text-red-650 dark:text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 dark:text-red-300 font-bold text-base">Échec de l&apos;opération</h3>
              <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {status === 'success' && result && (
          <div className="mt-12 w-full max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
            
            {/* Visual Integrity Banner */}
            {result.alerte_phenomene_folio ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-500 shrink-0" />
                <div>
                  <h3 className="text-red-800 dark:text-red-300 font-bold text-base">Alerte Rature Visuelle</h3>
                  <p className="text-red-600 dark:text-red-450 text-xs mt-0.5 font-medium">Gemini a détecté des modifications suspectes ou du blanc correcteur sur les chiffres. Risque de phénomène Folio.</p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-emerald-800 dark:text-emerald-300 font-bold text-base">Document Visuellement Intègre</h3>
                  <p className="text-emerald-650 dark:text-emerald-455 text-xs mt-0.5 font-medium">Aucune altération visuelle suspecte détectée sur le document.</p>
                </div>
              </div>
            )}

            {/* Registre Central Verification Banner */}
            {dbVerification && (
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                {!dbVerification.found ? (
                  <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="bg-white dark:bg-slate-950 p-2 rounded-xl shrink-0 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-slate-800 dark:text-slate-200 font-bold text-base">Titre Inconnu dans le Registre</h3>
                      <p className="text-slate-500 dark:text-slate-450 text-xs mt-0.5 font-medium">Ce numéro d&apos;enregistrement n&apos;est pas répertorié dans le registre central officiel de la RDC.</p>
                    </div>
                  </div>
                ) : dbVerification.status === 'Falsifié' ? (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm animate-pulse-slow">
                    <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-500 shrink-0" />
                    <div>
                      <h3 className="text-red-800 dark:text-red-300 font-bold text-base">Alerte : Titre Falsifié Répertorié</h3>
                      <p className="text-red-600 dark:text-red-400 text-xs mt-0.5 font-medium">Ce titre foncier est officiellement enregistré comme ayant fait l&apos;objet de falsification dans le registre.</p>
                    </div>
                  </div>
                ) : dbVerification.status === 'Litige' ? (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500 shrink-0" />
                    <div>
                      <h3 className="text-amber-800 dark:text-amber-300 font-bold text-base">Titre en Litige</h3>
                      <p className="text-amber-650 dark:text-amber-400 text-xs mt-0.5 font-medium">Attention, ce titre foncier fait l&apos;objet d&apos;un litige juridique en cours d&apos;après le registre central.</p>
                    </div>
                  </div>
                ) : !dbVerification.matches.nom || !dbVerification.matches.volume || !dbVerification.matches.folio || !dbVerification.matches.circonscription ? (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500 shrink-0" />
                    <div>
                      <h3 className="text-amber-800 dark:text-amber-300 font-bold text-base">Divergences détectées avec le Registre</h3>
                      <p className="text-amber-650 dark:text-amber-400 text-xs mt-0.5 font-medium">Ce titre existe mais ses informations ne correspondent pas exactement à la base centrale (risque d&apos;usurpation).</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-650 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-emerald-800 dark:text-emerald-300 font-bold text-base">Titre Authentique & Validé</h3>
                      <p className="text-emerald-600 dark:text-emerald-450 text-xs mt-0.5 font-medium">Toutes les informations concordent parfaitement avec le registre central officiel de la RDC.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Fields Table */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/50 flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#007FFF]" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Données Extraites</h2>
              </div>
              <div className="p-6">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-850/50">
                      <th className="py-4 text-slate-450 dark:text-slate-500 font-bold text-xs uppercase tracking-wider w-1/3 font-semibold">Propriétaire (Nom)</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{result.nom || 'Non détecté'}</span>
                          {dbVerification && dbVerification.found && (
                            dbVerification.matches.nom ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                                <CheckCircle2 className="w-3 h-3" /> Conforme
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-550/10 dark:text-red-400 dark:bg-red-950/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/30">
                                <AlertTriangle className="w-3 h-3" /> Divergent (Registre: {dbVerification.dbRecord?.nom_proprietaire})
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-850/50">
                      <th className="py-4 text-slate-450 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-semibold">N° d&apos;enregistrement</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{result.numero_cadastral || 'Non détecté'}</span>
                          {dbVerification && (
                            dbVerification.found ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-650 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                                <CheckCircle2 className="w-3 h-3" /> Répertorié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                                <AlertTriangle className="w-3 h-3" /> Inconnu
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-850/50">
                      <th className="py-4 text-slate-450 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-semibold">Volume</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{result.volume || 'Non détecté'}</span>
                          {dbVerification && dbVerification.found && (
                            dbVerification.matches.volume ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-655 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                                <CheckCircle2 className="w-3 h-3" /> Conforme
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-550/10 dark:text-red-400 dark:bg-red-950/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/30">
                                <AlertTriangle className="w-3 h-3" /> Divergent (Registre: {dbVerification.dbRecord?.volume})
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-850/50">
                      <th className="py-4 text-slate-450 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-semibold">Folio</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{result.folio || 'Non détecté'}</span>
                          {dbVerification && dbVerification.found && (
                            dbVerification.matches.folio ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-655 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                                <CheckCircle2 className="w-3 h-3" /> Conforme
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-550/10 dark:text-red-400 dark:bg-red-950/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/30">
                                <AlertTriangle className="w-3 h-3" /> Divergent (Registre: {dbVerification.dbRecord?.folio})
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-850/50">
                      <th className="py-4 text-slate-450 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-semibold">Circonscription</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{result.circonscription || 'Non détecté'}</span>
                          {dbVerification && dbVerification.found && (
                            dbVerification.matches.circonscription ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-655 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                                <CheckCircle2 className="w-3 h-3" /> Conforme
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-550/10 dark:text-red-400 dark:bg-red-950/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/30">
                                <AlertTriangle className="w-3 h-3" /> Divergent (Registre: {dbVerification.dbRecord?.circonscription})
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-850/50">
                      <th className="py-4 text-slate-455 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-semibold">Superficie</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">{result.superficie || 'Non détecté'}</td>
                    </tr>
                    <tr>
                      <th className="py-4 text-slate-455 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-semibold">Date d&apos;établissement</th>
                      <td className="py-4 text-sm font-bold text-slate-800 dark:text-white">{result.date_etablissement || 'Non détecté'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
               <button 
                  onClick={() => {
                    setResult(null);
                    setDbVerification(null);
                    setStatus('idle');
                    setFile(null);
                  }}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-355 text-xs font-bold underline underline-offset-4"
               >
                 Analyser un autre document
               </button>
            </div>
          </div>
        )}
        
        <section className="max-w-4xl w-full mx-auto mt-16 mb-8 space-y-6 animate-in fade-in duration-500">
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              <Sparkles className="w-6 h-6 text-[#007FFF]" /> Qu&apos;est-ce que le Smart Archive ?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              Le module <strong>Smart Archive</strong> utilise l&apos;intelligence artificielle (Vision) pour lire et numériser instantanément les informations des certificats d&apos;enregistrement papier ou PDF. 
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Il permet non seulement d&apos;extraire le nom, le numéro d&apos;enregistrement, le volume et le folio, mais aussi de croiser ces données en temps réel avec le <strong>Registre Central</strong> de la RDC afin de détecter d&apos;éventuelles usurpations d&apos;identité ou ratures (Phénomène Folio).
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              <ShieldAlert className="w-6 h-6 text-[#007FFF]" /> Bases Légales (Numérisation)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Conformément à l&apos;évolution vers l&apos;e-gouvernance foncière, cet outil soutient les efforts d&apos;assainissement du cadastre congolais en accélérant l&apos;authentification des titres existants et en archivant numériquement les données pour une meilleure traçabilité.
            </p>
          </div>
        </section>

      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; border-color: rgba(220, 38, 38, 0.4); }
          50% { opacity: 0.9; border-color: rgba(220, 38, 38, 0.8); box-shadow: 0 0 50px rgba(220, 38, 38, 0.15); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
}
