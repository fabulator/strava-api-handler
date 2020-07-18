import CookieApi from 'cookie-api-handler';
import { DefaultApiException, DefaultResponseProcessor } from 'rest-api-handler';
import { Privacy } from './Privacy';
import StravaException from './StravaException';

export default class WebApi extends CookieApi<any> {
    protected session?: string;

    public constructor(session?: string) {
        super('https://www.strava.com', [new DefaultResponseProcessor(DefaultApiException)], {
            'Content-Type': 'application/x-www-form-urlencoded',
        });
        if (session) {
            this.addCookies({ _strava4_session: session });
        }
    }

    public setSession(session?: string) {
        this.session = session;
    }

    public getSession() {
        return this.session;
    }

    public async getCsfrToken(path: string): Promise<string> {
        const { data } = await this.get(path);
        const token = /csrf-token" content="(([A-Za-z]|\+|\d|=|\/)*)/g.exec(data);
        if (!token) {
            throw new StravaException('CSFR token was not found');
        }
        return token[1];
    }

    public async login(email: string, password: string) {
        const token = await this.getCsfrToken('login');
        try {
            await this.request('session', 'POST', {
                body: CookieApi.convertData(
                    {
                        utf8: '✓',
                        authenticity_token: token,
                        plan: '',
                        email,
                        password,
                    },
                    CookieApi.FORMATS.URL_ENCODED,
                ),
                redirect: 'manual',
            });
            // eslint-disable-next-line no-empty
        } catch {}
        const cookies = this.getCookies();
        this.setSession(cookies ? cookies._strava4_session : undefined);
    }

    public async setPrivacy(id: number, privacy: Privacy) {
        const token = await this.getCsfrToken(`activities/${id}/edit`);

        await this.request(`activities/${id}`, 'POST', {
            body: CookieApi.convertData(
                {
                    'utf8': '✓',
                    '_method': 'patch',
                    'authenticity_token': token,
                    'activity[visibility]': privacy,
                    'commit': 'Save',
                },
                CookieApi.FORMATS.URL_ENCODED,
            ),
            redirect: 'manual',
        });
    }
}
