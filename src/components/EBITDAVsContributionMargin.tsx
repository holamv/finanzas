'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const EBITDAVsContributionMargin: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const contributionMargin = [4332431.13, -4349631.65, -4071462.64, -4464201.37, -4879723.00, -5290832.38, -4481797.12, -4802775.39, -4831934.63, -4828677.87, -4831751.06, -4484783.92];
  const ebitda = [-38303968.70, -44634623.39, -34774339.26, -38232186.43, -40241265.71, -39008075.83, -37873912.35, -40521228.81, -39514203.66, -38487525.73, -38488880.99, -30241714.85];

  const data = months.map((month, idx) => ({
    month,
    'Contribution Margin': Math.round(contributionMargin[idx]),
    'EBITDA': Math.round(ebitda[idx]),
    gap: Math.round(ebitda[idx] - contributionMargin[idx]),
  }));

  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Cálculos de análisis
  const avgContributionMargin = contributionMargin.reduce((a, b) => a + b, 0) / contributionMargin.length;
  const avgEbitda = ebitda.reduce((a, b) => a + b, 0) / ebitda.length;
  const totalGap = ebitda.reduce((sum, e, idx) => sum + (e - contributionMargin[idx]), 0);
  const avgGap = totalGap / months.length;

  const positiveContributionMonths = contributionMargin.filter(v => v > 0).length;
  const positiveEbitdaMonths = ebitda.filter(v => v > 0).length;

  const formatCurrency = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">EBITDA vs Contribution Margin</h2>
        <p className="text-gray-600">Análisis comparativo del flujo de efectivo operativo vs margen de contribución</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-1">Prom. Contribution Margin</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(avgContributionMargin)}</p>
          <p className="text-xs text-gray-500 mt-1">{positiveContributionMonths} meses positivos</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-1">Prom. EBITDA</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(avgEbitda)}</p>
          <p className="text-xs text-gray-500 mt-1">{positiveEbitdaMonths} meses positivos</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-1">Brecha Promedio</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(avgGap)}</p>
          <p className="text-xs text-gray-500 mt-1">Diferencia mensual</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-1">Brecha Total Anual</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalGap)}</p>
          <p className="text-xs text-gray-500 mt-1">Año 2025</p>
        </div>
      </div>

      {/* Selector de tipo de gráfico */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            chartType === 'bar'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Gráfico de Barras
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            chartType === 'line'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Gráfico de Líneas
        </button>
      </div>

      {/* Gráfico principal */}
      <div className="w-full h-96 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Legend />
              <Bar dataKey="Contribution Margin" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="EBITDA" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="Contribution Margin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="EBITDA" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-bold mb-3">Detalles por Mes</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-2 text-left font-bold text-gray-700">Mes</th>
              <th className="px-4 py-2 text-right font-bold text-blue-600">Contribution Margin</th>
              <th className="px-4 py-2 text-right font-bold text-orange-600">EBITDA</th>
              <th className="px-4 py-2 text-right font-bold text-red-600">Brecha</th>
              <th className="px-4 py-2 text-right font-bold text-gray-700">% Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const percentDiff = contributionMargin[idx] !== 0
                ? ((ebitda[idx] - contributionMargin[idx]) / Math.abs(contributionMargin[idx]) * 100).toFixed(1)
                : 'N/A';
              
              return (
                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 hover:bg-yellow-50`}>
                  <td className="px-4 py-2 font-bold text-gray-800">{row.month}</td>
                  <td className="px-4 py-2 text-right text-blue-600 font-semibold">
                    {formatCurrency(row['Contribution Margin'])}
                  </td>
                  <td className="px-4 py-2 text-right text-orange-600 font-semibold">
                    {formatCurrency(row.EBITDA)}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${row.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(row.gap)}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${percentDiff === 'N/A' ? 'text-gray-500' : percentDiff.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                    {percentDiff}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <h3 className="font-bold text-blue-900 mb-2">Análisis Clave</h3>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>• El EBITDA promedio es {formatCurrency(Math.abs(avgEbitda))}, mientras que el Contribution Margin es {formatCurrency(avgContributionMargin)}</li>
          <li>• La brecha promedio (EBITDA - CM) es {formatCurrency(avgGap)}, indicando que los costos operativos exceden el margen de contribución</li>
          <li>• El Contribution Margin tiene {positiveContributionMonths} meses positivos; el EBITDA tiene {positiveEbitdaMonths}</li>
          <li>• La brecha total anual es {formatCurrency(totalGap)}</li>
        </ul>
      </div>
    </div>
  );
};

export default EBITDAVsContributionMargin;
