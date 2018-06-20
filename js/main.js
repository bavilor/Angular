var priceListUrl = 'http://localhost:8080/getProducts';
var sendOrderUrl = 'http://localhost:8080/setOrder';
var getOrderUrl = 'http://localhost:8080/getOrder';
var updateOrderUrl = "http://localhost:8080/updateOrder";
var getServerPublicKeyUrl = "http://localhost:8080/getServerPublicKey";
var updateUsersUrl = "http://localhost:8080/deleteUsers";

var currentKeyPair;
var b64RsaPublicKey;
var allKeyPairs;


function readKeyPairsFromDB(){
	var keys = new Promise((resolve, reject) => {
		readKeyPairs();

		function checkKeys(){
			if(allKeyPairs != undefined){
				console.log(allKeyPairs);
			}else{
				console.log(allKeyPairs);
			}
		}


	})	

	return keys;

	
	
}





function generateKeyPair(){
	generateRsaKeyPair()
	.then(keyPair => {
		currentKeyPair = keyPair;
		writeKeyPair(keyPair);
		allKeyPairs = readKeyPairs();
		return exportPublicRsaKey(keyPair.publicKey);
	})
	.then(publicKeyArrayBuffer => {
		b64RsaPublicKey = getB64RsaPublicKey(publicKeyArrayBuffer);
		alert("Key was generated successfully")
	})
}

function getPriceList(){
	
}