const { Router } = require('express');
const ctrl = require('../controllers/historyController');

const router = Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);

module.exports = router;
