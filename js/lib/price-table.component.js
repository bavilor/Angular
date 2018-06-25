angular
	.module('applicationModule')
	.component('priceTable', {
		template:
			'<table id="table" align="center">' +
			  	'<thead>' +
			  		'<tr>' +
			  			'<th style="width: 80px;"> Name </th>' +
			  			'<th style="width: 80px;"> Price </th>' +
			  			'<th style="width: 80px;"> Amount</th>' +
			  		'</tr>' +
			  	'</thead>' +	
			  	'<tbody>' +
					'<tr ng-repeat="product in $ctrl.products">' +
						'<td width="100px" align="center">{{product}} </td>' +
						'<td width="100px" align="center">{{product}} </td>' +
						'<td>' +
							'<input type="number" name="amount" min="0"  placeholder="0">' +
						'</td>' +
					'</tr>' +
			  	'</tbody>' +
			  '</table>',
		controller: function priceTableController() {
			this.products = [0,1];
		}
	});