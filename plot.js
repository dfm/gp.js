//Plot various GP data products

//Plot the covariance matrix onto a div element.
//
//inputs:
//  id: the div id on which to paint the graph
//  K: the covariance matrix (2D NxN square matrix)
//
// inspired by grid.js https://gist.github.com/bunkat/2605010


function drawMatrix(id, K)
{
    var calData = randomData(20, 20, square);
    console.log(calData);
    var grid = d3.select(id).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", "chart");

    var row = grid.selectAll(".row")
                  .data(calData)
                .enter().append("svg:g")
                  .attr("class", "row");

    var col = row.selectAll(".cell")
                 .data(function (d) { return d; })
                .enter().append("svg:rect")
                 .attr("class", "cell")
                 .attr("x", function(d) { return d.x; })
                 .attr("y", function(d) { return d.y; })
                 .attr("width", function(d) { return d.width; })
                 .attr("height", function(d) { return d.height; })
                 .on('mouseover', function() {
                    d3.select(this)
                        .style('fill', '#0F0');
                 })
                 .on('mouseout', function() {
                    d3.select(this)
                        .style('fill', '#FFF');
                 })
                 .on('click', function() {
                    console.log(d3.select(this));
                 })
                 .style("fill", '#FFF')
                 .style("stroke", '#555');
}

////////////////////////////////////////////////////////////////////////

/**
*   randomData()        returns an array: [
                                            [{id:value, ...}],
                                            [{id:value, ...}],
                                            [...],...,
                                            ];
                        ~ [
                            [hour1, hour2, hour3, ...],
                            [hour1, hour2, hour3, ...]
                          ]

*/
function randomData(gridWidth, gridHeight, square)
{
    var data = new Array();
    var gridItemWidth = gridWidth / 24;
    var gridItemHeight = (square) ? gridItemWidth : gridHeight / 7;
    var startX = gridItemWidth / 2;
    var startY = gridItemHeight / 2;
    var stepX = gridItemWidth;
    var stepY = gridItemHeight;
    var xpos = startX;
    var ypos = startY;
    var newValue = 0;
    var count = 0;

    for (var index_a = 0; index_a < 7; index_a++)
    {
        data.push(new Array());
        for (var index_b = 0; index_b < 24; index_b++)
        {
            newValue = Math.round(Math.random() * (100 - 1) + 1);
            data[index_a].push({
                                time: index_b,
                                value: newValue,
                                width: gridItemWidth,
                                height: gridItemHeight,
                                x: xpos,
                                y: ypos,
                                count: count
                            });
            xpos += stepX;
            count += 1;
        }
        xpos = startX;
        ypos += stepY;
    }
    return data;
}