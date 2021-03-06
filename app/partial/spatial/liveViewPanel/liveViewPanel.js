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
angular.module('unionvmsWeb').controller('LiveviewpanelCtrl',function($scope, $timeout, $window, locale, mapService, reportService){
    $scope.selectedTab = 'MAP';
    
    //Define tabs
    var setTabs = function(){
            return [
                {
                    'tab': 'MAP',
                    'title': locale.getString('spatial.tab_map'),
                    'visible': reportService.tabs.map
                },
                {
                    'tab': 'VMS',
                    'title': locale.getString('spatial.tab_vms'),
                    'visible': reportService.tabs.vms
                }
            ];
        };
        
   $scope.selectTab = function(tab){
       $scope.selectedTab = tab;
       reportService.selectedTab = tab;
   };
   
   $scope.isTabSelected = function(tab){
       return $scope.selectedTab === tab;
   };
   
   $scope.isTabVisible = function(tabIdx){
       return $scope.tabMenu[tabIdx].visible;
   };
   
   //Focus map div
   $scope.focusMap = function(){
       var mapElement = $window.document.getElementById('map');
       if(mapElement){
           mapElement.focus();
       }
   };
   
   //Refresh map size on tab change
   $scope.$watch('selectedTab', function(newVal, oldVal){
       if (newVal === 'MAP'){
           $timeout(mapService.updateMapContainerSize(), 100);
           $timeout($scope.focusMap, 50);
       }
   });
   
   $scope.$watch(function(){return reportService.isReportExecuting;}, function(newVal, oldVal){
       $scope.tabMenu[0].visible = reportService.tabs.map;
       $scope.tabMenu[1].visible = reportService.tabs.vms;
       if (reportService.tabs[$scope.selectedTab.toLowerCase()] === false ){
           var newTab = 'MAP';
           if ($scope.selectedTab === 'MAP'){
               newTab = 'VMS';
           }
           $scope.selectTab(newTab);
       }
       
//       if (reportService.tabs.map === true){
//           $scope.selectTab('MAP');
//       } else {
//           $scope.selectTab('VMS');
//       }
   });
   
   $scope.$on('mapAction', function(){
       $scope.selectedTab = 'MAP';
   });
   
   locale.ready('spatial').then(function(){
       $scope.tabMenu = setTabs();
   });
});