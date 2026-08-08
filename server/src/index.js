import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { initSocket } from './socket/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { detectarAlertas } from './services/alertas.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import profileRoutes from './routes/profile.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import tablesRoutes from './routes/tables.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import kitchenRoutes from './routes/kitchen.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import purchasesRoutes from './routes/purchases.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import clientRoutes from './routes/client.routes.js';

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'MixGustos API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/perfil', profileRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/client', clientRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

server.listen(config.port, () => {
  console.log(`MixGustos API escuchando en http://localhost:${config.port}`);
  // Deteccion periodica de alertas (vencidos, proximos a vencer, stock minimo, reposicion)
  const runAlertas = async () => {
    try {
      const creadas = await detectarAlertas();
      if (creadas.length) console.log(`[alertas] ${creadas.length} alerta(s) creada(s)`);
    } catch (e) {
      console.error('[alertas] error:', e.message);
    }
  };
  runAlertas();
  setInterval(runAlertas, 5 * 60 * 1000);
});
