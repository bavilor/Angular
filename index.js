angular
	.module('applicationModule', ['connectionModule', 'cryptoModule', 'indexedDBModule', 'helpModule'])
	.controller('ApplicationController', function($timeout, applicationService){
		var self = this;
		this.totalPrice = applicationService.getTotalPrice();
		this.products = [];



		applicationService.checkKeyPairs()
			.then(rsaKeyPairs => {
				return applicationService.prepareKeys(rsaKeyPairs);
			})
			.then(empty => {
				return applicationService.requestProductList();
			})
			.then(productList => {
				$timeout(function() {
					self.products = productList;
				})
			})
		
		this.keyPress = function($event){
			var e = $event.keyCode;
			if(e === 45 || e === 101 || e === 46){
				$event.preventDefault();
			}	
		}

		this.generateKeyPair = function(){
			applicationService.createKeyPair()
				.then(rsaKeyPairs => {
					applicationService.prepareKeys(rsaKeyPairs);
				})
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
			requestProductList : requestProductList,
			prepareKeys : prepareKeys,
			createKeyPair : createKeyPair,
			checkKeyPairs : checkKeyPairs,
		}

		function prepareKeys(rsaKeyPairs) {
			console.log(rsaKeyPairs);
				currentKeyPair = rsaKeyPairs[rsaKeyPairs.length-1];
				return cryptoService.exportPublicKey(currentKeyPair.publicKey)
					.then(publicKeyArrayBuffer => {
						b64RsaPublicKey = JSON.stringify(helpService.transformPublicKey(publicKeyArrayBuffer));
						console.log("Key is exported");
					})		
		}

		function checkKeyPairs() {
			return indexedDBService.readKeyPairs()
				.then(rsaKeyPairs => {
					if(rsaKeyPairs.length !== 0){
						console.log("Keys're checked");
						return rsaKeyPairs;
					}else{
						return createKeyPair();
					}
				})
		}

		function createKeyPair(){
			return cryptoService.generateRsaKeys()
				.then(rsaKeyPair => {
					indexedDBService.writeKeyPair(rsaKeyPair);
					return indexedDBService.readKeyPairs();
				})
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
