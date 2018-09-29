var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const fieryFunctions = require('firebase-functions');
const PropertiesReader = require('properties-reader');
const wordsAPIUrl = 'https://wordsapiv1.p.mashape.com/words/';
const unirest = require('unirest');
const gmat_file = './functions/word-seed/gmat-words.ini';
const gre_file = './functions/word-seed/gre-words.ini';
const toefl_file = './functions/word-seed/toefl-words.ini';
const cat_file = './functions/word-seed/cat-words.ini';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://laconically-1b118.firebaseio.com"
});


var db = admin.firestore();
addToDb(gre_file,'gre_wordlist');

exports.addGMATData = fieryFunctions.https.onRequest((request, response) => {
    addToDb();
});

function addToDb(file,collection) {


    var properties = PropertiesReader(file);
    let l5words = properties.get('FIVE.words').split(',');
    let l4words = properties.get('FOUR.words').split(',');
    let l3words = properties.get('THREE.words').split(',');
    let l2words = properties.get('TWO.words').split(',');
    let l1words = properties.get('ONE.words').split(',');
    count = 99999999
    l5words.forEach(element => {
        fetchMeaningAndWriteToFirestore(element, count--, 5);
    });
    l4words.forEach(element => {
        fetchMeaningAndWriteToFirestore(element, count--, 4);
    });
    l3words.forEach(element => {
        fetchMeaningAndWriteToFirestore(element, count--, 3);
    });
    l2words.forEach(element => {
        fetchMeaningAndWriteToFirestore(element, count--, 2);
    });
    l1words.forEach(element => {
        fetchMeaningAndWriteToFirestore(element, count--, 1);
    });


    function fetchMeaningAndWriteToFirestore(element, id, difficulty) {
        unirest.get(wordsAPIUrl + element)
            .header("X-Mashape-Key", "aDu6Bxlt8zmsh81ztbhabBBx1mscp1ljhKAjsnigBjk8IgRzLe")
            .header("X-Mashape-Host", "wordsapiv1.p.mashape.com")
            .end(function (result) {
                console.log(result.status, result.body.results[0].definition);
                var docRef = db.collection(collection).doc(String(id));
                let examples = ['No examples available'];
                if (result.status, result.body.results[0].examples != null) {
                    examples = result.body.results[0].examples;
                }
                var setAda = docRef.set({
                    word: element,
                    meaning: [result.body.results[0].definition],
                    examples: examples,
                    type: result.body.results[0].partOfSpeech,
                    difficulty: difficulty
                });
            });
    }
}

