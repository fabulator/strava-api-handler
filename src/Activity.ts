import { Workout, WorkoutConstructor } from 'fitness-models';
import { DateTime, Duration } from 'luxon';
import { unit } from 'mathjs';
import { ApiActivity } from './types/api/Activity';

interface Constructor<Id, ApiSource> extends WorkoutConstructor {
    description?: string;
    gearId?: string;
    id: Id;
    source: ApiSource;
    typeId: string;
}

export default class Activity<Id extends number | undefined = any, ApiSource extends ApiActivity | undefined = any> extends Workout {
    protected typeId: string;

    protected id: Id;

    protected source: ApiSource;

    protected description?: string;

    protected gearId?: string;

    public constructor(options: Constructor<Id, ApiSource>) {
        super(options);
        this.typeId = options.typeId;
        this.id = options.id;
        this.source = options.source;
        this.description = options.description;
        this.gearId = options.gearId;
    }

    public static getFromApi(activity: ApiActivity): Activity<number, ApiActivity> {
        const { commute, gear_id, distance, start_date, timezone, id, elapsed_time, type, calories, name } = activity;

        return new Activity({
            start: DateTime.fromISO(start_date, {
                zone: timezone.split(' ')[1],
            }),
            id,
            duration: Duration.fromObject({
                seconds: elapsed_time,
            }),
            typeId: type,
            calories,
            distance: distance != null ? unit(distance, 'm') : undefined,
            title: name,
            source: activity,
            isCommute: commute,
            gearId: gear_id,
        });
    }

    protected clone(extension: Partial<Constructor<number | undefined, ApiSource>>): this {
        return new Activity({
            ...this.toObject(),
            ...extension,
        }) as this;
    }

    public toObject(): Constructor<Id, ApiSource> {
        return {
            ...super.toObject(),
            typeId: this.typeId,
            id: this.id,
            source: this.source,
            description: this.description,
            gearId: this.gearId,
        };
    }

    public getId() {
        return this.id;
    }

    public getTypeName() {
        return this.typeId;
    }

    public setId(id: number): Activity<number, ApiSource>;

    public setId(id: undefined): Activity<undefined, ApiSource>;

    public setId(id: undefined | number): Activity<number | undefined, ApiSource> {
        return this.clone({ id });
    }

    public getSource() {
        return this.source;
    }

    public getDescription() {
        return this.description;
    }

    public getGearId() {
        return this.gearId;
    }

    public setGearId(gearId?: string) {
        return this.clone({ gearId });
    }

    public toApiObject() {
        const distance = this.getDistance();

        return {
            type: this.getTypeId(),
            start_date_local: this.getStart().toISO(),
            elapsed_time: this.getDuration().as('seconds'),
            commute: this.isCommute ? 1 : 0,
            gear_id: this.getGearId() || 'none',
            ...(this.getTitle() ? { name: this.getTitle() } : {}),
            ...(distance != null ? { distance: distance.toNumber('m') } : {}),
            ...(this.getDescription() != null ? { description: this.getDescription() } : {}),
        };
    }
}
