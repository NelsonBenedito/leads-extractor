const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

/**
 * Acessa uma URL e extrai links do Instagram e WhatsApp encontrados na página.
 * Implementa validações de timeout e fallback de erro para não quebrar a aplicação principal.
 * 
 * @param {string} url - A URL do website a ser processado.
 * @returns {Promise<Object>} Objeto contendo os links do instagram e whatsapp, caso existam.
 */
async function enrichWithSocialLinks(url) {
  const result = {
    instagram: null,
    whatsapp: null
  };

  if (!url) {
    return result;
  }

  let html = null;

  try {
    // Tentativa 1: Método rápido e leve via HTTP puro (Axios)
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    html = response.data;
  } catch (error) {
    // Se falhar o método rápido (Cloudflare, bloqueios HTTP normais), ativamos o Puppeteer (Navegador real)
    console.log(`   [ScraperService] Bloqueio detectado em ${url} (${error.message}). Tentando extração avançada com Puppeteer...`);
    
    let browser = null;
    try {
      browser = await puppeteer.launch({ 
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      const page = await browser.newPage();
      
      // Disfarce extra para Puppeteer
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      html = await page.content();
    } catch (pupError) {
      console.error(`   [ScraperService] Erro até no Puppeteer para o site ${url}: ${pupError.message}`);
      return result; // Falhou completamente
    } finally {
      if (browser) await browser.close();
    }
  }

  if (!html) return result;

  try {
    const $ = cheerio.load(html);

    // Iterando por todas as tags <a>
    $('a').each((i, element) => {
      const href = $(element).attr('href');

      if (!href) return; // Continue loop internamente

      const lowerHref = href.toLowerCase();

      // Busca por Instagram
      if (!result.instagram && lowerHref.includes('instagram.com')) {
        result.instagram = href;
      }

      // Busca por WhatsApp
      if (
        !result.whatsapp &&
        (lowerHref.includes('wa.me') || lowerHref.includes('api.whatsapp.com') || lowerHref.includes('web.whatsapp.com'))
      ) {
        result.whatsapp = href;
      }
    });

  } catch (parseError) {
    console.error(`   [ScraperService] Erro ao analisar HTML do site ${url}: ${parseError.message}`);
  }

  return result;
}

module.exports = {
  enrichWithSocialLinks
};
