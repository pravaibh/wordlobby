var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const fieryFunctions = require('firebase-functions');
const PropertiesReader = require('properties-reader');
const wordsAPIUrl = 'https://wordsapiv1.p.mashape.com/words/';
const unirest = require('unirest');
const gmat_file = './functions/word-seed/gmat-words.ini';
const gre_file = './functions/word-seed/gre-words.ini';
const lite_file = './functions/word-seed/lite-words.ini';
const toefl_file = './functions/word-seed/toefl-words.ini';
const cat_file = './functions/word-seed/cat-words.ini';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://laconically-1b118.firebaseio.com"
});


var db = admin.firestore();
function updateDailyWordAndSendNotifications() {
    let indexRef = db.collection('lite-words').doc('active-word-index');
    indexRef.get().then((val) => {
        console.log(val.data().index);
        let ind = val.data().index;
        console.log(ind);
        db.collection('lite-words').doc(String(ind)).get().then((value) => {
            console.log(value.data());
            console.log(ind);
            db.collection('lite_wordlist').doc(String(ind)).set(value.data());
            sendNotification(value.data().word, value.data().meaning[0]);
            return 1;
        }).catch(err => console.log(err));
        indexRef.update({ index: ind - 1 });
        return 1;
    }).catch((err) => console.log(err));
}

function sendNotification(word, meaning) {
    // The topic name can be optionally prefixed with "/topics/".
    var topic = 'word_of_day';

    // See documentation on defining a message payload.
    var message = {
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: {
                title: 'Your word for today is '.concat(word),
                body: meaning,
                icon: 'stock_ticker_update',
                color: '#f45342'
            }
        },
        topic: topic
    };

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            return 1;
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

exports.addGMATData = fieryFunctions.https.onRequest((request, response) => {
    addToDb();
});

function addToDb(file, collection) {


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
                if (result.status, result.body.results[0].examples !== null) {
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

exports.daily_job =
    fieryFunctions.pubsub.topic('daily-tick').onPublish((event) => {
        updateDailyWordAndSendNotifications();
    });