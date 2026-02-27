const fs = require('fs');
let file = fs.readFileSync('src/public/index.html', 'utf8');

// Update Tailwind Config
file = file.replace('theme: {', 'darkMode: \'class\',\n            theme: {');

// Add Dark mode CSS
file = file.replace('.glass-header {', '.dark .glass-header { background: rgba(15, 23, 42, 0.85); border-bottom-color: rgba(255, 255, 255, 0.05); }\n        .glass-header {');
file = file.replace('::-webkit-scrollbar-track {', '.dark ::-webkit-scrollbar-track { background: #1e293b; }\n        ::-webkit-scrollbar-track {');
file = file.replace('::-webkit-scrollbar-thumb {', '.dark ::-webkit-scrollbar-thumb { background: #475569; }\n        ::-webkit-scrollbar-thumb {');
file = file.replace('::-webkit-scrollbar-thumb:hover {', '.dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }\n        ::-webkit-scrollbar-thumb:hover {');

// General BG & Text
file = file.replace('bg-slate-50 text-slate-800', 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200');

// Toggle Button Script
const toggleScript = `
        // Dark Mode Setup
        const html = document.documentElement;
        let theme = localStorage.getItem('theme');
        if (!theme) {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (theme === 'dark') {
            html.classList.add('dark');
        }

        function toggleTheme() {
            html.classList.toggle('dark');
            if (html.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
                document.getElementById('theme-icon').className = 'ph ph-sun text-lg';
            } else {
                localStorage.setItem('theme', 'light');
                document.getElementById('theme-icon').className = 'ph ph-moon text-lg';
            }
        }
`;
file = file.replace('// ESTADO GLOBAL', toggleScript + '\n        // ESTADO GLOBAL');

// Update icon on load
file = file.replace("await fetchUserDetails(token);\n            }", "await fetchUserDetails(token);\n            }\n            if (document.documentElement.classList.contains('dark')) { document.getElementById('theme-icon').className = 'ph ph-sun text-lg'; }");

// Add Header Button
file = file.replace('<button onclick="showSearches()"', '<button onclick="toggleTheme()" class="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors" title="Modo Escuro"><i id="theme-icon" class="ph ph-moon text-lg"></i></button>\n                <button onclick="showSearches()"');

// Helper to replace globally via precise regex
const replaceClasses = (raw, dark) => {
   const regex = new RegExp('(\\b)' + raw.replace(/\//g, '\\/') + '(\\b)', 'g');
   file = file.replace(regex, raw + ' ' + dark);
};

// Replace Backgrounds
replaceClasses('bg-white', 'dark:bg-slate-800');
replaceClasses('bg-slate-50', 'dark:bg-slate-900');
replaceClasses('bg-slate-100', 'dark:bg-slate-700');
replaceClasses('bg-slate-200', 'dark:bg-slate-600');
replaceClasses('bg-slate-50/50', 'dark:bg-slate-900/50');

// Replace Text
replaceClasses('text-slate-900', 'dark:text-white');
replaceClasses('text-slate-800', 'dark:text-slate-100');
replaceClasses('text-slate-700', 'dark:text-slate-200');
replaceClasses('text-slate-600', 'dark:text-slate-300');
replaceClasses('text-slate-500', 'dark:text-slate-400');
replaceClasses('text-slate-400', 'dark:text-slate-500');

// Replace Borders
replaceClasses('border-slate-100', 'dark:border-slate-700');
replaceClasses('border-slate-200', 'dark:border-slate-700');

// Fixes specific to our app logic creating HTML strings
file = file.replace(/dark:bg-slate-900\/50 dark:bg-slate-900/g, 'dark:bg-slate-900/50');
file = file.replace(/placeholder-slate-400 dark:text-slate-500/g, 'placeholder-slate-400 dark:placeholder-slate-500');

fs.writeFileSync('src/public/index.html', file, 'utf8');
console.log('Dark mode classes applied successfully.');
