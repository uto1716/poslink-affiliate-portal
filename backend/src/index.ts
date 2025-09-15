import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/init';
import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import linksRoutes from './routes/links';
import reportsRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});