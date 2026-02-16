'use client';

import React, { useState, useEffect } from 'react';
import {
    Lock,
    LogIn,
    PlusCircle,
    ChevronRight,
    Activity,
    FileText,
    ShieldCheck,
    CheckCircle2,
    ArrowLeft,
    Search,
    User,
    Activity as ActivityIcon
} from 'lucide-react';
import { getProviders } from '@/services/googleSheetsService';

interface LoginPageProps {
    onLogin: (password: string) => void;
    onQuickOC: (data: any) => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onQuickOC }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'oc'>('login');
    const [password, setPassword] = useState('');
    const [providers, setProviders] = useState<{ id: string, name: string, country: string }[]>([]);
    const [ocForm, setOcForm] = useState({
        proveedor: '',
        monto: '',
        tipo: 'Pago planificado',
        concepto: '',
        pais: 'PERÚ',
        moneda: 'USD',
        centroCosto: '',
        lineaServicio: '',
        fechaServicio: '',
        fechaVencimiento: '',
        solicitante: '',
        id: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProvList, setShowProvList] = useState(false);

    useEffect(() => {
        const loadProviders = async () => {
            const data = await getProviders();
            setProviders(data);
        };
        loadProviders();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };

    const handleOCSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Lista de campos obligatorios
        const mandatoryFields = [
            'pais', 'tipo', 'proveedor', 'concepto', 'moneda',
            'monto', 'centroCosto', 'lineaServicio', 'fechaServicio',
            'fechaVencimiento', 'solicitante'
        ];

        const missing = mandatoryFields.filter(f => !ocForm[f as keyof typeof ocForm]);

        if (missing.length > 0) {
            alert("Por favor completa todos los campos obligatorios (*) antes de continuar.");
            return;
        }

        setIsSubmitting(true);
        const result = await onQuickOC(ocForm);
        if (result) {
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setOcForm({
                    proveedor: '',
                    monto: '',
                    tipo: 'Pago planificado',
                    concepto: '',
                    pais: 'PERÚ',
                    moneda: 'USD',
                    centroCosto: '',
                    lineaServicio: '',
                    fechaServicio: '',
                    fechaVencimiento: '',
                    solicitante: '',
                    id: ''
                });
                setSearchTerm('');
            }, 3000);
        }
        setIsSubmitting(false);
    };

    const filteredProviders = providers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-4 lg:p-10 relative overflow-hidden font-sans tabular-nums">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00B14F]/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>

            <div className={`w-full ${activeTab === 'oc' ? 'max-w-4xl' : 'max-w-lg'} bg-white rounded-[3rem] shadow-2xl shadow-emerald-200/20 border border-slate-100 overflow-hidden relative z-10 transition-all duration-500 ease-in-out`}>

                {/* Header Section */}
                <div className="p-8 pb-4 text-center">
                    <div className="h-14 w-14 bg-[#00B14F]/10 text-[#00B14F] rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                        <ActivityIcon size={28} />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
                        Manzana <span className="text-[#00B14F]">Verde</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-50 py-1 px-4 rounded-full w-fit mx-auto border border-slate-100">
                        Sistema de Operaciones v2.2
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex px-8 gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                        <LogIn size={14} /> Ingresar
                    </button>
                    <button
                        onClick={() => setActiveTab('oc')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'oc' ? 'bg-[#00B14F] text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                        <PlusCircle size={14} /> Crear OC
                    </button>
                </div>

                <div className="px-8 pb-10">
                    {activeTab === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pin de Acceso</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00B14F] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••"
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-[#00B14F]/5 outline-none transition-all placeholder:text-slate-300 tracking-[0.3em]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#00B14F] hover:bg-slate-900 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
                            >
                                Entrar al Dashboard <ChevronRight size={18} />
                            </button>

                            <div className="flex items-center justify-center gap-3 opacity-30 mt-8">
                                <ShieldCheck size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Finanzas Core Secure Access</span>
                            </div>
                        </form>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {success ? (
                                <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[3.5rem] text-center max-w-lg mx-auto">
                                    <div className="h-20 w-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">OC Registrada</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Sincronizado con OC_MASTER Google Sheet</p>
                                </div>
                            ) : (
                                <form onSubmit={handleOCSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 px-4">
                                    {/* País */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">País <span className="text-rose-500">*</span></label>
                                        <select
                                            required
                                            value={ocForm.pais}
                                            onChange={(e) => setOcForm({ ...ocForm, pais: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 focus:bg-white outline-none"
                                        >
                                            <option value="PERÚ">PERÚ</option>
                                            <option value="COLOMBIA">COLOMBIA</option>
                                            <option value="MEXICO">MÉXICO</option>
                                        </select>
                                    </div>

                                    {/* Tipo OC */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Tipo de OC <span className="text-rose-500">*</span></label>
                                        <select
                                            required
                                            value={ocForm.tipo}
                                            onChange={(e) => setOcForm({ ...ocForm, tipo: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 focus:bg-white outline-none"
                                        >
                                            <option value="Pago planificado">Pago planificado</option>
                                            <option value="Urgente">Urgente</option>
                                            <option value="Recurrente">Recurrente</option>
                                        </select>
                                    </div>

                                    {/* Proveedor */}
                                    <div className="space-y-2 relative">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Proveedor <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Escriba para buscar..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setShowProvList(true);
                                                }}
                                                onFocus={() => setShowProvList(true)}
                                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 focus:bg-white outline-none"
                                            />
                                        </div>
                                        {showProvList && searchTerm && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto border-t-4 border-t-emerald-500">
                                                {filteredProviders.length > 0 ? filteredProviders.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setOcForm({ ...ocForm, proveedor: p.name, id: p.id });
                                                            setSearchTerm(p.name);
                                                            setShowProvList(false);
                                                        }}
                                                        className="w-full px-5 py-3 hover:bg-emerald-50 text-left text-[10px] font-bold text-slate-700 border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{p.name}</span>
                                                            <span className="text-[8px] text-slate-400 uppercase">RUC: {p.id} • {p.country}</span>
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className="px-5 py-3 text-[10px] text-slate-400 italic">No se encontraron proveedores</div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOcForm({ ...ocForm, proveedor: searchTerm });
                                                        setShowProvList(false);
                                                    }}
                                                    className="w-full px-5 py-3 bg-slate-50 hover:bg-slate-100 text-left text-[10px] font-black text-[#00B14F] uppercase tracking-widest"
                                                >
                                                    + Usar "{searchTerm}" como nuevo
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Concepto / Servicio */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Concepto / Servicio <span className="text-rose-500">*</span></label>
                                        <input
                                            required
                                            value={ocForm.concepto}
                                            onChange={(e) => setOcForm({ ...ocForm, concepto: e.target.value })}
                                            placeholder="Escriba el motivo de la compra..."
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 focus:bg-white outline-none"
                                        />
                                    </div>

                                    {/* Moneda */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Moneda <span className="text-rose-500">*</span></label>
                                        <select
                                            required
                                            value={ocForm.moneda}
                                            onChange={(e) => setOcForm({ ...ocForm, moneda: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 focus:bg-white outline-none"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="PEN">PEN (S/)</option>
                                            <option value="COP">COP ($ COL)</option>
                                            <option value="MXN">MXN ($ MEX)</option>
                                        </select>
                                    </div>

                                    {/* Monto OC */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Monto OC <span className="text-rose-500">*</span></label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={ocForm.monto}
                                            onChange={(e) => setOcForm({ ...ocForm, monto: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 focus:bg-white border-emerald-500/20 outline-none"
                                        />
                                    </div>

                                    {/* Centro de Costo */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Centro de Costo <span className="text-rose-500">*</span></label>
                                        <select
                                            required
                                            value={ocForm.centroCosto}
                                            onChange={(e) => setOcForm({ ...ocForm, centroCosto: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 focus:bg-white outline-none"
                                        >
                                            <option value="">Seleccione un centro de costo</option>
                                            <option value="Catering">Catering</option>
                                            <option value="Delivery">Delivery</option>
                                            <option value="Insumos">Insumos</option>
                                            <option value="Impuestos">Impuestos</option>
                                            <option value="Google Ads/ Facebook Ads">Google Ads/ Facebook Ads</option>
                                            <option value="Planilla neta">Planilla neta</option>
                                            <option value="Planilla RXH">Planilla RXH</option>
                                            <option value="Beneficios sociales">Beneficios sociales</option>
                                            <option value="Deudas pasadas">Deudas pasadas</option>
                                            <option value="Inversión">Inversión</option>
                                        </select>
                                    </div>

                                    {/* Línea de Servicio */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Línea de Servicio <span className="text-rose-500">*</span></label>
                                        <select
                                            required
                                            value={ocForm.lineaServicio}
                                            onChange={(e) => setOcForm({ ...ocForm, lineaServicio: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 focus:bg-white outline-none"
                                        >
                                            <option value="">Seleccione una línea de servicio</option>
                                            <option value="Scheduled orders">Scheduled orders</option>
                                            <option value="On Demand orders">On Demand orders</option>
                                            <option value="Franchise">Franchise</option>
                                            <option value="No aplica">No aplica</option>
                                        </select>
                                    </div>

                                    {/* Fecha de Servicio */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Fecha de Servicio <span className="text-rose-500">*</span></label>
                                        <input
                                            required
                                            type="date"
                                            value={ocForm.fechaServicio}
                                            onChange={(e) => setOcForm({ ...ocForm, fechaServicio: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 focus:bg-white outline-none"
                                        />
                                    </div>

                                    {/* Fecha de Vencimiento */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Fecha de Vencimiento <span className="text-rose-500">*</span></label>
                                        <input
                                            required
                                            type="date"
                                            value={ocForm.fechaVencimiento}
                                            onChange={(e) => setOcForm({ ...ocForm, fechaVencimiento: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 focus:bg-white outline-none"
                                        />
                                    </div>

                                    {/* Solicitante */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Solicitante <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                required
                                                value={ocForm.solicitante}
                                                onChange={(e) => setOcForm({ ...ocForm, solicitante: e.target.value })}
                                                placeholder="Nombre de quien solicita la OC"
                                                className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 focus:bg-white outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#00B14F] hover:bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <><FileText size={16} /> Crear Orden de Compra Maestra</>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('login')}
                                            className="w-full py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
                                        >
                                            <ArrowLeft size={12} /> Descartar y Volver
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Meta */}
                <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.1em]">Cloud Sync Active</span>
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Manzana Verde Ops • 2026</span>
                </div>
            </div>
        </div>
    );
};
