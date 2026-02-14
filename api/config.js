import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { blobs } = await list({ prefix: 'config.json' });
            const configBlob = blobs.find(b => b.pathname === 'config.json');
            if (configBlob) {
                const response = await fetch(configBlob.url);
                const data = await response.json();
                return res.status(200).json(data);
            }
            return res.status(200).json({
                title: 'You Got It!',
                heroText: 'You successfully identified the love of my life! ❤️',
                bodyText: 'Just like you found yourself in those photos, I found my happiness in you. Happy Valentine\'s Day! 🌹',
                letterText: 'You mean everything to me.',
                signature: '— Forever yours 💌',
            });
        } catch (err) {
            console.error('Config read error:', err);
            return res.status(500).json({ error: 'Failed to read config' });
        }
    }

    if (req.method === 'POST') {
        const password = req.headers['x-admin-password'];
        if (!password || password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Handle ping/validation check without parsing/saving
        if (req.body && req.body._ping) {
            return res.status(200).json({ success: true });
        }

        try {
            const configData = JSON.stringify(req.body);
            await put('config.json', configData, {
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false,
            });
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('Config write error:', err);
            return res.status(500).json({ error: 'Failed to save config' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
