angular
	.module('applicationModule', ['connectionModule', 'cryptoModule', 'indexedDBModule', 'helpModule'])
	.controller('ApplicationController', function($timeout, $window, applicationService){
		var self = this;
		this.totalPrice = 0;
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
					self.products = applicationService.formProductList(productList);
				})
			})
		
		this.keyPress = function($event){
			var e = $event.keyCode;

			if(e < 48 || e > 57){
				$event.preventDefault();
			}	
		}

		this.generateKeyPair = function(){
			applicationService.createKeyPair()
				.then(rsaKeyPairs => {
					applicationService.prepareKeys(rsaKeyPairs);
				})
		}

		this.makeOrder = function(){
			var emptyOrder = true;
			var orderList = applicationService.formOrderList(self.products);
			if(orderList.length !== 0){
				self.totalPrice = applicationService.calcTotalPrice(orderList);
				applicationService.requestServerPublicKey()
					.then(serverPublicKey => {
						return applicationService.sendOrder(serverPublicKey, orderList);
					})
					.then(statusCode => {
						console.log(statusCode);
					})
			}else{
				$window.alert("Choose the order");
			}		
		}

	})
	.service('applicationService', function($window, indexedDBService, cryptoService, helpService, connectionService){
		var priceListUrl = "http://localhost:8080/getProducts";
		var sendOrderUrl = "http://localhost:8080/setOrder";
		var getOrderUrl = "http://localhost:8080/getOrder";
		var updateOrderUrl = "http://localhost:8080/updateOrder";
		var getServerPublicKeyUrl = "http://localhost:8080/getServerPublicKey";
		var updateUsersUrl = "http://localhost:8080/deleteUsers";
		
		var currentKeyPair;
		var b64RsaPublicKey;

		var product = function(name, price, amount){
			this.name = name;
			this.price = price;
			this.amount = amount;
		}

		return {
			requestProductList : requestProductList,
			prepareKeys : prepareKeys,
			createKeyPair : createKeyPair,
			checkKeyPairs : checkKeyPairs,
			formProductList : formProductList,
			requestServerPublicKey : requestServerPublicKey,
			sendOrder : sendOrder,
			formOrderList : formOrderList,
			calcTotalPrice : calcTotalPrice,
		}

		function prepareKeys(rsaKeyPairs) {
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

		function requestProductList(orderList){
			var encrResponse;
			var aesKey;

			return connectionService.requestGET(b64RsaPublicKey, priceListUrl)
				.then(response => {
					encrResponse = helpService.string2ArrayBuffer(atob(response));
					return cryptoService.restoreAesKey(encrResponse.slice(0,256), currentKeyPair.privateKey);
				})
				.then(decrAesKey => {
					aesKey = decrAesKey;
					return cryptoService.decryptRsaData(encrResponse.slice(256,512), currentKeyPair.privateKey)
				})
				.then(decrIv => {
					return cryptoService.decryptAesData(aesKey, decrIv, encrResponse.slice(512,encrResponse.length))
				})
				.then(priceList => {
					return JSON.parse(helpService.arrayBuffer2String(priceList));
				})
		}

		function formProductList(productListFromServer){
			var productList = [];
			for(var i = 0; i < productListFromServer.length; i++){
				var prod = productListFromServer[i];
				productList.push(new product(prod.name, prod.price, 0))
			}
			return productList;
		}

		function requestServerPublicKey(){
			var encrResponse;
			var aesKey;
			return connectionService.requestGET(b64RsaPublicKey, getServerPublicKeyUrl)
				.then(response => {
					encrServerPublicKey = helpService.string2ArrayBuffer(atob(response));
					return cryptoService.importRsaPublicKey(encrServerPublicKey);
				})
		}

		function sendOrder(serverPublicKey, orderList){
			var self = this;
			var iv = $window.crypto.getRandomValues(new Uint8Array(16));
			var aes;
			var encrOrderList;
			var encrIv;
			var encrAes;

			return cryptoService.generateAesKey()
				.then(aes => {
					self.aes = aes;
					return cryptoService.encryptAesData(aes, iv, helpService.string2ArrayBuffer(JSON.stringify(orderList)));
				})
				.then(encrOrderList => {
					self.encrOrderList = new Uint8Array(encrOrderList);
					return cryptoService.encryptRsaData(serverPublicKey, iv);
				})
				.then(encrIv => {
					self.encrIv =  new Uint8Array(encrIv);
					return cryptoService.wrapAesKey(self.aes, serverPublicKey);
				})
				.then(encrAes => {
					self.encrAes = new Uint8Array(encrAes);

					var order =  new Uint8Array(self.encrAes.length + self.encrIv.length + self.encrOrderList.length);

					order.set(self.encrAes);
					order.set(self.encrIv, self.encrAes.length);
					order.set(self.encrOrderList, self.encrAes.length + self.encrIv.length);

					return connectionService.requestPOST(b64RsaPublicKey, sendOrderUrl, btoa(helpService.arrayBuffer2String(order)));
				})
		}	

		function formOrderList(orderList){
			let list = new Array();

			for(var i = 0; i < orderList.length; i++){
				if(orderList[i].amount !== 0){
					list[list.length] = orderList[i];	
				}
			}
			return list;
		}

		function calcTotalPrice(orderList){
			var price = 0;
			for(var i=0; i<orderList.length; i++){
				price += orderList[i].price * orderList[i].amount;
			}
			return (Math.round(price * 100) / 100 );
		}
	})
