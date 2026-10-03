import React from 'react';
import { Terminal, Table, Calculator, BarChart3 } from 'lucide-react';

export const TechnicalToolsCard: React.FC = () => {
  const tools = [
    {
      name: 'Python',
      role: 'Model implementation',
      description: 'Core logic executing the weighted-sum calculations and statistical methods.',
      icon: Terminal,
      iconColor: 'text-[#042F34]',
      badgeBg: 'bg-[#B5F2DB] text-[#042F34]',
    },
    {
      name: 'Pandas',
      role: 'Data handling',
      description: 'Managing structured time-series price data and corporate balance sheet metrics.',
      icon: Table,
      iconColor: 'text-[#042F34]',
      badgeBg: 'bg-[#B5F2DB] text-[#042F34]',
    },
    {
      name: 'NumPy',
      role: 'Mathematical calculations',
      description: 'Vectorized computing for daily returns, standard deviation, and normalizations.',
      icon: Calculator,
      iconColor: 'text-[#825b00]',
      badgeBg: 'bg-[#FFC933]/30 text-[#825b00]',
    },
    {
      name: 'Matplotlib',
      role: 'Risk visualization',
      description: 'Plotting price historical series, moving averages, and risk band breakdowns.',
      icon: BarChart3,
      iconColor: 'text-[#16232B]',
      badgeBg: 'bg-[#042F34] text-white',
    },
  ];

  return (
    <div className="bg-white border border-[#cddfe2] rounded-lg p-5 space-y-4 shadow-xs">
      <div className="pb-3 border-b border-[#cddfe2]">
        <h2 className="text-lg font-bold text-[#042F34] tracking-tight">
          Technical Tools
        </h2>
        <p className="text-xs text-[#16232B]/70 mt-0.5">
          Quantitative computing stack powering mathematical risk modeling and analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.name}
              className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-2 hover:border-[#042F34] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white border border-[#cddfe2] flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon className={`w-4 h-4 ${t.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#042F34] font-mono">{t.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.badgeBg}`}>
                    {t.role}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#16232B]/80 leading-relaxed pt-1">
                {t.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
