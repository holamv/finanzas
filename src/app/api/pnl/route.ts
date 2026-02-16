import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'pnl_input.tsv');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            return NextResponse.json({ months: [], pnl_data: [] });
        }

        const headers = lines[0].split('\t');
        const months = headers.slice(2).map(m => m.trim());

        // Objeto para agrupar métricas por su nombre
        const metricsMap: Record<string, any> = {};

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split('\t');
            const category = parts[0]?.trim() || "";
            const parent = parts[1]?.trim() || "";
            const values = parts.slice(2, 2 + months.length).map(v => {
                const cleanV = v.replace(/,/g, '').trim();
                return (cleanV === "" || isNaN(Number(cleanV))) ? 0 : Number(cleanV);
            });

            if (category === "") continue;

            if (parent === "") {
                // Es una métrica principal
                if (!metricsMap[category]) {
                    metricsMap[category] = {
                        category: category,
                        unit: 'USD', // Por defecto o inferir si existiera columna
                        total_values: values,
                        sub_metrics: {}
                    };
                } else {
                    // Si ya existe (por alguna razón), actualizamos el total
                    metricsMap[category].total_values = values;
                }
            } else {
                // Es una sub-métrica
                // Buscamos o creamos el padre
                if (!metricsMap[parent]) {
                    metricsMap[parent] = {
                        category: parent,
                        unit: 'USD',
                        total_values: Array(months.length).fill(0),
                        sub_metrics: {}
                    };
                }

                // El sub_key en snake_case como pedía el script anterior
                const subKey = category.toLowerCase().replace(/ /g, "_");
                metricsMap[parent].sub_metrics[subKey] = values;
            }
        }

        // Convertir el mapa a array preservando el orden del archivo si es posible
        // Pero en realidad page.tsx lo ordena por HEADER_KEYWORDS
        const pnl_data = Object.values(metricsMap);

        return NextResponse.json({
            months: months,
            count_weeks: months.length,
            pnl_data: pnl_data
        });
    } catch (error: any) {
        console.error('Error internal P&L API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
