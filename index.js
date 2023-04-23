/*
 * Copyright 2022 Ilker Temir <ilker@ilkertemir.com>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function(app) {
  var plugin = {};

  plugin.id = "gusts";
  plugin.name = "Wind Gusts";
  plugin.description = "Calculates and publishes wind gusts";
  var unsubscribes = [];
  var windSpeed = [];

  plugin.start = function(options) {
    function processDelta(data) {
      let dict = data.updates[0].values[0];
      let path = dict.path;
      let value = dict.value;
      switch (path) {
        case 'environment.wind.speedApparent':
          let now = new Date();
          windSpeed.push({
            date: now,
            speed: value
          });
          // Keep one hour of data
          windSpeed = windSpeed.filter(item => (now - item.date) <= 60*60*1000);
          break;
        default:
          app.error('Unknown path: ' + path);
      }
    }
  
    function publishGusts() {
      let now = new Date();
      let fiveMinutes = windSpeed.filter(item => (now - item.date) <= 5*60*1000);
      let fiveMinuteArray = Array.from(Object.values(fiveMinutes), item => item.speed);
      let oneHourArray = Array.from(Object.values(windSpeed), item => item.speed);
      let fiveMinuteGust = Math.max(...fiveMinuteArray);
      let oneHourGust = Math.max(...oneHourArray);
      app.debug(`Publishing gust ${fiveMinuteGust} and ${oneHourGust}`);
 
      var values = [{
          path: 'environment.wind.fiveMinutes.gustApparent',
          value: fiveMinuteGust
        }, {
          path: 'environment.wind.oneHour.gustApparent',
          value: oneHourGust
      }];
      app.handleMessage('gusts', {
        updates: [{
          values: values
        }]
      });
    }

    app.setPluginStatus('Publishing wind gusts');
    let subscription = {
      context: 'vessels.self',
      subscribe: [{
        path: 'environment.wind.speedApparent',
        period: 100
      }]
    };

    app.subscriptionmanager.subscribe(subscription, unsubscribes, function() {
      app.error('Subscription error');
    }, data => processDelta(data));
 
    // Publish gusts every 2 seconds
    setInterval( function() {
      publishGusts();
    }, 2000);
  }

  plugin.stop =  function() {
  };

  plugin.schema = {
    type: 'object',
    required: [],
    properties: {
    }
  }

  return plugin;
}
