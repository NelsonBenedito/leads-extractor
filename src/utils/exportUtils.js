const fs = require('fs');
const path = require('path');

/**
 * Exporta os dados num arquivo JSON.
 * 
 * @param {Array} leads - A lista de leads a ser exportada.
 * @param {string} filename - O nome do arquivo (padrão: leads.json).
 */
function exportToJson(leads, filename = 'leads.json') {
  const filePath = path.join(process.cwd(), filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf8');
    console.log(`\n[\u2713] leads exportados com sucesso para JSON: ${filePath}`);
  } catch (error) {
    console.error(`[Erro] Falha ao exportar para JSON: ${error.message}`);
  }
}

/**
 * Exporta os dados num arquivo CSV simples.
 * 
 * @param {Array} leads - A lista de leads a ser exportada.
 * @param {string} filename - O nome do arquivo (padrão: leads.csv).
 */
function exportToCsv(leads, filename = 'leads.csv') {
  const filePath = path.join(process.cwd(), filename);
  
  if (leads.length === 0) {
    console.log('Nenhum dado para exportar em CSV.');
    return;
  }

  try {
    // Cabeçalhos fáceis baseados nos dados do primeiro elemento
    const headers = ['nome', 'endereco', 'telefone', 'website', 'instagram', 'whatsapp'];
    const csvRows = [headers.join(',')];

    for (const lead of leads) {
      const values = headers.map(header => {
        let val = lead[header] || '';
        // Escapar aspas e separar por vírgulas em formato padrão CSV
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
    console.log(`[\u2713] leads exportados com sucesso para CSV: ${filePath}`);
  } catch (error) {
    console.error(`[Erro] Falha ao exportar para CSV: ${error.message}`);
  }
}

module.exports = {
  exportToJson,
  exportToCsv
};
