import { DateTime } from 'luxon';

export interface ActivityFilters {
    before?: number | DateTime,
    after?: number | DateTime,
    page?: number,
    per_page?: number,
}
