"use strict"

function Dashboard()
{
    // Variables:
    var div, svg, indicator, scoreIndicator;

    var delayText, delayAirportText;
    var delayScore = "", delayStatus = "", delayTrend = "";
    var originDelayScore = "", originDelayStatus = "", originDelayTrend = "";
    var destDelayScore = "", destDelayStatus = "", destDelayTrend = "";

    var checkbox;

    // Functions:
    function getDestinationAirports()
    {
        var destinationAirports = [];

        for (var i = 0 ; i < flightsData.length; i++)
        {
            var flight = flightsData[i];
            var state = flight.DEST_CITY_NAME.slice(-2);

            if (!(destinationAirports.includes(flight.DEST_AIRPORT)) && state != "IL")
                destinationAirports.push(flight.DEST_AIRPORT);
        }

        return destinationAirports;
    }

    function destinationAirportsDropdownEvent() 
    {
        var selectedAirport = destinationAirportsDropdown.value();
        var destinationCity = getDestinationAirportInfo(selectedAirport).city;

        requestOpenWeatherMapData(destinationCity);

        content.updateLeafletMap();
        updateDelayInfo();
    }

    function getDestinationAirportInfo(airportName)
    {
        var citystate, state, city, lat, lng;

        // find airport
        for (var i = 0; i < flightsData.length; i++)
        {
            if (airportName == flightsData[i].DEST_AIRPORT)
            {
                citystate = flightsData[i].DEST_CITY_NAME;
                break;
            }
        }

        // get state name
        state = citystate.slice(-2);
        state = stateAbrvToNameHash[state];

        // get city name
        city = citystate.slice(0, -4);

        // get lat, long
        for (key in stateNameToLatLongHash)
        {
            var s = stateNameToLatLongHash[key];

            if (s.state == state)
            {
                lat = s.latitude;
                lng = s.longitude;
                break;
            }
        }

        return {
            state: state, 
            city: city,
            lat: lat,
            lng: lng
        };
    }

    function showWeatherData()
    {
        var originAirportParent = createElement("div")
            .parent("#dashboard")
            .id("origin-airport-weather");
        var destAirportParent = createElement("div")
            .parent("#dashboard")
            .id("dest-airport-parent");
        var delaysParent = createElement("div")
            .parent("#dashboard")
            .id("flight-delay-info");

        // Origin Airport:
        createElement("h3", "Origin Airport:").parent(originAirportParent);
        createElement("h4", "O'Hare International Airport").parent(originAirportParent);

        createElement("br").parent(originAirportParent);

        createElement("h5", "Weather: " + originAirportData.weather[0].main + " (" + originAirportData.weather[0].description + ")").parent(originAirportParent);
        createElement("h5", "Temperature: " + originAirportData.main.temp + " °F").parent(originAirportParent);
        createElement("h5", "Wind: " + originAirportData.wind.speed + " mph").parent(originAirportParent);


        createElement("br").parent(originAirportParent);

        // Destination Airport
        createElement("h3", "Destination Airport:").parent(destAirportParent);
        createDestinationAirportsDropdown(destAirportParent);

        createElement("br").parent(destAirportParent);
        createElement("br").parent(destAirportParent);

        var selectedAirport = destinationAirportsDropdown.value();
        var destinationCity = getDestinationAirportInfo(selectedAirport).city;
        requestOpenWeatherMapData(destinationCity);

        // Delay:
        createElement("br").parent(delaysParent);
        createElement("br").parent(delaysParent);
        createElement("h3", "Delay Status:").parent(delaysParent);
        delayText = createElement("h5", delayStatus + " and " + delayTrend).parent(delaysParent);
        delayAirportText = createElement("h4", "()").parent(delaysParent);

        createDelayGradient(delaysParent);
        updateDelayInfo();
    }

    function createDestinationAirportsDropdown(parent)
    {
        var destinationAirports = getDestinationAirports();
        destinationAirports.sort();

        destinationAirportsDropdown = createSelect();
        destinationAirportsDropdown.parent(parent);
        destinationAirportsDropdown.style("width", "90%");
        destinationAirportsDropdown.class("dest-airports-select");

        destinationAirportsDropdown.changed(destinationAirportsDropdownEvent)

        for (var i = 0; i < destinationAirports.length; i++)
        {
            destinationAirportsDropdown.option(destinationAirports[i]);
        }

        destOptions = destinationAirports;
    }

    function createDelayGradient(parent)
    {
        // Background:
        var width = select("#dashboard").width,
            height = 30,
            padding = 10,
            textpadding = 10;

        createElement("div")
            .id("svg-container")
            .parent(parent);
            
        div = d3.select('#svg-container');
        svg = div.append("svg");

        svg.attr('width', width).attr('height', height);

        var svgDefs = svg.append('defs');

        var mainGradient = svgDefs.append('linearGradient')
                .attr('id', 'mainGradient');

        mainGradient.append('stop')
        .attr('class', 'stop-left')
        .attr('offset', '0');

        mainGradient.append('stop')
            .attr('class', 'stop-right')
            .attr('offset', '1');

        svg.append('rect')
            .classed('filled', true)
            .attr('x', padding)
            .attr('y', padding + textpadding)
            .attr('width', (width) - 2 * padding)
            .attr('height', height - padding);

        // Marker
        
        // Indicator:
        indicator = svg.append('rect')
            .classed('filled-solid', true)
            .attr('x', 10)
            .attr('y', padding + textpadding)
            .attr('width', 5)
            .attr('height', 10);

        scoreIndicator = svg.append('text')
            .text("0.0")
            .attr("fill", "#868b90")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('x', 10)
            .attr('y', padding)
            .attr('width', 5)
            .attr('height', 15)
            .attr("text-anchor", "middle");
    }

    function updateSVGMarker()
    {
        var x = map(delayScore, 0, 4, 0, select("#dashboard").width);
        indicator.attr('x', x);

        scoreIndicator.attr('x', x);
        scoreIndicator.text(delayScore);
    }

    function updateDelayInfo()
    {
        scoreIndicator.text("...");
        delayText.elt.innerHTML = "Loading...";
        delayAirportText.elt.innerHTML = "(...)";
        getOriginAirportDelay( function() {
            getDestAirportDelay( function() {
              updateDelayUI( function() {
              });
            });
          });
    }

    function updateDelayUI()
    {
        //console.log("@updateDelayUI");
        //console.log(">> Origin:\n" + originDelayScore + "\n" + originDelayStatus + "\n" + originDelayTrend)
        //console.log("\n>> Dest:\n" + destDelayScore + "\n" + destDelayStatus + "\n" + destDelayTrend)
        
        if (originDelayScore > destDelayScore || destDelayScore == "N/A")
        {
            delayScore = originDelayScore;
            delayStatus = originDelayStatus;
            delayTrend = originDelayTrend
            delayAirportText.elt.innerHTML = "(" + "O'Hare International Airport" + ")";
        }
        else
        {
            delayScore = destDelayScore;
            delayStatus = destDelayStatus;
            delayTrend = destDelayTrend
            delayAirportText.elt.innerHTML = "(" + destinationAirportsDropdown.value() + " Airport" + ")";
        }

        delayText.elt.innerHTML = delayStatus + " and " + delayTrend;
        updateSVGMarker();
    }

    function getOriginAirportDelay(callback)
    {
        //console.log("@getOriginAirportDelay")
        $.get('https://allorigins.me/get?method=raw&url=' + encodeURIComponent('https://www.flightstats.com/v2/airport-conditions/KORD') + '&callback=?', 
        function(data)
        {
            var reg = /"delayIndex":{"observed":true,"score":(.*),"status":"(.*)","trend":"(.*)","lastUpdated":"/
            var delayInfo = data.match(reg);

            originDelayScore = delayInfo[1];
            originDelayStatus = delayInfo[2];
            originDelayTrend = delayInfo[3];
            
            callback();
        });
    }

    function getDestAirportDelay(callback)
    {
        var airportCode = airportCodesHash[destinationAirportsDropdown.value() + " Airport"]
        //console.log("@getDestAirportDelay: " + airportCode)
        $.get('https://allorigins.me/get?method=raw&url=' + encodeURIComponent('https://www.flightstats.com/v2/airport-conditions/' + airportCode) + '&callback=?', 
        function(data)
        {
            // var nareg = /"(NOT AVAILABLE)"/
            var reg = /"delayIndex":{"observed":true,"score":(.*),"status":"(.*)","trend":"(.*)","lastUpdated":"/
            var delayInfo = data.match(reg);
            
            if (delayInfo != null)
            {
                destDelayScore = delayInfo[1];
                destDelayStatus = delayInfo[2];
                destDelayTrend = delayInfo[3];
            }
            else
            {
                destDelayScore = "N/A"
                destDelayStatus = "N/A"
                destDelayTrend = "N/A"
            }

            callback();
        });
    }

    function createWeatherCheckbox()
    {
        var checkboxParent = createElement("div")
            .id("weather-checkbox-div")
            .parent("#dashboard");

        createElement("br").parent(checkboxParent);
        createElement("br").parent(checkboxParent);

        checkbox = select("#weather-checkbox").
            parent(checkboxParent);

        createElement("h5", "Visualize Weather")
            .parent(checkboxParent)
            .style("position", "absolute")
            .style("display", "inline")
            .style("transform", "translateY(6px)")

        checkbox.checked(true);
    }

    return {
        getDestinationAirports,
        createDestinationAirportsDropdown,
        getDestinationAirportInfo,
        showWeatherData,
        destinationAirportsDropdown,
        createWeatherCheckbox,

        getOriginAirportDelay,
        getDestAirportDelay,
        updateDelayInfo,

        delayText,
        checkbox
    }
}