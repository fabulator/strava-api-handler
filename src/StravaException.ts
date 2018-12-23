export default class StravaException extends Error {
    public constructor(message: string) {
        super(`Strava Error: ${message}`);
    }
}
