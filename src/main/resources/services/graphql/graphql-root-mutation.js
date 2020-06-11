var graphQlLib = require('/lib/graphql');
var graphQlEnumsLib = require('./graphql-enums');
var graphQlObjectTypesLib = require('./graphql-object-types');
var graphQlInputTypesLib = require('./graphql-input-types');
var storeLib = require('/lib/office-league-store');
var authLib = require('/lib/xp/auth');
var invitationLib = require('/lib/invitation');
var mailLib = require('/lib/mail');

exports.rootMutationType = graphQlLib.createObjectType({
    name: 'Mutation',
    fields: {
        createLeague: {
            type: graphQlObjectTypesLib.leagueType,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString),
                sport: graphQlLib.nonNull(graphQlEnumsLib.sportEnumType),
                description: graphQlLib.GraphQLString,
                config: graphQlLib.GraphQLString,//TODO
                adminPlayerIds: graphQlLib.list(graphQlLib.GraphQLID),
                playerNames: graphQlLib.list(graphQlLib.GraphQLString),
                pointsToWin: graphQlLib.GraphQLInt,
                minimumDifference: graphQlLib.GraphQLInt,
                halfTimeSwitch: graphQlLib.GraphQLBoolean
            },
            resolve: function (env) {
                var currentPlayerId = getCurrentPlayerId();
                var adminPlayerIds = env.args.adminPlayerIds || [];
                var playerNames = env.args.playerNames || [];
                checkCreateLeaguePermissions(currentPlayerId, adminPlayerIds);

                var createdLeague = storeLib.createLeague({
                    name: env.args.name,
                    sport: env.args.sport,
                    description: env.args.description,
                    config: env.args.config ? JSON.parse(env.args.config) : {}, //TODO
                    adminPlayerIds: env.args.adminPlayerIds,
                    pointsToWin: env.args.pointsToWin,
                    minimumDifference: env.args.minimumDifference,
                    halfTimeSwitch: env.args.halfTimeSwitch
                });

                storeLib.refresh();
                playerNames.map(function (playerName) {
                    var player = storeLib.getPlayerByName(playerName);
                    if (player) {
                        storeLib.joinPlayerLeague(createdLeague._id, player._id, env.args.rating);
                    } else if (playerName.indexOf('@') !== -1) {
                        var invitation = invitationLib.createInvitation(createdLeague._id);
                        mailLib.sendInvitation(playerName, createdLeague._id, getCurrentPlayerId(), invitation.token)
                    } else {
                        log.warning('[' + playerName + '] is not an existing player name or an email address.');
                    }
                });

                storeLib.refresh();
                return createdLeague;
            }
        },
        updateLeague: {
            type: graphQlObjectTypesLib.leagueType,
            args: {
                id: graphQlLib.nonNull(graphQlLib.GraphQLID),
                name: graphQlLib.GraphQLString,
                description: graphQlLib.GraphQLString,
                config: graphQlLib.GraphQLString,//TODO
                adminPlayerIds: graphQlLib.list(graphQlLib.GraphQLID),
                pointsToWin: graphQlLib.GraphQLInt,
                minimumDifference: graphQlLib.GraphQLInt,
                halfTimeSwitch: graphQlLib.GraphQLBoolean,
            },
            resolve: function (env) {
                checkUpdateLeaguePermissions(env.args.id, env.args.adminPlayerIds);

                var updatedLeague = storeLib.updateLeague({
                    leagueId: env.args.id,
                    name: env.args.name,
                    description: env.args.description,
                    config: env.args.config ? JSON.parse(env.args.config) : {}, //TODO
                    adminPlayerIds: env.args.adminPlayerIds,
                    pointsToWin: env.args.pointsToWin,
                    minimumDifference: env.args.minimumDifference,
                    halfTimeSwitch: env.args.halfTimeSwitch
                });
                storeLib.refresh();
                return updatedLeague;
            }
        },
        deleteLeague: {
            type: graphQlLib.GraphQLID,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString)
            },
            resolve: function (env) {
                checkDeleteLeaguePermissions(env.args.name);

                var deletedId = storeLib.deleteLeagueByName(env.args.name);
                storeLib.refresh();
                return deletedId;
            }
        },
        createPlayer: {
            type: graphQlObjectTypesLib.playerType,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString),
                fullname: graphQlLib.GraphQLString,
                nationality: graphQlLib.GraphQLString, //TODO
                handedness: graphQlEnumsLib.handednessEnumType,
                description: graphQlLib.GraphQLString,
                invitation: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                var userKey = getCurrentUserKey();
                checkCreatePlayerPermissions(userKey)

                var createdPlayer = storeLib.createPlayer({
                    name: env.args.name,
                    fullname: env.args.fullname,
                    nationality: env.args.nationality,
                    handedness: env.args.handedness,
                    description: env.args.description,
                    userKey: userKey
                });
                if (env.args.invitation) {
                    var invitation = invitationLib.removeInvitationByToken(env.args.invitation);
                    if (invitation) {
                        storeLib.joinPlayerLeague(invitation.leagueId, createdPlayer._id);
                    }
                }
                storeLib.refresh();
                return createdPlayer;
            }
        },
        updatePlayer: {
            type: graphQlObjectTypesLib.playerType,
            args: {
                id: graphQlLib.nonNull(graphQlLib.GraphQLID),
                name: graphQlLib.GraphQLString,
                fullname: graphQlLib.GraphQLString,
                nationality: graphQlLib.GraphQLString, //TODO
                handedness: graphQlEnumsLib.handednessEnumType,
                description: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                checkUpdatePlayerPermissions(env.args.id);

                var updatedPlayer = storeLib.updatePlayer({
                    playerId: env.args.id,
                    name: env.args.name,
                    fullname: env.args.fullname,
                    nationality: env.args.nationality,
                    handedness: env.args.handedness,
                    description: env.args.description
                });
                storeLib.refresh();
                return updatedPlayer;
            }
        },
        createTeam: {
            type: graphQlObjectTypesLib.teamType,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString),
                description: graphQlLib.GraphQLString,
                playerIds: graphQlLib.nonNull(graphQlLib.list(graphQlLib.GraphQLID))
            },
            resolve: function (env) {
                checkCreateTeamPermissions(env.args.playerIds);

                var createdTeam = storeLib.createTeam({
                    name: env.args.name,
                    description: env.args.description,
                    playerIds: env.args.playerIds
                });
                storeLib.refresh();
                return createdTeam;
            }
        },
        updateTeam: {
            type: graphQlObjectTypesLib.teamType,
            args: {
                id: graphQlLib.nonNull(graphQlLib.GraphQLID),
                name: graphQlLib.GraphQLString,
                description: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                checkUpdateTeamPermissions(env.args.id);

                var updatedTeam = storeLib.updateTeam({
                    teamId: env.args.id,
                    name: env.args.name,
                    description: env.args.description
                });
                storeLib.refresh();
                return updatedTeam;
            }
        },
        joinPlayerLeague: {
            type: graphQlObjectTypesLib.leaguePlayerType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                playerId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                rating: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                checkJoinPlayerLeaguePermissions(env.args.leagueId);

                var prevLeaguePlayer = storeLib.getLeaguePlayerByLeagueIdAndPlayerId(env.args.leagueId, env.args.playerId, true);
                var requestedByPlayer = prevLeaguePlayer && prevLeaguePlayer.pending;
                var createdLeaguePlayer = storeLib.joinPlayerLeague(env.args.leagueId, env.args.playerId, env.args.rating);
                storeLib.refresh();

                if (requestedByPlayer) {
                    mailLib.sendAllowJoinRequestNotification(env.args.playerId, env.args.leagueId);
                }

                return createdLeaguePlayer;
            }
        },
        addPlayersLeague: {
            type: graphQlLib.list(graphQlObjectTypesLib.leaguePlayerType),
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                playerNames: graphQlLib.nonNull(graphQlLib.list(graphQlLib.GraphQLString))
            },
            resolve: function (env) {
                checkJoinPlayerLeaguePermissions(env.args.leagueId);

                var createdLeaguePlayers = env.args.playerNames.map(function (playerName) {
                    var player = storeLib.getPlayerByName(playerName);
                    if (player) {
                        storeLib.joinPlayerLeague(env.args.leagueId, player._id, env.args.rating);
                    } else if (playerName.indexOf('@') !== -1) {
                        var invitation = invitationLib.createInvitation(env.args.leagueId);
                        mailLib.sendInvitation(playerName, env.args.leagueId, getCurrentPlayerId(), invitation.token)
                    } else {
                        log.warning('[' + playerName + '] is not an existing player name or an email address.');
                    }
                });
                storeLib.refresh();
                return createdLeaguePlayers;
            }
        },
        leavePlayerLeague: {
            type: graphQlLib.GraphQLID,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                playerId: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                checkLeavePlayerLeaguePermissions(env.args.leagueId, env.args.playerId);

                storeLib.leavePlayerLeague(env.args.leagueId, env.args.playerId);
                storeLib.refresh();
                return env.args.playerId;
            }
        },
        requestJoinLeague: {
            type: graphQlObjectTypesLib.leaguePlayerType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                var leagueId = env.args.leagueId;
                checkRequestJoinLeaguePermissions(leagueId);

                var currentPlayerId = getCurrentPlayerId();
                var leaguePlayer = storeLib.getLeaguePlayerByLeagueIdAndPlayerId(leagueId, currentPlayerId);
                if (leaguePlayer && leaguePlayer.pending) {
                    return leaguePlayer;
                }

                var updatedLeaguePlayer = storeLib.markPlayerLeaguePending(leagueId, currentPlayerId, true, false);
                storeLib.refresh();

                mailLib.sendJoinRequestNotification(currentPlayerId, leagueId);

                return updatedLeaguePlayer;
            }
        },
        denyJoinLeagueRequest: {
            type: graphQlObjectTypesLib.leaguePlayerType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                playerId: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                var leagueId = env.args.leagueId;
                checkDenyJoinLeaguePermissions(leagueId);

                var playerId = env.args.playerId;
                var leaguePlayer = storeLib.getLeaguePlayerByLeagueIdAndPlayerId(leagueId, playerId);
                if (leaguePlayer && !leaguePlayer.pending) {
                    return leaguePlayer;
                }

                var updatedLeaguePlayer = storeLib.markPlayerLeaguePending(leagueId, playerId, false, true);
                storeLib.refresh();

                mailLib.sendDenyJoinRequestNotification(playerId, leagueId);

                return updatedLeaguePlayer;
            }
        },
        updatePlayerLeagueRating: {
            type: graphQlObjectTypesLib.leaguePlayerType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                playerId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                ratingDelta: graphQlLib.nonNull(graphQlLib.GraphQLInt)
            },
            resolve: function (env) {
                checkUpdatePlayerLeagueRatingPermissions();

                var updatedLeaguePlayer = storeLib.updatePlayerLeagueRating(env.args.leagueId, env.args.playerId, env.args.ratingDelta);
                storeLib.refresh();
                return updatedLeaguePlayer;
            }
        },
        joinTeamLeague: {
            type: graphQlObjectTypesLib.leagueTeamType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                teamId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                rating: graphQlLib.GraphQLInt
            },
            resolve: function (env) {
                checkJoinTeamLeaguePermissions(env.args.leagueId);

                var createdLeagueTeam = storeLib.joinTeamLeague(env.args.leagueId, env.args.teamId, env.args.rating);
                storeLib.refresh();
                return createdLeagueTeam;
            }
        },
        updateTeamLeagueRating: {
            type: graphQlObjectTypesLib.leagueTeamType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                teamId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                ratingDelta: graphQlLib.nonNull(graphQlLib.GraphQLInt)
            },
            resolve: function (env) {
                checkUpdateTeamLeagueRatingPermissions();

                var updatedLeagueTeam = storeLib.updateTeamLeagueRating(env.args.leagueId, env.args.teamId, env.args.ratingDelta);
                storeLib.refresh();
                return updatedLeagueTeam;
            }
        },
        createGame: {
            type: graphQlObjectTypesLib.gameType,
            args: {
                leagueId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                points: graphQlLib.list(graphQlInputTypesLib.pointCreationType),
                gamePlayers: graphQlLib.nonNull(graphQlLib.list(graphQlInputTypesLib.gamePlayerCreationType))
            },
            resolve: function (env) {
                checkCreateGamePermissions(env.args.leagueId, env.args.gamePlayers);

                var createGameParams = storeLib.generateCreateGameParams({
                    leagueId: env.args.leagueId,
                    points: env.args.points || [],
                    gamePlayers: env.args.gamePlayers
                });
                var createdGame = storeLib.createGame(createGameParams);
                storeLib.refresh();

                if (createGameParams.finished) {
                    // update ranking
                    var game = storeLib.getGameById(createdGame._id);
                    storeLib.updateGameRanking(game);
                    storeLib.refresh();
                    storeLib.logGameRanking(game);
                }
                return createdGame;
            }
        },
        updateGame: {
            type: graphQlObjectTypesLib.gameType,
            args: {
                gameId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                points: graphQlLib.list(graphQlInputTypesLib.pointCreationType),
                gamePlayers: graphQlLib.nonNull(graphQlLib.list(graphQlInputTypesLib.gamePlayerCreationType))
            },
            resolve: function (env) {
                checkUpdateGamePermissions(env.args.gameId, env.args.gamePlayers);

                var gameToUpdate = storeLib.getGameById(env.args.gameId);
                var createGameParams = storeLib.generateCreateGameParams({
                    leagueId: gameToUpdate.leagueId,
                    points: env.args.points || [],
                    gamePlayers: env.args.gamePlayers
                });
                storeLib.updateGame({
                    gameId: env.args.gameId,
                    finished: createGameParams.finished,
                    gamePlayers: createGameParams.gamePlayers,
                    gameTeams: createGameParams.gameTeams,
                    points: createGameParams.points
                });
                storeLib.refresh();

                if (createGameParams.finished) {
                    // update ranking
                    var game = storeLib.getGameById(env.args.gameId);
                    if (game) {
                        storeLib.updateGameRanking(game);
                        storeLib.refresh();
                        storeLib.logGameRanking(game);
                    }
                }
                return storeLib.getGameById(env.args.gameId);
            }
        },
        deleteGame: {
            type: graphQlLib.GraphQLID,
            args: {
                id: graphQlLib.nonNull(graphQlLib.GraphQLID)
            },
            resolve: function (env) {
                checkDeleteGamePermissions(env.args.id);

                var deletedId = storeLib.deleteGameById(env.args.id);
                storeLib.refresh();
                return deletedId;
            }
        },
        createComment: {
            type: graphQlObjectTypesLib.commentType,
            args: {
                gameId: graphQlLib.nonNull(graphQlLib.GraphQLID),
                author: graphQlLib.nonNull(graphQlLib.GraphQLID),
                text: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                var playerId = getCurrentPlayerId();
                if (playerId !== env.args.author) {
                    throw "Comment author is not the logged in user";
                }
                var createdComment = storeLib.createComment({
                    gameId: env.args.gameId,
                    author: env.args.author,
                    text: env.args.text
                });
                storeLib.refresh();
                return createdComment;
            }
        },
        regenerateLeagueRanking: {
            type: graphQlObjectTypesLib.leagueType,
            args: {
                leagueId: graphQlLib.GraphQLID,
                leagueName: graphQlLib.GraphQLID
            },
            resolve: function (env) {
                var leagueId = env.args.leagueId;
                var leagueName = env.args.leagueName;
                var league;
                if (leagueId) {
                    league = storeLib.getLeagueById(leagueId);
                } else {
                    league = storeLib.getLeagueByName(leagueName);
                }

                if (!league) {
                    throw "League not found: '" + (leagueId || leagueName || '') + "'";
                }
                checkRegenerateLeagueRankingPermissions(league);

                storeLib.regenerateLeagueRanking(league);
                return league;
            }
        },
        addPushSubscription: {
            type: graphQlLib.GraphQLBoolean,
            args: {
                endpoint: graphQlLib.nonNull(graphQlLib.GraphQLString),
                key: graphQlLib.nonNull(graphQlLib.GraphQLString),
                auth: graphQlLib.nonNull(graphQlLib.GraphQLString)
            },
            resolve: function (env) {
                var currentPlayerId = getCurrentPlayerId();

                var addedPushSubscription = storeLib.addPushSubscription({
                    playerId: currentPlayerId,
                    endpoint: env.args.endpoint,
                    key: env.args.key,
                    auth: env.args.auth
                });
                storeLib.refresh();

                storeLib.sendPushNotification({
                    playerIds: [currentPlayerId],
                    text: "Office League notifications enabled.",
                    key: env.args.key
                });

                return !!addedPushSubscription;
            }
        },
        removePushSubscription: {
            type: graphQlLib.GraphQLBoolean,
            args: {
                endpoint: graphQlLib.nonNull(graphQlLib.GraphQLString),
                key: graphQlLib.nonNull(graphQlLib.GraphQLString),
                auth: graphQlLib.nonNull(graphQlLib.GraphQLString)
            },
            resolve: function (env) {
                var currentPlayerId = getCurrentPlayerId();

                storeLib.removePushSubscription({
                    playerId: currentPlayerId,
                    endpoint: env.args.endpoint,
                    key: env.args.key,
                    auth: env.args.auth
                });
                storeLib.refresh();
                return true;
            }
        }
    }
});

var checkCreateLeaguePermissions = function (currentPlayerId, adminPlayerIds) {
    if (isAdmin()) {
        return;
    }
    if (!currentPlayerId || (adminPlayerIds.indexOf(currentPlayerId) === -1)) {
        throw "The current player must be set as admin for a new league.";
    }
};

var checkUpdateLeaguePermissions = function (leagueId, adminPlayerIds) {
    if (isAdmin()) {
        return;
    }
    if (adminPlayerIds && (adminPlayerIds.length === 0)) {
        throw "The league must have at least one admin.";
    }
    var currentPlayerId = getCurrentPlayerId();
    var league = storeLib.getLeagueById(leagueId);
    if (!league) {
        return;
    }

    if (!currentPlayerId || ([].concat(league.adminPlayerIds).indexOf(currentPlayerId) === -1)) {
        throw "The league '" + league.name + "' cannot be updated. The current user is not an admin for the league.";
    }

    if (adminPlayerIds && (adminPlayerIds.indexOf(currentPlayerId) === -1)) {
        throw "The current player must be set as admin for the league.";
    }
};

var checkDeleteLeaguePermissions = function (leagueName) {
    if (isAdmin()) {
        return;
    }

    var currentPlayerId = getCurrentPlayerId();
    var league = storeLib.getLeagueByName(leagueName);
    if (!league) {
        return null;
    }
    if (!currentPlayerId || ([].concat(league.adminPlayerIds).indexOf(currentPlayerId) === -1)) {
        throw "The league '" + league.name + "' cannot be deleted. The current user is not an admin for the league.";
    }
};

var checkUpdatePlayerPermissions = function (playerId) {
    if (isAdmin()) {
        return;
    }

    var userKey = getCurrentUserKey();
    if (!userKey) {
        throw "Player cannot be updated, no logged in user.";
    }
    var player = storeLib.getPlayerById(playerId);
    if (!player) {
        return null;
    }
    if (player.userKey !== userKey) {
        throw "User not authorized to update player.";
    }
};

var checkCreatePlayerPermissions = function (userKey) {
    if (!userKey) {
        throw "Player cannot be created, no logged in user to link to.";
    }
    if (isUserLinkedToPlayer(userKey)) {
        throw "Player cannot be created, logged in user already linked to another player.";
    }
};

var checkCreateTeamPermissions = function (playerIds) {
    if (isAdmin()) {
        return;
    }

    var userKey = getCurrentUserKey();
    if (!userKey) {
        throw "Team cannot be created, no logged in user.";
    }
    var players = storeLib.getPlayersById(playerIds);
    if (!players || players.length !== 2) {
        return null;
    }

    if ((players[0].userKey !== userKey) && (players[1].userKey !== userKey)) {
        throw "User not authorized to create team.";
    }
};

var checkUpdateTeamPermissions = function (teamId) {
    if (isAdmin()) {
        return;
    }

    var userKey = getCurrentUserKey();
    if (!userKey) {
        throw "Team cannot be updated, no logged in user.";
    }
    var team = storeLib.getTeamById(teamId);
    if (!team) {
        return null;
    }
    var players = storeLib.getPlayersById(team.playerIds);
    if (!players || players.length !== 2) {
        return null;
    }
    if ((players[0].userKey !== userKey) && (players[1].userKey !== userKey)) {
        throw "User not authorized to update team.";
    }
};

var checkJoinPlayerLeaguePermissions = function (leagueId) {
    if (isAdmin()) {
        return;
    }

    var currentPlayerId = getCurrentPlayerId();
    if (!currentPlayerId) {
        throw "League cannot be updated, no logged in user.";
    }

    var league = storeLib.getLeagueById(leagueId);
    if (!league) {
        return;
    }

    var adminPlayerIds = league.adminPlayerIds ? [].concat(league.adminPlayerIds) : [];
    var userIsLeagueAdmin = false;
    adminPlayerIds.forEach(function (adminId) {
        if (adminId === currentPlayerId) {
            userIsLeagueAdmin = true;
        }
    });
    if (!userIsLeagueAdmin) {
        throw "User not authorized to update league.";
    }
};

var checkRequestJoinLeaguePermissions = function (leagueId) {
    var currentPlayerId = getCurrentPlayerId();
    if (!currentPlayerId) {
        throw "Cannot request joining league, no logged in user.";
    }

    var league = storeLib.getLeagueById(leagueId);
    if (!league) {
        throw "League not found: " + leagueId;
    }
};

var checkDenyJoinLeaguePermissions = function (leagueId) {
    if (isAdmin()) {
        return;
    }

    var currentPlayerId = getCurrentPlayerId();
    if (!currentPlayerId) {
        throw "League cannot be updated, no logged in user.";
    }

    var league = storeLib.getLeagueById(leagueId);
    if (!league) {
        return;
    }

    var adminPlayerIds = league.adminPlayerIds ? [].concat(league.adminPlayerIds) : [];
    var userIsLeagueAdmin = false;
    adminPlayerIds.forEach(function (adminId) {
        if (adminId === currentPlayerId) {
            userIsLeagueAdmin = true;
        }
    });
    if (!userIsLeagueAdmin) {
        throw "User not authorized to update league.";
    }
};

var checkLeavePlayerLeaguePermissions = function (leagueId, playerId) {
    var currentPlayerId = getCurrentPlayerId();
    if (!currentPlayerId) {
        throw "League cannot be updated, no logged in user.";
    }

    var league = storeLib.getLeagueById(leagueId);
    if (!league) {
        return;
    }
    var adminPlayerIds = league.adminPlayerIds ? [].concat(league.adminPlayerIds) : [];
    var userIsLeagueAdmin = false;
    adminPlayerIds.forEach(function (adminId) {
        if (adminId === currentPlayerId) {
            userIsLeagueAdmin = true;
        }
    });

    if (isAdmin()) {
        return;
    }
    if (!userIsLeagueAdmin && (playerId !== currentPlayerId)) {
        throw "Non admin user cannot remove another player from the league.";
    }
};

var checkUpdatePlayerLeagueRatingPermissions = function () {
    if (isNotAdmin()) {
        throw "User not authorized to update league ranking.";
    }
};

var checkJoinTeamLeaguePermissions = function (leagueId) {
    if (isAdmin()) {
        return;
    }

    var userKey = getCurrentUserKey();
    if (!userKey) {
        throw "League cannot be updated, no logged in user.";
    }
    var league = storeLib.getLeagueById(leagueId);
    if (!league) {
        return;
    }
    var adminPlayers = storeLib.getPlayersById(league.adminPlayerIds) || [];
    var userIsLeagueAdmin = false;
    adminPlayers.forEach(function (p) {
        if (p.userKey === userKey) {
            userIsLeagueAdmin = true;
        }
    });
    if (userIsLeagueAdmin) {
        throw "User not authorized to update league.";
    }
};

var checkUpdateTeamLeagueRatingPermissions = function () {
    if (isNotAdmin()) {
        throw "User not authorized to update league ranking.";
    }
};

var checkCreateGamePermissions = function (leagueId, gamePlayers) {
    var playerIds = gamePlayers.map(function (gp) {
        return gp.playerId;
    });
    var leaguePlayerResp = storeLib.getLeaguePlayersByLeagueIdAndPlayerIds(leagueId, playerIds);
    if (leaguePlayerResp.count !== playerIds.length) {
        throw "Game cannot be created, some of the players are not members of the league.";
    }
};

var checkUpdateGamePermissions = function (gameId, gamePlayers) {
    var game = storeLib.getGameById(gameId);
    if (!game) {
        return;
    }
    var leagueId = game.leagueId;
    var playerIds = gamePlayers.map(function (gp) {
        return gp.playerId;
    });
    var leaguePlayerResp = storeLib.getLeaguePlayersByLeagueIdAndPlayerIds(leagueId, playerIds);
    if (leaguePlayerResp.count !== playerIds.length) {
        throw "Game cannot be updated, some of the players are not members of the league.";
    }
};

var checkDeleteGamePermissions = function (gameId) {
    if (isAdmin()) {
        return;
    }
    var game = storeLib.getGameById(gameId);
    if (!game) {
        return;
    }
    var playerIds = game.gamePlayers.map(function (gp) {
        return gp.playerId;
    });
    var players = storeLib.getPlayersById(playerIds);

    var userIsGamePlayer = false;
    var userKey = getCurrentUserKey();
    players.forEach(function (p) {
        if (p.userKey === userKey) {
            userIsGamePlayer = true;
        }
    });

    var league = storeLib.getLeagueById(game.leagueId);
    var adminPlayerIds = league.adminPlayerIds ? [].concat(league.adminPlayerIds) : [];
    var currentPlayerId = getCurrentPlayerId();
    var userIsLeagueAdmin = false;
    adminPlayerIds.forEach(function (adminId) {
        if (adminId === currentPlayerId) {
            userIsLeagueAdmin = true;
        }
    });

    if (userIsLeagueAdmin) {
        return;
    }
    if (!userIsLeagueAdmin && !userIsGamePlayer) {
        throw "User not authorized to delete game.";
    }

    if (userIsGamePlayer && game.finished) {
        throw "Finished games can only be deleted by league administrators.";
    }
};

var checkRegenerateLeagueRankingPermissions = function (league) {
    if (isAdmin()) {
        return;
    }

    var adminPlayerIds = league.adminPlayerIds ? [].concat(league.adminPlayerIds) : [];
    var currentPlayerId = getCurrentPlayerId();
    var userIsLeagueAdmin = false;
    adminPlayerIds.forEach(function (adminId) {
        if (adminId === currentPlayerId) {
            userIsLeagueAdmin = true;
        }
    });

    if (!userIsLeagueAdmin) {
        throw "User not authorized to regenerate league ranking.";
    }
};

var getCurrentPlayerId = function () {
    var user = authLib.getUser();
    if (!user) {
        return null;
    }
    var player = storeLib.getPlayerByUserKey(user.key);
    return player && player._id;
};

var getCurrentUserKey = function () {
    var user = authLib.getUser();
    return user ? user.key : null;
};

var isUserLinkedToPlayer = function (userKey) {
    var player = storeLib.getPlayerByUserKey(userKey);
    return !!player;
};

var isNotAdmin = function () {
    return !authLib.hasRole('system.admin');
};

var isAdmin = function () {
    return authLib.hasRole('system.admin');
};