const express = require("express");
const uuid = require("uuid");
const server = express();
server.use(express.json());
server.use(express.static("public"));

// All your code goes here
let activeSessions = {}

async function generateWord() {
    let response = await fetch("https://random-word-api.vercel.app/api?words=1&length=5")
     let results = await response.json() 


    let randomWord = results[0]
    return randomWord
}

server.get("/newgame", async (req,res) => {
    let newID =uuid.v4();
    let word = await generateWord();
    let userWord = req.query.answer; 
    if (userWord) {

        word = userWord
    }
         let gameData = {
        wordToGuess: word,
        guesses: [],
        wrongLetters: [],
        closeLetters: [],
        rightLetters:[],
        remainingGuesses: 6,
        gameOver:false
    }
    activeSessions[newID] = gameData
    res.status(201).send({ sessionID: newID })

});



server.get('/gamestate', (req, res) => {
    let sessionID = req.query.sessionID

if (!sessionID) {
        return res.status(400).send({ error: "Invalid Session ID" })
    } else if (activeSessions[sessionID]) {
        return res.status(200).send({ gameState: activeSessions[sessionID] })
    } else {
        return res.status(404).send({ error: "Invalid Game" })
    }
})
server.post('/guess', async (req,res)=> {
          let sessionID = req.body.sessionID 
          let userGuess = req.body.guess 

    let response = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + userGuess)  
    let dictionaryData = await response.json()
    console.log(dictionaryData)

    

if (!userGuess == "phase" && dictionaryData.title === "No Definitions Found") {
        return res.status(400).send({ error: "Not a Word in List" })
    }
    if (!sessionID) {
        return res.status(400).send({ error: "Invalid Session ID" })

    }
    let session = activeSessions[sessionID]
    if (!session) {
        return res.status(404).send({ error: "Invalid Session" })

    }
    if (userGuess.length !== 5) {
        return res.status(400).send({ error: "Not enough Letters" });

    }

    let targetWordArray =session.wordToGuess.split("")

    let currentGuess =[]
    session.remainingGuesses -=1;

for (let i = 0; i < userGuess.length; i++) {

        let letter = userGuess[i].toLowerCase()
        let correctness = "WRONG"
        if (!letter.match(/[a-z]/)) {
            return res.status(400).send({ error: "Not Enough Letters" })
    }
        if (letter === targetWordArray[i]) {
            correctness ="RIGHT";
            if (!session.rightLetters.includes(letter)) {
                session.rightLetters.push(letter)
            }
            if (session.closeLetters.includes(letter)) {
                let index = session.closeLetters.indexOf(letter)
                session.closeLetters.splice(index, 1);
            }
    } else if (targetWordArray.includes(letter)) {
            correctness = "CLOSE";
            if (!session.closeLetters.includes(letter) && !session.rightLetters.includes(letter)) {
                session.closeLetters.push(letter)
            }
    } else {
        if (!session.wrongLetters.includes(letter)) {
                session.wrongLetters.push(letter)
        }
        }

        currentGuess.push({ value: letter, result: correctness })
    }

    session.guesses.push(currentGuess)



    if (userGuess === session.wordToGuess) {
        session.gameOver = true
    } else if (session.remainingGuesses <= 0) {
        session.gameOver = true
    }

    return res.status(201).send({ gameState: session })
});


server.delete('/reset', (req, res) => {
    let sessionID = req.query.sessionID

    if (!sessionID) {
        res.status(400).send({ error: "Invalid Session ID" })
        return;
    }
    if (activeSessions[sessionID]) {
        activeSessions[sessionID] = {
            wordToGuess: undefined,
            guesses: [],
            wrongLetters: [],
            closeLetters: [],
            rightLetters: [],
            remainingGuesses: 6,
            gameOver: false
        };
        return res.status(200).send({ gameState: activeSessions[sessionID] })
    } else {
        return res.status(404).send({ error: "Invalid Session ID" })
    }
})
server.delete("/delete", (req, res) => {
    let sessionID = req.query.sessionID;
    if (!sessionID) {
        res.status(400).send({ error: "Invalid Session ID" })
    }
    if (activeSessions[sessionID]) {
        delete activeSessions[sessionID];
        res.status(204).send({ error: "Invalid Session ID" })
    } else {
        res.status(404).send({ error: "Invalid Session ID" })
    }
})

server.get("/hint", async (req, res) => {
    let sessionID = req.query.sessionID;
    if (!sessionID) {
        return res.status(400).send({ error: "Invalid Session ID" })
    }

    if (!activeSessions[sessionID]) {
        res.status(404).send({ error: "Invalid Session ID" })
    } else if (sessionID) {
        let response = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + userGuess)
        let dictionaryResults = await response.json();
        let definition = dictionaryResults[0].meanings.definitions[0].definition
        return definition
    }

});



// Do not remove this line. This allows the test suite to start
// multiple instances of your server on different ports
module.exports = server;
