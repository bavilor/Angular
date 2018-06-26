angular
	.module('cryptoModule', ['helpModule'])
	.service('cryptoService', function($window, helpService){
		
		return {
			generateRsaKeys : generateRsaKeyPair,
			exportPublicKey : exportPublicRsaKey,
			restoreAesKey : restoreAesKey,
			decryptRsaData : decryptRsaData,
			decryptAesData : decryptAesData,
			importRsaPublicKey : importRsaPublicKey,
			encryptAesData : encryptAesData,
			encryptRsaData : encryptRsaData,
			wrapAesKey : wrapAesKey,
			generateAesKey : generateAesKey,
			generateRsaPss : generateRsaPss,
			signingData : signingData,
			exportRsaPss : exportRsaPss
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
			return $window.crypto.subtle.decrypt(
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
		  	return $window.crypto.subtle.decrypt(
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

		function importRsaPublicKey(publicKeyArrayBuffer){
			return $window.crypto.subtle.importKey(
		    	"spki",
		    	publicKeyArrayBuffer,
		    	{
			     	name:'RSA-OAEP',
			      	hash:{ name:'SHA-256' }
		  		},
		  		false,
		  		['encrypt', 'wrapKey'])
			.catch(err => {
			    console.error(err);
			});
		}

		function generateAesKey(){
			return $window.crypto.subtle.generateKey(
				{
					name: 'AES-CBC',
					length: 128
				},
				true, 
				['encrypt'])
			.catch(err => {
				console.error(err);
			})
		}

		function encryptAesData(aes, iv, data){
			return $window.crypto.subtle.encrypt(
				{
					name: 'AES-CBC',
					iv: iv
				},
				aes,
				data)
			.catch(err => {
				console.error(err);
			})
		}

		function encryptRsaData(publicKey, data){
		  	return $window.crypto.subtle.encrypt(
			  	{
			    	name: "RSA-OAEP"
			  	},
			  	publicKey,
			  	data)
			.catch(err => {
			      console.error(err);
			});
		}

		function wrapAesKey(aes, publicKey){
			return $window.crypto.subtle.wrapKey(
				"raw",
				aes,
				publicKey,
				{
					name: "RSA-OAEP",
					hash: {name: "SHA-256"}
				})
			.catch(err => {
				console.error(err);
			})	
		}

		function generateRsaPss(){
			return $window.crypto.subtle.generateKey(
		    {
		        name: "RSA-PSS",
		        modulusLength: 2048, 
		        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
		        hash: {name: "SHA-256"},
		    },
		    true, 
		    ["sign","verify"] )
			.catch(function(err){
			    console.error(err);
			});
		}

		function signingData(data, key){
			return window.crypto.subtle.sign(
		    {
		        name: "RSA-PSS",
		        saltLength: 128, 
		    },
		    key,
		    data)
			.catch(err => {
			    console.error(err);
			});
		}

		function exportRsaPss(key){
			return window.crypto.subtle.exportKey(
		    "spki", 
		    key)
			.catch(err => {
			    console.error(err);
			});
		}
})