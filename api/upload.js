import { handleUpload } from '@vercel/blob/client';

export const config = { api: { bodyParser: false } };

export default async function handler(request, response) {
    const body = await request.json();

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Authenticate the request
                // The password is passed in the "payload" field from the client
                const { password, role } = JSON.parse(body.payload);

                if (!password || password !== process.env.ADMIN_PASSWORD) {
                    throw new Error('Unauthorized: Incorrect password');
                }

                // Restrict upload paths based on role
                // valid roles: 'target', 'distractor', 'audio'
                const allowedRoles = ['target', 'distractor', 'audio'];
                if (!allowedRoles.includes(role)) {
                    throw new Error('Invalid upload role');
                }

                return {
                    allowedContentTypes: role === 'audio' ? ['audio/mpeg', 'audio/mp3', 'audio/wav'] : ['image/jpeg', 'image/png', 'image/webp'],
                    tokenPayload: JSON.stringify({
                        role, // Pass role to onUploadCompleted if needed
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // You can log uploads here or update a database
                console.log('Blob uploaded:', blob.url);
            },
        });

        return response.status(200).json(jsonResponse);
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
}
