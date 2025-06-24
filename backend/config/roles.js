// User roles and their permission levels

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  MEMBER: 'member'
};

// Permissions for each role
const PERMISSIONS = {
  [ROLES.ADMIN]: {
    projects: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    users: ['read', 'update'],
    global: true // Can access any project/task
  },
  
  [ROLES.MANAGER]: {
    // Manager can manage assigned projects but not delete them
    projects: ['read', 'update'], // Cannot create or delete projects
    tasks: ['create', 'read', 'update', 'delete'], // Full task management within assigned projects
    users: ['read'],
    global: false // Limited to assigned projects
  },
  
  [ROLES.MEMBER]: {
    // Member can only view and update their assigned tasks
    projects: ['read'], // Read-only access to projects they're part of
    tasks: ['read', 'update'], // Can only update status of assigned tasks
    users: ['read'],
    global: false // Limited to assigned projects/tasks
  }
};

// Check if a role has a specific permission
const hasPermission = (role, resource, action) => {
  if (!PERMISSIONS[role] || !PERMISSIONS[role][resource]) {
    return false;
  }
  return PERMISSIONS[role][resource].includes(action);
};

// Check if role has global access (admin only)
const hasGlobalAccess = (role) => {
  return PERMISSIONS[role]?.global || false;
};

export {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasGlobalAccess
}; 