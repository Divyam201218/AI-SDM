const express = require('express');
const cors = require('cors');
require('dotenv').config();

const function1 = require('./functions/lp');
const function2 = require('./functions/rpc');
const function3 = require('./functions/l');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'https://sdm-connect-2.netlify.app' }));

// Routes
app.post('/generate-lesson', function1);
app.post('/rpc', function2);
app.post('/generate-lesson2', function3);

app.get('/health-check', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
