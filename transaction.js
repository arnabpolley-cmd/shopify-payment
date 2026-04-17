// Simple Node.js webhook handler for Shopify order payment
const http = require('http');
const fetch = require('node-fetch');

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
	if (req.method === 'POST' && req.url === '/webhook') {
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});
		req.on('end', async () => {
			try {
				const order = JSON.parse(body);
				// Extract payment info (customize as needed)
				const paymentId = order.payment_gateway_names ? order.payment_gateway_names[0] : 'unknown';
				const orderId = order.id;

				// Save to metafield
				const metafieldPayload = {
					metafield: {
						namespace: 'custom',
						key: 'paymentid',
						value: paymentId,
						type: 'single_line_text_field'
					}
				};

				const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/orders/${orderId}/metafields.json`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
					},
					body: JSON.stringify(metafieldPayload)
				});

				if (!response.ok) {
					throw new Error('Failed to save metafield');
				}

				res.writeHead(200);
				res.end('Metafield saved');
			} catch (err) {
				res.writeHead(500);
				res.end('Error: ' + err.message);
			}
		});
	} else {
		res.writeHead(404);
		res.end('Not found');
	}
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
