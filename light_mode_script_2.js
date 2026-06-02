const fs = require('fs');
let content = fs.readFileSync('src/components/dashboards/rescuer-leader/RescuerLeaderDashboard.tsx', 'utf8');

const replacements = [
  [/from-slate-800/g, 'from-slate-100'],
  [/from-slate-700/g, 'from-white'],
  [/to-slate-900/g, 'to-slate-50'],
  [/to-slate-800/g, 'to-slate-100'],
  [/text-slate-200/g, 'text-slate-700'],
  [/border-slate-950/g, 'border-slate-200'],
  // Replace dark mode overlays and dialogs backgrounds
  [/bg-slate-900/g, 'bg-white'], 
  // Wait, I already did bg-slate-900.
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync('src/components/dashboards/rescuer-leader/RescuerLeaderDashboard.tsx', content);
console.log('Second pass done!');
