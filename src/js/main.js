var originAirportData, destAirportData, flightsData;
let historicalWeatherData;
let stateAbrvToNameHash, stateNameToLatLongHash;
let oceansGeoJSON;

let dashboard = new Dashboard();
let content = new ContentMap();

var destinationAirportsDropdown;

var temp;
var destOptions;
var airportCodesHash;

function preload()
{
    // Open Weather Map API:
    originAirportData = loadJSON("https://api.openweathermap.org/data/2.5/weather?q=Chicago&units=imperial&appid=d426f4c55c706e674620089a98a10cc8");

    // Files:
    // loadJSON("./data/2017_Illinois_Flights.json", gotFlightData);
    loadJSON("./data/2017_Illinois_Flights.json", gotFlightData);

    historicalWeatherData = loadJSON("./data/2017_Chicago_Historical_Weather.json");

    stateAbrvToNameHash = loadJSON("./data/states-hash.json");
    stateNameToLatLongHash = loadJSON("./data/USstates_avg_latLong.json");
    airportCodesHash = loadJSON("./data/airport_codes.json")
    
    oceansGeoJSON = loadJSON("./data/oceans.json");

    temp = loadJSON("./data/temp.json");

    cloud = loadImage("./data/clouds.png");
}

function requestOpenWeatherMapData(city)
{
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial&appid=d426f4c55c706e674620089a98a10cc8";

    loadJSON(url, gotOpenWeatherMapData);
}

function gotOpenWeatherMapData(data) {
    destAirportData = data;

    if (document.getElementById("dest-airport-weather") != null)
        document.getElementById("dest-airport-weather").remove();

    var destAirportParent = createElement("div").parent("#dest-airport-parent");

    destAirportParent.id("dest-airport-weather");
    createElement("h5", "Weather: " + destAirportData.weather[0].main + " (" + destAirportData.weather[0].description + ")").parent(destAirportParent);
    createElement("h5", "Temperature: " + destAirportData.main.temp + " °F").parent(destAirportParent);
    createElement("h5", "Wind: " + destAirportData.wind.speed + " mph").parent(destAirportParent);
}

function gotFlightData(data) {
    flightsData = data;
}

function setup()
{
    dashboard.showWeatherData();
    dashboard.createWeatherCheckbox();

    content.createLeafletMap();
    content.createWeatherCanvas();


    // Rain Init
    for (var i = 0; i < numParticles; i++)
    {
        particles[i] = new Drop();
        particles[i].init();
    }

    // Cloud Init
    cloudX = width / 4;
    cloudY = -cloud.height / 4
}

function draw()
{
    var showWeather = select("#weather-checkbox").checked();
    clear();
    
    if (showWeather)
    {
        if (destAirportData != null)
        {
            if ((destAirportData.weather[0].main) == "Rain")
            {
                for (var i = 0; i < numParticles; i++)
                {
                    particles[i].show();
                    particles[i].move();
                }
        
                frameRate(60);
            }
            else if ((destAirportData.weather[0].main) == "Clouds")
            {
                
                image(cloud, cloudX, cloudY, cloud.width, cloud.height)
    
                cloudX -= xSpeed;
                if (cloudX <= -cloud.width)
                    cloudX = width;
            }
        }
    } 
}

// Rain Drops:   
var numParticles = 400;
var particles = []; 

function Drop()
{
    var x = random(0, innerWidth);
    var y = random(-10, innerHeight);
    var d = 2;
    var h = random(2, 10);
    var col = map(h, 2, 10, 100, 255);

    init = function()
    {
        x = random(0, innerWidth);
        y = random(-10, innerHeight);
        d = 2;
        h = random(2, 10);
        col = map(h, 2, 10, 100, 255);
    }

    show = function()
    {
        noStroke();
        fill(5, 100, 255, 100);
        ellipse(x, y, d, h);
    }

    var vel = 0;
    var grv = map(h, 2, 10, 3, 10);
    var off = map(h, 2, 10, height/2, height);

    move = function()
    {
        y += vel;
        vel = grv;
        if (destAirportData != null)
            vel += destAirportData.wind.speed * 0.1;

        if (y > off)
            y = -10;
    }

    return {
        init,
        show,
        move,
        grv
    }
}

// Clouds (Perlin Noise)
var cloud, cloudX, cloudY;
var xSpeed = 0.2;