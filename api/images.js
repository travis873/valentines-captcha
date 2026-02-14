import { list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { blobs } = await list();

        const targets = [];
        const distractors = [];

        for (const blob of blobs) {
            // config.json is not an image
            if (blob.pathname === 'config.json') continue;

            const entry = { url: blob.url, pathname: blob.pathname };

            if (blob.pathname.startsWith('target/')) {
                targets.push(entry);
            } else {
                distractors.push(entry);
            }
        }

        return res.status(200).json({ targets, distractors });
    } catch (err) {
        console.error('List error:', err);
        return res.status(500).json({ error: 'Failed to list images' });
    }
}
