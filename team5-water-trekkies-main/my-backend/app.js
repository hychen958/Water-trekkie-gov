const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());



// Routes
// Routes
app.use('/api', authRoutes); // Register the authentication routes


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//custom root route, can be changes
app.get('/', (req, res) => {
  res.send('Welcome to my API!');
});


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Registered Routes:');
  app._router.stack
    .filter((layer) => layer.route)
    .forEach((layer) => console.log(layer.route.path));
});
