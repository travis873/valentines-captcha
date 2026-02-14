import { del } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const password = req.headers['x-admin-password'];
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Missing url' });
        }

        await del(url);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Delete failed' });
    }
}
