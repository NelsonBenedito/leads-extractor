require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { searchPlaces } = require('./services/placesService');
const { enrichWithSocialLinks } = require('./services/scraperService');
const { exportToJson, exportToCsv } = require('./utils/exportUtils');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback');
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1T5WW4ARnJXQ6e7Fr8xQ2WoW';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o Express para servir arquivos estáticos e receber JSON
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal (UI HTML)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- AUTH ROUTES ---

// Registro de Usuário
app.post('/api/register', async (req, res) => {
  try {
    console.log('[API Register] body recebido no Express:', req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, password } = body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email e senha obrigatórios. Body recebido: ' + JSON.stringify(body) });

    // Verifica se já existe
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ success: false, message: 'Usuário já existe.' });

    // Hash e Insere
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    res.json({ success: true, user: newUser.rows[0] });
  } catch (error) {
    console.error('[API Register Error]', error);
    res.status(500).json({ success: false, message: 'Erro no servidor.', error: error.message });
  }
});

// Login de Usuário
app.post('/api/login', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, password } = body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email e senha obrigatórios.' });

    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(400).json({ success: false, message: 'Credenciais inválidas.' });

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret-key-fallback', { expiresIn: '7d' });
    
    res.json({ success: true, token, user: { id: user.id, email: user.email, plan: user.plan || 'free' } });
  } catch (error) {
    console.error('[API Login Error]', error);
    res.status(500).json({ success: false, message: 'Erro no servidor.', error: error.message });
  }
});

// Obter dados do usuário logado
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, email, plan FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    res.json({ success: true, user: userRes.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor.', error: error.message });
  }
});

// Assinar Plano (Checkout via API)
app.post('/api/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];

    // Cria a sessão de Checkout do Stripe
    const sessionData = {
      payment_method_types: ['card'],
      line_items: [{
        price: STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.protocol}://${req.get('host')}/api/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/`,
      client_reference_id: req.user.id.toString(),
      customer_email: user.stripe_customer_id ? undefined : user.email,
    };

    if (user.stripe_customer_id) {
       sessionData.customer = user.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar checkout: ' + error.message });
  }
});

// Sucesso do Checkout (Callback Simplificado MVP)
app.get('/api/subscription-success', async (req, res) => {
   const sessionId = req.query.session_id;
   if (!sessionId) return res.redirect('/');
   
   try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const userId = session.client_reference_id;
      
      if (session.payment_status === 'paid' || session.status === 'complete') {
          await db.query(
             'UPDATE users SET plan = $1, stripe_customer_id = $2, stripe_subscription_id = $3 WHERE id = $4',
             ['pro', session.customer, session.subscription, userId]
          );
      }
      res.redirect('/?payment=success');
   } catch(e) {
      console.error('Success callback error', e);
      res.redirect('/?payment=error');
   }
});

// Cancelar Assinatura via API Direta
app.post('/api/subscription/cancel', authMiddleware, async (req, res) => {
  try {
     const userRes = await db.query('SELECT stripe_subscription_id FROM users WHERE id = $1', [req.user.id]);
     const user = userRes.rows[0];
     
     if (user.stripe_subscription_id) {
         try {
             await stripe.subscriptions.cancel(user.stripe_subscription_id);
         } catch(e) { console.error('Stripe Cancel Warning:', e.message); }
     }
     
     await db.query('UPDATE users SET plan = $1, stripe_subscription_id = NULL WHERE id = $2', ['free', req.user.id]);
     res.json({ success: true, plan: 'free', message: 'Assinatura cancelada com sucesso.' });
  } catch (err) {
     res.status(500).json({ success: false, message: 'Erro ao cancelar assinatura.' });
  }
});

// Listar histórico de buscas do usuário
app.get('/api/searches', authMiddleware, async (req, res) => {
  try {
    const searchesRes = await db.query(
      'SELECT id, query, created_at FROM searches WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, searches: searchesRes.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico.', error: error.message });
  }
});

// Obter os leads de uma busca específica salva no banco
app.get('/api/searches/:id/leads', authMiddleware, async (req, res) => {
  try {
    // Valida se a busca pertence ao usuário
    const searchCheck = await db.query('SELECT * FROM searches WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (searchCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Busca não encontrada ou não pertence a você.' });

    const leadsRes = await db.query('SELECT * FROM leads WHERE search_id = $1', [req.params.id]);
    res.json({ success: true, leads: leadsRes.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao carregar leads salvos.', error: error.message });
  }
});

// --- EXTRACTION ROUTE ---

// Endpoint da API para iniciar a extração de forma síncrona/esperando resposta
app.post('/api/extract', authMiddleware, async (req, res) => {
  const query = req.body.query || 'loja de iPhone e assistência técnica em São Paulo';
  
  try {
    // Buscar plano do usuário
    const userRes = await db.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
    const plan = userRes.rows.length > 0 ? userRes.rows[0].plan : 'free';

    // Se o plano for free, verificar limite de buscas (apenas 1 permitida)
    if (plan === 'free') {
        const searchesCount = await db.query('SELECT COUNT(*) FROM searches WHERE user_id = $1', [req.user.id]);
        if (parseInt(searchesCount.rows[0].count) >= 1) {
            return res.status(403).json({ 
                success: false, 
                error: 'plan_limit_reached',
                message: 'Você atingiu o limite de buscas do plano gratuito. Faça upgrade para continuar buscando!' 
            });
        }
    }

    console.log(`\n[API] Nova requisição de extração: "${query}" - Plan: ${plan}`);
    let rawPlaces = await searchPlaces(query);

    if (!rawPlaces || rawPlaces.length === 0) {
      return res.status(404).json({ success: false, message: 'Nenhuma loja encontrada para o termo fornecido.' });
    }

    // Se o plano for free, limitar a 5 resultados
    if (plan === 'free' && rawPlaces.length > 5) {
        rawPlaces = rawPlaces.slice(0, 5);
    }

    const enrichedLeads = [];

    // O ideal para produção seria um sistema de filas, mas aqui faremos no loop simples
    for (let i = 0; i < rawPlaces.length; i++) {
        const place = rawPlaces[i];
        let instagram = '';
        let whatsapp = '';

        if (place.website) {
            const socialData = await enrichWithSocialLinks(place.website);
            instagram = socialData.instagram || 'N/A';
            whatsapp = socialData.whatsapp || 'N/A';
        } else {
            instagram = 'N/A';
            whatsapp = 'N/A';
        }

        enrichedLeads.push({
            nome: place.name,
            endereco: place.address,
            telefone: place.phone,
            website: place.website || 'N/A',
            instagram,
            whatsapp
        });
    }

    // --- Integração com banco de dados ---
    const client = await db.query('BEGIN'); // Transação
    try {
        // 1. Inserir a busca na tabela searches para o usuário logado
        const insertSearchRes = await db.query(
            'INSERT INTO searches (user_id, query) VALUES ($1, $2) RETURNING id',
            [req.user.id, query]
        );
        const searchId = insertSearchRes.rows[0].id;

        // 2. Inserir os leads daquela busca
        for (const lead of enrichedLeads) {
            await db.query(
                `INSERT INTO leads (search_id, nome, endereco, telefone, website, instagram, whatsapp) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [searchId, lead.nome, lead.endereco, lead.telefone, lead.website, lead.instagram, lead.whatsapp]
            );
        }

        await db.query('COMMIT');
    } catch (dbError) {
        await db.query('ROLLBACK');
        console.error('[DB Insert Error]', dbError);
        // Mesmo com erro de banco, podemos manter a devoluçao via JSON, mas seria bom avisar
    }

    // Salva os arquivos locamente (opcional, só para manter o comportamento original)
    exportToJson(enrichedLeads, 'leads.json');
    exportToCsv(enrichedLeads, 'leads.csv');

    res.json({
        success: true,
        message: `${enrichedLeads.length} leads extraídos com sucesso.`,
        data: enrichedLeads
    });

  } catch (error) {
    console.error(`[API Error] Falha na extração: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor somente se o arquivo for executado diretamente
if (require.main === module) {
    app.listen(PORT, async () => {
        try {
            await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free'`);
            await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100)`);
            await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100)`);
            console.log('✅ Verificação de banco de dados concluída.');
        } catch (e) {
            console.error('⚠️ Aviso: Não foi possível atualizar a tabela users. Verifique o banco de dados.', e.message);
        }
        console.log(`Servidor rodando em http://localhost:${PORT}`);
        console.log(`UI Web disponível em http://localhost:${PORT}/`);
    });
}

module.exports = app; // Adicionado para exportar para o Vercel Serverless
