const Agenda = require('agenda');
const mongoose = require('mongoose');

// Create Agenda instance - will be initialized after MongoDB connection
let agenda = null;

/**
 * Initialize Agenda with the existing MongoDB connection
 * Must be called after mongoose is connected
 */
const initializeAgenda = async () => {
  if (agenda) {
    console.log('Agenda already initialized');
    return agenda;
  }

  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB must be connected before initializing Agenda');
  }

  agenda = new Agenda({
    mongo: mongoose.connection.db,
    collection: 'agendaJobs',
    processEvery: '30 seconds',
    maxConcurrency: 5,
  });

  // Load job definitions
  require('./definitions/sessionGeneration')(agenda);
  require('./definitions/sessionReminder')(agenda);

  // Graceful shutdown handlers
  const gracefulShutdown = async () => {
    console.log('Stopping Agenda...');
    await agenda.stop();
    console.log('Agenda stopped gracefully');
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return agenda;
};

/**
 * Get the Agenda instance
 * @returns {Agenda|null}
 */
const getAgenda = () => agenda;

module.exports = {
  initializeAgenda,
  getAgenda,
};
