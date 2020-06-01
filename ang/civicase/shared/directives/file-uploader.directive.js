(function (angular, $, _) {
  var module = angular.module('civicase');

  module.directive('civicaseFileUploader', function () {
    return {
      restrict: 'A',
      templateUrl: '~/civicase/shared/directives/file-uploader.directive.html',
      controller: civicaseFilesUploaderController,
      scope: {
        ctx: '=civicaseFileUploader',
        onUpload: '@'
      }
    };
  });

  /**
   *
   * @param {object} $scope controllers scope object
   * @param {object} crmApi service to access civicrm api
   * @param {object} crmBlocker crm blocker service
   * @param {object} crmStatus crm status service
   * @param {Function} FileUploader file uploader service
   * @param {object} $q angular queue service
   * @param {object} $timeout timeout service
   */
  function civicaseFilesUploaderController ($scope, crmApi, crmBlocker, crmStatus, FileUploader, $q, $timeout) {
    $scope.block = crmBlocker();
    $scope.ts = CRM.ts('civicase');

    (function init () {
      initActivity();
      $scope.$watchCollection('ctx.id', initActivity);
    }());

    $scope.isUploadActive = function () {
      return ($scope.uploader.queue.length > 0);
    };

    $scope.uploader = new FileUploader({
      url: CRM.url('civicrm/ajax/attachment'),
      onAfterAddingFile: function onAfterAddingFile (item) {
        item.crmData = { description: '' };
      },
      onSuccessItem: function onSuccessItem (item, response, status, headers) {
        var ok = status === 200 && _.isObject(response) && response.file && (response.file.is_error === 0);

        if (!ok) {
          this.onErrorItem(item, response, status, headers);
        }
      },
      onErrorItem: function onErrorItem (item, response, status, headers) {
        var msg = (response && response.file && response.file.error_message) ? response.file.error_message : $scope.ts('Unknown error');

        CRM.alert(item.file.name + ' - ' + msg, $scope.ts('Attachment failed'), 'error');
      },
      // Like uploadAll(), but it returns a promise.
      uploadAllWithPromise: function () {
        var dfr = $q.defer();
        var self = this;

        self.onCompleteAll = function () {
          dfr.resolve();
          self.onCompleteAll = null;
        };
        self.uploadAll();
        return dfr.promise;
      }
    });

    $scope.deleteActivity = function deleteActivity () {
      $scope.uploader.clearQueue();
      initActivity();
    };

    $scope.saveActivity = function saveActivity () {
      var promise = crmApi('Activity', 'create', $scope.activity)
        .then(function (r) {
          var target = { entity_table: 'civicrm_activity', entity_id: r.id };
          _.each($scope.uploader.getNotUploadedItems(), function (item) {
            item.formData = [
              _.extend({ crm_attachment_token: CRM.crmAttachment.token }, target, item.crmData)
            ];
          });
          return $scope.uploader.uploadAllWithPromise();
        }).then(function () {
          return delayPromiseBy(1000); // Let the user absorb what happened.
        }).then(function () {
          $scope.uploader.clearQueue();
          initActivity();
          if ($scope.onUpload) {
            $scope.$parent.$eval($scope.onUpload);
          }
        });

      return $scope.block(crmStatus({
        start: $scope.ts('Uploading...'),
        success: $scope.ts('Uploaded')
      }, promise));
    };

    /**
     * Initialise Activity
     */
    function initActivity () {
      $scope.activity = {
        case_id: $scope.ctx.id,
        activity_type_id: 'File Upload',
        subject: ''
      };
    }

    /**
     * TODO: Test interrupted transfer.
     *
     * @param {number} delay timedelay in millisecond
     * @returns {object} Promise
     */
    function delayPromiseBy (delay) {
      var dfr = $q.defer();
      $timeout(function () { dfr.resolve(); }, delay);
      return dfr.promise;
    }
  }
})(angular, CRM.$, CRM._);
