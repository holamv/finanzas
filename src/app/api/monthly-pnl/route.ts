import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cityFilter = searchParams.get('city'); // Lima, Piura, etc.
        const countryFilter = searchParams.get('country'); // Peru, Mexico, Colombia, Global
        const businessLine = searchParams.get('line') || 'total'; // Scheduled orders, On demand orders, Franchises, total

        const filePath = path.join(process.cwd(), 'data', 'monthly_db.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const db = JSON.parse(fileContent);

        const { cities, months } = db;
        const cityNames = Object.keys(cities);

        // Identificar qué ciudades incluir
        let targetCities = cityNames;
        if (cityFilter && cityFilter !== 'all') {
            targetCities = [cityFilter];
        } else if (countryFilter && countryFilter !== 'Global') {
            targetCities = cityNames.filter(c => cities[c].country === countryFilter);
        }

        const monthsCount = months.length;

        // Función para obtener valores de una métrica para una ciudad y línea de negocio
        const getValues = (city: string, metric: string, line: string) => {
            const cityData = cities[city];
            const metricData = cityData[metric];
            if (!metricData) return Array(monthsCount).fill(0);

            // Mapear el nombre de la línea si es necesario
            let lineKey = line;
            if (line === 'Scheduled orders') lineKey = 'Scheduled orders';
            if (line === 'On demand orders') lineKey = 'On demand orders';
            if (line === 'Franchises') lineKey = 'Franchises';

            const values = metricData[lineKey] || metricData['total'] || Array(monthsCount).fill(0);
            return values.map((v: any) => Number(v) || 0);
        };

        // Agregar valores de múltiples ciudades
        const aggregate = (metric: string, line: string) => {
            const result = Array(monthsCount).fill(0);
            targetCities.forEach(city => {
                const vals = getValues(city, metric, line);
                vals.forEach((v: number, i: number) => result[i] += v);
            });
            return result;
        };

        // Líneas principales solicitadas
        const sales = aggregate('Sales', businessLine);
        const revenue = aggregate('Revenue', businessLine);
        const grossMargin = aggregate('Gross margin', businessLine);

        // Calcular COGS = Revenue - Gross Margin
        const cogs = revenue.map((r: number, i: number) => r - grossMargin[i]);

        // Expenses = Marketing Costs + Sales Payroll
        const marketing = aggregate('Marketing Costs', businessLine);
        const payroll = aggregate('Sales Payroll', businessLine);
        const expenses = marketing.map((m: number, i: number) => m + payroll[i]);

        // EBITDA = Contribution Margin (o Revenue - COGS - Expenses)
        // Usaremos Contribution Margin del JSON como EBITDA si no hay más gastos
        const contributionMargin = aggregate('Contribution margin', businessLine);
        const ebitda = contributionMargin;

        // Burn Rate (EBITDA si es negativo, o simplificado)
        const burnRate = ebitda.map((e: number) => e < 0 ? Math.abs(e) : 0);

        const pnl_data = [
            { category: 'Sales', values: sales, isHeader: true },
            { category: 'Revenue', values: revenue, isHeader: true },
            { category: 'COGS', values: cogs, isHeader: true },
            { category: 'Gross Margin', values: grossMargin, isHeader: true },
            { category: 'Expenses', values: expenses, isHeader: true },
            { category: 'EBITDA', values: ebitda, isHeader: true },
            { category: 'Burn Rate', values: burnRate, isHeader: true },
        ];

        return NextResponse.json({
            months: months,
            pnl_data: pnl_data,
            availableCities: cityNames,
            availableCountries: ['Peru', 'Mexico', 'Colombia', 'Global']
        });

    } catch (error: any) {
        console.error('Error in monthly P&L API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
