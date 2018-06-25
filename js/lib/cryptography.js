angular
	.module('cryptoModule', ['helpModule'])
	.service('cryptoService', function($window, helpService){
		
		return {
			generateRsaKeys : generateRsaKeyPair,
			exportPublicKey : exportPublicRsaKey,
			decodeProductList : decodeServerResponse
		}

		function decodeServerResponse(response, currentKeyPair){
			var x = new Promise((resolve, reject) => {
				var encrResponse = helpService.string2ArrayBuffer(atob(response));
				var aesKey;

				restoreAesKey(encrResponse.slice(0,256), currentKeyPair.privateKey)
					.then(decrAesKey => {
						aesKey = decrAesKey;
						return decryptRsaData(encrResponse.slice(256,512), currentKeyPair.privateKey)
					})
					.then(decrIv => {
						return decryptAesData(aesKey, decrIv, encrResponse.slice(512,encrResponse.length))
					})
					.then(priceList => {
						resolve(JSON.parse(helpService.arrayBuffer2String(priceList)));
					})
			})
			return x;
		}

		function generateRsaKeyPair(){
			return $window.crypto.subtle.generateKey(
				{
					name:'RSA-OAEP',
					modulusLength:2048,
					publicExponent:new Uint8Array([0x01,0x00,0x01]),
					hash:{name:'SHA-256'}
				},
				true,
				['encrypt', 'decrypt', 'unwrapKey'])
			.catch(err => {
				console.error(err);
			})
		}

		function exportPublicRsaKey(publicRsaKey){
			return $window.crypto.subtle.exportKey(
				'spki',
				publicRsaKey)
			.catch(err => {
				console.error(err);
			})
		}

		function restoreAesKey(encrAes, privateKey){
		  	return $window.crypto.subtle.unwrapKey(
		    	'raw',
		    	encrAes,
		    	privateKey,
		    	{
			      	name: 'RSA-OAEP',
			      	modulusLength: 2048,
			      	publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			      	hash: {name: 'SHA-256'}
		    	},
		    	{
			      	name: 'AES-CBC',
			      	length: 128
		    	},
			    false,
			    ['decrypt'])
			.catch(err => {
			    console.error(err);
			});
		}

		function decryptRsaData(encrRsaData, privateKey){
			return window.crypto.subtle.decrypt(
				{
			    	name: 'RSA-OAEP',
			  	},
			  	privateKey,
			  	encrRsaData)
		  	.catch(err => {
		    	console.error(err);
		  	}); 
		}

		function decryptAesData(aesKey, iv, encrAesData){
		  	return window.crypto.subtle.decrypt(
			    {
			      	name: 'AES-CBC',
			      	iv: iv
			    },
			    aesKey,
			    encrAesData)
			.catch(err => {
			   	console.error(err);
			});
		}
})