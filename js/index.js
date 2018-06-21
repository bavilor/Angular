var priceListUrl = "http://localhost:8080/getProducts";
var sendOrderUrl = "http://localhost:8080/setOrder";
var getOrderUrl = "http://localhost:8080/getOrder";
var updateOrderUrl = "http://localhost:8080/updateOrder";
var getServerPublicKeyUrl = "http://localhost:8080/getServerPublicKey";
var updateUsersUrl = "http://localhost:8080/deleteUsers";

angular
	.module('applicationModule', ['tableModule', 'buttonsModule'])
	.controller('ApplicationController', function(checkKeyPairService, connectionService, tableData, totalPrice){		
		this.products = [];
		this.currentKeyPair;
		this.b64RsaPublicKey;
		this.totalPrice = totalPrice;

		totalPrice = 9;
		checkKeyPairService.checkKeys()
		.then(keyPairs => {
			this.currentKeyPair = keyPairs[keyPairs.length-1];
			console.log(this.currentKeyPair);
			totalPrice = 9;
		})
	})

angular
	.module('tableModule', [])
	.controller('TableController', function(){

	})

angular
	.module('buttonsModule', [])
	.controller('ButtonsController', function(){
		this.makeOrder = function(){		
			console.log("Making order");
		}
	})
	.value('tableData', [])
	.value('totalPrice', 0)