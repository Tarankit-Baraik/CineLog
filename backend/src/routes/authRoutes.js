const { Router } = require('express');
const { register, login, me, googleLogin } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authMiddleware, me);

module.exports = router;
