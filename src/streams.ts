export const TIME = 'time';
export const DISTANCE = 'distance';
export const LATNG = 'latlng';
export const ALTITUDE = 'altitude';
export const VELOCITY_SMOOTH = 'velocity_smooth';
export const HEARTRATE = 'heartrate';
export const CADENCE = 'cadence';
export const WATTS = 'watts';
export const TEMP = 'temp';
export const MOVING = 'moving';
export const GRADE_SMOOTH = 'grade_smooth';

export type Stream = typeof TIME |
    typeof DISTANCE |
    typeof LATNG |
    typeof ALTITUDE |
    typeof VELOCITY_SMOOTH |
    typeof HEARTRATE |
    typeof CADENCE |
    typeof WATTS |
    typeof TEMP |
    typeof MOVING |
    typeof GRADE_SMOOTH;
