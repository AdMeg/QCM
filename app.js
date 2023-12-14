var questionMap = new Map();
var selectedValues = [];
var verifResult = false;
var questions;

var container = document.getElementById('quiz-container');

// Variable test
var RADIO = 1, CHECK = 2;
var ID_USER = 1;

/*
// Exemple de question
var question1 = {
    id: 1,
    title: 'Quelles sont les orthographes possibles ?',
    source: 'https://urban-factory.com/3665-thickbox_default/hubee-mini-station-d-accueil-usb-c-multi-ecran-4k-100w.jpg',
    options: [
        {id: 100, name: 'Anguelo', state: true}, 
        {id: 101, name: 'Enjilo', state: false}, 
        {id: 102, name: 'Angelio', state: true}, 
        {id: 103, name: 'Engilio', state: false}
    ],
    type: CHECK
};

var question2 = {
    id: 2,
    title: 'Quel est la chose la plus petite ?',
    source: 'https://youtu.be/cMrTGqwJJXo?si=Mmt9ABPgKrqmYN1T',
    options: [
        {id: 200, name: 'Fourmi', state: true}, 
        {id: 201, name: 'Microbe', state: false}, 
        {id: 202, name: 'Angelo', state: false}
    ],
    type: RADIO
};

var questions = {questions: [question1, question2], valid: 80, start: '2023-11-27', end: '2023-11-30'}; // Tableau de questions
*/

// Index de la question actuelle
var currentQuestionIndex = 0;

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

//Test serveur
// Exemple de fonction pour effectuer une requête POST avec fetch
function getQuizById(id_quiz) {
    fetch('http://127.0.0.1:3000/', {
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

    fetch('http://127.0.0.1:3000/', {
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
  
// Appeler la fonction pour récupérer les données du quiz
getQuizById(1);

function getAllQuizScore() {
    fetch('http://127.0.0.1:3000/quiz-result', {
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
        // Gérer les données reçues ici
        console.log(data);
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
    });
}

getAllQuizScore();