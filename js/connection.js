function requestGet(url, b64PublicRsaKey){
	console.log(b64PublicRsaKey);
	return $.ajax({
		type:'GET',
		url:url,
		beforeSend: request=>{
			request.setRequestHeader('key', b64PublicRsaKey);
		}
	})
	.catch(err => {
		console.error(err);
	})
}