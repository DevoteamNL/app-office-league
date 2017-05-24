import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {GraphQLService} from '../../services/graphql.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Player} from '../../../graphql/schemas/Player';
import {XPCONFIG} from '../../app.config';
import {League} from '../../../graphql/schemas/League';
import {GamePlayComponent} from '../game-play/game-play.component';
import {PageTitleService} from '../../services/page-title.service';
import {NewGamePlayerComponent} from '../new-game-player/new-game-player.component';
import {GameSelection} from '../GameSelection';
import {RankingService} from '../../services/ranking.service';

@Component({
    selector: 'new-game',
    templateUrl: 'new-game.component.html',
    styleUrls: ['new-game.component.less']
})
export class NewGameComponent implements OnInit {

    leagueId: string;

    bluePlayer1: Player;
    bluePlayer2: Player;
    redPlayer1: Player;
    redPlayer2: Player;
    leaguePlayerIds: string[] = [];
    selectedPlayerIds: string[] = [];

    @ViewChildren(NewGamePlayerComponent)
        playerCmps: QueryList<NewGamePlayerComponent>;

    league: League;
    title: string;
    expectedScoreRed: string;
    expectedScoreBlue: string;
    playerSelectionReady: boolean;
    shuffleDisabled: boolean;
    shuffleInProgress: boolean;
    teamMode: boolean = false;
    shuffleCount: number = 0;
    private playerRatings: { [playerId: string]: number } = {};

    constructor(private graphQLService: GraphQLService, private route: ActivatedRoute,
                private pageTitleService: PageTitleService, private router: Router, private gameSelection: GameSelection,
                private rankingService: RankingService) {
    }

    ngOnInit(): void {
        this.leagueId = this.route.snapshot.params['leagueId'];

        if (!this.leagueId) {
            return;
        }

        let playerId = XPCONFIG.user && XPCONFIG.user.playerId;
        if (playerId) {
            this.graphQLService.post(
                NewGameComponent.getPlayerLeagueQuery,
                {playerId: playerId, leagueId: this.leagueId},
                    data => this.handlePlayerLeagueQueryResponse(data)
            );
        }
    }

    private handlePlayerLeagueQueryResponse(data) {
        this.bluePlayer1 = Player.fromJson(data.player);
        this.league = League.fromJson(data.league);
        this.title = this.league.name;
        this.leaguePlayerIds = this.league.leaguePlayers.map((leaguePlayer) => {
            if (!leaguePlayer.player) {
                return null;
            }
            this.playerRatings[leaguePlayer.player.id] = leaguePlayer.rating;
            return leaguePlayer.player.id;
        }).filter((id) => !!id);

        this.pageTitleService.setTitle(this.league.name);
        this.updatePlayerSelectionState();
    }

    onPlayClicked() {
        if (!this.playerSelectionReady || (this.shuffleCount > 0)) {
            return;
        }
        this.gameSelection.bluePlayer1 = this.bluePlayer1;
        this.gameSelection.bluePlayer2 = this.bluePlayer2;
        this.gameSelection.redPlayer1 = this.redPlayer1;
        this.gameSelection.redPlayer2 = this.redPlayer2;
        this.gameSelection.league = this.league;

        this.createGame().then((gameId) => {
            console.log('Initial game created: ' + gameId);
            this.gameSelection.gameId = gameId;
            this.router.navigate(['games', this.leagueId, 'game-play'], {replaceUrl: true, queryParams: {gameId: gameId}});
        }).catch((ex) => {
            console.log('Could not create game');
            this.gameSelection.gameId = null;
            this.router.navigate(['games', this.leagueId, 'game-play'], {replaceUrl: true});
        });
    }

    onToggleClicked() {
        this.bluePlayer2 = null;
        this.redPlayer2 = null;
        this.updatePlayerSelectionState();
        this.teamMode = !this.teamMode;
    }

    private shuffleActions: { [id: string]: { from: NewGamePlayerComponent, to: NewGamePlayerComponent, player: Player, side: string, done: boolean } };

    onShuffleClicked() {
        if (this.shuffleDisabled) {
            return;
        }
        this.shuffleInProgress = true;
        this.shuffle();
    }

    private shuffle(shuffledPlayerCount: number = 4, rollCount: number = 10) {
        let players: Player[] = [];
        if (shuffledPlayerCount > 3) {players.push(this.bluePlayer1);}
        if (shuffledPlayerCount > 2) {players.push(this.redPlayer1);}
        players.push(this.bluePlayer2);
        players.push(this.redPlayer2);

        if (shuffledPlayerCount > 3) {this.bluePlayer1 = this.randomPlayer(players);}
        if (shuffledPlayerCount > 2) {this.redPlayer1 = this.randomPlayer(players);}
        this.bluePlayer2 = this.randomPlayer(players);
        this.redPlayer2 = this.randomPlayer(players);
        this.updatePlayerSelectionState();

        if (rollCount > 1) {
            setTimeout(() => this.shuffle(shuffledPlayerCount, rollCount - 1), 150)
        } else if (shuffledPlayerCount > 2) {
            setTimeout(() => this.shuffle(shuffledPlayerCount - 1, 10), 150);
        } else {
            this.shuffleInProgress = false;
        }
    }

    private randomPlayer(players: Player[]) {
        return players.splice(Math.floor(Math.random() * players.length), 1)[0];
    }

    onPlayerSelected(position: 'blue1' | 'blue2' | 'red1' | 'red2', p: Player) {
        if (p) {
            switch (position) {
            case 'blue1':
                this.bluePlayer1 = p;
                break;
            case 'blue2':
                this.bluePlayer2 = p;
                break;
            case 'red1':
                this.redPlayer1 = p;
                break;
            case 'red2':
                this.redPlayer2 = p;
                break;
            }
            this.updatePlayerSelectionState();
        }
    }

    private createGame(): Promise<string> {
        let players = [this.bluePlayer1, this.redPlayer1, this.bluePlayer2, this.redPlayer2].filter((p) => !!p).map((p) => {
            return {"playerId": p.id, "side": ( p === this.bluePlayer1 || p === this.bluePlayer2 ? 'blue' : 'red')};
        });
        let createGameParams = {
            points: [],
            players: players,
            leagueId: this.leagueId
        };
        createGameParams['leagueId'] = this.league.id;
        return this.graphQLService.post(
            GamePlayComponent.createGameMutation,
            createGameParams
        ).then(
                data => {
                console.log('Game created', data);
                return data.createGame.id;
            });
    }

    private updatePlayerSelectionState() {
        let singlesGameReady = !!(this.bluePlayer1 && this.redPlayer1 && !this.bluePlayer2 && !this.redPlayer2);
        let doublesGameReady = !!(this.bluePlayer1 && this.redPlayer1 && this.bluePlayer2 && this.redPlayer2);
        this.playerSelectionReady = singlesGameReady || doublesGameReady;
        this.shuffleDisabled = !doublesGameReady || (this.shuffleCount > 0);

        this.selectedPlayerIds = [this.bluePlayer1, this.bluePlayer2, this.redPlayer1, this.redPlayer2].filter((p) => !!p).map(
            (player) => player.id);
        this.updateExpectedScore();
    }

    private updateExpectedScore() {
        if (this.playerSelectionReady) {
            let bluePlayer1Rating = this.getPlayerRating(this.bluePlayer1 && this.bluePlayer1.id);
            let bluePlayer2Rating = this.getPlayerRating(this.bluePlayer2 && this.bluePlayer2.id);
            let redPlayer1Rating = this.getPlayerRating(this.redPlayer1 && this.redPlayer1.id);
            let redPlayer2Rating = this.getPlayerRating(this.redPlayer2 && this.redPlayer2.id);
            let expectedScore = this.rankingService.getExpectedScore([bluePlayer1Rating, bluePlayer2Rating],
                [redPlayer1Rating, redPlayer2Rating]);

            this.expectedScoreBlue = `${expectedScore[0]}`;
            this.expectedScoreRed = `${expectedScore[1]}`;
        } else {
            this.expectedScoreRed = '';
            this.expectedScoreBlue = '';
        }
    }

    private getPlayerRating(playerId: string): number {
        if (!playerId) {
            return undefined;
        }
        return this.playerRatings[playerId] || this.rankingService.defaultRating();
    }

    static readonly getPlayerLeagueQuery = `query ($playerId: ID!, $leagueId: ID!) {
        player(id: $playerId) {
            id
            name
            imageUrl
            description
            nationality
            handedness
        }
        
        league(id: $leagueId) {
            id
            name
            imageUrl
            description
            leaguePlayers(first:-1, sort:"_timestamp DESC") {
                rating
                player {
                    id
                    imageUrl
                }
            }
        }
    }`;

}
