import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Basic environment check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Present' : 'Missing',
      GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY ? 'Present' : 'Missing',
      VERCEL: process.env.VERCEL || 'not set',
      PWD: process.cwd(),
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Debug info:', envCheck);

    // Test basic database connection
    let dbStatus = 'Not tested';
    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import('@neondatabase/serverless');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        await pool.query('SELECT 1');
        await pool.end();
        dbStatus = '✅ Connected successfully';
      } catch (error) {
        dbStatus = `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    res.json({
      success: true,
      message: "Debug endpoint working",
      environment: envCheck,
      database: dbStatus,
      request: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-vercel-id': req.headers['x-vercel-id']
        }
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    res.status(500).json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
