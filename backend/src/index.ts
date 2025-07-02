import express from 'express';
import { setupSwagger } from './swagger';
import exampleRouter from './routes/example';

const app = express();
app.use(express.json());

// Swagger 적용
setupSwagger(app);

// 라우터 적용
app.use('/example', exampleRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server on http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
});
