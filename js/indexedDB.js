var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

angular
	.module('indexedDBModule', ['cryptoModule'])
	.service('indexedDBService', function(cryptoService){

		return {
			loadKeyPairs : loadKeyPairs,
			createKeyPair : createSaveRsaKeyPair
		}

		function createSaveRsaKeyPair(){
			return cryptoService.generateRsaKeys()
				.then(keyPair => {
					writeKeyPair(keyPair);
					return readKeyPairs();
				})
		}

		function loadKeyPairs() {
			return readKeyPairs()
				.then(keyPairs => {
					if(keyPairs.length !== 0){
						return keyPairs;
					}else{
						return createSaveRsaKeyPair();
					}
				})
				.catch(res => {
					return createSaveRsaKeyPair();
				})
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

				    reject();
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