# Wind Gusts

Signal K misses native functionality to record wind speeds and most wind instruments do not support wind gusts. This leaves a gap in monitoring peak wind speeds. This plugin attempts to close that gap by measuring wind speed every 100 miliseconds and then publishing "gusts" for one minute, five minutes and one hour intervals. Obviously this doesn't meet the true definition of a wind gust, more accurately it should be the maximum wind speed in a one minute, five minutes and one hour intervals.

The idea of this plugin is to provide data for other plugins. You can use it for monitoring solutions like Saillogger.

