function getSessionUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

function requireAuth(req, res, next) {
  if (getSessionUser(req)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

function requireRole(...roles) {
  const allowedRoles = new Set(roles.map((role) => String(role).toLowerCase()));

  return (req, res, next) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const role = String(user.role || '').toLowerCase();
    if (!allowedRoles.has(role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    return next();
  };
}

function isOwnerOrAdmin(req, ownerId) {
  const user = getSessionUser(req);
  if (!user) {
    return false;
  }

  const isAdmin = String(user.role || '').toLowerCase() === 'admin';
  if (isAdmin) {
    return true;
  }

  if (!ownerId) {
    return false;
  }

  return ownerId.toString() === user.id.toString();
}

module.exports = {
  requireAuth,
  requireRole,
  getSessionUser,
  isOwnerOrAdmin
};
