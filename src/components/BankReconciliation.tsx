'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  CreditCard,
  Banknote,
  Zap,
  ArrowRightLeft,
  Upload,
  Link2,
  X,
  Loader2,
  Search,
  TableIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Country, ReconciliationResult } from '@/types';
import ReconciliationTable from './ReconciliationTable';
import Dashboard from './Dashboard';
import { getAllTransactions, manualUpdateRowStatus } from '@/services/googleSheetsService';

interface BankReconciliationProps {
  selectedCountry: Country;
  isHistoryView?: boolean;
}

type DataSource = 'BACKEND' | 'PAYU' | 'MONNET' | 'MERCADOPAGO' | 'TRANSFERENCIA';

const BankReconciliation: React.FC<BankReconciliationProps> = ({ selectedCountry, isHistoryView = false }) => {
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [reconData, setReconData] = useState<ReconciliationResult[]>([]);
  const [historyData, setHistoryData] = useState<ReconciliationResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Partial<Record<DataSource, File>>>({});
  const [globalStatus, setGlobalStatus] = useState<{ status: string; progress: number; message?: string }>({ status: 'idle', progress: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [viewMode, setViewMode] = useState<'table' | 'dashboard'>('table');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Webhooks por país
  const webhooks: Record<Country, string> = {
    Peru: 'https://n8n.manzanaverde.la/webhook/backend/peru',
    Colombia: 'https://n8n.manzanaverde.la/webhook/backend/colombia',
    Mexico: 'https://n8n.manzanaverde.la/webhook/backend/mexico',
    Global: 'https://n8n.manzanaverde.la/webhook/backend/global',
  };

  const dataSources = [
    {
      id: 'BACKEND' as DataSource,
      name: 'SISTEMA BACKEND',
      icon: Database,
      color: 'emerald',
    },
    {
      id: 'PAYU' as DataSource,
      name: 'PASARELA PAYU',
      icon: CreditCard,
      color: 'orange',
    },
    {
      id: 'MONNET' as DataSource,
      name: 'MONNET PAYMENTS',
      icon: Banknote,
      color: 'blue',
    },
    {
      id: 'MERCADOPAGO' as DataSource,
      name: 'MERCADO PAGO',
      icon: Zap,
      color: 'sky',
    },
    {
      id: 'TRANSFERENCIA' as DataSource,
      name: 'TRANSFERENCIAS',
      icon: ArrowRightLeft,
      color: 'purple',
    },
  ];

  // Cargar historial siempre para mostrar estadísticas
  useEffect(() => {
    loadReconciliationHistory();
  }, []);

  const loadReconciliationHistory = async () => {
    setLoadingHistory(true);
    const data = await getAllTransactions();
    setHistoryData(data);
    setLoadingHistory(false);
  };

  const handleFileUpload = (sourceId: DataSource, file: File) => {
    setPendingFiles(prev => ({ ...prev, [sourceId]: file }));
  };

  const removeFile = (sourceId: DataSource) => {
    setPendingFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[sourceId];
      return newFiles;
    });
  };

  const triggerFileInput = (sourceId: DataSource) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(sourceId, file);
      }
    };
    input.click();
  };

  const runConciliation = async () => {
    if (!pendingFiles['BACKEND']) {
      alert('⚠️ El archivo de Sistema Backend es OBLIGATORIO para realizar la conciliación');
      return;
    }

    const webhookUrl = webhooks[selectedCountry];
    setGlobalStatus({ status: 'uploading', progress: 50, message: `Conciliando ${selectedCountry}...` });
    setReconData([]);

    const formData = new FormData();
    Object.entries(pendingFiles).forEach(([key, file]) => {
      if (file) {
        formData.append(key.toLowerCase(), file as File);
      }
    });
    formData.append('country', selectedCountry.toLowerCase());

    try {
      const response = await fetch(webhookUrl, { method: 'POST', body: formData });
      if (response.ok) {
        const resultJson = await response.json();
        let finalItems: ReconciliationResult[] = Array.isArray(resultJson) ? resultJson : (resultJson.data || []);

        const countryCode = selectedCountry === 'Peru' ? 'PE' : selectedCountry === 'Colombia' ? 'CO' : selectedCountry === 'Mexico' ? 'MX' : 'XX';
        const enriched = finalItems.map(it => ({ ...it, PAIS: it.PAIS || countryCode }));

        setReconData(enriched);
        setGlobalStatus({ status: 'success', progress: 100, message: `Procesados ${enriched.length} registros` });
      } else {
        setGlobalStatus({ status: 'error', progress: 0, message: 'Error en el servidor' });
      }
    } catch (error) {
      console.error('Error de conciliación:', error);
      setGlobalStatus({ status: 'error', progress: 0, message: 'Error de conexión' });
    }
  };

  const handleManualReconcile = async (item: ReconciliationResult) => {
    const success = await manualUpdateRowStatus(String(item.ID), 'Si está');
    if (success) {
      const update = (list: ReconciliationResult[]) =>
        list.map(it => it.ID === item.ID ? { ...it, ESTADO: 'Si está', DIFERENCIA: 0 } : it);

      if (isHistoryView) {
        setHistoryData(update(historyData));
      } else {
        setReconData(update(reconData));
      }
    }
  };

  const filteredReconciliation = useMemo(() => {
    const countryMap: Record<Country, string> = { 'Peru': 'PE', 'Colombia': 'CO', 'Mexico': 'MX', 'Global': 'XX' };
    const target = countryMap[selectedCountry];
    const source = isHistoryView ? historyData : reconData;

    return source.filter(item => {
      const matchCountry = selectedCountry === 'Global' || !item.PAIS || item.PAIS === target;
      const matchStatus = statusFilter === 'Todos' || item.ESTADO === statusFilter;
      const matchSearch = searchTerm === '' || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por fecha
      let matchFecha = true;
      if (fechaDesde || fechaHasta) {
        let itemDate: string | null = null;
        try {
          if (item.FECHA) {
            const date = new Date(item.FECHA);
            if (!isNaN(date.getTime())) {
              itemDate = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          itemDate = null;
        }
        
        if (fechaDesde && itemDate && itemDate < fechaDesde) matchFecha = false;
        if (fechaHasta && itemDate && itemDate > fechaHasta) matchFecha = false;
      }
      
      return matchCountry && matchStatus && matchSearch && matchFecha;
    });
  }, [reconData, historyData, selectedCountry, statusFilter, searchTerm, isHistoryView, fechaDesde, fechaHasta]);

  const reconciliationStats = useMemo(() => {
    // Siempre usar historyData para mostrar el estado del Excel
    const source = historyData;
    const countryMap: Record<Country, string> = { 'Peru': 'PE', 'Colombia': 'CO', 'Mexico': 'MX', 'Global': 'XX' };
    const target = countryMap[selectedCountry];

    const countryData = source.filter(item =>
      selectedCountry === 'Global' || !item.PAIS || item.PAIS === target
    );

    if (countryData.length === 0) {
      return { total: 0, conciliados: 0, pendientes: 0, fechaInicio: null, fechaFin: null };
    }

    const fechas = countryData
      .map(item => item.FECHA)
      .filter((f): f is string => !!f)
      .map(f => new Date(f))
      .sort((a, b) => a.getTime() - b.getTime());

    const conciliados = countryData.filter(item => item.ESTADO === 'Si está').length;
    const pendientes = countryData.length - conciliados;

    return {
      total: countryData.length,
      conciliados,
      pendientes,
      fechaInicio: fechas.length > 0 ? fechas[0] : null,
      fechaFin: fechas.length > 0 ? fechas[fechas.length - 1] : null,
    };
  }, [historyData, selectedCountry]);

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-emerald-100/50',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-600 hover:bg-orange-500 hover:text-white shadow-orange-100/50',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500 hover:text-white shadow-blue-100/50',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-600 hover:bg-sky-500 hover:text-white shadow-sky-100/50',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500 hover:text-white shadow-purple-100/50',
  };

  return (
    <div className="space-y-6">
      {/* Webhook y Cargar Archivos - Solo en vista activa */}
      {!isHistoryView && (
        <>
          {/* Webhook Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#227A4B] to-[#1D6A41] flex items-center justify-center shadow-lg">
                    <Link2 size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Webhook Conciliación
                    </p>
                    <span className="px-2 py-0.5 bg-[#227A4B] text-white text-[10px] font-bold rounded-full uppercase">
                      {selectedCountry}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-gray-600 bg-white px-3 py-1.5 rounded-md inline-block border border-gray-200">
                    {webhooks[selectedCountry]}
                  </code>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runConciliation}
                  disabled={!pendingFiles['BACKEND'] || globalStatus.status === 'uploading'}
                  className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-md flex items-center gap-2 ${
                    pendingFiles['BACKEND'] && globalStatus.status !== 'uploading'
                      ? 'text-white bg-gradient-to-r from-[#227A4B] to-[#1D6A41] hover:shadow-lg hover:scale-105'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {globalStatus.status === 'uploading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Conciliar Ahora
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas de Conciliación */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <TrendingUp size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Total Registros</p>
                    <p className="text-2xl font-bold text-gray-800">{reconciliationStats.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Conciliados</p>
                    <p className="text-2xl font-bold text-green-600">{reconciliationStats.conciliados.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <AlertCircle size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600">{reconciliationStats.pendientes.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-purple-200 p-5 bg-purple-50/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Calendar size={18} className="text-purple-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">Conciliado hasta</p>
                    {reconciliationStats.fechaFin ? (
                      <>
                        <p className="text-xl font-bold text-purple-700 mt-0.5">
                          {reconciliationStats.fechaFin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-purple-600 font-medium mt-1">
                          {selectedCountry} • Último registro en Excel
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-purple-400 mt-1">Sin datos</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          {/* Data Sources Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dataSources.map((source) => {
              const Icon = source.icon;
              const hasFile = !!pendingFiles[source.id];

              return (
                <div
                  key={source.id}
                  className={`bg-white rounded-xl border p-6 hover:shadow-md transition-all group ${
                    hasFile ? 'border-[#227A4B] bg-emerald-50/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${colorClasses[source.color]}`}>
                        <Icon size={28} />
                      </div>
                      {hasFile && (
                        <button
                          onClick={() => removeFile(source.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        {source.name}
                      </h3>
                      {hasFile && (
                        <p className="text-xs text-green-600 mt-1">✓ Archivo cargado</p>
                      )}
                    </div>

                    <button
                      onClick={() => triggerFileInput(source.id)}
                      className="w-full px-4 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    >
                      <Upload size={14} />
                      {hasFile ? 'Cambiar' : 'Cargar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          {globalStatus.message && (
            <div className={`p-4 rounded-lg ${
              globalStatus.status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              globalStatus.status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {globalStatus.message}
            </div>
          )}
        </>
      )}

      {/* Búsqueda y Filtros - Mostrar cuando hay datos */}
      {(filteredReconciliation.length > 0 || isHistoryView) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#227A4B]" />
              <input
                type="text"
                placeholder="Buscar registros..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#227A4B] transition-all"
              />
            </div>

            <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'
                }`}
              >
                <TableIcon size={14} className="inline mr-1" />
                Tabla
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                  viewMode === 'dashboard' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'
                }`}
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Filtros de Fecha */}
          <div className="flex flex-col md:flex-row gap-3 items-end border-t border-gray-100 pt-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none focus:border-[#227A4B] transition-all"
              />
            </div>

            <div className="flex-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none focus:border-[#227A4B] transition-all"
              />
            </div>

            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-all"
              >
                Limpiar Fechas
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabla o Dashboard */}
      {loadingHistory ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#227A4B]" />
        </div>
      ) : filteredReconciliation.length > 0 ? (
        viewMode === 'table' ? (
          <ReconciliationTable
            data={filteredReconciliation}
            country={selectedCountry.toLowerCase() as any}
            onManualReconcile={handleManualReconcile}
          />
        ) : (
          <Dashboard
            data={filteredReconciliation}
            country={selectedCountry.toLowerCase() as any}
          />
        )
      ) : !isHistoryView && reconData.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-500">
            {isHistoryView
              ? 'No hay datos de historial para este país'
              : 'Carga archivos y haz clic en "Conciliar Ahora" para ver los resultados'}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default BankReconciliation;
