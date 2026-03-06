import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveEmail } from '../src/server/database.js';

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
    const { emailId, userEmail, subject, sender, receivedDatetime } = req.body;
    if (!emailId || !userEmail) {
      return res.status(400).json({ error: 'emailId and userEmail are required' });
    }
    await saveEmail(emailId, userEmail, subject || '', sender || '', receivedDatetime || '');
    res.json({ success: true });
  } catch (error) {
    console.error('Save email error:', error);
    res.status(500).json({ error: 'Failed to save email' });
  }
}
