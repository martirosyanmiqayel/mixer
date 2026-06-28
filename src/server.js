// Локальный запуск (npm start). На Vercel используется api/index.js.
import app from './app.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MixerGrief Forms: http://localhost:${PORT}`);
});
