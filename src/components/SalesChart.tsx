import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface SalesChartProps {
    weeks: string[];
    sales2024: number[];
    sales2025: number[];
}

const SalesChart: React.FC<SalesChartProps> = ({ weeks, sales2024, sales2025 }) => {
    const data = weeks.map((week, index) => ({
        name: week,
        'Base 2024': sales2024[index],
        'Proyección 2025': sales2025[index],
    }));

    return (
        <div className="w-full h-[300px] mt-8 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Tendencia Comparativa (YoY)
                </h4>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-[10px] font-bold text-slate-500">2024 Historical</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        <span className="text-[10px] font-bold text-indigo-700">2025 AI Forecast</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorSales2025" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSales2024" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
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
                    <Area
                        type="monotone"
                        dataKey="Base 2024"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#colorSales2024)"
                    />
                    <Area
                        type="monotone"
                        dataKey="Proyección 2025"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSales2025)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
