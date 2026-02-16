'use client';

import React, { useState } from 'react';
import {
  Zap,
  UtensilsCrossed,
  Truck,
  Building2,
  FileText,
  ShoppingBag,
  Users,
  Save
} from 'lucide-react';
import { Country } from '@/types';

interface CashFlowAssumptionsProps {
  selectedCountry: Country;
}

type AssumptionCategory = {
  id: string;
  name: string;
  icon: typeof Zap;
  color: string;
};

const CashFlowAssumptions: React.FC<CashFlowAssumptionsProps> = ({ selectedCountry }) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(2);
  const [totalIncome, setTotalIncome] = useState<string>('');
  const [assumptions, setAssumptions] = useState<Record<string, string>>({
    catering: '',
    delivery: '',
    gastos_admin: '',
    impuestos: '',
    compras: '',
    plantilla: '',
  });

  const weeks = [2, 3, 4];

  const categories: AssumptionCategory[] = [
    { id: 'catering', name: 'Catering', icon: UtensilsCrossed, color: 'red' },
    { id: 'delivery', name: 'Delivery', icon: Truck, color: 'orange' },
    { id: 'gastos_admin', name: 'Gastos Administrativos', icon: Building2, color: 'blue' },
    { id: 'impuestos', name: 'Impuestos', icon: FileText, color: 'yellow' },
    { id: 'compras', name: 'Compras', icon: ShoppingBag, color: 'teal' },
    { id: 'plantilla', name: 'Plantilla', icon: Users, color: 'purple' },
  ];

  const handleAssumptionChange = (categoryId: string, value: string) => {
    setAssumptions(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = () => {
    console.log('Guardando configuración...', {
      country: selectedCountry,
      week: selectedWeek,
      totalIncome,
      assumptions,
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-50 border-red-200 text-red-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
    };
    return colors[color] || '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header Compacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            SUPUESTOS DE <span className="text-[#227A4B]">FLUJO</span>
          </h2>
          <p className="text-xs text-gray-500 uppercase mt-0.5">
            {selectedCountry} • Configure las proyecciones
          </p>
        </div>

        {/* Week Tabs en el header */}
        <div className="flex gap-2">
          {weeks.map(week => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                selectedWeek === week
                  ? 'bg-[#227A4B] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sem {week}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario Compacto en 2 Columnas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

          {/* Ingresos Totales - Destacado */}
          <div className="md:col-span-2 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-[#227A4B] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#227A4B] flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#227A4B] uppercase">
                  Ingresos Totales (Ventas)
                </h3>
                <p className="text-xs text-green-600">Semana {selectedWeek}</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500">$</span>
              <input
                type="number"
                value={totalIncome}
                onChange={(e) => setTotalIncome(e.target.value)}
                className="w-full bg-white border-2 border-[#227A4B]/30 rounded-lg py-2.5 pl-8 pr-4 text-lg font-bold text-gray-800 focus:outline-none focus:border-[#227A4B] transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Categorías Compactas */}
          {categories.map((category) => {
            const Icon = category.icon;
            const colorClasses = getColorClasses(category.color);

            return (
              <div
                key={category.id}
                className={`${colorClasses} rounded-lg border p-3`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-md bg-white/60 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold uppercase truncate">
                      {category.name}
                    </h4>
                    <p className="text-[10px] opacity-70">Semana {selectedWeek}</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">$</span>
                  <input
                    type="number"
                    value={assumptions[category.id]}
                    onChange={(e) => handleAssumptionChange(category.id, e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md py-2 pl-7 pr-3 text-sm font-semibold focus:outline-none focus:border-[#227A4B] focus:ring-1 focus:ring-[#227A4B] transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer con Info y Botón */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-600 italic flex-1">
            💡 Los valores se usarán como base para escenarios de flujo de caja
          </p>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gray-900 text-white font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-gray-800 transition-all shadow-md flex items-center gap-2"
          >
            <Save size={14} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashFlowAssumptions;
