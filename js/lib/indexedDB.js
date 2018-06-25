var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

angular
	.module('indexedDBModule', ['cryptoModule'])
	.service('indexedDBService', function(cryptoService){

		return {
			readKeyPairs : readKeyPairs,
			writeKeyPair : writeKeyPair
		}

		function writeKeyPair(keyPair) {
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
				console.log("Key pair was saved");

				tx.oncomplete = function() {
				    db.close();
				};
			}

			open.onerror = function(error){
				console.error(error);
			}
		}

		function readKeyPairs(){

			var keyPairs = new Promise((resolve, reject) =>{

				var open = indexedDB.open("AngularKeyStore", 1);

				open.onupgradeneeded = function() {
				    console.error("DB isn't exist. Creating the new one..");

				    var db = open.result;
			    	var store = db.createObjectStore("keyPair", {keyPath: "id", autoIncrement: true});

				    resolve([]);
				};

				open.onsuccess = function() {
				    var db = open.result;
				    var tx = db.transaction("keyPair", "readwrite");
				    var store = tx.objectStore("keyPair");
				   	var request = store.getAll();

				    request.onsuccess = function() {
				        resolve(request.result);
				    };

				    tx.oncomplete = function() {
				        db.close();
				    };
				}
				open.onerror = function(error){
					console.error(error);
				}
			})

			return keyPairs;	
		}
})