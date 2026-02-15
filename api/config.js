import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
    // Force no-cache on the response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'GET') {
        try {
            console.log('GET /api/config: Fetching blobs...');
            // list() can sometimes be cached, so we filter carefully
            const { blobs } = await list();
            const configBlob = blobs
                .filter(b => b.pathname === 'config.json')
                .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

            if (configBlob) {
                console.log('Found config blob:', configBlob.url);
                // Fetch with a timestamp to bust any edge caching on the blob itself
                const response = await fetch(`${configBlob.url}?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
                });
                const data = await response.json();
                return res.status(200).json(data);
            }

            console.log('No config blob found, returning defaults.');
            return res.status(200).json({
                title: 'You Got It!',
                heroText: 'You successfully identified the love of my life! ❤️',
                bodyText: 'Just like you found yourself in those photos, I found my happiness in you. Happy Valentine\'s Day! 🌹',
                letterText: 'You mean everything to me.',
                signature: '— Forever yours 💌',
                musicUrl: '',
                targetName: 'the HANDSOME ANGEL',
                senderName: 'Eric'
            });
        } catch (err) {
            console.error('Config read error:', err);
            return res.status(500).json({ error: 'Failed to read config: ' + err.message });
        }
    }

    if (req.method === 'POST') {
        const password = req.headers['x-admin-password'];
        if (!password || password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.body && req.body._ping) {
            return res.status(200).json({ success: true });
        }

        try {
            console.log('POST /api/config: Saving new config...', req.body);
            const configData = JSON.stringify(req.body);
            const blob = await put('config.json', configData, {
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false,
            });
            console.log('Config saved successfully:', blob.url);
            return res.status(200).json({ success: true, url: blob.url });
        } catch (err) {
            console.error('Config write error:', err);
            return res.status(500).json({ error: 'Failed to save config: ' + err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
