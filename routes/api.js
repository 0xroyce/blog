const express = require('express');
const router = express.Router();

router.post('/collect-email', (req, res) => {
    const email = req.body.email;
    // Save the email to the database or handle it as needed
    console.log('Collected email:', email);
    res.json({ message: 'Thank you for subscribing!' });
});

module.exports = router;
