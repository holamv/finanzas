import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
    Cell
} from 'recharts';

interface CashFlowTrendChartProps {
    data: {
        week: string;
        inflows: number;
        outflows: number;
        net: number;
    }[];
}

const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({ data }) => {
    // Format dates to be shorter
    const chartData = data.map(item => ({
        ...item,
        formattedWeek: item.week.split('-').slice(1).reverse().join('/') // MM-DD
    }));

    return (
        <div className="w-full h-[300px] mt-8 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 italic">
            <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Flujo de Caja Proyectado
                </h4>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ingresos</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Egresos</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="formattedWeek"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                        formatter={(value: any) => [value !== undefined ? `$${value?.toLocaleString()}` : '$0', '']}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                    <Bar dataKey="inflows" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Ingresos" />
                    <Bar dataKey="outflows" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} name="Egresos" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CashFlowTrendChart;
