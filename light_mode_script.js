const fs = require('fs');
let content = fs.readFileSync('src/components/dashboards/rescuer-leader/RescuerLeaderDashboard.tsx', 'utf8');

// Colors replacement map
const replacements = [
  [/bg-slate-950/g, 'bg-slate-50'],
  [/bg-slate-900/g, 'bg-white'],
  [/bg-slate-800/g, 'bg-slate-100'],
  [/bg-slate-700/g, 'bg-slate-200'],
  [/border-slate-800/g, 'border-slate-200'],
  [/border-slate-700/g, 'border-slate-300'],
  [/text-white/g, 'text-slate-900'],
  [/text-slate-400/g, 'text-slate-500'],
  [/text-slate-300/g, 'text-slate-600'],
  [/border-white\/5/g, 'border-slate-900\/5'],
  [/hover:bg-slate-800/g, 'hover:bg-slate-200'],
  [/hover:text-white/g, 'hover:text-slate-900'],
  [/bg-slate-900\/60/g, 'bg-white\/80'],
  [/bg-slate-900\/70/g, 'bg-white\/90'],
  [/bg-slate-900\/80/g, 'bg-white\/90'],
  [/bg-slate-800\/50/g, 'bg-slate-100\/80'],
  [/bg-slate-800\/60/g, 'bg-slate-100\/90'],
  [/border-white\/10/g, 'border-slate-900\/10'],
  [/border-white\/20/g, 'border-slate-900\/20']
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync('src/components/dashboards/rescuer-leader/RescuerLeaderDashboard.tsx', content);
console.log('Done!');
