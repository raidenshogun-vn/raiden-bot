// fixUserMaps.js
function ensureUserMaps(user) {
  if (user) {
    if (!(user.serverModes instanceof Map)) {
      user.serverModes = new Map(Object.entries(user.serverModes || {}));
    }
    if (!(user.serverSituations instanceof Map)) {
      user.serverSituations = new Map(Object.entries(user.serverSituations || {}));
    }
  }
}

module.exports = ensureUserMaps;
