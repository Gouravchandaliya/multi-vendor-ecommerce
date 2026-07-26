// DNS must be configured FIRST — before dotenv, mongoose, or anything that
// makes a network call. Windows blocks SRV lookups used by mongodb+srv://.
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});

connectDB();
