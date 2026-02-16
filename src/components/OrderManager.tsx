'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    FileStack,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    User,
    MessageSquare,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    RotateCw,
    MoreHorizontal
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OCData, Country } from '@/types';
import { updateOrderMetadata } from '@/services/googleSheetsService';
import { convertToUSD, formatCurrency } from '@/lib/currencyUtils';

interface OrderManagerProps {
    orders: OCData[];
    selectedCountry: Country;
    onRefresh: () => void;
    isLoading: boolean;
}

export default function OrderManager({ orders, selectedCountry, onRefresh, isLoading }: OrderManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // 1. Calculate alerts independently of the current status filter
    const criticalAlertsList = useMemo(() => {
        const today = new Date();
        const FiveDaysInMs = 5 * 24 * 60 * 60 * 1000;

        return orders.filter(o => {
            const countryMatch = selectedCountry === 'Global' || o.country === selectedCountry;
            if (!countryMatch || !o.fechaVencimiento || o.statusTesoreriaRaw !== 'Pendiente') return false;

            const vDate = new Date(o.fechaVencimiento);
            const diff = Math.abs(vDate.getTime() - today.getTime());
            return diff <= FiveDaysInMs;
        });
    }, [orders, selectedCountry]);

    // 2. Filter orders for the table display
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const countryMatch = selectedCountry === 'Global' || o.country === selectedCountry;
            if (!countryMatch) return false;

            let statusMatch = false;
            if (statusFilter === 'All') {
                statusMatch = true;
            } else if (statusFilter === 'Critical') {
                statusMatch = criticalAlertsList.some(a => a.correlativo === o.correlativo);
            } else {
                statusMatch = o.statusTesoreriaRaw === statusFilter;
            }

            const searchMatch =
                o.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.id.toLowerCase().includes(searchTerm.toLowerCase());

            return statusMatch && searchMatch;
        });
    }, [orders, selectedCountry, statusFilter, searchTerm, criticalAlertsList]);

    const stats = useMemo(() => {
        // Base counts (independent of current statusFilter but respecting country)
        const baseFilteredByCountry = orders.filter(o => selectedCountry === 'Global' || o.country === selectedCountry);

        const totalAmount = baseFilteredByCountry.reduce((acc, o) => {
            if (selectedCountry === 'Global') {
                return acc + convertToUSD(o.monto, o.pais || o.moneda || 'USD');
            }
            return acc + o.monto;
        }, 0);

        return {
            total: baseFilteredByCountry.length,
            pending: baseFilteredByCountry.filter(o => o.statusTesoreriaRaw === 'Pendiente').length,
            paid: baseFilteredByCountry.filter(o => o.statusTesoreriaRaw === 'Pago completo').length,
            totalAmount: totalAmount,
            criticalAlerts: criticalAlertsList.length
        };
    }, [orders, selectedCountry, criticalAlertsList]);

    const handleStatusUpdate = async (correlativo: string, newStatus: string) => {
        setUpdatingId(correlativo);
        const success = await updateOrderMetadata(correlativo, { statusTesoreriaRaw: newStatus as any });
        if (success) {
            onRefresh();
        }
        setUpdatingId(null);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text(`Reporte de Órdenes - ${selectedCountry}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Filtro: ${statusFilter === 'Critical' ? 'Alertas Críticas' : statusFilter === 'All' ? 'Todas' : statusFilter}`, 14, 34);

        const tableData = filteredOrders.map(oc => {
            const displayAmount = selectedCountry === 'Global'
                ? formatCurrency(convertToUSD(oc.monto, oc.pais || oc.moneda || 'USD'), selectedCountry)
                : formatCurrency(oc.monto, selectedCountry);

            return [
                oc.correlativo,
                oc.proveedor,
                oc.fechaVencimiento || '---',
                oc.concepto,
                displayAmount,
                oc.statusTesoreriaRaw || 'Pendiente',
                'CRISTHIAN MAYO'
            ];
        });

        autoTable(doc, {
            startY: 40,
            head: [['OC', 'Proveedor', 'Vencimiento', 'Concepto', 'Monto', 'Estado', 'Responsable']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 177, 79] },
            styles: { fontSize: 8 }
        });

        doc.save(`Ordenes_${selectedCountry}_${statusFilter}_${Date.now()}.pdf`);
    };

    const statusColors: any = {
        'Pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
        'Pago parcial': 'bg-purple-100 text-purple-700 border-purple-200',
        'Pago completo': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { id: 'All', label: 'Total Órdenes', value: stats.total, icon: FileStack, color: 'text-slate-600' },
                    { id: 'Pendiente', label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-amber-500' },
                    { id: 'Critical', label: 'Alertas Críticas', value: stats.criticalAlerts, icon: AlertCircle, color: 'text-rose-500' },
                    { id: 'Pago completo', label: 'PAGADAS', value: stats.paid, icon: CheckCircle2, color: 'text-emerald-500' },
                    { id: 'Amount', label: 'Monto Total', value: formatCurrency(stats.totalAmount, selectedCountry), icon: ExternalLink, color: 'text-[#00B14F]' },
                ].map((stat, i) => {
                    const isCriticalAlert = stat.label === 'Alertas Críticas' && (typeof stat.value === 'number' && stat.value > 0);
                    const isActive = statusFilter === stat.id;

                    return (
                        <button
                            key={i}
                            onClick={() => stat.id !== 'Amount' && setStatusFilter(stat.id)}
                            className={`text-left bg-white p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'ring-2 ring-slate-900 ring-offset-2' : ''} ${isCriticalAlert ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'} shadow-sm`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</span>
                                <stat.icon size={16} className={stat.color} />
                            </div>
                            <div className={`text-2xl font-black ${isCriticalAlert ? 'text-rose-600' : 'text-slate-900'}`}>{stat.value}</div>
                        </button>
                    );
                })}
            </div>

            {/* Filters/Actions Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-wrap items-center gap-4 shadow-sm">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por Correlativo, Proveedor, RUC o Concepto..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 outline-none focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {[
                        { id: 'All', label: 'TODOS' },
                        { id: 'Critical', label: '📅 CRÍTICAS' },
                        { id: 'Pendiente', label: 'PENDIENTE' },
                        { id: 'Pago parcial', label: 'PAGO PARCIAL' },
                        { id: 'Pago completo', label: 'PAGO COMPLETO' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f.id ? (f.id === 'Critical' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-[#00B14F] shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToPDF}
                        title="Exportar PDF"
                        className="h-12 px-6 flex items-center justify-center gap-2 bg-[#00B14F] text-white rounded-2xl hover:bg-[#008F3F] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        <Download size={18} />
                        Exportar PDF
                    </button>

                    <button
                        onClick={onRefresh}
                        className="h-12 w-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl hover:bg-[#00B14F] transition-all"
                        disabled={isLoading}
                    >
                        <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">OC Correlativo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor / RUC</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vencimiento</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Tesorería</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Responsable</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? filteredOrders.map((oc) => {
                                const isCritical = criticalAlertsList.some(a => a.correlativo === oc.correlativo);
                                return (
                                    <React.Fragment key={oc.correlativo}>
                                        <tr className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${expandedRow === oc.correlativo ? 'bg-emerald-50/20' : ''} ${isCritical ? 'bg-rose-50/40' : ''}`}>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-900">{oc.correlativo}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{oc.tipo}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-800">{oc.proveedor}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">RUC: {oc.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[10px] font-black ${oc.fechaVencimiento && new Date(oc.fechaVencimiento) < new Date() ? 'text-rose-500' : 'text-slate-600'}`}>
                                                        {oc.fechaVencimiento || '---'}
                                                    </span>
                                                    {isCritical && (
                                                        <span className="text-[7px] font-black text-rose-600 bg-rose-100 px-1 rounded uppercase mt-1 animate-pulse">¡Vencimiento Cercano!</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 max-w-[200px]">
                                                <span className="text-[11px] font-bold text-slate-600 line-clamp-1 truncate">{oc.concepto}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-[#00B14F] italic">
                                                        {selectedCountry === 'Global'
                                                            ? formatCurrency(convertToUSD(oc.monto, oc.pais || oc.moneda || 'USD'), selectedCountry)
                                                            : formatCurrency(oc.monto, selectedCountry)
                                                        }
                                                    </span>
                                                    {selectedCountry === 'Global' && oc.moneda !== 'USD' && (
                                                        <span className="text-[8px] text-slate-400 font-bold uppercase">{oc.moneda} {oc.monto.toLocaleString()}</span>
                                                    )}
                                                    <span className="text-[8px] text-slate-400 font-bold uppercase">Pais: {oc.pais}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[oc.statusTesoreriaRaw || 'Pendiente'] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {oc.statusTesoreriaRaw || 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-[10px] font-black text-slate-600 uppercase">
                                                    CRISTHIAN MAYO
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setExpandedRow(expandedRow === oc.correlativo ? null : oc.correlativo)}
                                                        className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                                    >
                                                        {expandedRow === oc.correlativo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === oc.correlativo && (
                                            <tr className="bg-slate-50/30">
                                                <td colSpan={8} className="px-10 py-8 border-b border-slate-100">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                                <Clock size={12} className="text-slate-900" /> Tiempos & Vencimientos
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[8px] text-slate-400 uppercase font-black">Registro</p>
                                                                    <p className="text-[11px] font-bold text-slate-800">{oc.fechaRegistro || '---'}</p>
                                                                </div>
                                                                <div className="border-l border-slate-200 pl-4">
                                                                    <p className="text-[8px] text-slate-400 uppercase font-black">Vencimiento</p>
                                                                    <p className={`text-[11px] font-black ${oc.fechaVencimiento && new Date(oc.fechaVencimiento) < new Date() ? 'text-rose-500' : 'text-slate-800'}`}>
                                                                        {oc.fechaVencimiento || '---'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 border-x border-slate-100 px-8">
                                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                                <User size={12} className="text-slate-900" /> Estados de Aprobación
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <p className="text-[8px] text-slate-400 uppercase font-black">Status CEO</p>
                                                                    <p className={`text-[11px] font-black uppercase ${oc.statusCEO?.toLowerCase() === 'aprobada' ? 'text-emerald-600' : 'text-amber-600'}`}>{oc.statusCEO || 'Pendiente'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] text-slate-400 uppercase font-black">Status Tesorería</p>
                                                                    <p className={`text-[11px] font-black uppercase ${oc.statusTesoreriaRaw?.toLowerCase().includes('pago') ? 'text-blue-600' : 'text-slate-600'}`}>{oc.statusTesoreriaRaw || 'Pendiente'}</p>
                                                                </div>
                                                                <div className="pt-2 border-t border-slate-100">
                                                                    <p className="text-[8px] text-slate-400 uppercase font-black">Solicitado por</p>
                                                                    <p className="text-[11px] font-black text-slate-800 uppercase italic">{oc.solicitante || 'NO ASIGNADO'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                                <MessageSquare size={12} className="text-slate-900" /> Comentarios & Evidencia
                                                            </h4>
                                                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic bg-white p-3 rounded-2xl border border-slate-100">
                                                                "{oc.comentarios || 'Sin comentarios adicionales registrados.'}"
                                                            </p>
                                                            {oc.evidenciaUrl && (
                                                                <a
                                                                    href={oc.evidenciaUrl}
                                                                    target="_blank"
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00B14F] transition-all"
                                                                >
                                                                    Ver Comprobante <ExternalLink size={12} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="opacity-20 flex flex-col items-center">
                                            <FileStack size={48} className="mb-4" />
                                            <p className="text-sm font-black uppercase tracking-[0.5em]">No hay órdenes para mostrar</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
