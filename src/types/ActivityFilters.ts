import { DateTime } from 'luxon';

export type ActivityFilters = {
    before?: number | DateTime,
    after?: number | DateTime,
    page?: number,
    per_page?: number,
};
