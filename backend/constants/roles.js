export const ROLES = {
    MASTER_ADMIN: 'MASTER_ADMIN', // Full control
    ADMIN: 'ADMIN', // Can manage managers and users
    MANAGER: 'MANAGER', // Can manage users
    USER: 'USER', // Regular user
  };
  
  export const PERMISSIONS = {
    CREATE_USER: 'CREATE_USER',
    READ_USER: 'READ_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
  };
  
  export const ROLE_PERMISSIONS = {
    [ROLES.MASTER_ADMIN]: [
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.READ_USER,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.DELETE_USER,
    ],
    [ROLES.ADMIN]: [
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.READ_USER,
      PERMISSIONS.UPDATE_USER,
    ],
    [ROLES.MANAGER]: [
      PERMISSIONS.READ_USER,
      PERMISSIONS.UPDATE_USER,
    ],
    [ROLES.USER]: [],
  };