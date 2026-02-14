import { put, list } from '@vercel/blob';

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

    try {
        // Parse multipart manually using raw body
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);

        // Extract boundary from content-type
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        const boundary = boundaryMatch[1];
        const parts = parseMultipart(body, boundary);

        const filePart = parts.find(p => p.filename);
        const rolePart = parts.find(p => p.name === 'role');

        if (!filePart) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const role = rolePart ? rolePart.data.toString().trim() : 'distractor';
        const filename = `${role}/${Date.now()}-${filePart.filename}`;

        const blob = await put(filename, filePart.data, {
            access: 'public',
            contentType: filePart.contentType,
        });

        return res.status(200).json({
            url: blob.url,
            role,
            pathname: blob.pathname,
        });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Upload failed' });
    }
}

function parseMultipart(body, boundary) {
    const parts = [];
    const boundaryBuf = Buffer.from(`--${boundary}`);
    const endBuf = Buffer.from(`--${boundary}--`);

    let start = body.indexOf(boundaryBuf) + boundaryBuf.length;

    while (start < body.length) {
        const nextBoundary = body.indexOf(boundaryBuf, start);
        if (nextBoundary === -1) break;

        const partData = body.slice(start, nextBoundary);
        const headerEnd = partData.indexOf('\r\n\r\n');
        if (headerEnd === -1) { start = nextBoundary + boundaryBuf.length; continue; }

        const headers = partData.slice(0, headerEnd).toString();
        let data = partData.slice(headerEnd + 4);
        // Remove trailing \r\n
        if (data.length >= 2 && data[data.length - 2] === 0x0d && data[data.length - 1] === 0x0a) {
            data = data.slice(0, -2);
        }

        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        const ctMatch = headers.match(/Content-Type:\s*(.+)/i);

        parts.push({
            name: nameMatch ? nameMatch[1] : null,
            filename: filenameMatch ? filenameMatch[1] : null,
            contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
            data,
        });

        start = nextBoundary + boundaryBuf.length;
    }

    return parts;
}
