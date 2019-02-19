/* eslint-disable sonarjs/no-duplicate-string */
import FormData from 'form-data';
import {
    Api as ApiBase,
    DefaultApiException,
    DefaultResponseProcessor,
    ApiResponseType,
} from 'rest-api-handler';
import StravaException from './StravaException';
import Activity from './Activity';
import { Activity as ApiActivity } from './types/api/Activity';
import { ActivityFilters } from './types/ActivityFilters';
import * as STREAM from './streams';
import * as SCOPE from './scopes';

// @ts-ignore
global.FormData = FormData;

type Scope = 'read' | 'read_all' | 'profile:read_all' | 'profile:write' | 'activity:read' | 'activity:read_all' | 'activity:write';
type Prompt = 'force' | 'auto';
interface Athlete {
    id: number,
    username: string,
    resource_state: number,
    firstname: string,
    lastname: string,
    city: string,
    state: string,
    country: string,
    sex: string,
    premium: boolean,
    created_at: string,
    updated_at: string,
    badge_type_id: number,
    profile_medium: string,
    profile: string,
    friend: string | undefined,
    follower: string | undefined,
    email: string,
}

interface Token {
    access_token: string,
    token_type: string,
    athlete: Athlete,
}

interface UploadStatus {
    id: number,
    external_id: string,
    error: string | undefined,
    status: string,
    activity_id: number | undefined,
}

function base64Encode(string: string): string {
    if (typeof btoa !== 'undefined') {
        // eslint-disable-next-line no-undef
        return btoa(string);
    }

    return Buffer.from(string).toString('base64');
}

export default class Api extends ApiBase<ApiResponseType<any>> {
    protected clientId: string;

    protected secret: string;

    protected accessToken?: string;

    public constructor(clientId: string, secret: string) {
        super('https://www.strava.com', [
            new DefaultResponseProcessor(DefaultApiException),
        ], {
            'content-Type': 'application/json',
        });
        this.clientId = clientId;
        this.secret = secret;
    }

    public static STREAM = STREAM;

    public static SCOPE = SCOPE;

    public setAccessToken(token: string) {
        this.accessToken = token;
        this.setDefaultHeader('Authorization', `Bearer ${token}`);
    }

    public getAccessToken() {
        return this.accessToken;
    }

    public getLoginUrl(
        redirectUri: string,
        scope: Scope[] = ['read'],
        approvalPrompt?: Prompt,
        state?: string,
    ): string {
        const parameters = {
            client_id: this.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scope.join(','),
            ...(state ? { state } : {}),
            ...(approvalPrompt ? { approval_prompt: approvalPrompt } : {}),
        };
        return `https://www.strava.com/oauth/authorize${ApiBase.convertParametersToUrl(parameters)}`;
    }

    protected async requestToken(parameters: Record<string, string>): Promise<Token> {
        const { data } = await this.request(
            `oauth/token${ApiBase.convertParametersToUrl({
                client_id: this.clientId,
                client_secret: this.secret,
                ...parameters,
            })}`,
            'POST',
            {},
            {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${base64Encode(`${this.clientId}:${this.secret}`)}`,
            },
        );

        this.setAccessToken(data.access_token);

        return data;
    }

    public requestAccessToken(code: string): Promise<Token> {
        return this.requestToken({ code });
    }

    public refreshToken(token: string): Promise<Token> {
        return this.requestToken({ grant_type: 'refresh_token', refresh_token: token });
    }

    public async getActivity(id: number) {
        const { data } = await this.get(`api/v3/activities/${id}`);
        return Activity.getFromApi(data);
    }

    public async getStream(id: number, streams: STREAM.Stream[] = []): Promise<any[]> {
        const { data } = await this.get(`api/v3/activities/${id}/streams`, {
            keys: streams.join(','),
            key_by_type: false,
        });

        const points: any[] = [];
        Object.keys(data).forEach((item: any) => {
            data[item].data.forEach((value: any, key: any) => {
                if (!points[key]) {
                    points[key] = {};
                }
                points[key][item] = value;
            });
        });
        return points;
    }

    public async getActivities(parameters: ActivityFilters) {
        const { after, before } = parameters;
        const { data } = await this.get(`api/v3/athlete/activities/${ApiBase.convertParametersToUrl({
            ...parameters,
            ...(after ? { after: typeof after === 'number' ? after : after.valueOf() / 1000 } : {}),
            ...(before ? { before: typeof before === 'number' ? before : before.valueOf() / 1000 } : {}),
        })}`);

        return data.map((activity: ApiActivity) => {
            return Activity.getFromApi(activity);
        });
    }

    public async processActivities(
        filter: ActivityFilters = {},
        processor: (workout: Activity<number, ApiActivity>) => Promise<Activity<number, ApiActivity>>,
    ): Promise<Activity<number, ApiActivity>[]> {
        const activities = await this.getActivities(filter);

        const processorPromises = activities.map((activity: Activity<number, ApiActivity>) => {
            return processor(activity);
        });

        if (activities.length > 0) {
            const { page } = filter;
            processorPromises.push(...await this.processActivities({
                ...filter,
                page: page ? page + 1 : 2,
            }, processor));
        }

        // @ts-ignore
        return Promise.all(processorPromises);
    }

    // eslint-disable-next-line complexity
    public async uploadActivity(
        activity: Activity,
        fileContent: string,
        externalId: string | number,
        dataType = 'gpx',
    ): Promise<UploadStatus> {
        // @ts-ignore
        const body: FormData = Api.convertData({
            data_type: dataType,
            ...(activity.getTitle() != null ? { name: activity.getTitle() } : {}),
            ...(activity.getDescription() != null ? { description: activity.getDescription() } : {}),
            ...(activity.isCommute != null ? { commute: activity.isCommute ? 1 : 0 } : {}),
        }, Api.FORMATS.FORM_DATA);

        body.append('file', fileContent, {
            filename: `${externalId}.${dataType}`,
        });

        const contentType = this.getDefaultHeaders()['content-Type'];
        this.removeDefaultHeader('content-Type');

        // @ts-ignore
        const { data } = await this.request('api/v3/uploads', 'POST', { body });

        // @ts-ignore
        this.setDefaultHeader('content-Type', contentType);

        return data;
    }

    public async getUploadStatus(uploadId: number): Promise<UploadStatus> {
        const { data } = await this.get(`api/v3/uploads/${uploadId}`);

        if (data.error) {
            throw new StravaException(data.error);
        }

        return data;
    }

    public async createActivity(activity: Activity<undefined, undefined>): Promise<Activity<number, ApiActivity>> {
        const { data } = await this.post('api/v3/activities', activity.toApiObject());
        return Activity.getFromApi(data);
    }

    // eslint-disable-next-line complexity
    public async updateActivity(activity: Activity<number>): Promise<Activity> {
        const { data } = await this.put(`api/v3/activities/${activity.getId()}`, activity.toApiObject());
        return Activity.getFromApi(data);
    }
}
