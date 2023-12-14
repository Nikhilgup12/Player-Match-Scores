const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
app.use(express.json())
let db = null
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is start! ')
    })
  } catch (e) {
    console.log(`Error message: ${e.message}`)
    process.exit(1)
  }
}

initialize()

const convert = data => {
  return {
    playerId: data.player_id,
    playerName: data.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayerQuery = `select * from player_details`;
  const player = await db.all(getPlayerQuery)
  response.send(player.map(each => convert(each)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `select * from player_details where player_id =${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(player)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updateQuery = `update player_details 
    set player_name = '${playerName};
    where player_id = ${playerId};`;
  await db.run(updateQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `select * from match_details where match_id = ${matchId};`;
  const match = await db.get(getMatchQuery)
  response.send(match)
})

const convertMatch = data => {
  return {
    matchId: data.match_id,
    match: data.match,
    year: data.year,
  }
}

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchQuery = `select * from player_match_score natural join match_details where player_id = ${playerId};`
  const match = await db.all(getMatchQuery)
  response.send(match.map(each => convertMatch(each)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerQuery = `SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const player = await db.all(getPlayerQuery)
  response.send(player)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `select player_details.player_id AS playerId,
	      player_details.player_name AS playerName,
          sum(player_match_score.score) as totalScore,
          sum(player_match_score.fours) as totalFours,
          sum(player_match_score.sixes) as totalSixes
          from player_match_score inner join player_details on player_match_score.player_id = player_details.player_id
           WHERE player_details.player_id = ${playerId};
          `;
  const player = await db.get(getQuery)
  response.send(player)
})

module.exports = app
