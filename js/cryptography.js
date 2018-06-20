function generateRsaKeyPair(){
	return window.crypto.subtle.generateKey({
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
	return window.crypto.subtle.exportKey(
		'spki',
		publicRsaKey)
	.catch(err => {
		console.error(err);
	})
}

