const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getObject = async (req, res) => {
    try {
        const siteUrl = req.cookies['load-site'];
        if (siteUrl) {
            const targetUrl = `${siteUrl}${req.path}`;
            // Make a GET request to the target URL
            const response = await axios.get(targetUrl, {
                responseType: 'arraybuffer', // Support binary responses
                headers: {
                    ...req.headers, // Forward original request headers
                    host: new URL(siteUrl).host, // Update Host header
                },
            });


            // Remove specific <script> tags
            if (typeof response.data === 'string') {
                if (process.env.REPLACE_STRINGS) {
                    process.env.REPLACE_STRINGS.split(',').forEach((str) => {
                        response.data = response.data.replaceAll(str, '');
                    });
                }
                response.data = response.data.replaceAll(origin, `/?url=${encodeURIComponent(origin)}`);
            }

            // Set headers to match the proxied response
            Object.entries(response.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Allow embedding in an iframe
            res.setHeader('X-Frame-Options', ''); // Remove X-Frame-Options if present
            res.setHeader('Content-Security-Policy', 'frame-ancestors *');

            // Send the response data
            res.status(response.status).send(response.data);
        } else {
            res.status(400).send('Invalid load site');
        }
    } catch (error) {
        console.error('Error during proxy request:', error.message);
        res.status(500).send('Internal Server Error');
    }
}

// Endpoint to fetch and rewrite the HTML of a given site
app.get('/site', async (req, res) => {
    const { url } = req.query;
    if (req.headers['content-type'] != 'text/html') {
        getObject(req, res);
        return;
    }
    const { origin } = new URL(url);
    if (!url) return res.status(400).send('Missing URL parameter.');
    try {
        const response = await axios.get(url);
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('text/html')) {
            return res.status(400).send('URL is not an HTML page.');
        }
        let html = response.data;

        // Remove specific <script> tags
        if (typeof html === 'string') {
            if (process.env.REPLACE_STRINGS) {
                process.env.REPLACE_STRINGS.split(',').forEach((str) => {
                    html = html.replaceAll(str, '');
                });
            }
            html = html.replaceAll(origin, `/site/?url=${encodeURIComponent(origin)}`);
        }
        res.cookie('load-site', origin, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/'
        });
        // Allow embedding in an iframe
        res.set('Content-Security-Policy', "frame-ancestors *;");
        res.set('X-Frame-Options', 'ALLOWALL');
        res.send(html);
    } catch (error) {
        console.error(`Error fetching site: ${error.message}`);
        res.status(500).send('Error fetching site.');
    }
});

app.get('/*', getObject);

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
