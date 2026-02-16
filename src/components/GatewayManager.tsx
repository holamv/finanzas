
import React, { useState } from 'react';
import { 
  CloudUpload, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Smartphone, 
  Globe, 
  ArrowRight,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { DataSource, SourceConfig } from '../types';

const SOURCES: SourceConfig[] = [
  { id: 'PAYU', name: 'PayU Latam', icon: 'credit-card', color: 'bg-emerald-500', endpoint: '' },
  { id: 'MONNET', name: 'Monnet', icon: 'smartphone', color: 'bg-blue-500', endpoint: '' },
  { id: 'MERCADOPAGO', name: 'Mercado Pago', icon: 'globe', color: 'bg-sky-400', endpoint: '' },
  { id: 'TRANSFERENCIA', name: 'Bancaria / Transf.', icon: 'file-text', color: 'bg-slate-600', endpoint: '' },
];

interface GatewayManagerProps {
  onUploadSuccess: () => void;
}

const GatewayManager: React.FC<GatewayManagerProps> = ({ onUploadSuccess }) => {
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    simulateUpload();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus('success');
      onUploadSuccess();
      setTimeout(() => {
        setUploadStatus('idle');
        setSelectedSource(null);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#00843D] rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            <CloudUpload size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Ingesta de <span className="text-[#00843D]">Pasarelas</span></h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincroniza reportes externos con el sistema</p>
          </div>
        </div>
        {selectedSource && (
          <button onClick={() => setSelectedSource(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      <div className="p-10">
        {!selectedSource ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SOURCES.map((source) => (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className="group flex flex-col items-center p-8 rounded-[2.5rem] border border-slate-100 hover:border-[#00843D]/30 hover:bg-emerald-50/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl ${source.color} transition-transform group-hover:scale-110`}>
                   {source.id === 'PAYU' ? <CreditCard size={24} /> : source.id === 'MONNET' ? <Smartphone size={24} /> : source.id === 'MERCADOPAGO' ? <Globe size={24} /> : <FileSpreadsheet size={24} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">{source.name}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Cargar CSV / XLSX</span>
                <div className="absolute bottom-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowRight size={14} className="text-[#00843D]" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in-95">
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuente Seleccionada:</span>
               <div className="px-4 py-1.5 bg-[#00843D] text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                 <CheckCircle2 size={12} /> {selectedSource}
               </div>
             </div>

             <div className="w-full max-w-xl">
                <label className="relative group cursor-pointer block">
                  <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} accept=".csv,.xlsx,.xls" />
                  <div className={`w-full h-48 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center space-y-4 ${
                    uploadStatus === 'success' ? 'border-emerald-500 bg-emerald-50' : 
                    isUploading ? 'border-blue-400 bg-blue-50' : 'border-slate-100 hover:border-[#00843D]/20 hover:bg-slate-50'
                  }`}>
                    {isUploading ? (
                      <>
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-[#00843D] animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CloudUpload size={20} className="text-[#00843D]" />
                          </div>
                        </div>
                        <p className="text-[11px] font-black text-[#00843D] uppercase tracking-widest animate-pulse">Procesando Líneas del Excel...</p>
                      </>
                    ) : uploadStatus === 'success' ? (
                      <>
                        <div className="h-14 w-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Sincronización Exitosa</p>
                      </>
                    ) : (
                      <>
                        <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-[#00843D] transition-colors">
                          <CloudUpload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Arrastra el archivo aquí</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">O haz clic para explorar tu dispositivo</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GatewayManager;
