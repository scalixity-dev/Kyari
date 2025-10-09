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
    ORDER_CREATE: 'order:create',
    ORDER_UPDATE: 'order:update',
    ORDER_DELETE: 'order:delete',
    ASSIGNMENT_CONFIRMED: 'assignment:confirmed',
    ASSIGNMENT_PARTIAL_CONFIRMED: 'assignment:partial_confirmed',
    ASSIGNMENT_DECLINED: 'assignment:declined',
    DISPATCH_CREATED: 'dispatch:created',
    DISPATCH_PROOF_UPLOADED: 'dispatch:proof_uploaded',
    GRN_CREATED: 'grn:created',
    GRN_VERIFIED_OK: 'grn:verified_ok',
    GRN_VERIFIED_MISMATCH: 'grn:verified_mismatch',
  } as const,
} as const;

export type AppRole = keyof typeof APP_CONSTANTS.ROLES;
export type AppPermission = typeof APP_CONSTANTS.PERMISSIONS[keyof typeof APP_CONSTANTS.PERMISSIONS];
export type AuditAction = typeof APP_CONSTANTS.AUDIT_ACTIONS[keyof typeof APP_CONSTANTS.AUDIT_ACTIONS];