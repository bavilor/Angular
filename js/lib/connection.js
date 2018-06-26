angular
	.module('connectionModule', [])
	.service('connectionService', function() {

		return {
			requestGET : requestGET,
			requestPOST : requestPOST
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
				console.error("Can't connected to the server!");
				console.error(err);
			})
		}

		function requestPOST(b64PublicRsaKey, url, order, b64PublicRsaPss){
			return $.ajax({
		    	type: 'POST',
		    	contentType:'application/json',
		    	url: url,
		    	beforeSend: request => {
		      		request.setRequestHeader('key', b64PublicRsaKey),
		      		request.setRequestHeader('sign', b64PublicRsaPss)
		    	},
		    	data: order,
		  	})
		  	.then(function(xml, textStatus, xhr) {
        		return xhr.status;
    		})
		  	.catch(err => {
		    	console.error(err);
		  	})  	
		}
})
