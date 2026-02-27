const axios = require('axios');

/**
 * Busca estabelecimentos utilizando a nova Google Places API (Text Search).
 * Documentação: https://developers.google.com/maps/documentation/places/web-service/text-search
 * 
 * @param {string} query - O termo de busca (ex: "loja de iphone em São Paulo")
 * @returns {Promise<Array>} Lista de estabelecimentos com nome, endereço, telefone e website.
 */
async function searchPlaces(query, maxResults = 60) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('A variável de ambiente GOOGLE_PLACES_API_KEY não foi definida.');
  }

  let allPlaces = [];
  let pageToken = '';

  try {
    do {
      const requestBody = { textQuery: query };
      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      console.log(`[Google Places] Buscando página de resultados (Current count: ${allPlaces.length})...`);
      
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            // Solicitando também o nextPageToken para continuar buscando
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,nextPageToken',
            ...(process.env.REFERER_URL && { 'Referer': process.env.REFERER_URL })
          }
        }
      );

      const places = response.data.places || [];
      allPlaces = allPlaces.concat(places);
      
      pageToken = response.data.nextPageToken;

      // O Google Places requer um pequeno delay para que o nextPageToken fique válido
      if (pageToken && allPlaces.length < maxResults) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (pageToken && allPlaces.length < maxResults);

    // Mapeando e normalizando a resposta, limitando ao maxResults
    return allPlaces.slice(0, maxResults).map(place => ({
      name: place.displayName?.text || 'Sem nome',
      address: place.formattedAddress || 'Sem endereço',
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null
    }));
  } catch (error) {
    console.error(`[Erro PlacesService] Falha ao buscar lugares para a query: "${query}"`);
    if (error.response) {
      console.error(`Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

module.exports = {
  searchPlaces
};
