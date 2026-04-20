const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(404).send('Not found');
    return;
  }

  try {
    // Vercel parses JSON body automatically
    const order = req.body;
    // Log the full order payload as formatted JSON
    console.log('Full order payload:', JSON.stringify(order, null, 2));
    // Extract unique payment/transaction id
    let paymentId = 'unknown';
    const orderId = order.id;
    if (order.transactions && Array.isArray(order.transactions) && order.transactions.length > 0) {
      paymentId = order.transactions[0].id ? String(order.transactions[0].id) : 'unknown';
    } else {
      // Fetch transactions from Shopify API if not present in payload
      try {
        const txResp = await fetch(
          `https://${process.env.SHOPIFY_STORE}/admin/api/2026-07/orders/${orderId}/transactions.json`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
            }
          }
        );
        const txData = await txResp.json();
        if (txData.transactions && txData.transactions.length > 0) {
          paymentId = txData.transactions[0].id ? String(txData.transactions[0].id) : 'unknown';
        } else if (order.payment_gateway_names) {
          paymentId = order.payment_gateway_names[0];
        }
      } catch (fetchErr) {
        console.error('Error fetching transactions:', fetchErr);
        if (order.payment_gateway_names) {
          paymentId = order.payment_gateway_names[0];
        }
      }
    }
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
