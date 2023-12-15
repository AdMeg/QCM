document.write('<script src="quiz.js"></script>');
document.write('<script src="quiz-result.js"></script>');

var questionMap = new Map();
var selectedValues = [];
var verifResult = false;
var questions;

var container = document.getElementById('quiz-container');

// Variable test
var RADIO = 1, CHECK = 2;
var ID_USER = 1;

// Index de la question actuelle
var currentQuestionIndex = 0;

// -- QUIZ -- //
function createAllQuiz(data) {
    var table = document.createElement('table');
    container.appendChild(table);

    // Create table header
    var headerRow = table.insertRow(0);
    var headers = ['Name', 'Start', 'End'];

    for (var i = 0; i < headers.length; i++) {
        var headerCell = headerRow.insertCell(i);
        headerCell.textContent = headers[i];
    }

    // Iterate through quiz results
    for (const quiz of data) {
        let row = table.insertRow(-1);

        // ID Quiz
        var cell1 = row.insertCell(0);
        cell1.textContent = quiz.name;

        // ID User
        var cell2 = row.insertCell(1);
        cell2.textContent = quiz.start;

        // Score
        var cell3 = row.insertCell(2);
        cell3.textContent = quiz.end;

        row.addEventListener('click', () => { 
            table.style.display = "none";
            getQuizById(quiz.id_quiz);
        });
    }
}

// Fonction pour créer dynamiquement un QCM
function createQuiz() {

    let progressBar = document.createElement('progress');
    progressBar.id = 'progressBar';
    container.appendChild(progressBar);

    for (var question_nb = 0; question_nb < questions.questions.length; question_nb++) {

        var question = questions.questions[question_nb];

        // Div de la question
        let questionDiv = document.createElement('div');
        questionDiv.id = question_nb;
        container.appendChild(questionDiv);

        // Titre de la question
        var questionTitle = document.createElement('h2');
        questionTitle.textContent = question.title;
        questionDiv.appendChild(questionTitle);

        // Afficher la source (image ou vidéo) si elle est fournie
        if (question.source) {
            var mediaElement;

            // Vérifier le type de source
            if (isYouTubeLink(question.source)) {
                // Source est un lien YouTube
                var videoId = getYouTubeVideoId(question.source);
                if (videoId) {
                    // Créer l'élément d'incorporation de la vidéo YouTube
                    mediaElement = document.createElement('iframe');
                    mediaElement.src = 'https://www.youtube.com/embed/' + videoId;
                    mediaElement.frameborder = '0';
                    mediaElement.allowfullscreen = true;
                }
            } else if (question.source.endsWith('.mp4') || question.source.endsWith('.webm') || question.source.endsWith('.ogg')) {
                // Source est une vidéo
                mediaElement = document.createElement('video');
                mediaElement.src = question.source;
                mediaElement.controls = true; // Ajouter les contrôles de lecture/pause
            } else if (question.source.endsWith('.jpg') || question.source.endsWith('.jpeg') || question.source.endsWith('.png') || question.source.endsWith('.gif')) {
                // Source est une image
                mediaElement = document.createElement('img');
                mediaElement.src = question.source;
            }

            // Ajouter l'élément média au conteneur
            if (mediaElement) {
                mediaElement.width = '560';
                mediaElement.height = '315';
                questionDiv.appendChild(mediaElement);
            }
        }

        // Options de réponse
        var questionOptions = document.createElement('options-block');
        questionDiv.appendChild(questionOptions);

        var options = question.options;
        let input;
        for (var i = 0; i < options.length; i++) {
            
            input = document.createElement('input');
            switch (question.type) {
                case RADIO:
                    input.type = 'radio';
                    break;
                case CHECK:
                    input.type = 'checkbox';
                    break;
                default:
                    break;
            }
            input.name = options[i].name;
            input.value = options[i].id;
            
            var label = document.createElement('label');
            label.textContent = options[i].name;

            var questionOption = document.createElement('options');
            questionOptions.appendChild(questionOption);

            questionOption.appendChild(input);
            questionOption.appendChild(label);
        }

        if (question_nb > 0) {
            var returnButton = document.createElement('button');
            returnButton.textContent = "Retour";
            returnButton.addEventListener('click', () => { previousQuestion() });
            questionDiv.appendChild(returnButton);
        }

        var questionButton = document.createElement('button');
        if (question_nb + 1 == questions.questions.length)
            questionButton.textContent = "Confirmer"
        else
            questionButton.textContent = "Suivant";
        questionButton.addEventListener('click', () => { createQuestionMap(questionDiv.id, input) });
        questionDiv.appendChild(questionButton);

        updateProgressBar();
    }

    displayQuiz();
    
}

// Fonction pour créer la carte des questions
function createQuestionMap(questionDivId, input) {
    // Récupérer tous les boutons radio ou checkboxes de la page
    var response = document.getElementById(questionDivId).querySelectorAll('input[type="' + input.type + '"]');

    // Créer un tableau pour stocker les valeurs sélectionnées
    selectedValues = [];

    // Parcourir les boutons pour trouver ceux qui sont cochés
    response.forEach(function (input) {
        if (input.checked) {
            selectedValues.push(input.value);
        }
    });

    // Ajouter l'ID de la question et les valeurs sélectionnées à la map
    questionMap.set(questionDivId, selectedValues);

    // Passer à la question suivante
    nextQuestion();
}

// Fonction pour passer à la question suivante
function nextQuestion() {
    // Vérifier s'il y a une question suivante
    if (currentQuestionIndex < questions.questions.length - 1) {
        // Passer à la question suivante
        currentQuestionIndex++;
        displayQuiz();
    } else {
        // Afficher les résultats
        document.getElementById(currentQuestionIndex).style.display = 'none';
        displayResults();
    }

    updateProgressBar();
}

// Fonction pour revenir à la question précédante
function previousQuestion() {
    // Vérifier s'il y a une question suivante
    if (currentQuestionIndex > 0) {
        // Passer à la question suivante
        currentQuestionIndex--;
        displayQuiz();
    }

    updateProgressBar();
}

function displayQuiz() {
    var allDivs = document.getElementById('quiz-container').querySelectorAll('div');

    for (var i = 0; i < allDivs.length; i++) {
        var currentDiv = allDivs[i];

        if (parseInt(currentDiv.id) != currentQuestionIndex) {
            currentDiv.style.display = 'none';
        } else {
            currentDiv.style.display = 'block';
        }
    }
}

// Fonction pour afficher les résultats à la fin du questionnaire
function displayResults() {
    var correctAnswersCount = 0;

    var resultMessage = document.createElement('p');
    container.appendChild(resultMessage);

    // Comparer les réponses stockées avec les réponses d'origine
    for (var i = 0; i < questions.questions.length; i++) {
        // Créer un tableau des options avec stat=true
        var originalOptions = questions.questions[i].options
            .filter(function(option) {
                return option.state === true;
            })
            .map(function(option) {
                return option.id;
            });

        var userOptions = questionMap.get(String(i));

        if (arraysEqual(originalOptions, userOptions)) {
            correctAnswersCount++;
        }

        if (!verifResult) {
            if (returnButton == null) {
                if (((questions.valid * questions.questions.length) / 100) < questions.valid) {
                    var returnButton = document.createElement('button');
                    returnButton.textContent = "Reset le quiz";
                    returnButton.addEventListener('click', () => { 
                        resetQuiz();
                    });
                    container.appendChild(returnButton);
                }
            }
        } else {
            verifResultQuiz(originalOptions, userOptions, i);
        }

    }

    // Afficher les statistiques
    resultMessage.textContent = 'Résultats : ' + correctAnswersCount + ' / ' + questions.questions.length + ' questions correctes.';

    var score = (correctAnswersCount / questions.questions.length) * 100
    saveUserQuizScore(questions.id_quiz, ID_USER, score);
}

// Fonction pour comparer deux tableaux
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (var i = 0; i < arr1.length; i++) {
        if (parseInt(arr1[i]) !== parseInt(arr2[i])) {
            return false;
        }
    }
    return true;
}

// Fonction pour vérifier si la source est un lien YouTube
function isYouTubeLink(source) {
    return source.includes('youtube.com') || source.includes('youtu.be');
}

// Fonction pour extraire l'identifiant de la vidéo YouTube à partir du lien
function getYouTubeVideoId(source) {
    // Extraire l'identifiant de la vidéo à partir du lien YouTube
    var regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    var match = source.match(regex);
    return match ? match[1] : null;
}

// Fonction pour mettre à jour la barre de progression
function updateProgressBar() {
    var progressBar = document.getElementById('progressBar');
    progressBar.value = currentQuestionIndex + 1;
    progressBar.max = questions.questions.length;
}

function resetQuiz() {
    // Effacer le contenu du conteneur actuel
    container.innerHTML = '';
    currentQuestionIndex = 0;
    createQuiz(questions.questions[currentQuestionIndex]);
    updateProgressBar();
}

function verifResultQuiz(originalOptions, userOptions, i) {
    var responseDiv = document.createElement('div');
    responseDiv.textContent = questions.questions[i].title;
    for (var j = 0; j < questions.questions[i].options.length; j++) {
        var option = questions.questions[i].options[j];
        var optionDiv = document.createElement('div');
        optionDiv.textContent = option.name;
        responseDiv.appendChild(optionDiv);

        if (userOptions && userOptions.includes("" + option.id + "")) {
            if (originalOptions.includes(option.id)) {
                // Réponse correcte
                optionDiv.style.backgroundColor = '#a1f796';
            } else {
                // Réponse incorrecte
                optionDiv.style.backgroundColor = '#e45752';
            }
        } else if (originalOptions.includes(option.id)) {
            // Réponse manquante
            optionDiv.style.backgroundColor = '#c9f0f5';
        }
    }
    container.appendChild(responseDiv);
}

// -- QUIZ-RESULT -- //
function createQuizResult(data) {
    var table = document.createElement('table');
    container.appendChild(table);

    // Create table header
    var headerRow = table.insertRow(0);
    var headers = ['ID Quiz', 'ID User', 'Score'];

    for (var i = 0; i < headers.length; i++) {
        var headerCell = headerRow.insertCell(i);
        headerCell.textContent = headers[i];
    }

    // Iterate through quiz results
    for (const quiz_result of data) {
        var row = table.insertRow(-1);

        // ID Quiz
        var cell1 = row.insertCell(0);
        cell1.textContent = quiz_result.id_quiz;

        // ID User
        var cell2 = row.insertCell(1);
        cell2.textContent = quiz_result.id_user;

        // Score
        var cell3 = row.insertCell(2);
        cell3.textContent = quiz_result.score;
    }
}

// -- QUIZ-MANAGE -- //
function createQuizManage() {
    var quizForm = createQuizForm();
    container.appendChild(quizForm);
}

function createQuizForm() {
    var form = document.createElement('div');

    // Titre du questionnaire
    var titleLabel = document.createElement('label');
    titleLabel.textContent = 'Titre du questionnaire:';
    form.appendChild(titleLabel);

    var titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'quizTitle';
    form.appendChild(titleInput);

    // Date de début
    var startLabel = document.createElement('label');
    startLabel.textContent = 'Date de début:';
    form.appendChild(startLabel);

    var startInput = document.createElement('input');
    startInput.type = 'datetime-local';
    startInput.name = 'quizStart';
    form.appendChild(startInput);

    // Date de fin
    var endLabel = document.createElement('label');
    endLabel.textContent = 'Date de fin:';
    form.appendChild(endLabel);

    var endInput = document.createElement('input');
    endInput.type = 'datetime-local';
    endInput.name = 'quizEnd';
    form.appendChild(endInput);

    // Score de validation
    var validLabel = document.createElement('label');
    validLabel.textContent = 'Score de validation:';
    form.appendChild(validLabel);

    var validInput = document.createElement('input');
    validInput.type = 'number';
    validInput.name = 'quizValid';
    form.appendChild(validInput);

    let buttonAddQuestion = document.createElement('button');
    buttonAddQuestion.textContent = "Ajouter une question";
    form.appendChild(buttonAddQuestion);

    let buttonAddQuiz = document.createElement('button');
    buttonAddQuiz.textContent = "Créer le quiz";
    form.appendChild(buttonAddQuiz);

    buttonAddQuestion.addEventListener('click', () => { 
        form.appendChild(createQuestionForm(form));
    });

    buttonAddQuiz.addEventListener('click', () => { 
        processQuizForm();
    });

    return form;
}

function createQuestionForm(form) {
    var question_form = document.createElement('div');
    question_form.classList.add('questionForm');
    form.appendChild(question_form);

    // Titre de la question
    var titleLabel = document.createElement('label');
    titleLabel.textContent = 'Titre de la question:';
    question_form.appendChild(titleLabel);

    var titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'questionTitle';
    question_form.appendChild(titleInput);

    // Source de la question
    var sourceLabel = document.createElement('label');
    sourceLabel.textContent = 'Source de la question:';
    question_form.appendChild(sourceLabel);

    var sourceInput = document.createElement('input');
    sourceInput.type = 'text';
    sourceInput.name = 'questionSource';
    question_form.appendChild(sourceInput);

    // Type de la question
    var typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type de la question (Une réponse possible: RADIO, Plusieurs réponse possible: CHECK):';
    question_form.appendChild(typeLabel);

    var typeInput = document.createElement('select');
    typeInput.name = 'questionType';

    var option1 = document.createElement('option');
    option1.value = '1';
    option1.text = 'RADIO';
    typeInput.add(option1);

    var option2 = document.createElement('option');
    option2.value = '2';
    option2.text = 'CHECK';
    typeInput.add(option2);

    question_form.appendChild(typeInput);

    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer';
    question_form.appendChild(deleteButton);

    deleteButton.addEventListener('click', function() {
        form.removeChild(question_form);
    });

    let buttonAddOption = document.createElement('button');
    buttonAddOption.textContent = "Ajouter une réponse";
    question_form.appendChild(buttonAddOption);

    buttonAddOption.addEventListener('click', () => { 
        question_form.appendChild(createOptionForm(question_form));
    });

    return question_form;
}

function createOptionForm(question_form) {
    var option_form = document.createElement('div');
    option_form.classList.add('optionForm');
    question_form.appendChild(option_form);

    // Titre de la question
    var titleLabel = document.createElement('label');
    titleLabel.textContent = 'Nom de la réponse:';
    option_form.appendChild(titleLabel);

    var titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'optionName';
    option_form.appendChild(titleInput);

    // Type de la option
    var typeLabel = document.createElement('label');
    typeLabel.textContent = 'Réponse:';
    option_form.appendChild(typeLabel);

    var typeInput = document.createElement('select');
    typeInput.name = 'optionType';

    var option1 = document.createElement('option');
    option1.value = '0';
    option1.text = 'FAUX';
    typeInput.add(option1);

    var option2 = document.createElement('option');
    option2.value = '1';
    option2.text = 'VRAI';
    typeInput.add(option2);

    option_form.appendChild(typeInput);

    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer';
    option_form.appendChild(deleteButton);

    deleteButton.addEventListener('click', function() {
        question_form.removeChild(option_form);
    });

    return option_form;
}

function processQuizForm() {
    var quizData = {
        "questions": [],
        "valid": 0,
        "start": "",
        "end": ""
    };

    // Titre du questionnaire
    quizData.title = document.querySelector('input[name="quizTitle"]').value;

    // Date de début
    quizData.start = document.querySelector('input[name="quizStart"]').value;

    // Date de fin
    quizData.end = document.querySelector('input[name="quizEnd"]').value;

    // Score de validation
    quizData.valid = parseInt(document.querySelector('input[name="quizValid"]').value);

    // Traitement des questions
    var questionForms = document.querySelectorAll('.questionForm');
    questionForms.forEach(function (questionForm) {
        var questionData = {
            "title": questionForm.querySelector('input[name="questionTitle"]').value,
            "source": questionForm.querySelector('input[name="questionSource"]').value,
            "options": [],
            "type": parseInt(questionForm.querySelector('select[name="questionType"]').value)
        };

        // Traitement des options
        var optionForms = questionForm.querySelectorAll('.optionForm');
        optionForms.forEach(function (optionForm) {
            var optionData = {
                "name": optionForm.querySelector('input[name="optionName"]').value,
                "state": optionForm.querySelector('select[name="optionType"]').value === '1' ? true : false
            };
            questionData.options.push(optionData);
        });

        quizData.questions.push(questionData);
    });

    // Affichage dans la console
    console.log(JSON.stringify(quizData, null, 2));
    insertNewQuiz(quizData);
}

// -- API SERVER -- //
function getAllQuiz() {
    fetch('http://10.114.236.239:3000/quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            command: 'getAllQuiz'
        }),
    })
    .then(response => response.json())
    .then(data => {
        createAllQuiz(data);
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
    });
}

function getQuizById(id_quiz) {
    fetch('http://10.114.236.239:3000/quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_quiz: id_quiz, 
            command: 'getQuizById'
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Gérer les données reçues ici
        questions = data;
        createQuiz();
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
    });
}

function saveUserQuizScore(id_quiz, id_user, score) {
    const data = {
        id_quiz: id_quiz,
        id_user: id_user,
        score: score,
    };

    fetch('http://127.0.0.1:3000/quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: data, 
            command: 'saveUserQuizScore'
        }),
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
    });
}

// Appeler la fonction du serveur depuis le client lorsqu'on accède à l'URL http://127.0.0.1:3000/quiz
if (window.location.pathname === '/quiz') {
    getAllQuiz();
}

function getAllQuizScore() {
    fetch('http://10.114.236.239:3000/quiz-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            command: 'getAllQuizScore'
        }),
    })
    .then(response => response.json())
    .then(data => {
        createQuizResult(data);
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
    });
}

// Appeler la fonction du serveur depuis le client lorsqu'on accède à l'URL http://127.0.0.1:3000/quiz-result
if (window.location.pathname === '/quiz-result') {
    getAllQuizScore();
}

function insertNewQuiz(data) {
    fetch('http://10.114.236.239:3000/quiz-manage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: data, 
            command: 'insertNewQuiz'
        }),
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
    });
}

// Appeler la fonction du serveur depuis le client lorsqu'on accède à l'URL http://127.0.0.1:3000/quiz-result
if (window.location.pathname === '/quiz-manage') {
    createQuizManage();
}