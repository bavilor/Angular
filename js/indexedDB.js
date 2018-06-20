var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

function writeKeyPair (keyPair) {

	var open = indexedDB.open("AngularKeyStore", 1);

	open.onupgradeneeded = function() {
	    var db = open.result;
	    var store = db.createObjectStore("keyPair", {keyPath: "id", autoIncrement: true});
	};

	open.onsuccess = function() {
		var db = open.result;
	    var tx = db.transaction("keyPair", "readwrite");
	    var store = tx.objectStore("keyPair");

	   	store.put(keyPair);
	   	console.log("Keys're saved");

	    tx.oncomplete = function() {
	        db.close();
	    };
	}

	open.onerror = function(error){
		console.error(error);
	}
}

function readKeyPairs(){

	var open = indexedDB.open("AngularKeyStore", 1);

	open.onupgradeneeded = function() {
	    console.error("DB isn't exist!");
	};

	open.onsuccess = function() {
	    var db = open.result;
	    var tx = db.transaction("keyPair", "readwrite");
	    var store = tx.objectStore("keyPair");


	   	var request = store.getAll();

	    request.onsuccess = function() {
	        allKeyPairs = request.result;
	        console.log("Keys're downloaded");
	    };
	    tx.oncomplete = function() {
	        db.close();
	    };
	}

	open.onerror = function(error){
		console.error(error);
	}
}