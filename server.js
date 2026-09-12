const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ১. পেজ কানেক্ট ও সাবস্ক্রাইব করার API
app.post('/api/connect-page', async (req, res) => {
  const { page_id, page_access_token, page_name, system_prompt, client_email } = req.body;

  try {
    // ফেসবুক গ্রাফ এপিআই দিয়ে পেজ সাবস্ক্রাইব করানো
    const subscribeUrl = `https://graph.facebook.com/v19.0/${page_id}/subscribed_apps`;
    await axios.post(subscribeUrl, null, {
      params: {
        access_token: page_access_token,
        subscribed_fields: 'messages,messaging_postbacks'
      }
    });

    // n8n Webhook এ ডাটা পাঠানোর কোড (আপনার n8n এর Webhook URL এখানে বসাবেন)
    const n8nWebhookUrl = 'https://n8n-production-bc1a4.up.railway.app/webhook/facebook-onboarding'; 
    await axios.post(n8nWebhookUrl, {
      page_id,
      page_name,
      page_access_token,
      system_prompt,
      client_email: client_email || 'N/A',
      status: 'active' // বাই ডিফল্ট স্ট্যাটাস active থাকবে
    });

    console.log(`Page ${page_name} subscribed and saved to Google Sheet via n8n!`);

    res.status(200).json({ success: true, message: "Page connected and subscribed successfully!" });
  } catch (error) {
    console.error('Subscription Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Failed to subscribe page to Meta app." });
  }
});

// ২. ক্লায়েন্টের অটোমেশন ON/OFF করার API
app.post('/api/toggle-automation', async (req, res) => {
  const { page_id, status } = req.body; 

  try {
    console.log(`Automation for Page ID ${page_id} is now ${status}`);
    
    res.status(200).json({ success: true, message: `Automation successfully ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update automation status." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});