/// Copyright 2014-2015 Red Hat, Inc. and/or its affiliates
/// and other contributors as indicated by the @author tags.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.

/// <reference path="btmPlugin.ts"/>
module BTM {

  declare var c3: any;

  export var BTxnInfoController = _module.controller("BTM.BTxnInfoController", ["$scope", "$routeParams", "$http", '$location', '$interval', ($scope, $routeParams, $http, $location, $interval) => {

    $scope.businessTransactionName = $routeParams.businesstransaction;

    $scope.properties = [];
    
    $scope.criteria = {
      name: $scope.businessTransactionName,
      startTime: -3600000,
      endTime: 0
    };

    $scope.config = {
      interval: 60000,
      selectedProperty: undefined
    };

    $scope.reload = function() {
      $http.post('/hawkular/btm/analytics/businesstxn/completion/statistics?interval='+$scope.config.interval, $scope.criteria).then(function(resp) {
        $scope.statistics = resp.data;
        
        $scope.ctlinechart.load({
          json: $scope.statistics,
          keys: {
            value: ['max','average','min','count','faultCount'],
            x: 'timestamp'
          }
        });

      },function(resp) {
        console.log("Failed to get statistics: "+resp);
      });

      $http.post('/hawkular/btm/analytics/businesstxn/completion/faults', $scope.criteria).then(function(resp) {
        $scope.faults = resp.data;
        
        var faultdata = [];
        
        for (var i=0; i < $scope.faults.length; i++) {
          var fault = $scope.faults[i];
          var record=[ ];
          record.push(fault.value);
          record.push(fault.count);
          faultdata.push(record);
        }
        
        $scope.ctfaultschart.load({
          columns: faultdata
        });

      },function(resp) {
        console.log("Failed to get statistics: "+resp);
      });

      $http.get('/hawkular/btm/analytics/businesstxn/properties/'+$scope.businessTransactionName).then(function(resp) {
        $scope.properties = resp.data;
      },function(resp) {
        console.log("Failed to get property info: "+resp);
      });
    
      if ($scope.config.selectedProperty !== undefined) {
        $scope.reloadProperty();
      }
    };

    $scope.reloadProperty = function() {
      $http.post('/hawkular/btm/analytics/businesstxn/completion/property/'+$scope.config.selectedProperty, $scope.criteria).then(function(resp) {
        $scope.propertyDetails = resp.data;
        
        var propertydata = [];
        
        for (var i=0; i < $scope.propertyDetails.length; i++) {
          var prop = $scope.propertyDetails[i];
          var record=[ ];
          record.push(prop.value);
          record.push(prop.count);
          propertydata.push(record);
        }
        
        $scope.propertychart.load({
          columns: propertydata
        });

      },function(resp) {
        console.log("Failed to get property details for '"+$scope.config.selectedProperty+"': "+resp);
      });
    };

    $scope.reload();

    $interval(function() {
      $scope.reload();
    },10000);

    $scope.initGraph = function() {
      $scope.ctlinechart = c3.generate({
        bindto: '#completiontimelinechart',
        data: {
          json: [
          ],
          axes: {
            max: 'y',
            average: 'y',
            min: 'y',
            count: 'y2',
            faultCount: 'y2'
          },
          type: 'line',
          types: {
            count: 'bar',
            faultCount: 'bar'
          },
          keys: {
            value: ['max','average','min','count','faultCount'],
            x: 'timestamp'
          }
        },
        color: {
          pattern: ['#ff0000', '#33cc33', '#e5e600', '#99ccff', '#ffb3b3']
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              culling: {
                max: 6 // the number of tick texts will be adjusted to less than this value
              },
              format: '%Y-%m-%d %H:%M:%S'
            }
          },
          y: {
            label: 'Seconds',
            tick: {
              format: function (y) { return y / 1000000000; }
            }
          },
          y2: {
            show: true
          }
        }
      });

      $scope.ctfaultschart = c3.generate({
        bindto: '#completiontimefaultschart',
        data: {
          json: [
          ],
          type: 'pie',
          onclick: function (d, i) { console.log("Fault clicked = ", d, i); }
        }
      });

    };
    
    $scope.initGraph();

    $scope.propertyClicked = function() {
      $scope.initPropertyGraph($scope.config.selectedProperty);
    };

    $scope.initPropertyGraph = function(name) {
      $scope.propertychart = c3.generate({
        bindto: '#completiontimepropertychart',
        data: {
          columns: [
          ],
          type: 'pie'
        }
      });

      $scope.reloadProperty();
    };

  }]);
}
