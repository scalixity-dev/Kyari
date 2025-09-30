export const APP_CONSTANTS = {
  ROLES: {
    ADMIN: 'ADMIN',
    VENDOR: 'VENDOR',
    ACCOUNTS: 'ACCOUNTS',
    OPS: 'OPS',
  } as const,
  
  USER_STATUS: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
  } as const,
  
  PERMISSIONS: {
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    
    VENDOR_APPROVE: 'vendor:approve',
    VENDOR_SUSPEND: 'vendor:suspend',
    
    AUDIT_READ: 'audit:read',
  } as const,
  
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  } as const,
  
  AUDIT_ACTIONS: {
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_REGISTER: 'user:register',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    VENDOR_APPROVE: 'vendor:approve',
    VENDOR_SUSPEND: 'vendor:suspend',
    TOKEN_REFRESH: 'token:refresh',
  } as const,
} as const;

export type AppRole = keyof typeof APP_CONSTANTS.ROLES;
export type AppPermission = typeof APP_CONSTANTS.PERMISSIONS[keyof typeof APP_CONSTANTS.PERMISSIONS];
export type AuditAction = typeof APP_CONSTANTS.AUDIT_ACTIONS[keyof typeof APP_CONSTANTS.AUDIT_ACTIONS];