const { Router } = require('express');
const { getMovie, getTrending, getTopRated } = require('../controllers/movieController');

const router = Router();

router.get('/trending', getTrending);
router.get('/top-rated', getTopRated);
router.get('/:tmdbId', getMovie);

module.exports = router;
