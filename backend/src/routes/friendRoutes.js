const { Router } = require('express');
const { list, sendRequest, accept, getPending } = require('../controllers/friendController');

const router = Router();

router.get('/', list);
router.get('/pending', getPending);
router.post('/request', sendRequest);
router.post('/:id/accept', accept);

module.exports = router;
