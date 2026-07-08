require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/trainers',  require('./routes/trainerRoutes'));
app.use('/api/students',  require('./routes/studentRoutes'));
app.use('/api/workouts',  require('./routes/workoutRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/insights',  require('./routes/insightRoutes'));
app.use('/api/progress',  require('./routes/progressRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'index.html')));

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT)));
