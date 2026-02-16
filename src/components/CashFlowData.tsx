'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  User,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Country } from '@/types';
import { getSalesData, getOCData, SalesRecord, OCRecord } from '@/services/cashFlowService';
import { convertToUSD, formatCurrency } from '@/lib/currencyUtils';

interface CashFlowDataProps {
  selectedCountry: Country;
}

type TabType = 'ventas' | 'egresos';

const CashFlowData: React.FC<CashFlowDataProps> = ({ selectedCountry }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ventas');
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [ocData, setOCData] = useState<OCRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-28');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sales, ocs] = await Promise.all([
        getSalesData(),
        getOCData()
      ]);
      setSalesData(sales);
      setOCData(ocs);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const data = activeTab === 'ventas' ? salesData : ocData;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(record => {
      const recordDate = new Date(record.fecha);
      const inDateRange = recordDate >= start && recordDate <= end;

      // Filtro por país
      const countryMatch = selectedCountry === 'Global' || (record.pais && record.pais.toLowerCase().includes(selectedCountry.toLowerCase()));

      return inDateRange && countryMatch;
    });
  }, [salesData, ocData, activeTab, startDate, endDate, selectedCountry]);

  // Calcular total considerando conversión a USD si es Global
  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, record) => {
      let amount = record.monto;

      if (selectedCountry === 'Global') {
        // En modo Global, forzamos la conversión según el país del registro
        // ya que los montos en Ventas/Gastos siempre vienen en moneda local
        amount = convertToUSD(record.monto, record.pais || record.moneda || 'USD');
      }

      return sum + amount;
    }, 0);
  }, [filteredData, selectedCountry]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              PLANIFICACIÓN DE <span className="text-[#227A4B]">FLUJO</span>
            </h1>
            <p className="text-xs text-gray-500 uppercase mt-1">
              {selectedCountry === 'Global' ? 'GLOBAL (USD)' : selectedCountry} • Gestión de Ingresos y Egresos
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-[#227A4B] text-white rounded-lg hover:bg-[#1D6A41] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm uppercase transition-all ${activeTab === 'ventas'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Ventas
          </button>
          <button
            onClick={() => setActiveTab('egresos')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm uppercase transition-all ${activeTab === 'egresos'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Egresos
          </button>

          {/* Date Filters */}
          <div className="ml-auto flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Amount */}
        <div className={`rounded-xl p-6 ${activeTab === 'ventas'
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
          : 'bg-gradient-to-r from-orange-500 to-red-600'
          }`}>
          <div className="flex items-center gap-3 mb-2">
            {activeTab === 'ventas' ? (
              <TrendingUp size={24} className="text-white" />
            ) : (
              <TrendingDown size={24} className="text-white" />
            )}
            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider">
              {activeTab === 'ventas' ? 'Ingresos Totales' : 'Egresos Totales'}
            </p>
          </div>
          <p className="text-5xl font-black text-white">
            {formatCurrency(totalAmount, selectedCountry)}
          </p>
        </div>

        {/* Transaction Count */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} className="text-gray-600" />
            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
              Transacciones
            </p>
          </div>
          <p className="text-5xl font-black text-gray-900">
            {filteredData.length.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2 italic">
            Registros en el período seleccionado
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Lista de {activeTab === 'ventas' ? 'Ventas' : 'Egresos'}
          </h3>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#227A4B]" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">No hay datos disponibles</p>
              <p className="text-sm mt-2">Intenta ajustar los filtros de fecha</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((record, idx) => (
                <div
                  key={record.id || idx}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${activeTab === 'ventas' ? 'bg-indigo-100' : 'bg-orange-100'
                      } flex items-center justify-center`}>
                      <User size={18} className={
                        activeTab === 'ventas' ? 'text-indigo-600' : 'text-orange-600'
                      } />
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">
                        {'cliente' in record ? record.cliente : (record as OCRecord).proveedor}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.tipo} • {formatDate(record.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-black ${activeTab === 'ventas' ? 'text-indigo-700' : 'text-orange-700'
                      }`}>
                      {selectedCountry === 'Global'
                        ? formatCurrency(convertToUSD(record.monto, record.pais || record.moneda || 'USD'), 'Global')
                        : formatCurrency(record.monto, selectedCountry)
                      }
                    </p>
                    {selectedCountry === 'Global' && (
                      <p className="text-[10px] text-gray-500 font-bold uppercase">
                        {record.monto.toLocaleString()} {record.pais}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowData;
