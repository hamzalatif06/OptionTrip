import crypto from 'crypto';

export const verifyCronSecret = (req, res, next) => {
  const configured = process.env.CRON_SECRET;
  if (!configured) {
    return res.status(503).json({ success: false, message: 'CRON_SECRET is not configured' });
  }

  const provided = req.get('x-cron-secret') || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(configured);

  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!matches) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

export default { verifyCronSecret };
