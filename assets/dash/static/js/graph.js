// function to brute-force create a matrix object
Array.matrix = function(m,n, initial) {
	var a, i, j, mat = [];
	for (i = 0; i < m; i += 1) {
		a = [];
		for (j = 0; j < n; j += 1) {
			a[j] = initial;
		}
		mat[i] = a;
	}
	return mat;
};


function sum_2d_array(mx) {
    sum = 0;
    for (i=0; i<mx.length; i+=1){
        sum += mx[i].reduce(function(prev, cur) {return prev + cur;})
    };
    return sum;
}

// returns a function for fading all except a given chord group g
function fade_fn(opacity) {
    return function(g, i) {
        graph_obj.selectAll(".chord path") //("g.chord path")
            .filter(function(d) {return d.source.index != i && d.target.index != i;})
            .transition()
            .style("opacity", opacity);
    };
};

// returns a function handler for coloring a given chord group.
function switch_chord_color_fn(gph) {
    return function(g,i){
        var colorby = this.value;
        if (colorby == "source") {
            gph.selectAll("g.chord path")
                .style("fill", function(d) {
                    return fill_fn(d.source.index);
                });
        } else {
            gph.selectAll("g.chord path")
                .style("fill", function(d) {
                    return fill_fn(d.target.index);
                });
        };
    };
};

// returns an array of tick angles and labels, given a group.
function arcticks_fn1(d) {
    var k = (d.endAngle - d.startAngle) / Math.round(d.value,0);
    return d3.range(0, d.value, 500).map( function(v, i) {
        return {
            angle: v * k + d.startAngle
            ,label: ((i % 2) | (i == 0)) ? null : v / 1000 + "k"
            ,tickzero: i == 0 ? 1: 0
        };
    });
}


function arcticks_fn2(d) {
    var k = (d.endAngle - d.startAngle) / Math.round(d.value,0);
    return d3.range(0, Math.round(d.value,0), 50).map( function(v, i) {
        return {
            angle: v * k + d.startAngle,
            label: (i % 2) ? null : v
        };
    });
}



// return a string split at carriage returns
function multiline_fn(txt,row){
    words_arr = txt.split(' ')
    words_arr.reverse()
    first = words_arr.pop()
    words_arr.reverse()
    rem = words_arr.join(' ')

    if (row == 0){
        return first
    } else {
        return rem
    }
};


// table generation function
function tabulate(domtableobject, jsondata, colnames) {

    // TODO: allow updates to an existing table, to allow for css formatting
    // http://stackoverflow.com/questions/14514776/updating-an-html-table-in-d3-js-using-a-reusable-chart

    var table = d3.select(domtableobject);

    if (colnames.length != 0){
        // optional header row
        thead = table.append("thead")
        thead.append("tr").selectAll("th")
            .data(colnames).enter().append("th")
            .text(function(colname) { return colname; });
    }
    tbody = table.append("tbody");

    // create a row for each object in the json data
    var rows = tbody.selectAll("tr")
        .data(jsondata).enter().append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(d){return [d3.keys(d),d3.values(d)]})
        .enter().append("td")
        .text(function(d) {return d});

    return table;
};

/* ----------------- general setup and initialise variables ----------------- */

var w = 900,
    h = 900,
    r0 = Math.min(w, h) * .41,
    r1 = r0 * 1.12;

var fill_fn = d3.scale.category20().domain(d3.range(20));

var formatPercent = d3.format(".1%");
var formatInt = d3.format("0.0f");

var arc_fn = d3.svg.arc()
    .innerRadius(r0)
    .outerRadius(r1);

var path_fn = d3.svg.chord()
    .radius(r0);


function update_fn(datafile,flow_grossnet,rank_sel,timespan_sel) {
	d3.json(datafile, function(json) {
        graph_obj = d3.select("#graph_plot")
            .append("svg")
                .attr("width", w)
                .attr("height", h)
            .append("g")
                .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")


        /* Assume that we're only plotting nodes of individuals for now */

        // get nodes
        // assign idx so can be directly referenced by edges source target
        var nodes_idx_dictOLD = {};
        var nodes_idx_dict = {};
        var nodes = json.nodes;
        nodes.forEach( function(node, i) {node.idx = i;});

        // sort by eigen_centrality
        sortednodes = _.sortBy(nodes, function(node){ return parseFloat(node.eigen_cent) });
        sortednodes.reverse()
        sortednodes.forEach( function(node, i) {node.idxsorted = i;});

        // select sorted nodes by rank
        sortednodes.forEach( function(node, i) {
            if ((node.idxsorted >= (rank_sel[0]-1)) & (node.idxsorted < rank_sel[1]) ){
                    nodes_idx_dictOLD[node.idx] = true;
                    nodes_idx_dict[node.idx] = node.idxsorted;
            }
        });

        // create adjacency matrix for all nodes filled with net edge weights for selected nodes
        // TODO: make this for selected nodes only? requires different indexing
        var adjmatrixOLD = Array.matrix(nodes.length, nodes.length, 0);
        var adjmatrix = Array.matrix(Object.keys(nodes_idx_dict).length,
                                      Object.keys(nodes_idx_dict).length, 0);

        json.links.forEach( function(link) {
            if( (link.source in nodes_idx_dict) & (link.target in nodes_idx_dict)){
                if ((link.timeperiod >= timespan_sel[0]) & (link.timeperiod <= timespan_sel[1])){
                    fromOLD = nodes[link.source].idx;
                    toOLD = nodes[link.target].idx;
                    adjmatrixOLD[fromOLD][toOLD] +=  link.net;

                    from = nodes_idx_dict[nodes[link.source].idx];
                    to = nodes_idx_dict[nodes[link.target].idx];
                    adjmatrix[from][to] +=  link.net
                }
            }
        });


        // add matrix of edges to the chord object
        chord_obj = d3.layout.chord()
            .padding(.05)
            //.sortSubgroups(d3.descending)
            //.sortChords(d3.ascending)
            .matrix(adjmatrix);

        /* ------------------------ arc static ---------------------------- */

        // create array of arcs (aka individual) one per node
        var grp_arr = graph_obj.selectAll(".group")
            .data(chord_obj.groups)
            .enter()
            .append("g")
                .attr("class", "group");

        // add mouseover titles to the arcs
        grp_arr.append("title")
            .text(function(d, i) {
                return sortednodes[i].id + " ⇒ " + formatInt(d.value);
            });


        // add arcs
        var grp_arr_path = grp_arr.append("path")
            .attr("id", function(d, i) { return "group" + i; })
            .attr("d", arc_fn)
            .on("mouseover", fade_fn(.1))       // mouseover animation
            .on("mouseout", fade_fn(1))         // mouseover animation
            .style("fill", function(d) { return fill_fn(d.index); })
            .style("stroke", '#999');


        // add text labels to arcs (using curved textpaths)
        var group_arr_text0 = grp_arr.append("text")
            .attr("x", 6).attr("dy", 15)
            .attr("style","font-family:sans-serif; font-size:10;");

        var group_arr_text1 = grp_arr.append("text")
            .attr("x", 6).attr("dy", 26)
            .attr("style","font-family:sans-serif; font-size:10;");

        group_arr_text0.append("textPath")   // textPath is a D3 svg variable name
            .attr("xlink:href", function(d, i) { return "#group" + i; })
            .text(function(d, i) { return multiline_fn(sortednodes[i].id,0); });

        group_arr_text1.append("textPath")
            .attr("xlink:href", function(d, i) { return "#group" + i; })
            .text(function(d, i) { return multiline_fn(sortednodes[i].id,1); });


        // filter and remove text labels that don't fit inside arc areas (textpath > arc subtended)
        group_arr_text0
            .filter(function(d, i) {
                return grp_arr_path[0][i].getTotalLength() / 2 - 40 < this.getComputedTextLength();
            })
            .remove();

        group_arr_text1
            .filter(function(d, i) {
                if (group_arr_text0[0][i].baseURI == "") {
                    return true     // hacky way to check if 1st line was removed, if so also remove
                } else {
                    return grp_arr_path[0][i].getTotalLength() / 2 - 40 < this.getComputedTextLength();
                }
            })
            .remove();

        group_arr_text0
            .filter(function(d, i) {
                if (group_arr_text1[0][i].baseURI == "") {
                    return true     // hack: remove 1st line if second is removed
                } else {
                    return false
                }
            })
            .remove();


        // add tickmarks and ticklabels to arcs
        var grpticks;
        if (flow_grossnet == 'flow_gross') {
            grpticks = graph_obj
                .append("g")
                    .selectAll("g")
                    .data(chord_obj.groups)
                    .enter()
                .append("g")
                    .selectAll("g")
                    .data(arcticks_fn1)
                    .enter().append("g")
                    .attr("transform", function(d) {
                        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + r1 + ",0)";
                    });
        }else{                      //flow_grossnet == 'flow_net'
            grpticks = graph_obj
                .append("g")
                    .selectAll("g")
                    .data(chord_obj.groups)
                    .enter()
                .append("g")
                    .selectAll("g")
                    .data(arcticks_fn2)
                    .enter().append("g")
                    .attr("transform", function(d) {
                        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + r1 + ",0)";
                    });
        }
        grpticks.append("line")
            .attr("x1", 1).attr("y1", 0).attr("y2", 0)
            .attr("x2", function(d){return d.tickzero ? 9 : 4})
            .style("stroke", "#999");
        grpticks.append("text")
            .attr("x", 9).attr("dy", "0.2em")
            .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-29)" : null; })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .attr("style","font-family:sans-serif; font-size:10;")
            .text(function(d) { return d.label; });



        /* ------------------------ chord static ------------------------- */

        // create chords on object and reference in array
        var chord_arr = graph_obj.append('g')
            .attr("class", "chord")
            .selectAll("path")
            .data(chord_obj.chords)
            .enter()
                .append("path")
                    .attr("d", path_fn)
                    .style("fill", function(d) { return fill_fn(d.source.index); })
                    .style("stroke", '#999')
                    .style("opacity", 0.8);


        // add an informative mouseover title for each chord
        chord_arr.append("title").text(function(d) {
            txt = sortednodes[d.source.index].id + " ⇒ "
                    + sortednodes[d.target.index].id + ": " + formatInt(d.source.value)
            if (flow_grossnet == "flow_gross"){
                txt += "\n" + sortednodes[d.target.index].id + " ⇒ "
                    + sortednodes[d.source.index].id + ": " + formatInt(d.target.value)
            }
            return txt
        });

        /* ancillary info and controls */
        d3.selectAll("input[name=colorby]").on("change", switch_chord_color_fn(graph_obj));

        var totals_counts = [{period: timespan_sel[0] + " to " + timespan_sel[1]}
                            ,{rank: rank_sel[0] + " to " + rank_sel[1]}
                            ,{nodes: Object.keys(nodes_idx_dict).length}
                            ,{edges: sum_2d_array(adjmatrix)}];


        var totals_table = tabulate("#infotext",totals_counts,[]);
    });
};







/* --------------------------- page load ---------------------------------- */

var dataset_fqn = "static/data/networkgraph_gross_timeperiods.json";
var grossnet_sel = 'flow_gross';
var rank_sel = [1,50]
var timespan_sel = [199812,200203]

update_fn(dataset_fqn, grossnet_sel, rank_sel, timespan_sel)





/* ------------------------- user control updates ------------------------- */


// switch gross vs net edges
d3.selectAll("input[name=flow_grossnet]").on("change", function() {

    grossnet_sel = this.value;
    // storing in a var because the input doesn't seem to retain selected button value.
    // TODO: fix this
    if (grossnet_sel == 'flow_net') {
        dataset_fqn = "static/data/networkgraph_net_timeperiods.json"
    } else if (grossnet_sel == 'flow_gross') {
        dataset_fqn = "static/data/networkgraph_gross_timeperiods.json"
    }

    d3.select("#graph_plot")
        .selectAll("svg")
        .remove();
	d3.selectAll("#infotext tr")
        .remove();
    update_fn(dataset_fqn,grossnet_sel,rank_sel,timespan_sel)
  });


var slider_centrality = document.getElementById('slider_centrality');

noUiSlider.create(slider_centrality, {
    start: [ 50 ],               // Handle start position
    step: 1,                        // Slider moves in increments of '10'
    //margin: 1,                      // Handles must be more than '1' apart
    connect: 'lower',                  // Display a colored bar between the handles
    direction: 'ltr',               // Put '0' at the bottom of the slider
    orientation: 'horizontal',      // Orient the slider vertically
    //behaviour: 'tap-drag',          // Move handle on tap, bar is draggable
    range: {                        // Slider can select '0' to '100'
        'min': 0,
        'max': 100
    },
    pips: {                         // Show a scale with the slider
        mode: 'range',
        density: 5
    }
});


// var valueInput = document.getElementById('input_slider_centrality_value_0'),
//     valueSpan = document.getElementById('value-span');

// When the slider value changes, update the input and span
slider_centrality.noUiSlider.on('change', function( values, handle ) {
    // if ( handle ) {   // handle == 1 (the upper lim)
    //     document.getElementById('input_slider_centrality_value_0').text = values[handle]
    //     rank_sel[1] = +values[handle]

    // } else {    // handle == 0 (the lower lim)
    //     document.getElementById('input_slider_centrality_value_1').text = values[handle]
    //     rank_sel[0] = +values[handle]
    // }

    //document.getElementById('input_slider_centrality_value_1').text = values[handle]
    rank_sel[1] = +values[handle]

    d3.select("#graph_plot")
            .selectAll("svg")
            .remove();
    d3.selectAll("#infotext tr")
            .remove();

    update_fn(dataset_fqn, grossnet_sel, rank_sel, timespan_sel)
});

// When the input changes, set the slider value
// valueInput.addEventListener('change', function(){
//     slider_centrality.noUiSlider.set([null, this.value]);
// });



// $(function(){
//     $('#slider_centrality').dragslider({
//         min: 1,
//         max: 20,
//         animate: true,
//         range: true,
//         rangeDrag: true,
//         values: [1, 20],
//         change: function( event, ui ) {

//             var min = ui.values[0];
//             var max = ui.values[1];
//             rank_sel = [min, max]

//             // update info display on page
//             $("#input_slider_centrality_value_default").text("");
//             $("#input_slider_centrality_value_0").text("rank " + min);
//             $("#input_slider_centrality_value_1").text("to rank " + max);

//             d3.select("#graph_plot")
//                 .selectAll("svg")
//                 .remove();
//             d3.selectAll("#infotext tr")
//                 .remove();

//             update_fn(dataset_fqn, grossnet_sel, rank_sel, timespan_sel)
//         }
//     });
// });


//This should have each valid amount that can be selected in the slider
// var sliderAmountMap = [199812, 199901, 199902, 199903, 199904, 199905, 199906
//             ,199907, 199908, 199909, 199910, 199911, 199912, 200001, 200002
//             ,200003, 200004, 200005, 200006, 200007, 200008, 200009, 200010
//             ,200011, 200012, 200101, 200102, 200103, 200104, 200105, 200106
//             ,200107, 200108, 200109, 200110, 200111, 200112, 200201, 200202
//             ,200203];


// $(function(){
//     $('#slider_timespan').dragslider({
//         min: 0,
//         max: sliderAmountMap.length-1,
//         animate: true,
//         range: true,
//         rangeDrag: true,
//         values: [0, sliderAmountMap.length-1],
//         change: function( event, ui ) {

//             var min =  sliderAmountMap[ui.values[0]]
//             var max =  sliderAmountMap[ui.values[1]]
//             timespan_sel = [min, max]

//             // update info display on page
//             $("#input_slider_timespan_value_default").text("");
//             $("#input_slider_timespan_value_0").text("" + min);
//             $("#input_slider_timespan_value_1").text(" to " + max);

//             d3.select("#graph_plot")
//                 .selectAll("svg")
//                 .remove();
//             d3.selectAll("#infotext tr")
//                 .remove();

//             update_fn(dataset_fqn,grossnet_sel,rank_sel,timespan_sel)
//         }
//     });
// });
