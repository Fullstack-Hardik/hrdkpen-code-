const express = require('express');
const router = express.Router();

const PISTON_API = 'https://emkc.org/api/v2/piston';

const LANGUAGE_MAP = {
  c:   { language: 'c',   version: '*', filename: 'main.c' },
  cpp: { language: 'cpp', version: '*', filename: 'main.cpp' },
};

/**
 * POST /api/execute
 * Body: { language: 'c' | 'cpp', code: string }
 * Proxies to Piston API — a free open-source code execution engine.
 * Returns: { stdout, stderr, exitCode }
 */
router.post('/', async (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'Missing language or code' });
  }

  const langConfig = LANGUAGE_MAP[language];
  if (!langConfig) {
    return res.status(400).json({ error: `Unsupported language: ${language}. Use: c, cpp` });
  }

  if (typeof code !== 'string' || code.length > 50_000) {
    return res.status(400).json({ error: 'Code too large (max 50KB)' });
  }

  try {
    const response = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ name: langConfig.filename, content: code }],
        stdin: '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Piston API error: ${text}` });
    }

    const data = await response.json();
    const run = data.run ?? {};
    const compile = data.compile ?? {};

    return res.json({
      stdout: run.stdout ?? '',
      stderr: (compile.stderr ?? '') + (run.stderr ?? ''),
      exitCode: run.code ?? compile.code ?? 0,
    });
  } catch (err) {
    console.error('[execute] Piston error:', err);
    return res.status(503).json({ error: 'Code execution service unavailable' });
  }
});

module.exports = router;
