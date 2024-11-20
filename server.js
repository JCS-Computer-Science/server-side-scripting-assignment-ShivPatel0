const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())
server.use(express.static("public"))

//All your code goes here
let activeSessions={}


async function createWord(){
    let response = await fetch("https://random-word-api.vercel.app/api?words=1&length=5")
    let result = await response.json()
    let randWord = results[0]
    return randWord
}

server.get("/newgame", async(req, res) => {
    let newID = uuid.v4();
    let ans = await createWord()
    let answer = req.query.answer
    if (answer) {
        ans = answer
    }
    let newgame = {
        wordToGuess: ans,
        guesses: [],
        closeLetters:[],
        rightLetters: [],
        remainingGuesses: 6,
        gameOver: false
    }
    activeSessions[newID] = newgame;
    res.status(201).send({sessionID: newID})
})

server.get('/gamestate', (req, res) => {
    let sessionID = req.query.sessionID
    if (!sessionID) {
        return res.status(400).send({error: "Session ID is invalid"})
    } else if (activeSessions[sessionID]) {
        return res.status(200).send({gameState: activeSessions[sessionID]})
    } else {
        return res.status(404).send({error: "Game does not exist"})
    }
})
server.post('/guess', async (req, res) => {
    let sessionID = req.body.sessionsID
    let guess = req.body.guess
    let r = await fetch ("https://api.dictionaryapi.dev/api/v2/entries/en/" + guess)
    let results = await r.json()
    console.log(results)

    if(!guess == "phase" && results.title === "No definition"){
        return res.status(400).send({error: "Word does not exist"})
    }
    if (!sessionID) {
        return res.status(400).send({error: "Session ID is invalid"})
    }
    let session = activeSessions[sessionID]
    if (!session) {
        return res.status(404).send({error: "Awaaion does not exist"})
    }
    if (guess.length !== 5){
        return restart.status(400).send({error: "Guess must contain 5 letters"})
    }

    let actualValue = session.wordToGuess.split
})
//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = server;