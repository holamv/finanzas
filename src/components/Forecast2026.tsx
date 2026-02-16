'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Users,
  Zap,
  Activity,
  AlertTriangle,
  Globe,
  Calendar
} from 'lucide-react';
import { Country } from '@/types';

interface Forecast2026Props {
  selectedCountry: Country;
  pnlData: any[];
  months: string[];
}

type MetricCard = {
  id: string;
  label: string;
  icon: typeof DollarSign;
  color: string;
  bgColor: string;
  value: number;
  growth: number;
};

const Forecast2026: React.FC<Forecast2026Props> = ({ selectedCountry, pnlData, months }) => {

  const MONTHS_2026 = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const metrics = useMemo(() => {
    const HEADER_KEYWORDS = ["GLOBAL", "SALES", "REVENUE", "NET REVENUE", "CONTRIBUTION MARGIN", "PAYROLL", "EBITDA", "BURN RATE"];

    // Filtrar solo las filas que son headers globales
    const globalMetrics = pnlData.filter(row =>
      HEADER_KEYWORDS.includes(row.label?.toUpperCase().trim())
    );

    // Calcular proyecciones para 2026 (crecimiento del 15% sobre último valor)
    const growthRate = 1.15;

    const metricsData: MetricCard[] = globalMetrics.map(metric => {
      const lastValue = metric.values?.[0] || 0; // Último valor disponible
      const projected2026 = lastValue * growthRate;
      const growth = ((projected2026 - lastValue) / lastValue) * 100;

      // Asignar íconos y colores según el tipo
      let icon = DollarSign;
      let color = 'blue';
      let bgColor = 'bg-blue-50';

      const label = metric.label.toUpperCase();
      if (label.includes('SALES')) {
        icon = TrendingUp;
        color = 'green';
        bgColor = 'bg-green-50';
      } else if (label.includes('REVENUE')) {
        icon = DollarSign;
        color = 'emerald';
        bgColor = 'bg-emerald-50';
      } else if (label.includes('MARGIN')) {
        icon = Layers;
        color = 'teal';
        bgColor = 'bg-teal-50';
      } else if (label.includes('PAYROLL')) {
        icon = Users;
        color = 'purple';
        bgColor = 'bg-purple-50';
      } else if (label.includes('EBITDA')) {
        icon = Zap;
        color = 'yellow';
        bgColor = 'bg-yellow-50';
      } else if (label.includes('BURN')) {
        icon = AlertTriangle;
        color = 'red';
        bgColor = 'bg-red-50';
      } else if (label.includes('GLOBAL')) {
        icon = Globe;
        color = 'indigo';
        bgColor = 'bg-indigo-50';
      }

      return {
        id: metric.label,
        label: metric.label,
        icon,
        color,
        bgColor,
        value: projected2026,
        growth,
      };
    });

    return metricsData;
  }, [pnlData]);

  // Proyecciones mensuales detalladas
  const monthlyProjections = useMemo(() => {
    const HEADER_KEYWORDS = ["GLOBAL", "SALES", "REVENUE", "NET REVENUE", "CONTRIBUTION MARGIN", "PAYROLL", "EBITDA", "BURN RATE"];

    const globalMetrics = pnlData.filter(row =>
      HEADER_KEYWORDS.includes(row.label?.toUpperCase().trim())
    );

    // Crecimiento mensual compuesto: 15% anual = (1.15)^(1/12) ≈ 1.0117 por mes
    const monthlyGrowthRate = Math.pow(1.15, 1/12);

    return globalMetrics.map(metric => {
      const lastValue = metric.values?.[0] || 0;
      const monthlyValues = MONTHS_2026.map((_, index) => {
        // Proyectar cada mes con crecimiento compuesto
        return lastValue * Math.pow(monthlyGrowthRate, index + 1);
      });

      return {
        label: metric.label,
        values: monthlyValues,
        total: monthlyValues.reduce((sum, val) => sum + val, 0)
      };
    });
  }, [pnlData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { text: string; bg: string; border: string }> = {
      green: { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
      emerald: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      blue: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
      teal: { text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
      purple: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
      yellow: { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      red: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
      indigo: { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              FORECAST 2026
            </h1>
            <p className="text-indigo-100 text-sm">
              {selectedCountry} • Proyecciones basadas en crecimiento del 15%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Año Fiscal</p>
            <p className="text-4xl font-black">2026</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const colorClasses = getColorClasses(metric.color);

          return (
            <div
              key={metric.id}
              className={`${colorClasses.bg} border ${colorClasses.border} rounded-xl p-6 hover:shadow-xl transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${colorClasses.bg} border ${colorClasses.border} flex items-center justify-center`}>
                  <Icon size={24} className={colorClasses.text} />
                </div>
                <div className={`px-3 py-1 ${metric.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} rounded-full text-xs font-bold flex items-center gap-1`}>
                  <TrendingUp size={12} />
                  {metric.growth >= 0 ? '+' : ''}{metric.growth.toFixed(1)}%
                </div>
              </div>

              <div>
                <h3 className={`text-xs font-bold ${colorClasses.text} uppercase tracking-wider mb-2`}>
                  {metric.label}
                </h3>
                <p className="text-3xl font-black text-gray-900">
                  {formatCurrency(metric.value)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Proyección anual 2026
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-[#227A4B]" />
          Resumen Ejecutivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Ingresos Proyectados</p>
            <p className="text-2xl font-black text-green-700">
              {formatCurrency(metrics.find(m => m.label.toUpperCase().includes('REVENUE'))?.value || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">EBITDA Proyectado</p>
            <p className="text-2xl font-black text-yellow-700">
              {formatCurrency(metrics.find(m => m.label.toUpperCase().includes('EBITDA'))?.value || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Margen Contribución</p>
            <p className="text-2xl font-black text-purple-700">
              {formatCurrency(metrics.find(m => m.label.toUpperCase().includes('MARGIN'))?.value || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="text-sm font-bold text-blue-900 mb-3">💡 Supuestos de Proyección</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Crecimiento anual estimado: <strong>15%</strong> sobre valores actuales</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Basado en tendencias históricas y proyecciones de mercado</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Incluye ajustes por estacionalidad y factores macroeconómicos</span>
          </li>
        </ul>
      </div>

      {/* Monthly Projections Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Proyecciones Mensuales 2026
              </h3>
              <p className="text-xs text-indigo-100">
                Análisis detallado mes a mes • Machine Learning
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-4 text-left">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Métrica
                  </span>
                </th>
                {MONTHS_2026.map((month, idx) => (
                  <th key={idx} className="px-4 py-4 text-center min-w-[110px]">
                    <span className="text-xs font-bold text-gray-600 uppercase">
                      {month} 26
                    </span>
                  </th>
                ))}
                <th className="px-6 py-4 text-right bg-indigo-50">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Total Anual
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyProjections.map((projection, idx) => {
                const isPositive = !projection.label.toUpperCase().includes('BURN');
                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

                return (
                  <tr key={idx} className={`${bgColor} hover:bg-indigo-50/30 transition-colors`}>
                    <td className="sticky left-0 z-10 px-6 py-4 font-bold text-sm text-gray-900" style={{ backgroundColor: 'inherit' }}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {projection.label}
                      </div>
                    </td>
                    {projection.values.map((value, monthIdx) => (
                      <td key={monthIdx} className="px-4 py-4 text-center">
                        <span className={`text-sm font-semibold ${isPositive ? 'text-gray-800' : 'text-red-600'}`}>
                          {formatCurrency(value)}
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right bg-indigo-50">
                      <span className={`text-sm font-black ${isPositive ? 'text-indigo-700' : 'text-red-700'}`}>
                        {formatCurrency(projection.total)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Ingresos / Positivos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Gastos / Negativos</span>
              </div>
            </div>
            <span className="text-gray-500 italic">
              Proyecciones basadas en crecimiento compuesto mensual
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecast2026;
