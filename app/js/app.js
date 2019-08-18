const admin = require('firebase-admin');

const path = require('path');
const serviceAccount = require(path.resolve(__dirname, './keys/serviceAccountKey.json'));

const fs = require('fs');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
});

const db = admin.firestore();
db.settings({
    timestampsInSnapshots: true
});


// Import Elements
const btnImport = document.getElementById("btn-import");
const btnSaveToFile = document.getElementById("btn-save-file");
const inputImport = document.getElementById("input-import");
const preImport = document.getElementById('pre-import');

// Export Elements
const preExport = document.getElementById('pre-export');
const fileInput = document.getElementById('file-input');
const btnUploadFirestore = document.getElementById("btn-upload-firestore");
const inputExport = document.getElementById("input-export");

const dataObject = {
    import: null,
    export: null
};

// Functions
async function buildImportData(collection) {
    const data = {};
    const snapshot = await db.collection(collection).get();
    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });
    return data;
}

function uploadToFirestore(collectionPath, jsonData) {

    return new Promise(async resolve => {
        // Start Uploading
        for (const docId in jsonData) {
            const data = jsonData[docId];
            await db.collection(collectionPath).doc(docId).set(data)
                .catch(err => {
                    resolve(err);
                })
        }
        resolve("Done")
    })

}

// Events

btnImport.onclick = async function () {

    // Get the input path
    const collectionPath = inputImport.value;

    // Check if path is not null or empty
    if (!collectionPath)
        return;

    // Show the document in 'pre' element
    const result = await buildImportData(collectionPath);
    preImport.innerHTML = JSON.stringify(result, null, 2);
    dataObject.import = result;
}


btnSaveToFile.onclick = async function () {

    // Get the input path and imported data
    const collectionPath = inputImport.value;
    const data = dataObject.import;

    // Check if data import of collection path is not null
    if (!data || !collectionPath)
        return;

    // Build the file name with the input path and save the data to a json file
    const fileName = `${collectionPath.replace(' ', '_')}.json`;
    fs.writeFile(fileName, JSON.stringify(data), function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

fileInput.onchange = function (event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        var json = JSON.parse(e.target.result);
        preExport.innerHTML = JSON.stringify(json, null, 2);
        dataObject.export = json;
    }
    reader.readAsText(file);
}

btnUploadFirestore.onclick = async function () {

    const data = dataObject.export;
    const collectionPath = inputExport.value;

    if (!data || !collectionPath)
        return;

    await uploadToFirestore(collectionPath, data)
        .then(result => {
            if (result == "Done")
                preExport.innerHTML = "Data successfully load";
            else
                preExport.innerHTML = result;
        })
}