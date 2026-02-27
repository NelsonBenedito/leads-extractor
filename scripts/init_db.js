require('dotenv').config();
const db = require('../src/config/db');

async function initDB() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      plan VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSearchesTable = `
    CREATE TABLE IF NOT EXISTS searches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      query VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createLeadsTable = `
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      search_id INTEGER REFERENCES searches(id) ON DELETE CASCADE,
      nome VARCHAR(255),
      endereco TEXT,
      telefone VARCHAR(100),
      website TEXT,
      instagram TEXT,
      whatsapp VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('🔄 Inicializando banco de dados...');
    await db.query(createUsersTable);
    console.log('✅ Tabela users criada.');
    
    await db.query(createSearchesTable);
    console.log('✅ Tabela searches criada.');
    
    await db.query(createLeadsTable);
    console.log('✅ Tabela leads criada.');
    
    console.log('🚀 Banco de dados configurado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error);
    process.exit(1);
  }
}

initDB();
