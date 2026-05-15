import express from 'express';

const router = express.Router();

// Proxy for ipapi.co — avoids browser CORS restrictions
router.get('/ip', async (req, res) => {
  try {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    // In development the client IP is often ::1 (localhost); let ipapi auto-detect
    const url = clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1'
      ? `https://ipapi.co/${clientIp}/json/`
      : 'https://ipapi.co/json/';

    const response = await fetch(url);
    if (!response.ok) throw new Error(`ipapi responded ${response.status}`);
    const data = await response.json();
    res.json({ success: true, country_code: data.country_code || null, country_name: data.country_name || null });
  } catch {
    res.json({ success: false, country_code: null });
  }
});

export default router;
