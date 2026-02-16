'use client';

import EBITDAVsContributionMargin from '@/components/EBITDAVsContributionMargin';

export default function ComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Comparativa Financiera</h1>
          <p className="text-gray-600 text-lg">EBITDA vs Contribution Margin - Año 2025</p>
        </div>
        <EBITDAVsContributionMargin />
      </div>
    </div>
  );
}
