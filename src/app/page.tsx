'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import AIChat from '@/components/AIChat';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import CockpitDashboard from '@/components/CockpitDashboard';
import GlobalPnL from '@/components/GlobalPnL';
import GatewayManager from '@/components/GatewayManager';
import PayUMonitor from '@/components/PayUMonitor';
import { TransactionForm } from '@/components/TransactionForm';
import BankReconciliation from '@/components/BankReconciliation';
import CashFlowAssumptions from '@/components/CashFlowAssumptions';
import Forecast2026 from '@/components/Forecast2026';
import CashFlowData from '@/components/CashFlowData';
import WeeklyFinancialView from '@/components/WeeklyFinancialView';
import ProjectionDashboard from '@/components/ProjectionDashboard';
import CashScenarios from '@/components/CashScenarios';
import CashVariance from '@/components/CashVariance';
import OrderManager from '@/components/OrderManager';
import {
  Country,
  AppTab,
  ReconciliationResult,
  SheetData,
  OCData,
  PnLRow
} from '@/types';
import {
  getAllTransactions,
  createQuickOC,
  getOrdersMaster
} from '@/services/googleSheetsService';
import { LoginPage } from '@/components/LoginPage';
import {
  Loader2,
  Globe,
  Trophy,
  FileText,
  Zap,
  History,
  WandSparkles,
  LayoutDashboard,
  PlusCircle,
  LogOut
} from 'lucide-react';

const PNL_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyPmJLaJyqM0HkcLXxF7Ss0DBApF_aYnyNkKdkdgWUcPxfZLilotIiaKGtBG4pgNnN9/exec";
const HEADER_KEYWORDS = ["GLOBAL", "SALES", "REVENUE", "NET REVENUE", "CONTRIBUTION MARGIN", "PAYROLL", "EBITDA", "BURN RATE"];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('cockpit');
  const [selectedCountry, setSelectedCountry] = useState<Country>('Peru');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Estados P&L
  const [pnlRows, setPnlRows] = useState<PnLRow[]>([]);
  const [pnlMonths, setPnlMonths] = useState<string[]>([]);
  const [isFetchingPnL, setIsFetchingPnL] = useState(false);

  // Estados Conciliación / Datos
  const [historyData, setHistoryData] = useState<ReconciliationResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [growthAssumption, setGrowthAssumption] = useState(1.15);

  // Estado OC Master
  const [ordersMaster, setOrdersMaster] = useState<OCData[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const handleLogin = (pin: string) => {
    if (pin === '1234') { // Pin por defecto
      setIsAuthenticated(true);
    } else {
      alert('Pin incorrecto');
    }
  };

  const handleQuickOC = async (data: any) => {
    const success = await createQuickOC({
      ...data,
      monto: parseFloat(data.monto)
    });
    return success;
  };

  useEffect(() => {
    if (activeTab === 'pnl_global' || activeTab === 'forecast_2026') fetchPnLData();
    if (activeTab.includes('conciliation') || activeTab === 'cockpit' || activeTab.includes('ai')) loadReconciliationData();
    if (activeTab === 'order_manager') loadOrdersMaster();
  }, [activeTab]);

  const loadOrdersMaster = async () => {
    setIsLoadingOrders(true);
    const data = await getOrdersMaster();
    setOrdersMaster(data);
    setIsLoadingOrders(false);
  };

  const fetchPnLData = async () => {
    setIsFetchingPnL(true);
    try {
      const response = await fetch(PNL_APPS_SCRIPT_URL);
      const data = await response.json();

      const reversedMonths = [...(data.months || [])].reverse();
      setPnlMonths(reversedMonths);

      const rawRows = data.rows || data.data || [];
      const mappedRows: PnLRow[] = rawRows.map((r: any) => {
        const conceptLabel = (r.concept || r.label || 'Sin Nombre').toString();
        const isHeaderManual = HEADER_KEYWORDS.includes(conceptLabel.toUpperCase().trim());
        return {
          label: conceptLabel,
          unit: r.unit || '-',
          isHeader: r.isHeader === true || isHeaderManual,
          values: [...(r.values || [])].reverse()
        };
      });

      const filteredRows = mappedRows.filter(r => {
        const labelUpper = r.label.toUpperCase().trim();
        return labelUpper !== "PRE NET REVENUE" && labelUpper !== "EXPENSES";
      });

      setPnlRows(filteredRows);
    } catch (e) {
      console.error("Error cargando el P&L:", e);
    } finally {
      setIsFetchingPnL(false);
    }
  };

  const loadReconciliationData = async () => {
    setLoadingData(true);
    const data = await getAllTransactions();
    setHistoryData(data);
    setLoadingData(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pnl_global':
        return <GlobalPnL data={pnlRows} loading={isFetchingPnL} months={pnlMonths} />;

      case 'cockpit':
        return <CockpitDashboard recon={historyData} country={selectedCountry} />;

      case 'conciliation_active':
        return <BankReconciliation selectedCountry={selectedCountry} />;

      case 'conciliation_history':
        return <BankReconciliation selectedCountry={selectedCountry} isHistoryView={true} />;

      case 'cash_entry':
        return <CashFlowAssumptions selectedCountry={selectedCountry} />;

      case 'cash_data':
        return <CashFlowData selectedCountry={selectedCountry} />;

      case 'weekly_financial':
        return <WeeklyFinancialView selectedCountry={selectedCountry} />;

      case 'cash_projection':
        return <ProjectionDashboard selectedCountry={selectedCountry} />;

      case 'cash_scenarios':
        return <CashScenarios selectedCountry={selectedCountry} />;

      case 'cash_variance':
        return <CashVariance selectedCountry={selectedCountry} />;

      case 'forecast_2026':
        return <Forecast2026 selectedCountry={selectedCountry} pnlData={pnlRows} months={pnlMonths} />;

      case 'order_manager':
        return (
          <OrderManager
            orders={ordersMaster}
            selectedCountry={selectedCountry}
            onRefresh={loadOrdersMaster}
            isLoading={isLoadingOrders}
          />
        );

      case 'ai_chat':
        return <AIChat data={historyData} onSync={loadReconciliationData} />;

      case 'ai_predictions':
        return (
          <PredictionsDashboard
            data={historyData.map(r => ({ ...r, amount: r["MONTO CONTABLE"], date: new Date(r.FECHA || Date.now()), country: r.PAIS === 'PE' ? 'Peru' : 'Global' }))}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            isFetching={loadingData}
            onSync={loadReconciliationData}
            growthAssumption={growthAssumption}
            setGrowthAssumption={setGrowthAssumption}
          />
        );

      default:
        return (
          <div className="py-40 text-center opacity-20 font-black text-sm uppercase tracking-[0.5em] italic">
            Módulo {activeTab} en Sincronización
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onQuickOC={handleQuickOC} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-800 font-sans tabular-nums animate-in fade-in duration-1000">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
              {activeTab.includes('conciliation') ? <Zap size={18} className="text-[#00B14F]" /> : <FileText size={18} className="text-[#00B14F]" />}
              <span className="capitalize">{activeTab.split('_').join(' ')}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
              {(['Peru', 'Colombia', 'Mexico', 'Global'] as Country[]).map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className={`min-w-[40px] h-8 px-3 flex items-center justify-center rounded-md text-xs font-semibold uppercase transition-all ${selectedCountry === c
                    ? 'bg-[#00B14F] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {c === 'Global' ? <Globe size={14} /> : c.substring(0, 2)}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="h-9 w-9 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-all group"
              title="Cerrar Sesión"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="h-9 w-9 bg-[#00B14F] text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-lg shadow-emerald-100">
              MV
            </div>
          </div>
        </header>

        {(isFetchingPnL || loadingData) && (
          <div className="fixed top-24 right-6 z-50 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl animate-in slide-in-from-right-4">
            <Loader2 size={16} className="animate-spin text-[#00B14F]" />
            <span>Sincronizando Nube...</span>
          </div>
        )}

        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
