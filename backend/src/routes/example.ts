import express from 'express';
const router = express.Router();

/**
 * @openapi
 * /example/hello:
 *   get:
 *     summary: 헬로 메시지 응답
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/hello', (req, res) => {
  res.send('Hello Swagger!');
});

export default router;
