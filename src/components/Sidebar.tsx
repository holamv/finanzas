'use client';

import React from 'react';
import {
  Zap,
  History,
  Database,
  ChartLine,
  Layers,
  Scale,
  WandSparkles,
  LayoutDashboard,
  Trophy,
  FileText,
  Menu,
  Settings,
  TrendingUp,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) => {

  const menuSections = [
    {
      title: 'FINANZAS CORE',
      items: [
        { id: 'cockpit', icon: Trophy, label: 'Cockpit P&L' },
        { id: 'pnl_global', icon: FileText, label: 'P&L Global' },
        { id: 'forecast_2026', icon: TrendingUp, label: 'Forecast 2026' },
        { id: 'cash_data', icon: Database, label: 'Datos Maestro' },
        { id: 'order_manager', icon: ClipboardList, label: 'Administración OC' },
      ]
    },
    {
      title: 'CONCILIACIÓN',
      items: [
        { id: 'conciliation_active', icon: Zap, label: 'Bancaria' },
        { id: 'conciliation_history', icon: History, label: 'Historial' },
      ]
    },
    {
      title: 'CASH FLOW',
      items: [
        { id: 'cash_entry', icon: Settings, label: 'Supuestos' },
        { id: 'weekly_financial', icon: BarChart3, label: 'Modelo Semanal' },
        { id: 'cash_projection', icon: ChartLine, label: 'Proyección' },
        { id: 'cash_scenarios', icon: Layers, label: 'Escenarios' },
        { id: 'cash_variance', icon: Scale, label: 'Plan vs Real' },
      ]
    },
    {
      title: 'IA & PREDICTIVO',
      items: [
        { id: 'ai_chat', icon: WandSparkles, label: 'Oracle Chat' },
        { id: 'ai_predictions', icon: LayoutDashboard, label: 'Predictions ML' },
      ]
    }
  ];

  if (!isSidebarOpen) {
    return (
      <aside className="bg-white h-screen sticky top-0 flex flex-col w-16 border-r border-gray-100">
        <div className="p-3 border-b border-gray-100 flex items-center justify-center h-16">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-gray-600">
            <Menu size={20} />
          </button>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {menuSections.map((section) => (
            section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AppTab)}
                  className={`w-full p-3 rounded-lg flex items-center justify-center transition-all ${activeTab === item.id
                      ? 'bg-[#00B14F] text-white'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title={item.label}
                >
                  <Icon size={18} />
                </button>
              );
            })
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-white h-screen sticky top-0 flex flex-col w-64 border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00B14F] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MV</span>
          </div>
          <span className="font-bold text-[#00B14F] text-sm uppercase tracking-tight">
            Manzana Verde
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AppTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                      ? 'bg-[#00B14F] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#00B14F]'} />
                  <span className="text-xs font-semibold flex-1 text-left">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer - Configuración */}
      <div className="p-3 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
          <Settings size={16} className="text-gray-400" />
          <span className="text-xs font-semibold">Configuración</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
