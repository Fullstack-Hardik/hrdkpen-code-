const express = require('express');
const router = express.Router();

/**
 * POST /api/ai/chat
 * Body: { apiKey: string, messages: { role, content }[] }
 * Proxies to Gemini API.
 * Returns: { content: string }
 */
router.post('/chat', async (req, res) => {
  const { apiKey, messages } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Missing Gemini API Key' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages' });
  }
  
  try {
    // Convert OpenAI format to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const geminiMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiMessages,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
        }
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const safeMsg = err?.error?.message || `Gemini error: ${response.status}`;
      return res.status(response.status).json({ error: safeMsg });
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
    return res.json({ content });
  } catch (err) {
    console.error('[ai/chat] error:', err.message);
    return res.status(503).json({ error: 'AI service unavailable' });
  }
});

module.exports = router;
