angular
	.module('connectionModule', [])
	.service('connectionService', function() {

		return {
			getPriceList : requestGET
		}

		function requestGET(b64PublicRsaKey, url){
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
})
