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
angular.module('unionvmsWeb').controller('ExchangeCtrl',function($scope, $log, $filter,$location, locale, searchService, exchangeRestService, infoModal, ManualPosition, alertService, csvService, ExchangeService, SearchResults, $resource, longPolling){

    $scope.transmissionStatuses = new SearchResults();
    $scope.sendingQueue = new SearchResults();
    $scope.notifications = 0;
    $scope.pausedQueueItems = {};

    $scope.exchangeLogsSearchResults = new SearchResults('dateReceived', true);
    $scope.exchangeLogsSearchResults.incomingOutgoing = 'all';

    $scope.newExchangeLogCount = 0;
    var longPollingIdPlugins, longPollingIdSendingQueue, longPollingIdExchangeList;

    var updatePluginStatuses = function(newStatuses) {
        $.each($scope.transmissionStatuses.items, function(index, plugin) {
            var newStatus = newStatuses[plugin.serviceClassName];
            if (newStatus === true) {
                plugin.setAsStarted();
            }
            else if (newStatus === false) {
                plugin.setAsStopped();
            }
        });
    };

    var updateExchangeLogs = function(guid) {
        searchService.searchExchange().then(function(page) {
            if (page.hasItemWithGuid(guid)) {
                $scope.exchangeLogsSearchResults.updateWithNewResults(page);
            }
            else {
                $scope.newExchangeLogCount++;
            }
        });
    };

    $scope.resetSearch = function() {
        $scope.$broadcast("resetExchangeLogSearch");
    };

    var init = function(){

        //$scope.searchExchange();
        $scope.getSendingQueue();
        $scope.getTransmissionStatuses();

        longPollingIdPlugins = longPolling.poll("/exchange/activity/plugins", function(response) {
            updatePluginStatuses(response);
        });

        longPollingIdSendingQueue = longPolling.poll("/exchange/activity/queue", function(response) {
            if (response.ids.length > 0) {
                $scope.getSendingQueue();
            }
        });

        longPollingIdExchangeList =  longPolling.poll("/exchange/activity/exchange", function(response) {
            if (response.ids.length > 0) {
                updateExchangeLogs(response.ids[0]);
            }
        });
    };

    $scope.filterIncomingOutgoing = function(message) {
        if ($scope.exchangeLogsSearchResults.incomingOutgoing === "all") {
            return true;
        }

        return message.incoming ? $scope.exchangeLogsSearchResults.incomingOutgoing === "incoming" : $scope.exchangeLogsSearchResults.incomingOutgoing === "outgoing";
    };

    $scope.sendQueuedMessages = function(messageIds){
        exchangeRestService.sendQueue(messageIds).then(
        function(data){
            $log.debug("Message(s) successfully sent.");
            //get que again
             $scope.getSendingQueue();
        },
        function(error){
            $log.error("Error trying to send messagequeue.");
        });
    };


    $scope.getSendingQueue = function(){
        $scope.sendingQueue.setLoading(true);
        $scope.sendingQueue.clearErrorMessage();

        $scope.grouped_data = [];

        exchangeRestService.getSendingQueue().then(
            function(data) {
                $scope.sendingQueue.setLoading(false);
                $scope.sendingQueue.items = data;
                 $scope.notifications = $scope.getAmountOfNotifications($scope.sendingQueue.items);
        },
        function(error) {
            $scope.sendingQueue.setLoading(false);
            $scope.sendingQueue.items = [];
            console.error("Error getting sendingqueue statuses", error);
            $scope.sendingQueue.setErrorMessage(locale.getString('common.error_getting_data_from_server'));

        });
    };

    $scope.getAmountOfNotifications = function(items){
        var quantity = 0;

        for (var i = items.length - 1; i >= 0; i--) {
            quantity = quantity + items[i].pluginList.sendingLogList.length;
        }
        return quantity;
    };

    $scope.getTransmissionStatuses = function() {
        $scope.transmissionStatuses.setLoading(true);
        $scope.transmissionStatuses.clearErrorMessage();
        exchangeRestService.getTransmissionStatuses().then(
            function(services) {
                $scope.transmissionStatuses.setLoading(false);
                $scope.transmissionStatuses.items = services;
            },
            function(error) {
                $scope.transmissionStatuses.setLoading(false);

                $scope.transmissionStatuses.setErrorMessage(locale.getString('common.error_getting_data_from_server'));
                console.error("Error getting transmission statuses", error);
            }
        );
    };

    //Stop transmission service
    $scope.stopTransmissionService = function(model){
        exchangeRestService.stopTransmission(encodeURI(model.serviceClassName)).then(
        function(data){
            $log.debug("Service successfully stopped.");
            alertService.showSuccessMessageWithTimeout(locale.getString('exchange.transmission_stop_transmission_successfull'));
            model.setAsStopped();
        },
        function(error){
            $log.error("Error trying to send messagequeue.");
            alertService.showErrorMessageWithTimeout(locale.getString('exchange.transmission_stop_transmission_error'));
        });
    };

    //Start transmission service
    $scope.startTransmissionService = function(model){
        exchangeRestService.startTransmission(encodeURI(model.serviceClassName)).then(
        function(data){
            $log.debug("Service successfully started.");
            alertService.showSuccessMessageWithTimeout(locale.getString('exchange.transmission_start_transmission_successfull'));
            model.setAsStarted();
        },
        function(error){
            $log.error("Error trying to start plugin.");
             alertService.showErrorMessageWithTimeout(locale.getString('exchange.transmission_start_transmission_error'));
        });
    };

    $scope.searchExchange = function() {
        $scope.clearSelection();
        $scope.exchangeLogsSearchResults.clearErrorMessage();
        $scope.exchangeLogsSearchResults.setLoading(true);
        $scope.newExchangeLogCount = 0;
        searchService.searchExchange().then(function(page) {
            $scope.exchangeLogsSearchResults.updateWithNewResults(page);
        },
        function(error) {
            $scope.exchangeLogsSearchResults.removeAllItems();
            $scope.exchangeLogsSearchResults.setLoading(false);
            $scope.exchangeLogsSearchResults.setErrorMessage(locale.getString('common.search_failed_error'));
        });
    };

    //Goto page in the search results
    $scope.gotoPage = function(page){
        if(angular.isDefined(page)){
            searchService.setPage(page);
            $scope.searchExchange();
        }
    };

    $scope.showMessageDetails = function(model) {
        if (model.logData.type){
            switch(model.logData.type){
                case 'POLL':
                    $location.path('/polling/logs/' + model.logData.guid);
                    break;

                case 'MOVEMENT':
                    $location.path('/movement/' + model.logData.guid);
                    break;

                case 'ALARM':
                    $location.path('/alarms/holdingtable/' + model.logData.guid);
                    break;

                default:
                    $log.info("No matching type in model");
                    break;
            }
        }
    };

    $scope.openUpModal = function(model){
        var options = {
            titleLabel : locale.getString("exchange.message_details_modal_title"),
            textLabel : model.message,
            message : model
        };
        infoModal.open(options);
    };

    $scope.openPosition = function(model){
        $log.info("open a page... feature not implementet yet.");
    };

    //Get status label for the exchange log items
    $scope.getStatusLabel = function(status){
        var label;
        switch(status){
            case 'SUCCESSFUL':
                label = locale.getString('common.status_successful');
                break;
            case 'PENDING':
                label = locale.getString('common.status_pending');
                break;
            case 'ERROR':
                label = locale.getString('common.status_failed');
                break;
            default:
                label = status;
        }
        return label;
    };

    $scope.getStatusLabelClass = function(status){
        var cssClass;
        switch(status){
            case 'SUCCESSFUL' :
            case 'STARTED' :
            case 'ONLINE':
                cssClass = "label-success";
                break;
            case 'OFFLINE':
            case 'STOPPED':
            case 'ERROR' :
                cssClass = "label-danger";
                break;
            default:
            cssClass = "label-warning";
        }
        return cssClass;
    };

    //Get status label for the exchange transmission service items
    $scope.getTransmissionStatusLabel = function(status){
        var label;
        switch(status){
            case 'ONLINE':
                label = locale.getString('exchange.transmission_status_online');
                break;
            case 'OFFLINE':
                label = locale.getString('exchange.transmission_status_offline');
                break;
            case 'STOPPED':
                label = locale.getString('exchange.transmission_status_stopped');
                break;
            default:
                label = status;
        }
        return label;
    };

    //Edit selection
    $scope.editSelectionDropdownItems =[
        {'text':locale.getString('common.export_selection'),'code':'EXPORT'}
    ];

    //Export data as CSV file
    $scope.exportLogsAsCSVFile = function(onlySelectedItems){
        var filename = 'exchangeLogs.csv';

        //Set the header columns
        var header = [
            locale.getString('exchange.table_header_date_received'),
            locale.getString('exchange.table_header_source'),
            locale.getString('exchange.table_header_type'),
            locale.getString('exchange.table_header_sent_by'),
            locale.getString('exchange.table_header_fwd_rule'),
            locale.getString('exchange.table_header_recipient'),
            locale.getString('exchange.table_header_date_fwd'),
            locale.getString('exchange.table_header_status')
        ];

        //Set the data columns
        var getData = function() {
            var exportItems;
            //Export only selected items
            if(onlySelectedItems){
                exportItems = $scope.selectedItems;
            }
            //Export all logs in the table
            else{
                exportItems = $scope.exchangeLogsSearchResults.items;
            }
            return exportItems.reduce(
                function(csvObject, item){
                    if($scope.filterIncomingOutgoing(item)){
                        var csvRow = [
                            $filter('confDateFormat')(item.dateReceived),
                            $filter('transponderName')(item.source),
                            item.type,
                            item.senderRecipient,
                            item.forwardRule,
                            item.recipient,
                            $filter('confDateFormat')(item.dateForward),
                            $scope.getStatusLabel(item.status)
                        ];
                        csvObject.push(csvRow);
                    }
                    return csvObject;
                },[]
            );
        };

        //Create and download the file
        csvService.downloadCSVFile(getData(), header, filename);
    };

    //Callback function for the "edit selection" dropdown
    $scope.editSelectionCallback = function(selectedItem){
        if($scope.selectedItems.length){
            if(selectedItem.code === 'EXPORT'){
                $scope.exportLogsAsCSVFile(true);
            }
        }else{
            alertService.showInfoMessageWithTimeout(locale.getString('common.no_items_selected'));
        }
    };

    //Selected by checkboxes
    $scope.selectedItems = [];

    //Handle click on the top "check all" checkbox
    $scope.checkAll = function(){
        if($scope.isAllChecked()){
            //Remove all
            $scope.clearSelection();
        }else{
            //Add all
            $scope.clearSelection();
            $.each($scope.exchangeLogsSearchResults.items, function(index, item) {
                $scope.addToSelection(item);
            });
        }
    };

    $scope.check = function(item){
        if($scope.isChecked(item)){
            //Remove
            $scope.removeFromSelection(item);
        }else{
            $scope.addToSelection(item);
        }
    };

    $scope.isAllChecked = function(){
        if(angular.isUndefined($scope.exchangeLogsSearchResults.items) || $scope.selectedItems.length === 0){
            return false;
        }

        var allChecked = true;
        $.each($scope.exchangeLogsSearchResults.items, function(index, item) {
            if(!$scope.isChecked(item)){
                allChecked = false;
                return false;
            }
        });
        return allChecked;
    };

    $scope.isChecked = function(item){
        var checked = false;
        $.each($scope.selectedItems, function(index, exchangeMessage){
            if(exchangeMessage.isEqualExchange(item)){
                checked = true;
                return false;
            }
        });
        return checked;
    };

    //Clear the selection
    $scope.clearSelection = function(){
        $scope.selectedItems = [];
    };

    //Add an item to the selection
    $scope.addToSelection = function(item){
        $scope.selectedItems.push(item);
    };

    //Remove an item from the selection
    $scope.removeFromSelection = function(item){
        $.each($scope.selectedItems, function(index, exchangeMessage){
            if(exchangeMessage.isEqualExchange(item)){
                $scope.selectedItems.splice(index, 1);
                return false;
            }
        });
    };

    $scope.$on("$destroy", function() {
        alertService.hideMessage();
        longPolling.cancel(longPollingIdPlugins);
        longPolling.cancel(longPollingIdSendingQueue);
        longPolling.cancel(longPollingIdExchangeList);
    });

    $scope.resendAllQueueItemsInGroup = function(item){
        //All ids in group.
        var sendingQueuesIds = [];
        for (var i = item.length - 1; i >= 0; i--) {
            sendingQueuesIds.push(item[i].messageId);
        }
        $scope.sendQueuedMessages(sendingQueuesIds);
    };

    $scope.resendQueuedItemInGroup = function(id){
        var sendingQueuesIds = [];
        sendingQueuesIds.push(id);
        $scope.sendQueuedMessages(sendingQueuesIds);
    };

    $scope.resendAllQueued = function(){
        var sendingQueuesIds = [];
        //$scope.sendingQueue.items[i].pluginList.sendingLogList
        for (var i = $scope.sendingQueue.items.length - 1; i >= 0; i--){
           for (var o = $scope.sendingQueue.items[i].pluginList.sendingLogList.length - 1; o >= 0; o--) {
               sendingQueuesIds.push($scope.sendingQueue.items[i].pluginList.sendingLogList[o].messageId);
           }
           //sendingQueuesIds.push($scope.sendingQueue.items[i]);
        }
        $scope.sendQueuedMessages(sendingQueuesIds);
    };
    $scope.messageVisible = false;

    init();
});