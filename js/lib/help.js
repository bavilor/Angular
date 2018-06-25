angular
	.module('helpModule', [])
	.service('helpService', function(){
		return {
			transformPublicKey : getB64FromRsaPublicKey,
			string2Uint8Array : string2Uint8Array,
			string2ArrayBuffer : string2ArrayBuffer,
			arrayBuffer2String : arrayBuffer2String,
		}

		function getB64FromRsaPublicKey(publicKeyArrayBuffer){
			var str = arrayBuffer2String(publicKeyArrayBuffer);
			b64str = btoa(str);
			return string2Uint8Array(b64str);
		}

		function arrayBuffer2String(arrayBuffer) {
		 	var str = '';
		 	var bytes = new Uint8Array(arrayBuffer);

		  	for (var i = 0; i<bytes.byteLength; i++) {
		      	str += String.fromCharCode(bytes[i]);
		 	}
		  	return str;
		}

		function string2Uint8Array(string){
			var uint8 = new Array();

			for (var i=0; i<string.length; i++) {
		    	uint8[i] = string.charCodeAt(i);
		 	}
		 	return uint8;
		}

		function string2ArrayBuffer(string) {
			var buf = new ArrayBuffer(string.length); 
			var bufView = new Uint8Array(buf);

			for (var i=0; i<string.length; i++) {
		 		bufView[i] = string.charCodeAt(i);
			}
		  	return buf;
		}
})