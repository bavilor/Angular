angular
	.module('applicationModule', ['connectionModule', 'cryptoModule', 'indexedDBModule', 'helpModule'])
	.controller('ApplicationController', function($timeout, applicationService){
		var self = this;
		this.totalPrice = applicationService.getTotalPrice();
		this.products = [];

		applicationService.prepareKeys()	
		.then(empty => {
			return applicationService.requestProductList();
		})
		.then(productList => {
			$timeout(function() {
				self.products = productList;
			})
		})
		
		this.keyPress = function($event){
			return false;
		}



	})
	.service('applicationService', function(indexedDBService, cryptoService, helpService, connectionService){
		var priceListUrl = "http://localhost:8080/getProducts";
		var sendOrderUrl = "http://localhost:8080/setOrder";
		var getOrderUrl = "http://localhost:8080/getOrder";
		var updateOrderUrl = "http://localhost:8080/updateOrder";
		var getServerPublicKeyUrl = "http://localhost:8080/getServerPublicKey";
		var updateUsersUrl = "http://localhost:8080/deleteUsers";

		var currentKeyPair;
		var b64RsaPublicKey;
		var totalPrice = 0;
		
		return {
			getTotalPrice : getTotalPrice,
			setTotalPrice : setTotalPrice,
			setCurrentKeyPair : setCurrentKeyPair,
			getCurrentKeyPair : getCurrentKeyPair,
			prepareKeys : prepareKeys,
			requestProductList : requestProductList,
		}

		function prepareKeys() {
			var x = new Promise((resolve, reject) => {
				indexedDBService.loadKeyPairs()
				.then(keyPairs => {
					currentKeyPair = keyPairs[keyPairs.length-1];
					console.log("Keys're checked");
					return cryptoService.exportPublicKey(currentKeyPair.publicKey);
				})
				.then(publicKeyArrayBuffer => {
					b64RsaPublicKey = JSON.stringify(helpService.transformPublicKey(publicKeyArrayBuffer));
					console.log("Key is exported");
					resolve();
				})		
			})
			return x;
		}

		function requestProductList(){
			return connectionService.getPriceList(b64RsaPublicKey, priceListUrl)
			.then(result => {
				return cryptoService.decodeProductList(result, currentKeyPair)
			})
		}

		function setTotalPrice(newTotalPrice){
			totalPrice = newTotalPrice;	
			return totalPrice;
		}

		function getTotalPrice(){
			return totalPrice;
		}

		function setCurrentKeyPair(newCurrentKeyPair){
			currentKeyPair = newCurrentKeyPair;
		}	

		function getCurrentKeyPair(){
			return currentKeyPair;
		}
})