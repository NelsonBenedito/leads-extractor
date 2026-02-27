const fs = require('fs');
let file = fs.readFileSync('src/public/index.html', 'utf8');

// 1. Clean up duplicate dark classes created by my previous faulty Regex script
file = file.replace(/dark:text-slate-400 dark:text-slate-500/g, 'dark:text-slate-400');
file = file.replace(/dark:bg-slate-900\/50 dark:bg-slate-900\/50/g, 'dark:bg-slate-900/50');
file = file.replace(/dark:bg-slate-900 dark:bg-slate-900/g, 'dark:bg-slate-900');
file = file.replace(/hover:bg-slate-50 dark:bg-slate-900/g, 'hover:bg-slate-50 dark:hover:bg-slate-700'); 
file = file.replace(/dark:bg-slate-800 dark:bg-slate-800/g, 'dark:bg-slate-800');
file = file.replace(/dark:text-slate-100 dark:text-slate-200/g, 'dark:text-slate-200');

// 2. Specific fix: Action Bar "Extração Concluída" icon background
file = file.replace('bg-emerald-100 text-emerald-600 p-2', 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2');

// 3. Specific fix: Select elements
file = file.replace(/bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-700/g, 'bg-slate-50 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700');

// 4. Specific fix: Table head background
file = file.replace(/<thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 .*? font-semibold">/g, '<thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold">');
// Re-apply in case regex fails
file = file.replace('<thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold">', '<thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold">');

// 5. Specific fix: PRO Upsell
file = file.replace('bg-amber-50 border border-amber-200 p-3 text-amber-800', 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 text-amber-800 dark:text-amber-400');
file = file.replace('bg-amber-100 dark:bg-slate-700 text-amber-700', 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400');

// 6. Limits & Errors Backgrounds and text
file = file.replace('bg-red-50 rounded-2xl border border-red-100', 'bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50');
file = file.replace('bg-red-100 p-2 rounded-full text-red-600', 'bg-red-100 dark:bg-red-900/50 p-2 rounded-full text-red-600 dark:text-red-400');
file = file.replace('text-red-800">Falha', 'text-red-800 dark:text-red-400">Falha');
file = file.replace('text-red-600 mt-1', 'text-red-600 dark:text-red-300 mt-1');

// 7. Modals: Persuasion Box
file = file.replace('bg-brand-50 border border-brand-100 p-4 rounded-2xl flex gap-3 text-brand-800', 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 p-4 rounded-2xl flex gap-3 text-brand-800 dark:text-brand-300');
file = file.replace('bg-brand-100 p-2 rounded-full h-fit"><i class="ph-fill ph-gift text-brand-600', 'bg-brand-100 dark:bg-brand-900/50 p-2 rounded-full h-fit"><i class="ph-fill ph-gift text-brand-600 dark:text-brand-400');
file = file.replace('bg-slate-50\/50 rounded-t-3xl', 'bg-slate-50/50 dark:bg-slate-800/80 rounded-t-3xl');

// 8. Modals: Auth Inputs
file = file.replace(/bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800/g, 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white');

// 9. Buttons
file = file.replace(/bg-slate-900 hover:bg-slate-800 text-white/g, 'bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800 dark:hover:bg-indigo-600 text-white');

// 10. History modal search list
file = file.replace('bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-slate-400', 'bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-slate-400');
file = file.replace('group-hover:text-brand-500 group-hover:bg-brand-50', 'group-hover:text-brand-500 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30');
file = file.replace(/bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-600/g, 'bg-slate-50 dark:bg-slate-800/80 hover:bg-brand-50 dark:hover:bg-brand-900/30 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400');

// 11. Pagination
file = file.replace(/bg-slate-50 dark:bg-slate-900 p-1/g, 'bg-slate-50 dark:bg-slate-800/50 p-1');
file = file.replace(/bg-white dark:bg-slate-800 px-6 py-4/g, 'bg-white dark:bg-slate-800/80 px-6 py-4');

// 12. App background
file = file.replace('bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200', 'bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-slate-200');

fs.writeFileSync('src/public/index.html', file, 'utf8');
