const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { createAccount, getUserAccounts, getAccountBalance} = require('../controllers/account.controllers');
const router = express.Router();

router.post('/create', authMiddleware, createAccount);
router.get('/my-accounts', authMiddleware, getUserAccounts);
router.get('/balance/:accountId', authMiddleware, getAccountBalance);

module.exports = router;