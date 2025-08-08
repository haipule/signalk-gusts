module.exports = function(app) {
  var plugin = {};

  plugin.id = "gusts";
  plugin.name = "Wind Gusts";
  plugin.description = "Calculates and publishes wind gusts";
  var unsubscribes = [];
  var windSpeed = [];
  var currentUnits = "m/s"; // Default units, if not set

  plugin.start = function(options) {
    function processDelta(data) {
      let dict = data.updates[0].values[0];
      let path = dict.path;
      let value = dict.value;
      switch (path) {
        case 'environment.wind.speedTrue':
          // Extract units if available
          if (dict.meta && dict.meta.units) {
            currentUnits = dict.meta.units;
          }
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
      let oneMinute = windSpeed.filter(item => (now - item.date) <= 60*1000);
      let oneMinuteArray = Array.from(Object.values(oneMinute), item => item.speed);
      let fiveMinutes = windSpeed.filter(item => (now - item.date) <= 5*60*1000);
      let fiveMinuteArray = Array.from(Object.values(fiveMinutes), item => item.speed);
      let oneHourArray = Array.from(Object.values(windSpeed), item => item.speed);
      let oneMinuteGust = Math.max(...oneMinuteArray);
      let fiveMinuteGust = Math.max(...fiveMinuteArray);
      let oneHourGust = Math.max(...oneHourArray);
      app.debug(`Publishing gust ${fiveMinuteGust} and ${oneHourGust}`);
 
      var values = [{
          path: 'environment.wind.oneMinute.gustTrue',
          value: oneMinuteGust,
          meta: { units: currentUnits } 
        }, {
          path: 'environment.wind.fiveMinutes.gustTrue',
          value: fiveMinuteGust,
          meta: { units: currentUnits } 
        }, {
          path: 'environment.wind.oneHour.gustTrue',
          value: oneHourGust,
          meta: { units: currentUnits } 
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
        path: 'environment.wind.speedTrue',
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

  plugin.stop = function() {
    // Clean up
    unsubscribes.forEach(f => f());
    unsubscribes = [];
  };

  plugin.schema = {
    type: 'object',
    required: [],
    properties: {
    }
  }

  return plugin;
}

