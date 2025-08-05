const waitingUsers = new Map(); // userId => commandName

module.exports = {
  set(userId, commandName = true) {
    waitingUsers.set(userId, commandName);
  },

  clear(userId) {
    waitingUsers.delete(userId);
  },

  isWaiting(userId) {
    return waitingUsers.has(userId);
  },

  getCommand(userId) {
    return waitingUsers.get(userId) || null;
  }
};
