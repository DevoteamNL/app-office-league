import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
//import {Headers, Http, RequestOptions, Response} from '@angular/common/http';
import {Observable, empty} from 'rxjs';
import {catchError, } from 'rxjs/operators'
import {Team} from '../../graphql/schemas/Team';
import {Game} from '../../graphql/schemas/Game';
import {League} from '../../graphql/schemas/League';
import {Player} from '../../graphql/schemas/Player';
import {CryptoService} from './crypto.service';
import {XPCONFIG} from '../app.config';
import {AuthService} from './auth.service';

@Injectable()
export class GraphQLService {

    private url = XPCONFIG.graphQlUrl;
    game: Game;
    team: Team;
    league: League;
    player: Player;

    constructor(private http: HttpClient, private cryptoService: CryptoService, private authService: AuthService) {
    }
    post(query: string, variables?: {[key: string]: any}, successCallback?: (data) => void, failureCallback?: (error) => void): Promise<any> {
        let body = JSON.stringify({query: query, variables: variables});
        let hash = this.cryptoService.sha1(body);
        let url = this.url; //+ '?etag=' + hash;

        /* new http */

        let headers = new HttpHeaders();
        headers.append('Content-Type', 'application/json; charset=utf-8');

        let networkPromise = this.http.get(
            url,
            {
                headers,
                observe: "body",
                params: { etag: hash }
            }
        )
        .pipe(
            catchError(this.handleError),
            this.extractData,
        )
        .toPromise();

        if (typeof CacheStorage !== "undefined" && !!successCallback) {
            return this.getCachePromise(url, networkPromise, successCallback, failureCallback);
        }

        if (!!successCallback) {
            return networkPromise.then(successCallback);
        }

        return networkPromise;
    }

    private getCachePromise(url: string, fallbackPromise: Promise<any>, responseCallback: (data) => void, failureCallback?: (error) => void): Promise<any> {
        let responseReceived = false;
        let cacheFound = false;

        fallbackPromise
            .then(data => { responseReceived = true; return data; })
            .then(responseCallback)
            .catch(error => {
                if (!cacheFound) {
                    if (!!failureCallback) {
                        failureCallback(error);
                    }
                }
            });

        return caches.match(url)
            .then(res => this.extractCachedData(res))
            .then(json => {
                // don't overwrite newer network data
                    if (json && !responseReceived) {
                        cacheFound = true;
                        responseCallback(json.data);
                    }
                })
            // fall back to network if we didn't get cached data
            .catch(() => fallbackPromise);
    }

    private extractCachedData(res: Response) {
        return res.json();
    }

    private extractData(res) { //TODO need to do this with the observable?
        let json = res.json();
        if (json.errors && json.errors.length > 0) {
            throw json.errors;
        }
        return json.data || {};
    }

    private handleError(error: Response | any) {
        if (!navigator.onLine) {   
            console.log("Empty response return?");
            return empty();
        }

        if (error.status === 401) {
            if (this.authService.isAuthenticated()) {
                this.authService.login();
            }
            return Observable.throw('Not authenticated');
        }

        let errMsg: String;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body["error"] || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else if (Array.isArray(error)) {
            errMsg = error[0].message ? error[0].message : JSON.stringify(error);
            return Observable.throw(error);
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Observable.throw('Failed to retrieve data');
    }

}
