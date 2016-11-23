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
angular.module('unionvmsWeb').directive('deepBlur', [ '$timeout', function ($timeout) {
    return {
        restrict: 'A',
        controller: [ '$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            var leaveExpr = $attrs.deepBlur,
                dom = $element[0];

            function containsDom(parent, dom) {
                while (dom) {
                    if (dom === parent) {
                        return true;
                    }

                    dom = dom.parentNode;
                }

                return false;
            };

            function onBlur(e) {
                // e.relatedTarget for Chrome
                // document.activeElement for IE 11
                var targetElement = e.relatedTarget || document.activeElement;

                if (!containsDom(dom, targetElement)) {
                    $timeout(function () {
                        $scope.$apply(leaveExpr);
                    }, 10);
                }
            }

            if (dom.addEventListener) {
                dom.addEventListener('blur', onBlur, true);
            } else {
                dom.attachEvent('onfocusout', onBlur); // For IE8
            }
        }]
    };
}]);