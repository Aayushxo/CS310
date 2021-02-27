import React, {
  useRef,
  useEffect
} from 'react';
import * as topojson from "topojson-client";
import * as d3 from 'd3';
import rungeKutta from 'runge-kutta';



function MapVis() {
  var data, g, path, S, I, R, colorScale, svg, countryCode, valueWanted;
  //creating an empty dictionary to store SIR model results for each country
  let SIRArray = new Map();
  let travelArray = []
  let time = 80;

  const ref = useRef();

  useEffect(() => {
    svg = d3.select(ref.current)
      .attr("width", 1500)
      .attr("height", 800)
      .style("border", "1px solid black")
      .style("background-color", "hsl(210, 43%, 84%)")
  }, []);

  useEffect(() => {
    drawMap();
  }, []);

  //method which carries out d3
  const drawMap = () => {

    setMap();

  }

  const setMap = () => {
    //creating and defining an SVG object which appends to the body element
    let svg = d3.select(ref.current);

    let Promise = require('promise');
    const rk4 = require("ode-rk4");
    var tip = require("d3-tip");


    //defining the projection as the Natural Earth projection
    let projection = d3.geoNaturalEarth1()
      .center([-10, 40])
      .scale(230);

    // creating shapes based on the projection defined above
    path = d3.geoPath()
      .projection(projection);


    // Data and color scale
    data = new Map();

    //defining a colour scale for the choropleths
    colorScale = d3.scaleQuantize()
      //domain based on smallest and largest population
      .domain([0, 10000])
      .range(d3.schemePurples[9]);

    //defining zoom behaviour
    let zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', function (event, d) {
        svg.selectAll('path')
          .attr('transform', event.transform);
      });

    svg.call(zoom);

    loadData();

  };

  const SIRModel = (beta, gamma, population, time) => {
    //setting the initial infection as 1
    //dividing by population to get the percentage of the population that's infected
    var initInfected = 1 / population;

    // Define the set of ordinary differential equations.
    const dSIR = (t, y) => [
      -beta * y[0] * y[1],
      (beta * y[0] - gamma) * y[1],
      gamma * y[1]
    ];

    // Solve the system and log the result (reduced to the infection count).
    const simulation = rungeKutta(dSIR, [1 - initInfected, initInfected, 0], [0, time], 1);

    S = simulation.map(x => Math.round(x[0] * population));
    I = simulation.map(x => Math.round(x[1] * population));
    R = simulation.map(x => Math.round(x[2] * population));

    return [S, I, R];
  };

  const loadData = () => {

    //array that gets the map and population data
    //object will be used later to see if the retrieval was successful
    let promises = [
      //get the country data
      d3.json("gadm36_0.json"),

      //get the population data
      d3.csv("population.csv", function (d) {

        data.set(d.code, +d.pop);

        //adding the country and the simulation's value's for the country to the dictionary
        SIRArray.set(d.code, SIRModel(0.2, 0.1, d.pop, 100));

        //making a dictionary of countries and corresponding empty array for use later
        // countryID.set(d.code, [])

        //getting SIR values from the user selected parameters

      }),
      
      //get the mobility data
      d3.csv("AirTravel.csv", function (d) {
       
      })

      
    ]

    //if the json and csv files are succesfully retreived, carry out ready()
    Promise.all(promises).then(ready);
  };


  function ready([topology], countryData) {

    //binding the json country data with a path shape, creating a path for every country
    svg.selectAll(".country")
      //getting each country from the json file, whilst filtering out Antarctica
      .data((topojson.feature(topology, topology.objects.world).features).filter(d => d.properties.iso3 != "ATA"))
      .enter()
      .append("path")
      .attr("class", "country") // give them a class for styling and access later
      .attr("d", path)
      .style("stroke", "Black")
      .style("stroke-width", "0.1px")
      .style('fill', "White");

      //call the animation
    var timer = d3.interval(sequence, 1000);
  }

  function sequence() {

 
    console.log("asd", time);

    //selecting all the countries we bound path shapes to
    d3.selectAll('.country')
      .transition()
      .duration(1000)
      .delay(1000)
      //setting the colour of each country based on its no. of infections
      .style("fill", function (d) {

        //getting the country code from the .csv file
        countryCode = d.properties.iso3;
        //get infections for tool tips for certain year 

        //show the infected for the country
        valueWanted = SIRArray.get(countryCode)[1][time];

        return colorScale(valueWanted);

      });

    time++;
    
    

  }

  const transportSIRModel = (beta, gamma, population, time, connectivity) => {
    //setting the initial infection as 1
    //dividing by population to get the percentage of the population that's infected
    var initInfected = 1 / population;

    // Define the set of ordinary differential equations.
    const dSIR = (t, y) => [
      -beta * y[0] * y[1],
      (beta * y[0] - gamma) * y[1],
      gamma * y[1]
    ];

    // Solve the system and log the result (reduced to the infection count).
    const simulation = rungeKutta(dSIR, [1 - initInfected, initInfected, 0], [0, time], 1);

    S = simulation.map(x => Math.round(x[0] * population));
    I = simulation.map(x => Math.round(x[1] * population));
    R = simulation.map(x => Math.round(x[2] * population));

    return [S, I, R];
  };

  return ( <
    div >
    <
    svg ref = {
      ref
    } >
    <
    /svg> < /
    div >
  )
}


export default MapVis;