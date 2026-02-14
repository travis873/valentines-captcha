import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check password
    const password = req.headers['x-admin-password'];
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Role comes from a header
    const role = req.headers['x-upload-role'] === 'target' ? 'target' : 'distractor';

    try {
        const form = formidable({});

        const [fields, files] = await form.parse(req);

        // Handle case where file might be in an array or single object
        const filePart = files.file?.[0] || files.file;

        if (!filePart) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const filename = `${role}/${Date.now()}-${filePart.originalFilename}`;

        // Read file content
        const fileContent = await fs.promises.readFile(filePart.filepath);

        const blob = await put(filename, fileContent, {
            access: 'public',
            contentType: filePart.mimetype || 'application/octet-stream',
        });

        console.log('Blob uploaded successfully:', blob.url);

        return res.status(200).json({
            url: blob.url,
            role,
            pathname: blob.pathname,
        });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
}

