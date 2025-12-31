import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function enablePgVector() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Enable pgvector extension
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ pgvector extension enabled successfully!');

        // Verify installation
        const result = await client.query(
            "SELECT * FROM pg_extension WHERE extname = 'vector';"
        );

        if (result.rows.length > 0) {
            console.log('✅ Verified: pgvector is installed');
            console.log('Extension details:', result.rows[0]);
        } else {
            console.log('⚠️  Warning: pgvector extension not found after installation');
        }

    } catch (error) {
        console.error('❌ Error enabling pgvector:', error);
        throw error;
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

enablePgVector()
    .then(() => {
        console.log('\n✅ Setup complete! You can now run: npx prisma migrate reset --force');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    });
