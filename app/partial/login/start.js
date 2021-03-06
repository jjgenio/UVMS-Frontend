/*
﻿Developed with the contribution of the European Commission - Directorate General for Maritime Affairs and Fisheries
© European Union, 2015-2016.

This file is part of the Integrated Fisheries Data Management (IFDM) Suite. The IFDM Suite is free software: you can
redistribute it and/or modify it under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or any later version. The IFDM Suite is distributed in
the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details. You should have received a
copy of the GNU General Public License along with the IFDM Suite. If not, see <http://www.gnu.org/licenses/>.
 */
//Start controller
angular.module('unionvmsWeb').controller('StartCtrl', function($scope, $log, $state, startPageService) {
    //Get the start state from the global settings and redirect to that state
    var homeState = startPageService.getStartPageStateName();
    $state.go(homeState, {}, {location: 'replace'});
});

angular.module('unionvmsWeb').factory('startPageService',function($log, globalSettingsService, userService) {

    var unionVMSApplication = 'Union-VMS';
    var checkAccess = function(module, feature) {
        return userService.isAllowed(feature,module,true);
    };

    //Matches pages (in global config) with states in the app
    //Order of pages and states are of importance only when user don't have access to the homepage set in the global config
    var pagesAndStates = {
        exchange : ['app.exchange'],
        positions : ['app.movement'],
        polling : ['app.pollingLogs'],
        mobileTerminals : ['app.communication'],
        assets : ['app.assets'],
        alarms : ['app.holdingTable', 'app.openTickets'],
        admin : ['app.auditLog'],
        user : ['app.usm.users'],
        reporting : ['app.reporting'],
    };

    //Features for show usm page
    var userFeatures = [
        'activateRoles',
        'activateScopes',
        'activateUsers',
        'assignRoles',
        'assignScopes',
        'configurePolicies',
        'copyUserProfile',
        'manageApplications',
        'manageEndpoints',
        'manageOrganisations',
        'managePersons',
        'manageRoles',
        'manageScopes',
        'manageUserContexts',
        'manageUserPreferences',
        'manageUsers',
        'viewApplications',
        'viewEndpointsDetails',
        'viewOrganisationDetails',
        'viewOrganisations',
        'viewPersonDetails',
        'viewRoles',
        'viewScopes',
        'viewUserContexts',
        'viewUserPreferences',
        'viewUsers',
    ];

    var accessToAnyFeatureInList = function(application, featureList){
        var access = false;
        $.each(featureList, function(index, feature){
            if(checkAccess(application, feature)){
                access = true;
                return false;
            }
        });
        return access;
    };
    var userHasAccessToState = function(state){
        var accessToAssetsAndTerminals = checkAccess(unionVMSApplication, 'viewVesselsAndMobileTerminals');

        switch(state){
            case 'app.movement':
                return checkAccess('Movement', 'viewMovements') && accessToAssetsAndTerminals;
            case 'app.exchange':
                return checkAccess('Exchange', 'viewExchange');
            case 'app.pollingLogs':
                return checkAccess(unionVMSApplication, 'viewMobileTerminalPolls') && accessToAssetsAndTerminals;
            case 'app.communication':
                return accessToAssetsAndTerminals;
            case 'app.assets':
                return accessToAssetsAndTerminals;
            case 'app.holdingTable':
                return checkAccess(unionVMSApplication, 'viewAlarmsHoldingTable');
            case 'app.openTickets':
                return checkAccess(unionVMSApplication, 'viewAlarmsOpenTickets');
            case 'app.auditLog':
                return checkAccess('Audit', 'viewAudit');
            case 'app.usm.users':
                return accessToAnyFeatureInList('USM', userFeatures);
            case 'app.reporting':
                return checkAccess('Reporting', 'LIST_REPORTS');
            default:
                $log.info("State: " +state +" is missing from list. Returning false.");
                return false;
        }
    };

    var startPageService = {
        getStartPageStateName : function(){
            var defaultHomePage = globalSettingsService.get('defaultHomePage', false);
            var possibleStates, i;

            //Check if user has access to the defaultHomePage
            if(defaultHomePage in pagesAndStates){
                possibleStates = pagesAndStates[defaultHomePage];
                for (i=0; i< possibleStates.length; i++){
                    if(userHasAccessToState(possibleStates[i])){
                        return possibleStates[i];
                    }
                }
            }

            //User didn't have access to the default home page, so lets find first page user has access to
            $log.info("Default home page is set to '" +defaultHomePage +"' but user don't have access to this page. Redirecting to first page user has access to.");
            for (var page in pagesAndStates) {
                if (pagesAndStates.hasOwnProperty(page)) {
                    possibleStates = pagesAndStates[page];
                    for (i = 0; i< possibleStates.length; i++){
                        if(userHasAccessToState(possibleStates[i])){
                            return possibleStates[i];
                        }
                    }
                }
            }

            //No access, just return exchange page
            $log.warn("User don't have access to any page. Return access error.");
            return 'uvmsAccessError';
        }
    };

    return startPageService;
});