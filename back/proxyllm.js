const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    //console.log(req.body);
    const response = await axios.post('http://127.0.0.1:4891/v1/chat/completions', req.body);
    console.log('Réponse GPT4All :', response.data); // pour voir ce qui revient
    res.json(response.data);
  } catch (error) {
    console.error('Erreur côté proxy :', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy lancé sur http://localhost:${port}`);
});
