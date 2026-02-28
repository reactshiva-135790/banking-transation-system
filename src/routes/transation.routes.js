const express = require('express');
const router = express.Router();

const {authMiddleware, } = require('../middleware/auth.middleware');
const { createTransaction, createInitialFundTransaction } = require('../controllers/transation.controllers');

router.post('/transaction', authMiddleware, createTransaction);

router.post('/system/intial-fund', authSystemUserMiddleware, createInitialFundTransaction);

module.exports = router;