/**
 * @ngdoc controller
 * @name ContentEditController
 * @function
 * 
 * @description
 * The controller for the content editor
 */
function ContentEditController($scope, $routeParams, $location, contentResource, notificationsService, angularHelper, serverValidationService, contentEditingHelper) {
        
    if ($routeParams.create) {
        //we are creating so get an empty content item
        contentResource.getScaffold($routeParams.id, $routeParams.doctype)
            .then(function(data) {
                $scope.contentLoaded = true;
                $scope.content = data;
            });
    }
    else {
        //we are editing so get the content item from the server
        contentResource.getById($routeParams.id)
            .then(function(data) {
                $scope.contentLoaded = true;
                $scope.content = data;
                
                //in one particular special case, after we've created a new item we redirect back to the edit
                // route but there might be server validation errors in the collection which we need to display
                // after the redirect, so we will bind all subscriptions which will show the server validation errors
                // if there are any and then clear them so the collection no longer persists them.
                serverValidationService.executeAndClearAllSubscriptions();

            });
    }

    $scope.files = [];
    $scope.addFiles = function (propertyId, files) {
        //this will clear the files for the current property and then add the new ones for the current property
        $scope.files = _.reject($scope.files, function (item) {
            return item.id == propertyId;
        });
        for (var i = 0; i < files.length; i++) {
            //save the file object to the scope's files collection
            $scope.files.push({ id: propertyId, file: files[i] });
        }
    };

    //ensure there is a form object assigned.
    var currentForm = angularHelper.getRequiredCurrentForm($scope);

    //TODO: Need to figure out a way to share the saving and event broadcasting with all editors!

    $scope.saveAndPublish = function (cnt) {

        $scope.$broadcast("saving", { scope: $scope });

        //don't continue if the form is invalid
        if (currentForm.$invalid) return;

        serverValidationService.reset();
        
        contentResource.publishContent(cnt, $routeParams.create, $scope.files)
            .then(function (data) {
                //TODO: only update the content that has changed!
                $scope.content = data;
                
                notificationsService.success("Published", "Content has been saved and published");                
                $scope.$broadcast("saved", { scope: $scope });

                contentEditingHelper.redirectToCreatedContent($scope.content.id);
            }, function (err) {
                //TODO: only update the content that has changed!
                //$scope.content = err.data;
                contentEditingHelper.handleSaveError(err);
            });	        
    };

    $scope.save = function (cnt) {
	        
        $scope.$broadcast("saving", { scope: $scope });
            
        //don't continue if the form is invalid
        if (currentForm.$invalid) return;

        serverValidationService.reset();

        contentResource.saveContent(cnt, $routeParams.create, $scope.files)
            .then(function (data) {
                //TODO: only update the content that has changed!
                $scope.content = data;
                
                notificationsService.success("Saved", "Content has been saved");                
                $scope.$broadcast("saved", { scope: $scope });
                
                contentEditingHelper.redirectToCreatedContent($scope.content.id);
            }, function (err) {
                //TODO: only update the content that has changed!
                //$scope.content = err.data;
                contentEditingHelper.handleSaveError(err);
            });
	        
    };
}

angular.module("umbraco").controller("Umbraco.Editors.ContentEditController", ContentEditController);