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
angular.module('unionvmsWeb').factory('Report',function(unitConversionService) { //globalSettingsService,
	function Report(){
	    this.id = undefined;
	    this.name = undefined;
	    this.desc = undefined;
	    this.visibility = 'private';
	    this.startDateTime = undefined;
	    this.endDateTime = undefined;
	    this.positionSelector = 'all';
	    this.positionTypeSelector = 'positions';
	    this.xValue = undefined;

	    //Components
	    this.withMap = true;

	    //Vessel filter
	    this.vesselsSelection = [];

	    //VNS filter
	    this.hasVmsFilter = false;
	    this.hasPositionsFilter = false;
	    this.hasSegmentsFilter = false;
	    this.hasTracksFilter = false;
	    this.vmsFilters = {
	        positions: undefined,
	        segments: undefined,
	        tracks: undefined
	    };
	    this.areas = [];
	    
	    //Spatial configs
        this.mapConfiguration = {
    		stylesSettings: undefined,
	        layerSettings: undefined,
	        visibilitySettings: undefined
        };
	}

//	var getDateFormat = function(){
//	    return globalSettingsService.getDateFormat();
//	};
//	
//	var getTimeZone = function(){
//	    return parseInt(globalSettingsService.getTimezone());
//	};
//
//	var convertDate = function(date, direction){
//	    var displayFormat = getDateFormat();
//	    var src_format = 'YYYY-MM-DD HH:mm:ss Z';
//	    var server_format = 'YYYY-MM-DDTHH:mm:ss';
//
//	    if (direction === 'to_server'){
//	        if (moment.utc(date, src_format).isValid()){
//	            return moment.utc(date, src_format).format(server_format);
//	        }
//	    } else if(direction === 'from_server') {
//	        if (moment.utc(date, server_format).isValid()){
//	            return moment.utc(date, server_format).format(displayFormat);
//	        }
//	    }
//	};

	var validateFilterObject = function(filter,isRunningReport){
	    var valid = true;
	    var existingFilter = false;
        var isDefined = false;
        for (var i in filter){
            if (i === 'id'){
                existingFilter = true;
            } else if (i !== 'id' && i !== 'type'){
                if (angular.isDefined(filter[i])){
                    isDefined = true;
                }
            }
        }

        if ((existingFilter || isRunningReport) && isDefined === false){
            valid = false;
        }

        return valid;
	};

	Report.prototype.fromJson = function(data){
	    var report = new Report();

	    if(data){
	        var filter = data.filterExpression;

	        report.id = data.id;
	        report.name = data.name;
	        report.desc = data.desc;
	        report.withMap = data.withMap;
	        report.visibility = data.visibility;

	        //Common filters
			report.commonFilterId = filter.common.id;
	        report.startDateTime = angular.isDefined(filter.common.startDate) ? unitConversionService.date.convertDate(filter.common.startDate, 'from_server') : undefined;
	        report.endDateTime = angular.isDefined(filter.common.endDate) ? unitConversionService.date.convertDate(filter.common.endDate, 'from_server') : undefined;
	        report.positionSelector = angular.isDefined(filter.common.positionSelector) ? filter.common.positionSelector : 'all';
	        report.positionTypeSelector = angular.isDefined(filter.common.positionTypeSelector) ? filter.common.positionTypeSelector : 'positions';
	        report.xValue = angular.isDefined(filter.common.xValue) ? filter.common.xValue : undefined;

	        //Vessel filters
	        report.vesselsSelection = filter.assets;

	        //VMS positions filters
	        if (angular.isDefined(filter.vms) && angular.isDefined(filter.vms.vmsposition)){
	            report.vmsFilters.positions = filter.vms.vmsposition;
	            report.hasPositionsFilter = true;
	        }


	        if (angular.isDefined(filter.vms) && angular.isDefined(filter.vms.vmssegment)){
                report.vmsFilters.segments = filter.vms.vmssegment;
                report.hasSegmentsFilter = true;
            }

	        if (angular.isDefined(filter.vms) && angular.isDefined(filter.vms.tracks)){
                report.vmsFilters.tracks = filter.vms.tracks;
                report.hasTracksFilter = true;
            }

	        if (!angular.equals({}, filter.vms)){
	            report.hasVmsFilter = true;
	            for (var i in filter.vms){
	                var filterName = 'has' + i.substring(0,1).toUpperCase()+i.substring(1) + 'Filter';
	                report[filterName] = true;
	            }
	        }

	        report.areas = filter.areas;
	        
	        if (angular.isDefined(data.mapConfiguration)){
	        	if(angular.isDefined(data.mapConfiguration.layerSettings) && angular.isDefined(data.mapConfiguration.layerSettings.areaLayers) && !_.isEmpty(data.mapConfiguration.layerSettings.areaLayers)){
	        		angular.forEach(data.mapConfiguration.layerSettings.areaLayers, function(item) {
	        			if(item.areaType === 'areagroup'){
	        				item.name = item.areaGroupName;
	        			}
	        		});
	        	}
	            report.mapConfiguration = data.mapConfiguration;
	        }
	        
	    }

	    return report;
	};

	Report.prototype.toJson = function(){
	    return angular.toJson(this.DTO());
	};

	Report.prototype.DTO = function(){
	    var vmsFilters = {};
	    if (this.hasVmsFilter === true){
	        if (this.hasPositionsFilter === true && angular.isDefined(this.vmsFilters.positions)){
	            vmsFilters.vmsposition = this.vmsFilters.positions;
	            vmsFilters.vmsposition.movMinSpeed = vmsFilters.vmsposition.movMinSpeed === null ? undefined : vmsFilters.vmsposition.movMinSpeed;
	            vmsFilters.vmsposition.movMaxSpeed = vmsFilters.vmsposition.movMaxSpeed === null ? undefined : vmsFilters.vmsposition.movMaxSpeed;
	            vmsFilters.vmsposition.type = 'vmspos';

	            if (validateFilterObject(vmsFilters.vmsposition) === false){
	                vmsFilters.vmsposition = undefined;
	            }
	        }

	        if (this.hasSegmentsFilter === true && angular.isDefined(this.vmsFilters.segments)){
                vmsFilters.vmssegment = this.vmsFilters.segments;
                vmsFilters.vmssegment.segMinSpeed = vmsFilters.vmssegment.segMinSpeed === null ? undefined : vmsFilters.vmssegment.segMinSpeed;
                vmsFilters.vmssegment.segMaxSpeed = vmsFilters.vmssegment.segMaxSpeed === null ? undefined : vmsFilters.vmssegment.segMaxSpeed;
                vmsFilters.vmssegment.segMinDuration = vmsFilters.vmssegment.segMinDuration === null ? undefined : vmsFilters.vmssegment.segMinDuration;
                vmsFilters.vmssegment.segMaxDuration = vmsFilters.vmssegment.segMaxDuration === null ? undefined : vmsFilters.vmssegment.segMaxDuration;
                vmsFilters.vmssegment.type = 'vmsseg';

                if (validateFilterObject(vmsFilters.vmssegment) === false){
                    vmsFilters.vmssegment = undefined;
                }
            }

	        if (this.hasTracksFilter === true && angular.isDefined(this.vmsFilters.tracks)){
                vmsFilters.vmstrack = this.vmsFilters.tracks;
                vmsFilters.vmstrack.trkMinTime = vmsFilters.vmstrack.trkMinTime === null ? undefined : vmsFilters.vmstrack.trkMinTime;
                vmsFilters.vmstrack.trkMaxTime = vmsFilters.vmstrack.trkMaxTime === null ? undefined : vmsFilters.vmstrack.trkMaxTime;
                vmsFilters.vmstrack.trkMinDuration = vmsFilters.vmstrack.trkMinDuration === null ? undefined : vmsFilters.vmstrack.trkMinDuration;
                vmsFilters.vmstrack.trkMaxDuration = vmsFilters.vmstrack.trkMaxDuration === null ? undefined : vmsFilters.vmstrack.trkMaxDuration;
                vmsFilters.vmstrack.type = 'vmstrack';

                if (validateFilterObject(vmsFilters.vmstrack) === false){
                    vmsFilters.vmstrack = undefined;
                }
            }
	    }

	    var filter = {
	        common: {
				id: this.commonFilterId,
	            startDate: this.startDateTime === undefined ? undefined : unitConversionService.date.convertDate(this.startDateTime, 'to_server'),
	            endDate: this.endDateTime === undefined ? undefined : unitConversionService.date.convertDate(this.endDateTime, 'to_server'),
	            positionSelector: this.positionSelector,
	            positionTypeSelector: this.positionSelector !== 'all' ? this.positionTypeSelector: undefined,
	            xValue: this.xValue
	        },
            assets: [],
            vms: vmsFilters,
            areas: this.areas
	    };

	    if (angular.isDefined(this.vesselsSelection) && this.vesselsSelection.length){
            filter.assets = this.vesselsSelection;
        }
	    
	    var dto = {
	        id: this.id,
	        name: this.name,
	        desc: this.desc !== '' ? this.desc : undefined,
	        visibility: angular.isDefined(this.visibility) ? this.visibility : 'private',
	        withMap: this.withMap,
	        filterExpression: filter
	    };
	    
	    if(this.withMap === true){
	        dto.mapConfiguration = this.mapConfiguration;
	    }else{
	    	if(angular.isDefined(this.mapConfiguration.spatialConnectId)){
	    		dto.mapConfiguration = {'spatialConnectId': this.mapConfiguration.spatialConnectId};
	    	}
			if(angular.isDefined(this.mapConfiguration.visibilitySettings)){
				if(angular.isDefined(dto.mapConfiguration)){
					dto.mapConfiguration.visibilitySettings = this.mapConfiguration.visibilitySettings;
				}else{
	    			dto.mapConfiguration = {'visibilitySettings': this.mapConfiguration.visibilitySettings};
				}
	    	}
	    }
	    
	    if(angular.isDefined(this.additionalProperties)){
        	dto.additionalProperties = this.additionalProperties;
        }
	    
	    return dto;
	};
	
	Report.prototype.toJsonCopy = function(){
	    return angular.toJson(this.DTOCopy());
	};
	
	Report.prototype.DTOCopy = function(){
		var report = {};
		
        report.name = this.name;
        report.desc = this.desc !== '' ? this.desc : undefined;
        report.withMap = this.withMap;
        report.visibility = angular.isDefined(this.visibility) ? this.visibility : 'private';
        
        report.filterExpression = {};
        report.filterExpression.common = {};
        report.filterExpression.common.startDate = this.startDateTime === undefined ? undefined : unitConversionService.date.convertDate(this.startDateTime, 'to_server');
        report.filterExpression.common.endDate = this.endDateTime === undefined ? undefined : unitConversionService.date.convertDate(this.endDateTime, 'to_server');
    	report.filterExpression.common.positionTypeSelector = this.positionTypeSelector;
    	report.filterExpression.common.positionSelector = this.positionSelector;
    	report.filterExpression.common.xValue = this.xValue;
        
        report.filterExpression.areas = [];
        if(angular.isDefined(this.areas) && this.areas.length > 0){
		    angular.forEach(this.areas, function(item) {
		    	report.filterExpression.areas.push({
		    		'gid': item.gid,
		    		'areaType': item.areaType
		    	});
		    });
        }
        
        if (angular.isDefined(this.vesselsSelection) && this.vesselsSelection.length){
        	report.filterExpression.assets = [];
            angular.forEach(this.vesselsSelection, function(item) {
            	report.filterExpression.assets.push({
            		'guid': item.guid,
            		'name': item.name,
            		'type': item.type
            	});
            });
        }
        
        report.filterExpression.vms = {};
        if(this.hasVmsFilter === true){
        	if(this.hasPositionsFilter === true && angular.isDefined(this.vmsFilters.positions)){
            	report.filterExpression.vms.vmsposition = {
        			movActivity: this.vmsFilters.positions.movActivity === null ? undefined : this.vmsFilters.positions.movActivity,
    				movMaxSpeed: this.vmsFilters.positions.movMaxSpeed === null ? undefined : this.vmsFilters.positions.movMaxSpeed,
    				movMinSpeed: this.vmsFilters.positions.movMinSpeed === null ? undefined : this.vmsFilters.positions.movMinSpeed,
    				movType: this.vmsFilters.positions.movType === null ? undefined : this.vmsFilters.positions.movType,
    				type: "vmspos"
            	};
        		if (validateFilterObject(report.filterExpression.vms.vmsposition,true) === false){
        			report.filterExpression.vms.vmsposition = undefined;
	            }
            }
        	if(this.hasSegmentsFilter === true && angular.isDefined(this.vmsFilters.segments)){
            	report.filterExpression.vms.vmssegment = {
        			segCategory: this.vmsFilters.segments.segCategory === null ? undefined : this.vmsFilters.segments.segCategory,
    				segMaxDuration: this.vmsFilters.segments.segMaxDuration === null ? undefined : this.vmsFilters.segments.segMaxDuration,
    				segMaxSpeed: this.vmsFilters.segments.segMaxSpeed === null ? undefined : this.vmsFilters.segments.segMaxSpeed,
    				segMinDuration: this.vmsFilters.segments.segMinDuration === null ? undefined : this.vmsFilters.segments.segMinDuration,
    				segMinSpeed: this.vmsFilters.segments.segMinSpeed === null ? undefined : this.vmsFilters.segments.segMinSpeed,
    				type: "vmsseg"
            	};
            	if (validateFilterObject(report.filterExpression.vms.vmssegment,true) === false){
        			report.filterExpression.vms.vmssegment = undefined;
	            }
            }
        	if(this.hasTracksFilter === true && angular.isDefined(this.vmsFilters.tracks)){
            	report.filterExpression.vms.vmstrack = {
        			trkMaxDuration: this.vmsFilters.tracks.trkMaxDuration === null ? undefined : this.vmsFilters.tracks.trkMaxDuration,
        			trkMaxTime: this.vmsFilters.tracks.trkMaxTime === null ? undefined : this.vmsFilters.tracks.trkMaxTime,
        			trkMinDuration: this.vmsFilters.tracks.trkMinDuration === null ? undefined : this.vmsFilters.tracks.trkMinDuration,
        			trkMinTime: this.vmsFilters.tracks.trkMinTime === null ? undefined : this.vmsFilters.tracks.trkMinTime,
        			type: "vmstrack"
            	};
            }
        	if (validateFilterObject(report.filterExpression.vms.vmstrack,true) === false){
    			report.filterExpression.vms.vmstrack = undefined;
            }
        }
        
        if(this.withMap === true){
        	report.mapConfiguration = {
        		coordinatesFormat: this.mapConfiguration.coordinatesFormat,
            	displayProjectionId: this.mapConfiguration.displayProjectionId,
            	mapProjectionId: this.mapConfiguration.mapProjectionId,
            	scaleBarUnits: this.mapConfiguration.scaleBarUnits,
            	stylesSettings: this.mapConfiguration.stylesSettings,
            	visibilitySettings: this.mapConfiguration.visibilitySettings,
            	layerSettings: this.mapConfiguration.layerSettings
            };
        }else{
        	if(angular.isDefined(this.mapConfiguration.spatialConnectId)){
        		report.mapConfiguration = {'spatialConnectId': this.mapConfiguration.spatialConnectId};
        	}
			if(angular.isDefined(this.mapConfiguration.visibilitySettings)){
				if(angular.isDefined(report.mapConfiguration)){
					report.mapConfiguration.visibilitySettings = this.mapConfiguration.visibilitySettings;
				}else{
	    			report.mapConfiguration = {'visibilitySettings': this.mapConfiguration.visibilitySettings};
				}
	    	}
	    }
        
        if(angular.isDefined(this.additionalProperties)){
        	report.additionalProperties = this.additionalProperties;
        }
        
	    return report;
	};

	return Report;
});