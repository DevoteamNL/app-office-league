var graphQlLib = require('/lib/officeleague/graphql');
var graphQlConnectionLib = require('/lib/graphql-connection');
var graphQlEnumsLib = require('./graphql-enums');
var graphQlUtilLib = require('./graphql-util');
var storeLib = require('/lib/office-league-store');
var authLib = require('/lib/xp/auth');

/* -----------------------------------------------------------------------
 * Interfaces
 ----------------------------------------------------------------------- */
var entityType = graphQlLib.createInterfaceType({
    name: 'Entity',
    description: 'Data entity. Contains a field id with a unique value',
    typeResolver: function() { return null;},
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID)
        }
    }
});

/* -----------------------------------------------------------------------
 * Object types
 ----------------------------------------------------------------------- */

exports.playerStatsType = graphQlLib.createObjectType({
    name: 'PlayerStats',
    description: 'Domain representation of a player stats.',
    fields: {
        gameCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var playerId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getGameCountByPlayerId(playerId));
            }
        },
        winningGameCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var playerId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getWinningGameCountByPlayerId(playerId));
            }
        },
        goalCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var playerId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getGoalCountByPlayerId(playerId));
            }
        }
    }
});

exports.playerType = graphQlLib.createObjectType({
    name: 'Player',
    description: 'Domain representation of a player. A player has a link to a user',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        userKey: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
            resolve: function (env) {
                return env.source.userKey || '';
            }
        },
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString)
        },
        fullname: {
            type: graphQlLib.GraphQLString,
            resolve: function (env) {
                var user = authLib.getUser();
                if (user && user.key === env.source.userKey) {
                    return env.source.fullname;
                } else {
                    return null;
                }
            }
        },
        email: {
            type: graphQlLib.GraphQLString,
            resolve: function (env) {
                var user = authLib.getUser();
                if (env.source.userKey && (isAdmin() || ( user && user.key === env.source.userKey))) {
                    user = authLib.getPrincipal(env.source.userKey);
                    return user && user.email;
                } else {
                    return null;
                }
            }
        },
        nationality: {
            type: graphQlLib.GraphQLString //TODO Change to enum
        },
        handedness: {
            type: graphQlEnumsLib.handednessEnumType
        },
        description: {
            type: graphQlLib.GraphQLString
        },
        imageUrl: {
            type: graphQlLib.GraphQLString
        },
        teams: {
            type: graphQlLib.list(graphQlLib.reference('Team')),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return storeLib.getTeamsByPlayerId(env.source._id, env.args.offset, env.args.first).hits;
            }
        },
        teamsConnection: {
            type: graphQlLib.reference('TeamConnection'),
            args: {
                after: graphQlLib.GraphQLString,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                var start = env.args.after ? parseInt(graphQlConnectionLib.decodeCursor(env.args.after)) + 1 : 0;
                return storeLib.getTeamsByPlayerId(env.source._id, start, env.args.first);
            }
        },
        leaguePlayers: {
            type: graphQlLib.list(graphQlLib.reference('LeaguePlayer')),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return storeLib.getLeaguePlayersByPlayerId(env.source._id, env.args.offset, env.args.first).hits;
            }
        },
        leaguePlayer: {
            type: graphQlLib.reference('LeaguePlayer'),
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                return storeLib.getLeaguePlayerByLeagueIdAndPlayerId(env.args.leagueId, env.source._id);
            }
        },
        gamePlayers: {
            type: graphQlLib.list(graphQlLib.reference('GamePlayer')),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return storeLib.getGamePlayersByPlayerId(env.source._id, env.args.offset, env.args.first).hits;
            }
        },
        stats: {
            type: exports.playerStatsType,
            resolve: function (env) {
                return env.source;
            }
        }
    }
});

exports.playerConnectionType = graphQlConnectionLib.createConnectionType(graphQlLib.getSchemaGenerator(), exports.playerType);

exports.teamStatsType = graphQlLib.createObjectType({
    name: 'TeamStats',
    description: 'Domain representation of a team stats.',
    fields: {
        gameCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var teamId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getGameCountByTeamId(teamId));
            }
        },
        winningGameCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var teamId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getWinningGameCountByTeamId(teamId));
            }
        },
        goalCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var teamId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getGoalCountByTeamId(teamId));
            }
        }
    }
});

exports.teamType = graphQlLib.createObjectType({
    name: 'Team',
    description: 'Domain representation of a team. A team is composed of two player',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString)
        },
        description: {
            type: graphQlLib.GraphQLString
        },
        imageUrl: {
            type: graphQlLib.GraphQLString
        },
        players: {
            type: graphQlLib.list(exports.playerType),
            resolve: function (env) {
                return graphQlUtilLib.toArray(env.source.playerIds).map(function (playerId) {
                    return storeLib.getPlayerById(playerId);
                });
            }
        },
        leagueTeams: {
            type: graphQlLib.list(graphQlLib.reference('LeagueTeam')),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return storeLib.getLeagueTeamsByTeamId(env.source._id, env.args.offset, env.args.first).hits;
            }
        },
        gameTeams: {
            type: graphQlLib.list(graphQlLib.reference('GameTeam')),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return storeLib.getGameTeamsByTeamId(env.source._id, env.args.offset, env.args.first).hits;
            }
        },
        stats: {
            type: exports.teamStatsType,
            resolve: function (env) {
                return env.source;
            }
        }
    }
});
exports.teamConnectionType = graphQlConnectionLib.createConnectionType(graphQlLib.getSchemaGenerator(), exports.teamType);

exports.gamePlayerType = graphQlLib.createObjectType({
    name: 'GamePlayer',
    description: 'Relation between a player and a game. ' +
                 'This relation means that a player is a part of a game. GamePlayer also contains statistics',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        time: {
            type: graphQlLib.GraphQLString
        },
        score: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.score, 0);
            }
        },
        scoreAgainst: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.scoreAgainst, 0);
            }
        },
        side: {
            type: graphQlEnumsLib.sideEnumType
        },
        position: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.position, 0);
            }
        },
        winner: {
            type: graphQlLib.GraphQLBoolean
        },
        ratingDelta: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.ratingDelta, 0);
            }
        },
        player: {
            type: exports.playerType,
            resolve: function (env) {
                return storeLib.getPlayerById(env.source.playerId);
            }
        },
        game: {
            type: graphQlLib.reference('Game'),
            resolve: function (env) {
                return storeLib.getGameById(env.source.gameId);
            }
        }
    }
});

exports.gameTeamType = graphQlLib.createObjectType({
    name: 'GameTeam',
    description: 'Relation between a team and a game. ' +
                 'This relation means that a team is a part of a game. GameTeam also contains statistics',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        time: {
            type: graphQlLib.GraphQLString
        },
        score: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.score, 0);
            }
        },
        scoreAgainst: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.scoreAgainst, 0);
            }
        },
        side: {
            type: graphQlEnumsLib.sideEnumType
        },
        winner: {
            type: graphQlLib.GraphQLBoolean
        },
        ratingDelta: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.ratingDelta, 0);
            }
        },
        team: {
            type: exports.teamType,
            resolve: function (env) {
                return storeLib.getTeamById(env.source.teamId);
            }
        },
        game: {
            type: graphQlLib.reference('Game'),
            resolve: function (env) {
                return storeLib.getGameById(env.source.gameId);
            }
        }
    }
});

exports.pointType = graphQlLib.createObjectType({
    name: 'Point',
    description: 'Domain representation of a goal/point.',
    fields: {
        time: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.time);
            }
        },
        against: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLBoolean)
        },
        player: {
            type: graphQlLib.nonNull(exports.playerType),
            resolve: function (env) {
                return storeLib.getPlayerById(env.source.playerId);
            }
        }
    }
});

exports.commentType = graphQlLib.createObjectType({
    name: 'Comment',
    description: 'Domain representation of a user comment.',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        text: {
            type: graphQlLib.GraphQLString
        },
        author: {
            type: exports.playerType,
            resolve: function (env) {
                return storeLib.getPlayerById(env.source.author);
            }
        },
        time: {
            type: graphQlLib.GraphQLString
        },
        likes: {
            type: graphQlLib.list(exports.playerType),
            resolve: function (env) {
                return graphQlUtilLib.toArray(env.source.likes).map(function (playerId) {
                    storeLib.getPlayerById(playerId)
                });
            }
        }
    }
});

exports.gameType = graphQlLib.createObjectType({
    name: 'Game',
    description: 'Domain representation of a game',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        time: {
            type: graphQlLib.GraphQLString
        },
        finished: {
            type: graphQlLib.GraphQLBoolean
        },
        points: {
            type: graphQlLib.list(exports.pointType),
            resolve: function (env) {
                return graphQlUtilLib.toArray(env.source.points);
            }
        },
        comments: {
            type: graphQlLib.list(exports.commentType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return storeLib.getCommentsByGameId(env.source._id, env.args.offset, env.args.first).hits;
            }
        },
        gamePlayers: {
            type: graphQlLib.list(exports.gamePlayerType)
        },
        gameTeams: {
            type: graphQlLib.list(exports.gameTeamType)
        },
        league: {
            type: graphQlLib.reference('League'),
            resolve: function (env) {
                return storeLib.getLeagueById(env.source.leagueId);
            }
        }
    }
});
exports.gameConnectionType = graphQlConnectionLib.createConnectionType(graphQlLib.getSchemaGenerator(), exports.gameType);

exports.leaguePlayerType = graphQlLib.createObjectType({
    name: 'LeaguePlayer',
    description: 'Relation between a player and a league. ' +
                 'This relation means that a player is a part of a league. LeaguePlayer also contains statistics',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        rating: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.rating);
            }
        },
        ranking: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(storeLib.getRankingForPlayerLeague(env.source.playerId, env.source.leagueId));
            }
        },
        pending: {
            type: graphQlLib.GraphQLBoolean,
            resolve: function (env) {
                return !!env.source.pending;
            }
        },
        player: {
            type: exports.playerType,
            resolve: function (env) {
                return storeLib.getPlayerById(env.source.playerId);
            }
        },
        league: {
            type: graphQlLib.reference('League'),
            resolve: function (env) {
                return storeLib.getLeagueById(env.source.leagueId);
            }
        },
        gamePlayers: {
            type: graphQlLib.list(exports.gamePlayerType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt,
                sort: graphQlLib.GraphQLString,
                since: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                var since = env.args.since ? new Date(env.args.since) : undefined;
                return storeLib.getGamePlayersByLeagueIdAndPlayerId({
                    leagueId: env.source.leagueId,
                    playerId: env.source.playerId,
                    count: env.args.first,
                    start: env.args.offset,
                    sort: env.args.sort,
                    since: since
                }).hits;
            }
        }
    }
});
exports.leaguePlayerConnectionType = graphQlConnectionLib.createConnectionType(graphQlLib.getSchemaGenerator(), exports.leaguePlayerType);

exports.leagueTeamType = graphQlLib.createObjectType({
    name: 'LeagueTeam',
    description: 'Relation between a team and a league. ' +
                 'This relation means that a team is a part of a league. LeagueTeam also contains statistics',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        rating: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(env.source.rating);
            }
        },
        ranking: {
            type: graphQlLib.GraphQLInt,
            resolve: function (env) {
                return graphQlUtilLib.toInt(storeLib.getRankingForTeamLeague(env.source.teamId, env.source.leagueId));
            }
        },
        team: {
            type: exports.teamType,
            resolve: function (env) {
                return storeLib.getTeamById(env.source.teamId);
            }
        },
        league: {
            type: graphQlLib.reference('League'),
            resolve: function (env) {
                return storeLib.getLeagueById(env.source.leagueId);
            }
        }
    }
});
exports.leagueTeamConnectionType = graphQlConnectionLib.createConnectionType(graphQlLib.getSchemaGenerator(), exports.leagueTeamType);

exports.leagueStatsType = graphQlLib.createObjectType({
    name: 'LeagueStats',
    description: 'Domain representation of a league stats.',
    fields: {
        gameCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var leagueId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getGameCountByLeagueId(leagueId));
            }
        },
        playerCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var leagueId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getPlayerCountByLeagueId(leagueId));
            }
        },
        teamCount: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                var leagueId = env.source._id;
                return graphQlUtilLib.toInt(storeLib.getTeamCountByLeagueId(leagueId));
            }
        }
    }
});

exports.rulesType = graphQlLib.createObjectType({
    name: 'Rules',
    description: 'Domain representation of rules for a league.',
    fields: {
        pointsToWin: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                return env.source.pointsToWin
                    ? graphQlUtilLib.toInt(env.source.pointsToWin, storeLib.DEFAULT_POINTS_TO_WIN)
                    : storeLib.DEFAULT_POINTS_TO_WIN;
            }
        },
        minimumDifference: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                return env.source.minimumDifference
                    ? graphQlUtilLib.toInt(env.source.minimumDifference, storeLib.DEFAULT_MINIMUM_DIFFERENCE)
                    : storeLib.DEFAULT_MINIMUM_DIFFERENCE;
            }
        },
        halfTimeSwitch: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLBoolean),
            resolve: function (env) {
                return env.source.halfTimeSwitch == null ? storeLib.DEFAULT_HALF_TIME_SWITCH : env.source.halfTimeSwitch;
            }
        }
    }
});

exports.leagueType = graphQlLib.createObjectType({
    name: 'League',
    description: 'Domain representation of a league. A league contains games. Players can join 0..* leagues and indirectly their teams.',
    interfaces: [entityType],
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
            resolve: function (env) {
                return env.source._id;
            }
        },
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString)
        },
        imageUrl: {
            type: graphQlLib.GraphQLString
        },
        sport: {
            type: graphQlLib.nonNull(graphQlEnumsLib.sportEnumType)
        },
        description: {
            type: graphQlLib.GraphQLString
        },
        config: {
            type: graphQlLib.GraphQLString, //TODO Is it? Is there a unstructured type?
            resolve: function (env) {
                return JSON.stringify(env.source.config);
            }
        },
        adminPlayers: {
            type: graphQlLib.list(exports.playerType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                return graphQlUtilLib.toArray(env.source.adminPlayerIds).map(function (adminPlayerId) {
                    return storeLib.getPlayerById(adminPlayerId); //TODO Improve
                });
            }
        },
        isAdmin: {
            type: graphQlLib.GraphQLBoolean,
            args: {
                playerId: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                return graphQlUtilLib.toArray(env.source.adminPlayerIds).indexOf(env.args.playerId) > -1;
            }
        },
        leaguePlayer: {
            type: exports.leaguePlayerType,
            args: {
                playerId: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                return storeLib.getLeaguePlayerByLeagueIdAndPlayerId(env.source._id, env.args.playerId);
            }
        },
        leaguePlayers: {
            type: graphQlLib.list(exports.leaguePlayerType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt,
                sort: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                var currentPlayerId = getCurrentPlayerId();
                var playerIsLeagueAdmin = graphQlUtilLib.toArray(env.source.adminPlayerIds).indexOf(currentPlayerId) > -1;
                return storeLib.getLeaguePlayersByLeagueId(env.source._id, env.args.offset, env.args.first, env.args.sort,
                    playerIsLeagueAdmin).hits;
            }
        },
        leaguePlayersConnection: {
            type: exports.leaguePlayerConnectionType,
            args: {
                after: graphQlLib.GraphQLString,
                first: graphQlLib.GraphQLInt,
                sort: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                var start = env.args.after ? parseInt(graphQlConnectionLib.decodeCursor(env.args.after)) + 1 : 0;
                var currentPlayerId = getCurrentPlayerId();
                var playerIsLeagueAdmin = graphQlUtilLib.toArray(env.source.adminPlayerIds).indexOf(currentPlayerId) > -1;
                return storeLib.getLeaguePlayersByLeagueId(env.source._id, start, env.args.first,
                    env.args.sort, playerIsLeagueAdmin);
            }
        },
        leagueTeams: {
            type: graphQlLib.list(exports.leagueTeamType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt,
                sort: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                return storeLib.getLeagueTeamsByLeagueId(env.source._id, env.args.offset, env.args.first, env.args.sort).hits;
            }
        },
        leagueTeamsConnection: {
            type: exports.leagueTeamConnectionType,
            args: {
                after: graphQlLib.GraphQLString,
                first: graphQlLib.GraphQLInt,
                sort: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                var start = env.args.after ? parseInt(graphQlConnectionLib.decodeCursor(env.args.after)) + 1 : 0;
                return storeLib.getLeagueTeamsByLeagueId(env.source._id, start, env.args.first,
                    env.args.sort);
            }
        },
        nonMemberPlayers: {
            type: graphQlLib.list(exports.playerType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt,
                sort: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                return storeLib.getPlayersByNotLeagueId(env.source._id, env.args.offset, env.args.first, env.args.sort).hits;
            }
        },
        games: {
            type: graphQlLib.list(exports.gameType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt,
                finished: graphQlLib.GraphQLBoolean
            },
            resolve: function (env) {
                return storeLib.getGamesByLeagueId(env.source._id, env.args.offset, env.args.first, env.args.finished).hits;
            }
        },
        activeGames: {
            type: graphQlLib.list(exports.gameType),
            args: {
                offset: graphQlLib.GraphQLInt,
                first: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                var leagueId = env.source._id;
                var offset = env.args.offset;
                var first = env.args.first;
                return storeLib.getActiveGamesByLeagueId(leagueId, offset, first).hits;
            }
        },
        stats: {
            type: exports.leagueStatsType,
            resolve: function (env) {
                return env.source;
            }
        },
        rules: {
            type: exports.rulesType,
            resolve: function (env) {
                return env.source.rules || {};
            }
        }
    }
});

var getCurrentPlayerId = function () {
    var user = authLib.getUser();
    if (!user) {
        return null;
    }
    var player = storeLib.getPlayerByUserKey(user.key);
    return player && player._id;
};

var isAdmin = function () {
    return authLib.hasRole('system.admin');
};
