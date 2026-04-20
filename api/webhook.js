const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(404).send('Not found');
    return;
  }

  try {
    // Vercel parses JSON body automatically
    const order = req.body;
    console.log('Order payload:', order);
    const paymentId = order.payment_gateway_names ? order.payment_gateway_names[0] : 'unknown';
    const orderId = order.id;
    console.log('Order ID:', orderId, 'Payment ID:', paymentId);

    const metafieldPayload = {
      metafield: {
        namespace: 'custom',
        key: 'paymentid',
        value: paymentId,
        type: 'single_line_text_field'
      }
    };

    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2026-07/orders/${orderId}/metafields.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
        },
        body: JSON.stringify(metafieldPayload)
      }
    );

    const respText = await response.text();
    console.log('Shopify response:', response.status, respText);
    if (!response.ok) {
      throw new Error('Failed to save metafield: ' + respText);
    }

    res.status(200).send('Metafield saved');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error: ' + err.message);
  }
};
