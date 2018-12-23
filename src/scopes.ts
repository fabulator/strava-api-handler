export const READ = 'read';
export const READ_ALL = 'read_all';
export const PROFILE_READ_ALL = 'profile:read_all';
export const PROFILE_WRITE = 'profile:write';
export const ACTIVITY_READ = 'activity:read';
export const ACTIVITY_READ_ALL = 'activity:read_all';
export const ACTIVITY_WRITE = 'activity:write';

type Scope = typeof READ |
    typeof READ_ALL |
    typeof PROFILE_READ_ALL |
    typeof PROFILE_WRITE |
    typeof ACTIVITY_READ |
    typeof ACTIVITY_READ_ALL |
    typeof ACTIVITY_WRITE;
