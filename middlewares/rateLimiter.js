const rateLimit = require('express-rate-limit');


const rateLimiter = rateLimit({
  windowMs: 1000,
  max: 3,
  message: 'You have exceeded the 3 requests in 1 sec limit!', 
  headers: true
});

module.exports = rateLimiter;