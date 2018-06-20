var main = angular.module('main', [])

main.controller('mainController', function($scope){
	readKeyPairsFromDB();
	$scope.totalPrice = 0;
	$scope.tableData = [1,2];
	$scope.generateKeyPair = function(){
		generateKeyPair();
	}
})

