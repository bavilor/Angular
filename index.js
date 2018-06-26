angular
	.module('applicationModule', ['connectionModule', 'cryptoModule', 'indexedDBModule', 'helpModule'])
	.controller('ApplicationController', function($timeout, $window, applicationService){
		var self = this;
		this.totalPrice = 0;
		this.products = [];
		this.disabledButt = true; 

		applicationService.checkKeyPairs()
		.then(rsaKeyPairs => {
			return applicationService.prepareKeys(rsaKeyPairs);
		})
		.then(empty => {
			return applicationService.requestProductList("http://localhost:8080/getProducts");
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
				applicationService.sendProductList(orderList, "http://localhost:8080/setOrder", "http://localhost:8080/getServerPublicKey")
				.then(statusCode => {
					console.log(statusCode);
				})
			}else{
				$window.alert("Choose the order");
			}		
		}

		this.updateOrder = function(){
			self.disabledButt = false;
			applicationService.requestOrderList("http://localhost:8080/getOrder")
			.then(orders => {
				for(var i=0; i<self.products.length; i++){
					var record = self.products[i];
					record.amount = 0;

					for(var j=0; j<orders.length; j++){
						if(record.price === orders[j].price){
							record.amount += orders[j].amount;
						}
					}
				}
				$timeout(function() {})
			})
		}

		this.sendOrder = function(){
			applicationService.sendUpdate(self.products, "http://localhost:8080/updateOrder", "http://localhost:8080/getServerPublicKey")
			.then(response => {

				if(response === 200){
					applicationService.sendDelete("http://localhost:8080/deleteUsers", "http://localhost:8080/getServerPublicKey");
				}
			})		
		}
	})
	.service('applicationService', function($window, indexedDBService, cryptoService, helpService, connectionService){		
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
			sendProductList : sendProductList,
			formOrderList : formOrderList,
			calcTotalPrice : calcTotalPrice,
			requestOrderList : requestOrderList,
			sendUpdate : sendUpdate,
			sendDelete : sendDelete,
			formEncrPostRequest : formEncrPostRequest,

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

		function requestProductList(url){
			var encrResponse;

			return connectionService.requestGET(b64RsaPublicKey, url)
			.then(response => {
				encrResponse = helpService.string2ArrayBuffer(atob(response));
				return decryptData(
					encrResponse.slice(0,256), 
					encrResponse.slice(256,512), 
					encrResponse.slice(512,encrResponse.length), 
					currentKeyPair.privateKey)
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

		function requestServerPublicKey(url){
			return connectionService.requestGET(b64RsaPublicKey, url)
			.then(response => {
				encrServerPublicKey = helpService.string2ArrayBuffer(atob(response));
				return cryptoService.importRsaPublicKey(encrServerPublicKey);
			})
		}

		function formEncrPostRequest(serverPublicKey, orderList){
			var self = this;
			var iv = $window.crypto.getRandomValues(new Uint8Array(16));

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

				return order;
			})
		}

		function sendProductList(orderList, requestURL, serverPublicKeyURL){
			return requestServerPublicKey(serverPublicKeyURL)
			.then(serverPublicKey => {
				return formEncrPostRequest(serverPublicKey, orderList)
			})
			.then(order => {
				return connectionService.requestPOST(b64RsaPublicKey, requestURL, btoa(helpService.arrayBuffer2String(order)));
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

		function requestOrderList(url){
			var self = this;
			self.orders = "";
			self.pos = 0;
			self.keyIndex = 0;	

			return connectionService.requestGET(b64RsaPublicKey, url)
			.then(response => {
				self.encrResponse = helpService.string2ArrayBuffer(atob(response));
				return indexedDBService.readKeyPairs()
			})
			.then(allKeyPairs => {
				self.allKeyPairs = allKeyPairs;

				var p = new Promise((resolve, reject) => {
					resolve(rep());

					function rep(){
						return cryptoService.decryptRsaData(self.encrResponse.slice(self.pos+512, self.pos+768), currentKeyPair.privateKey)
						.then(length => {
							self.length = parseInt(helpService.arrayBuffer2String(length));

							self.encrAes = self.encrResponse.slice(self.pos, self.pos+256);
							self.encrIv = self.encrResponse.slice(self.pos+256, self.pos+512);
							self.encrData = self.encrResponse.slice(self.pos+768, self.pos+768+self.length);

							return decryptData(self.encrAes, self.encrIv, self.encrData, self.allKeyPairs[self.keyIndex].privateKey);
						})
						.then(order => {
							if(order !== undefined){
								self.orders += helpService.arrayBuffer2String(order);
							}
							if(self.keyIndex < self.allKeyPairs.length-1){
								self.keyIndex++;
								return rep();
							}else if (self.pos+768+self.length < self.encrResponse.byteLength){
								self.keyIndex = 0;
								self.pos += 768+self.length;
								return rep();
							}else{
								return self.orders;
							}	
						})
					}
				})
				return p;
			})
			.then(orders => {
				return JSON.parse(orders.replace(/\]\[/g, ","));
			})
		}

		function decryptData(encrAes, encrIv, encrData, privateKey){
			var self = this;

			return cryptoService.restoreAesKey(encrAes, privateKey)
			.then(aes => {
				self.aes = aes;
				return cryptoService.decryptRsaData(encrIv, privateKey);
			})
			.then(iv => {
				return cryptoService.decryptAesData(self.aes, iv, encrData);
			})
		}

		function sendUpdate(orderList, requestURL, serverPublicKeyURL){
			var self = this;
			var iv = $window.crypto.getRandomValues(new Uint8Array(16));

			return requestServerPublicKey(serverPublicKeyURL)
			.then(serverPublicKey => {
				return formEncrPostRequest(serverPublicKey, orderList)
			})
			.then(encrOrder => {
				self.encrOrder = encrOrder;
				return cryptoService.generateRsaPss();
			})
			.then(rsaPss => {
				self.rsaPss = rsaPss;
				return cryptoService.signingData(helpService.string2ArrayBuffer('key'), rsaPss.privateKey);
			})
			.then(sign => {
				self.sign = new Uint8Array(sign);
				return cryptoService.exportRsaPss(self.rsaPss.publicKey);
			})
			.then(exportedRsaPss => {
				var order =  new Uint8Array(self.encrOrder.length+self.sign.length);

				order.set(self.encrOrder);
				order.set(self.sign, self.encrOrder.length);

				return connectionService.requestPOST(
					b64RsaPublicKey, 
					requestURL, 
					btoa(helpService.arrayBuffer2String(order)),
					JSON.stringify(helpService.transformPublicKey(exportedRsaPss)));
			})
		}

		function sendDelete(requestURL, serverPublicKeyURL){
			var self = this;
			self.keysArray = [];
			self.keyIndex = 0;

			return indexedDBService.readKeyPairs()
			.then(allKeyPairs => {
				var p = new Promise((resolve, reject) => {
					resolve(rep());

					function rep(){
						return cryptoService.exportPublicKey(allKeyPairs[self.keyIndex].publicKey)
						.then(publicKeyArrayBuffer => {
							self.keysArray[self.keyIndex] =  btoa(helpService.arrayBuffer2String(publicKeyArrayBuffer))
							self.keyIndex++;

							if(self.keyIndex < allKeyPairs.length-1){
								return rep();
							}else{
								return self.keysArray;
							}
						})		
					}
				})
				return p;
			})
			.then(result => {
				return sendUpdate(result, requestURL, serverPublicKeyURL);
			})
			.then(resp => {
				console.log(resp);
			})
		}
	})					