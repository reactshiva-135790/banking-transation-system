const express = require('express');
const AuthRoutes = require('./routes/auth.routes');
const AccountRoutes = require('./routes/account.routes');
const TransationRoutes = require('./routes/transation.routes');

const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', AuthRoutes);
app.use('/api/accounts', AccountRoutes);
app.use('/api', TransationRoutes);


module.exports = app;