import crypto from 'crypto';

/**
 * Machine-to-machine guard for the internal cron-sweep endpoint — not a user
 * JWT, just a shared secret compared in constant time. An external scheduler
 * (GitHub Actions cron, a hosted cron service, a platform cron add-on) hits
 * this endpoint since in-process node-cron can't be trusted to survive on an
 * unconfirmed hosting target.
 */
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
