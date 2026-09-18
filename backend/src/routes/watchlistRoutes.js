const { Router } = require('express');
const ctrl = require('../controllers/watchlistController');

const router = Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
