function getB64RsaPublicKey(publicKeyArrayBuffer){
	var str = arrayBuffer2String(publicKeyArrayBuffer);
	b64str = btoa(str);
	return string2Uint8Array(b64str);
}

function arrayBuffer2String(arrayBuffer) {
  var str = '';
  var bytes = new Uint8Array(arrayBuffer);

  for (var i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i]);
  }
  return str;
}

function string2Uint8Array(string){
	var uint8 = new Array();

	for (var i=0; i < string.length; i++) {
    	uint8[i] = string.charCodeAt(i);
 	}
 	return uint8;
}