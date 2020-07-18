import { DateTime } from 'luxon';

export interface ActivityFilters {
    after?: number | DateTime;
    before?: number | DateTime;
    page?: number;
    per_page?: number;
}
