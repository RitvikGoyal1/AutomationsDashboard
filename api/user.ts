import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveOrUpdateUser } from '../src/server/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, displayName } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    await saveOrUpdateUser(email, displayName || null);
    res.json({ success: true });
  } catch (error) {
    console.error('Save user error:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
}
