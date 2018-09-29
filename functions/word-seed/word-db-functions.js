const fieryadmin = require('firebase-admin');
const fieryFunctions = require('firebase-functions');
const PropertiesReader = require('properties-reader');

fieryadmin.initializeApp(fieryFunctions.config().firebase);

var db = fieryadmin.firestore();

exports.printAll = function printAll() {


    var properties = PropertiesReader('./functions/word-seed/gmat-words.ini');
    let l5words = properties.get('FIVE.words').split(',');
    let l4words = properties.get('FOUR.words').split(',');
    let l3words = properties.get('THREE.words').split(',');
    let l2words = properties.get('TWO.words').split(',');
    let l1words = properties.get('ONE.words').split(',');
    console.log(l5words);
    console.log(l4words);
    console.log(l3words);
    console.log(l2words);
    console.log(l1words);

    var docRef = db.collection('users').doc('alovelace');

    var setAda = docRef.set({
        first: 'Ada',
        last: 'Lovelace',
        born: 1815
    });

    // db.collection('gmat-wordlist').get()
    // .then((snapshot) => {
    //   snapshot.forEach((doc) => {
    //     console.log(doc.id, '=>', doc.data());
    //   });
    // })
    // .catch((err) => {
    //   console.log('Error getting documents', err);
    // });
}
