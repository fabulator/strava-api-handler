import { Workout, TYPES } from 'fitness-models';
import { DateTime, Duration } from 'luxon';
import { unit } from 'mathjs';
import { Activity as ApiActivity } from './types/api/Activity';
import * as ACTIVITY_TYPES from './activity-types';

interface Constructor<Id, ApiSource> extends TYPES.WorkoutConstructor {
    typeId: string,
    id: Id,
    source: ApiSource,
    description?: string,
}

export default class Activity<Id extends (number | undefined) = any, ApiSource extends (ApiActivity | undefined) = any> extends Workout {
    protected typeId: string;

    protected id: Id;

    protected source: ApiSource;

    protected description?: string;

    public constructor(options: Constructor<Id, ApiSource>) {
        super(options);
        this.typeId = options.typeId;
        this.id = options.id;
        this.source = options.source;
        this.description = options.description;
    }

    public static ACTIVITY_TYPES = ACTIVITY_TYPES;

    public static getFromApi(activity: ApiActivity): Activity<number, ApiActivity> {
        const { distance } = activity;

        return new Activity({
            start: DateTime.fromISO(activity.start_date, {
                zone: activity.timezone.split(' ')[1],
            }),
            id: activity.id,
            duration: Duration.fromObject({
                seconds: activity.elapsed_time,
            }),
            typeId: activity.type,
            calories: activity.calories,
            distance: distance != null ? unit(distance, 'm') : undefined,
            title: activity.name,
            source: activity,
            isCommute: activity.commute,
        });
    }

    protected clone(extension: Partial<Constructor<number | undefined, ApiSource>>): any {
        // @ts-ignore
        return new Activity({
            ...this.toObject(),
            ...extension,
        });
    }

    public getId(): number | undefined {
        return this.id;
    }

    public getTypeName() {
        return this.typeId;
    }

    public setId(id: number): Activity<number, ApiActivity>

    public setId(id: undefined): Activity<undefined, ApiActivity>

    public setId(id: number | undefined) {
        // @ts-ignore
        return this.clone({ id });
    }

    public getSource() {
        return this.source;
    }

    public getDescription() {
        return this.description;
    }

    public toApiObject() {
        const distance = this.getDistance();

        return {
            type: this.getTypeId(),
            start_date_local: this.getStart().toISO(),
            elapsed_time: this.getDuration().as('seconds'),
            commute: this.isCommute ? 1 : 0,
            ...(this.getTitle() ? { name: this.getTitle() } : {}),
            ...(distance != null ? { distance: distance.toNumber('m') } : {}),
            ...(this.getDescription() != null ? { description: this.getDescription() } : {}),
        };
    }
}
