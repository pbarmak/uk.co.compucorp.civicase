(function (angular, $, _) {
  var module = angular.module('civicase');

  module.directive('civicaseContactCaseTabCaseList', function () {
    return {
      restrict: 'EA',
      replace: true,
      controller: CivicaseContactCaseTabCaseListController,
      templateUrl: '~/civicase/ContactCaseTabCaseList.html',
      scope: {
        'caseObj': '=',
        'viewingCaseId': '='
      }
    };
  });

  function CivicaseContactCaseTabCaseListController ($scope, $rootScope, crmApi, formatCase, DateHelper) {
    var defaultPageSize = 2;

    $scope.loadingPlaceholders = _.range($scope.caseObj.page.size || defaultPageSize);
    $scope.formatDate = DateHelper.formatDate;

    /**
     * Emits loadmore event
     */
    $scope.loadMore = function () {
      $scope.$emit('civicase::contact-record-list::load-more', $scope.caseObj.name);
    };

    /**
     * Emits view-case event
     */
    $scope.viewCase = function (caseObj) {
      $scope.$emit('civicase::contact-record-list::view-case', caseObj);
    };
  }
})(angular, CRM.$, CRM._);
