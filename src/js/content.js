"use strict"

function ContentMap()
{
    var usmap;
    var statesLayer, bezierCurveLayer;

    var canvas;

    function updateLeafletMap()
    {
        var selectedAirport = destinationAirportsDropdown.value();
        var destinationState = dashboard.getDestinationAirportInfo(selectedAirport).state;

        // Refresh Layers:
        if (typeof statesLayer != "undefined") {
            usmap.removeLayer(statesLayer);
        }

        if (typeof bezierCurveLayer != "undefined") {
            usmap.removeLayer(bezierCurveLayer);
        }

        // Color Illinois & Selected Airport State:
        function styleStates(feature) 
        {
            var opacity = 0;
            var color = "#a0c84b";
            if (feature.properties.name == destinationState || feature.properties.name == "Illinois")
                opacity = 1.0;

            if (feature.properties.name == "Illinois")
            {
                opacity = 1.0;
                color = "#4bc8f0";
            }

            return {
                fillColor: color,
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: opacity
            };
        }

        statesLayer = L.geoJson(statesData, {style: styleStates}).addTo(usmap);

        createBezierCurve(selectedAirport);
    }

    function createBezierCurve(selectedAirport)
    {
        var latlngs = [];

        var latlng1 = [40.3363, -89.0022],
            latlng2 = [dashboard.getDestinationAirportInfo(selectedAirport).lat, dashboard.getDestinationAirportInfo(selectedAirport).lng];

        var offsetX = latlng2[1] - latlng1[1],
            offsetY = latlng2[0] - latlng1[0];

        var r = Math.sqrt( Math.pow(offsetX, 2) + Math.pow(offsetY, 2) ),
            theta = Math.atan2(offsetY, offsetX);

        var thetaOffset = (3.14/10);

        var r2 = (r/2)/(Math.cos(thetaOffset)),
            theta2 = theta + thetaOffset;

        var midpointX = (r2 * Math.cos(theta2)) + latlng1[1],
            midpointY = (r2 * Math.sin(theta2)) + latlng1[0];

        var midpointLatLng = [midpointY, midpointX];

        latlngs.push(latlng1, midpointLatLng, latlng2);

        var pathOptions = {
            color: 'rgba(150,50,50,0.7)',
            weight: 4
        }

        if (typeof document.getElementById('usmap').animate === "function") { 
            var durationBase = 2500;
            var duration = Math.sqrt(Math.log(r)) * durationBase;
            // Scales the animation duration so that it's related to the line length
            // (but such that the longest and shortest lines' durations are not too different).
            // You may want to use a different scaling factor.
            pathOptions.animate = {
                duration: duration,
                iterations: 1,
                easing: 'ease-in-out',
                direction: 'alternate'
            }
        }

        bezierCurveLayer = L.curve(
        [
            'M', latlng1,
            'Q', midpointLatLng,
                latlng2
        ], pathOptions).addTo(usmap);
    }
    
    function createLeafletMap()
    {
        // Create Map:
        usmap = L.map('usmap');

        L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            minZoom: 4,
            maxZoom: 7
        }).addTo(usmap);

        // Center Bounds:
        var maxBounds = L.latLngBounds(
            L.latLng(39.82, -98.58), //Southwest
            L.latLng(39.82, -98.58)  //Northeast
        );

        usmap.setMaxBounds(maxBounds);
        usmap.fitBounds(maxBounds);
        usmap.setView([39.82, -98.58], 4);

        // Re-Color Water:
        function styleOceans(feature) { // Style option
            return {
                'weight': 1,
                'color': 'white',
                'fillColor': '#0a1428',
                'fillOpacity': 1
            }
        }

        L.geoJson(oceansGeoJSON, {style: styleOceans}).addTo(usmap);

        updateLeafletMap();
    }

    function createWeatherCanvas()
    {
        var w = select("#content").width;
        var h = select("#content").height;
        var left = select("#dashboard").width;

        canvas = createCanvas(w + 12, h)
            .id("weather-canvas")
            .parent("#content")
            .style("top", "0")
            .style("left", toString(left));

        //background(0, 0, 0, 0);
    }

    return {
        createLeafletMap,
        updateLeafletMap,
        createWeatherCanvas,
    }
}