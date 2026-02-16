
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Country } from '../types';
import { TrendingUp, Target, Database, Zap } from 'lucide-react';

interface PredictionsDashboardProps {
  data: any[];
  selectedCountry: Country;
  setSelectedCountry: (c: Country) => void;
  isFetching: boolean;
  onSync: () => void;
  growthAssumption: number;
  setGrowthAssumption: (v: number) => void;
}

export const PredictionsDashboard: React.FC<PredictionsDashboardProps> = ({ 
  data, selectedCountry, setSelectedCountry, isFetching, onSync, growthAssumption, setGrowthAssumption 
}) => {

  const mlStats = useMemo(() => {
    if (data.length === 0) return null;
    const countryData = data.filter(d => d.country === selectedCountry);
    if (countryData.length === 0) return null;

    const latestDate = new Date(Math.max(...countryData.map(d => d.date.getTime())));
    const twentyOneDaysAgo = new Date(latestDate);
    twentyOneDaysAgo.setDate(latestDate.getDate() - 21);

    const last21DaysSales = countryData.filter(d => d.date >= twentyOneDaysAgo);
    const total21Days = last21DaysSales.reduce((sum, d) => sum + d.amount, 0);
    const dailyAverage = total21Days / 21;

    const baselineProjection = dailyAverage * 30;
    const assumedProjection = baselineProjection * growthAssumption;

    const chartData = [1, 2, 3, 4].map(w => ({
      week: `Sem ${w}`,
      esperado: (dailyAverage * 7.5 * w) * growthAssumption,
      baseline: (dailyAverage * 7.5 * w)
    }));

    return {
      total21Days,
      dailyAverage,
      assumedProjection,
      baselineProjection,
      chartData,
      recordsCount: countryData.length
    };
  }, [data, selectedCountry, growthAssumption]);

  if (!mlStats) return (
    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[3rem] card-shadow border border-slate-50">
       <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <i className="fas fa-spinner fa-spin text-slate-200 text-2xl"></i>
       </div>
       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando datos históricos...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Chart Card */}
          <div className="bg-white p-10 rounded-[3rem] card-shadow border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-chart-line text-[#00B14F]"></i>
                Predicción Baseline (21 Días)
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#00B14F]"></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Esperado</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-200"></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Histórico</span>
                 </div>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mlStats.chartData}>
                  <defs>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B14F" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00B14F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '16px'}} />
                  <Area type="monotone" dataKey="baseline" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="8 4" fill="transparent" />
                  <Area type="monotone" dataKey="esperado" stroke="#00B14F" strokeWidth={5} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-50">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Promedio Diario Real (21d)</p>
               <p className="text-3xl font-black text-slate-800 tracking-tighter italic">${Math.round(mlStats.dailyAverage).toLocaleString()}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-50">
               <p className="text-[9px] font-black text-[#00B14F] uppercase tracking-widest mb-1">Meta Proyectada Mensual</p>
               <p className="text-3xl font-black text-slate-800 tracking-tighter italic">${Math.round(mlStats.assumedProjection).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Control Panel Card */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] card-shadow border border-slate-50 flex flex-col h-full">
            <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-10">Parámetros de Simulación</h3>
            
            <div className="flex-1 space-y-10">
              <div>
                <div className="flex justify-between items-center mb-6">
                   <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Factor de Crecimiento</span>
                   <span className="text-lg font-black text-[#00B14F] italic">x{growthAssumption.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" value={growthAssumption}
                  onChange={(e) => setGrowthAssumption(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00B14F]"
                />
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed">
                  Lógica: Se utiliza el promedio de los últimos 21 días multiplicado por {growthAssumption} para proyectar los próximos 30 días de operación.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center text-xs">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">Historial Consolidado</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{mlStats.recordsCount} registros de Google Sheets</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={onSync} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-10 hover:bg-[#00B14F] transition-colors">
               Actualizar Modelos ML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
