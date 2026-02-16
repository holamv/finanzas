import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getOrdersMaster } from '@/services/googleSheetsService';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'Global';
    const filter = searchParams.get('filter') || 'All';

    try {
        const orders = await getOrdersMaster();

        // Lógica de filtrado idéntica al componente OrderManager
        let filtered = orders.filter(o =>
            country === 'Global' || (o.country?.toString().toLowerCase() === country.toLowerCase())
        );

        const today = new Date();
        const FiveDaysInMs = 5 * 24 * 60 * 60 * 1000;

        if (filter === 'Critical') {
            filtered = filtered.filter(o => {
                if (!o.fechaVencimiento || o.statusTesoreriaRaw !== 'Pendiente') return false;
                try {
                    const vDate = new Date(o.fechaVencimiento);
                    const diff = Math.abs(vDate.getTime() - today.getTime());
                    return diff <= FiveDaysInMs;
                } catch { return false; }
            });
        } else if (filter !== 'All') {
            filtered = filtered.filter(o => o.statusTesoreriaRaw === filter);
        }

        const doc = new jsPDF();

        // Título del Reporte
        doc.setFontSize(18);
        doc.text(`Reporte de Ordenes - ${country}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado vía API - ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Filtro Aplicado: ${filter}`, 14, 34);

        const tableData = filtered.map(oc => [
            oc.correlativo,
            oc.proveedor,
            oc.fechaVencimiento || '---',
            oc.concepto,
            `${oc.moneda} ${oc.monto.toLocaleString()}`,
            oc.statusTesoreriaRaw || 'Pendiente',
            'CRISTHIAN MAYO'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['OC', 'Proveedor', 'Vencimiento', 'Concepto', 'Monto', 'Estado', 'Responsable']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 177, 79] },
            styles: { fontSize: 8 }
        });

        const pdfOutput = doc.output('arraybuffer');

        return new NextResponse(pdfOutput, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Reporte_Ordenes_${Date.now()}.pdf"`
            }
        });
    } catch (error: any) {
        console.error("PDF API Error:", error);
        return NextResponse.json({ error: 'Error generating PDF', details: error.message }, { status: 500 });
    }
}
