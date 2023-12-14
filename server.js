const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const hostname = '127.0.0.1';
const port = 3000;

const dbConnection = mysql.createConnection({
    host: '192.168.1.28',
    user: 'root',
    password: 'root',
    database: 'qcm'
});

dbConnection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                const requestData = JSON.parse(body);

                /*if (req.url === '/quiz') {
                    if (requestData.command === 'getQuizById') {
                        handleGetQuizById(res, requestData);
                    } else if (requestData.command === 'saveUserQuizScore') {
                        handleSaveUserQuizScore(res, requestData);
                    }
                } else if (req.url === '/quiz-result') {
                    if (requestData.command === 'getAllQuizScore') {
                        handleGetAllQuizScore(res);
                    }*/
                if (requestData.command === 'getQuizById') {
                    handleGetQuizById(res, requestData);
                } else if (requestData.command === 'saveUserQuizScore') {
                    handleSaveUserQuizScore(res, requestData);
                } else {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ error: 'Commande non valide' }));
                }
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ error: 'Données JSON non valides' }));
            }
        });
    } else {
        // Si c'est une requête GET à la racine, vous pouvez renvoyer une réponse simple
        if (req.method === 'GET') {
            if (req.url === '/') {
                // Serve the HTML file as before
                fs.readFile('html.html', 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Internal Server Error');
                        return;
                    }
        
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(data);
                });
            } else if (req.url === '/app.js') {
                // Serve the app.js file
                fs.readFile('app.js', 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Internal Server Error');
                        return;
                    }
        
                    res.writeHead(200, {'Content-Type': 'application/javascript'});
                    res.end(data);
                });
            }
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Page non trouvée');
        }
    }
});

// Select a Quiz in database with id
function handleGetQuizById(res, requestData) {
    // Effectuer la requête SELECT sur la table quiz
    const sqlQuery = 'SELECT * FROM quiz JOIN quiz_questions ON quiz.id_quiz = quiz_questions.id_quiz JOIN quiz_options ON quiz_questions.id_questions = quiz_options.id_questions WHERE quiz.id_quiz = ?';
    const id_quiz = requestData.id_quiz;  // Remplacez par l'ID dynamique    
    dbConnection.query(sqlQuery, [id_quiz], (err, results) => {
        if (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Erreur de la base de données' }));
            return;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(formatSQLObject(results)));
    });
}

// Insert a new score of quiz in database with id_quiz, id_user and score
function handleSaveUserQuizScore(res, requestData) {
    const { id_quiz, id_user, score } = requestData.data;

    // Exécutez la requête INSERT dans la table quiz_scores
    const sqlQuery = 'INSERT INTO quiz_scores (id_quiz, id_user, score) VALUES (?, ?, ?)';
    const values = [id_quiz, id_user, score];

    dbConnection.query(sqlQuery, values, (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'insertion dans quiz_scores:', err);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Erreur de la base de données' }));
            return;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ success: true }));
    });
}

// Select a Quiz in database with id
function handleGetAllQuizScore(res) {
    // Effectuer la requête SELECT sur la table quiz
    const sqlQuery = 'SELECT * FROM quiz_scores';
    dbConnection.query(sqlQuery, (err, results) => {
        if (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Erreur de la base de données' }));
            return;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
    });
}

function handleGetQuizScoreByIdQuiz(res, requestData) {
    const sqlQuery = 'SELECT * FROM quiz_scores WHERE id_quiz = ?'
    const id_q = requestData.id_q;
    dbConnection.query(sqlQuery, [id_q], (err,results) => {
        if (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Erreur de la base de données' }));
            return;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(formatSQLObject(results)));
    })
}

function handleGetQuizScoreByIdUser(res, requestData) {
    const sqlQuery = 'SELECT * FROM quiz_scores WHERE id_user = ?'
    const id_user = requestData.id_user;
    dbConnection.query(sqlQuery, [id_user], (err,results) => {
        if (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Erreur de la base de données' }));
            return;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(formatSQLObject(results)));
    })
}

// Format a SQL Object reponse
function formatSQLObject(results) {
    const transformedData = {
        questions: [],
        valid: null,
        start: null,
        end: null,
      };
      
      // Mapper pour stocker temporairement les questions par ID
      const questionsMap = new Map();
      
      // Première boucle pour remplir le map des questions
      for (const row of results) {
        const questionId = row.id_questions;
      
        if (!questionsMap.has(questionId)) {
          questionsMap.set(questionId, {
            id: row.id_questions,
            title: row.title,
            source: row.source,
            options: [],
            type: row.type,
          });
        }
      
        questionsMap.get(questionId).options.push({
          id: row.id_options,
          name: row.name,
          state: row.state === 1,
        });
      }
      
      // Seconde boucle pour remplir l'objet transformé
      for (const question of questionsMap.values()) {
        transformedData.questions.push(question);
      }
      
      // Utiliser les valeurs du premier élément pour les propriétés communes
      if (results.length > 0) {
        transformedData.id_quiz = results[0].id_quiz
        transformedData.valid   = results[0].valid;
        transformedData.start   = results[0].start;
        transformedData.end     = results[0].end;
      }
      
      return transformedData;
}

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
