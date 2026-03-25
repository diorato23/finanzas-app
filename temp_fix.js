const fs = require('fs');
let content = fs.readFileSync('src/app/login/page.tsx', 'utf8');
content = content.replace(/style=\{\{\s*background:\s*"linear-gradient\(135deg, #1a1040 0%, #2d1b69 40%, #1e3a8a 100%\)"\s*\}\}/g, '');
content = content.replace(/className="min-h-screen w-full flex items-center justify-center p-4"/g, 'className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-950 to-slate-950"');
content = content.replace(/style=\{\{\s*background:\s*"rgba\(255,255,255,0\.07\)",\s*backdropFilter:\s*"blur\(24px\)",\s*border:\s*"1px solid rgba\(255,255,255,0\.12\)"\s*\}\}/g, '');
content = content.replace(/className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"/g, 'className="w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10"');
content = content.replace(/indigo/g, 'emerald');
fs.writeFileSync('src/app/login/page.tsx', content);
