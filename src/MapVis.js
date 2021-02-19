import React, {
  useRef,
  useEffect
} from 'react';
import * as topojson from "topojson-client";
import * as d3 from 'd3';
import rungeKutta from 'runge-kutta';

function MapVis() {

  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current)
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

    //creating and defining an SVG object which appends to the body element
    let svg = d3.select(ref.current);

    let Promise = require('promise');

    const rk4 = require("ode-rk4");


    //defining the projection as the Natural Earth projection
    let projection = d3.geoNaturalEarth1()
      .center([-10, 40])
      .scale(230);

    // creating shapes based on the projection defined above
    const path = d3.geoPath()
      .projection(projection);

    const g = svg.append('g');

    // Data and color scale
    let data = new Map();

    //defining a colour scale for the choropleths
    let colorScale = d3.scaleQuantize()
      //domain based on smallest and largest population
      .domain([0, 1397715000])
      .range(d3.schemePurples[7]);

    //defining zoom behaviour
    let zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', function (event, d) {
        g.selectAll('path')
          .attr('transform', event.transform);
      });

    svg.call(zoom);

    let time = 0;

    //array that gets the map and population data
    //object will be used later to see if the retrieval was successful
    let promises = [
      d3.json("world-countries.json"),
      d3.csv("population.csv", function (d) {
        data.set(d.code, +d.pop);
      })
    ]

    const beta = .2143,
      gamma = 1 / 10;

    // Define the set of ordinary differential equations.
    const dSIR = (t, y) => [
      -beta * y[0] * y[1],
      (beta * y[0] - gamma) * y[1],
      gamma * y[1]
    ];

    // Solve the system and log the result (reduced to the infection count).
    const simulation = rungeKutta(dSIR, [1, .1, 0], [0, 30], 10);

    let S = simulation.map(x => x[0]);
    let I = simulation.map(x => x[1]);
    let R = simulation.map(x => x[2]);



    console.log(simulation, S, I, R);




    //if the json and csv files are succesfully retreived, carry out ready()
    Promise.all(promises).then(ready);

    function ready([topology]) {

      //binding the json country data, creating a path for every json feature 
      g.selectAll("path")
        .data(topojson.feature(topology, topology.objects.countries1).features)
        .enter()
        .append("path")
        .attr("d", path)
        //defining style
        // .style("fill", "White")
        .style("stroke", "Black")
        .style("stroke-width", 0.1)
        //choropleth colour fill based on population
        .style("fill", function (d) {

          //setting the population for each country from the .csv file
          d.pop = data.get(d.id) || 0;
          return colorScale(d.pop);

        });
    }
  }

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