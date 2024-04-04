const express = require('express'),
  router = express.Router();

router.get('/turn/$TL/$BR.png', async (req, res) => {
  const { TL, BR } = req.params;

  return res.status(200).json('HELLO WORLD');
});

module.exports = router;
