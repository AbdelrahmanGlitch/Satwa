import dotenv from 'dotenv';
dotenv.config()
import express from 'express';
import bootstrap from './src/app.controller.js';
const app = express();
const prot = process.env.PORT || 5000;

// A bug in code that runs outside a request (an event-emitter callback, a
// timer, ...) has no Express error handler to catch it — left alone, one
// throws and takes the entire process down with it, killing every
// in-flight request along with it. Logging instead of crashing here is a
// safety net for that whole class of bug, not a substitute for fixing the
// bug itself.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

bootstrap(app,express);
app.listen(prot, () => {
  console.log(`Server is running on port ${prot}`);
})