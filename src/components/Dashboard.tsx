
import React, { useMemo } from 'react';
// Corrected import to use types.ts for Country
import { ReconciliationResult, Country } from '../types';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  PieChart as PieIcon,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { formatCurrency, convertToUSD, getCurrencyByCountry, inferCurrencyFromCountryString } from '@/lib/currencyUtils';

interface DashboardProps {
  data: ReconciliationResult[];
  country: Country;
}

const STATUS_COLORS = {
  'Si está': '#10b981',
  'No está': '#f43f5e',
  'Difiere': '#f59e0b'
};

const Dashboard: React.FC<DashboardProps> = ({ data, country }) => {
  const stats = useMemo(() => {
    const totalRecords = data.length;

    // Suma total considerando conversión si es Global
    const totals = data.reduce((acc, item) => {
      const monto = Number(item["MONTO CONTABLE"]) || 0;
      const isOk = item.ESTADO === 'Si está';
      const isNotOk = item.ESTADO === 'No está';
      const isDiff = !isOk && !isNotOk;

      // Inferimos moneda si no viene e intentamos ser robustos
      let montoInContext = monto;
      if (country === 'Global') {
        const pais = (item.PAIS || '').toUpperCase();
        // Usamos la función de inferencia para mayor robustez
        const curr = inferCurrencyFromCountryString(pais);
        montoInContext = convertToUSD(monto, curr);
      }

      acc.total += montoInContext;
      if (!isOk) acc.risk += montoInContext;
      if (isOk) acc.successCount++;
      else if (isNotOk) acc.errorCount++;
      else acc.diffCount++;

      return acc;
    }, { total: 0, risk: 0, successCount: 0, errorCount: 0, diffCount: 0 });

    const statusData = [
      { name: 'Si está', value: totals.successCount },
      { name: 'No está', value: totals.errorCount },
      { name: 'Difiere', value: totals.diffCount },
    ].filter(d => d.value > 0);

    const financialOriginMap: Record<string, any> = {};

    data.forEach(item => {
      const o = item.ORIGEN || 'DESCONOCIDO';
      const monto = Number(item["MONTO CONTABLE"]) || 0;

      let montoInContext = monto;
      if (country === 'Global') {
        const pais = (item.PAIS || '').toUpperCase();
        const curr = inferCurrencyFromCountryString(pais);
        montoInContext = convertToUSD(monto, curr);
      }

      if (!financialOriginMap[o]) {
        financialOriginMap[o] = {
          name: o,
          'Si está': 0, 'No está': 0, 'Difiere': 0,
          'Si está_count': 0, 'No está_count': 0, 'Difiere_count': 0,
          total: 0, count: 0
        };
      }

      financialOriginMap[o].total += montoInContext;
      financialOriginMap[o].count += 1;

      if (item.ESTADO === 'Si está') {
        financialOriginMap[o]['Si está'] += montoInContext;
        financialOriginMap[o]['Si está_count'] += 1;
      } else if (item.ESTADO === 'No está') {
        financialOriginMap[o]['No está'] += montoInContext;
        financialOriginMap[o]['No está_count'] += 1;
      } else {
        financialOriginMap[o]['Difiere'] += montoInContext;
        financialOriginMap[o]['Difiere_count'] += 1;
      }
    });

    const financialByOriginData = Object.values(financialOriginMap).sort((a, b) => b.total - a.total);

    return {
      totalRecords,
      totalAmount: totals.total,
      amountInRisk: totals.risk,
      successCount: totals.successCount,
      errorCount: totals.errorCount,
      diffCount: totals.diffCount,
      successRate: totalRecords > 0 ? (totals.successCount / totalRecords) * 100 : 0,
      statusData,
      financialByOriginData,
    };
  }, [data, country]);

  // Tooltip personalizado para mostrar conteo y dinero
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black text-slate-900 uppercase mb-3 border-b border-slate-100 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.reverse().map((entry: any, index: number) => {
              const status = entry.name;
              const count = data[`${status}_count`] || 0;
              const amount = entry.value || 0;

              if (count === 0 && amount === 0) return null;

              return (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{status}:</span>
                    <span className="text-[10px] font-black text-slate-900">{count} Transacciones</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold ml-4">
                    ({formatCurrency(amount, country)})
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-1/2">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-500" /> Proporción de Conciliación
            </h4>
            <div className="h-[280px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#e2e8f0'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-center">
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.successRate.toFixed(0)}%</p>
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Éxito</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transacciones</p>
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalRecords.toLocaleString()}</h3>
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Layers className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Si está</p>
                <p className="text-xl font-black text-emerald-600">{stats.successCount}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <p className="text-[8px] font-black text-rose-600/60 uppercase tracking-widest mb-1">No / Difiere</p>
                <p className="text-xl font-black text-rose-600">{stats.errorCount + stats.diffCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <StatCard
            title={country === 'Global' ? 'Total Operado (USD)' : `Total Operado (${getCurrencyByCountry(country)})`}
            value={formatCurrency(stats.totalAmount, country)}
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            subtitle="Suma total contable"
          />
          <StatCard
            title="Monto en Riesgo"
            value={formatCurrency(stats.amountInRisk, country)}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="rose"
            subtitle="No conciliado + Difiere"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#00b050]" /> Distribución Monetaria por Origen
              </h4>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest italic">Análisis financiero por pasarela de pago (Conteo y Volumen en Tooltip)</p>
            </div>
          </div>

          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.financialByOriginData} margin={{ left: 20, right: 60, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 900, className: 'uppercase italic tracking-tighter' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Si está" stackId="a" fill={STATUS_COLORS['Si está']} barSize={32} />
                <Bar dataKey="No está" stackId="a" fill={STATUS_COLORS['No está']} />
                <Bar dataKey="Difiere" stackId="a" fill={STATUS_COLORS['Difiere']} radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subtitle }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    rose: 'bg-rose-50 border-rose-100 text-rose-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 hover:shadow-md transition-all group flex-1">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h3>
      <div className="flex items-center gap-2 mt-3">
        <div className={`w-1 h-1 rounded-full ${colors[color].split(' ')[2]}`}></div>
        <p className="text-[9px] font-bold text-slate-400 uppercase italic truncate">{subtitle}</p>
      </div>
    </div>
  );
};

export default Dashboard;
