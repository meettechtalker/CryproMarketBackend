const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Endpoint
app.get('/api/crypto', async (req, res) => {
  const { coin } = req.query;

  // Check if API key is configured
  if (!process.env.CRYPTO_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Validate coin parameter
  if (!coin) {
    return res.status(400).json({ error: 'Coin parameter is required' });
  }

  try {
    // Map common names to CoinMarketCap slugs if necessary, 
    // but CoinMarketCap /v1/cryptocurrency/quotes/latest supports 'slug' or 'symbol'
    const response = await axios.get(process.env.CRYPTO_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CRYPTO_API_KEY,
      },
      params: {
        slug: coin.toLowerCase(),
      },
    });

    const data = response.data.data;

    // Get the first key from the data object
    const coinKey = Object.keys(data)[0];

    if (!coinKey) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    const coinInfo = data[coinKey];

    // Process and return only required fields
    const processedData = {
      name: coinInfo.name,
      symbol: coinInfo.symbol,
      price: coinInfo.quote.USD.price,
      change24h: coinInfo.quote.USD.percent_change_24h,
      marketCap: coinInfo.quote.USD.market_cap
    };

    res.json(processedData);

  } catch (error) {
    console.error('Error fetching crypto data:', error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data.status?.error_message || 'Error fetching data from API'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
