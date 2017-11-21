// create globally-scoped chart objects
var plot_docs_x_topic = dc.rowChart("#dom_plot_docs_x_topic", "plotgroup_a");
// var plot_docs_x_sentiment = dc.rowChart("#dom_plot_docs_x_sentiment", "plotgroup_a");
// var plot_docs_x_binpol = dc.barChart("#dom_plot_docs_x_binpol", "plotgroup_a");
// var plot_docs_x_binsubj = dc.barChart("#dom_plot_docs_x_binsubj", "plotgroup_a");

// var plot_docs_x_sent_x_selecteddate_cmb = dc.compositeChart("#dom_plot_docs_x_sent_x_selecteddate_cmb", "plotgroup_a");
var plot_docs_x_selecteddate = dc.barChart("#dom_plot_docs_x_selecteddate", "plotgroup_a");
var plot_docs_x_alldate = dc.barChart("#dom_plot_docs_x_alldate", "plotgroup_a")

var label_count_selected = dc.dataCount("#dom_label_count_selected", "plotgroup_a")
var table_subselected = dc.dataTable("#dom_table_subselected", "plotgroup_a");

//var plot_docs_x_productclass = dc.rowChart("#dom_plot_docs_x_productclass","plotgroup_a");
//var plot_docs_x_contractpremstatus = dc.rowChart("#dom_plot_docs_x_contractpremstatus","plotgroup_a");
//var plot_docs_x_contractriskstatus = dc.rowChart("#dom_plot_docs_x_contractriskstatus","plotgroup_a");

//var plot_docs_x_deptfrom = dc.rowChart("#dom_plot_docs_x_deptfrom","plotgroup_a");
//var plot_docs_x_deptto = dc.rowChart("#dom_plot_docs_x_deptto","plotgroup_a");
//var plot_docs_x_deptcc = dc.rowChart("#dom_plot_docs_x_deptcc","plotgroup_a");

// for topic detail plots
var plot_topic_detail = dc.rowChart("#dom_plot_topic_detail","plotgroup_b");

// custom formatters
var date_format = d3.time.format("%Y-%m-%d");
var compressed_date_format = d3.time.format("%Y%m%d");
var fancy_date_format = d3.time.format("%d %b %Y");
var usa_fancy_date_format = d3.time.format("%b %d %Y");
var float_format = d3.format(".3f");
var comma_format = d3.format("0,000");

dc.dateFormat = fancy_date_format; // destructive hack!

// global variables
var ndx, ndx_td;
var clrs = d3.scale.category20()
var date_range_full, date_range;
var date_range_last60;

// global crossfilter dimensions
var dim_topic, grp_topic_count;
// var dim_sentiment, grp_sentiment_count;
// var dim_binpol, grp_binpol_count;
// var dim_binsubj, grp_binsubj_count;
var dim_date, grp_date_count;
// var dim_date_x_sent, grp_date_x_sent_count;

//var dim_productclass, grp_productclass_count;
//var dim_contractpremstatus, grp_contractpremstatus_count;
//var dim_contractriskstatus, grp_contractriskstatus_count;
//var dim_deptfrom, grp_deptfrom_count;
//var dim_deptto, grp_deptto_count;
//var dim_deptcc, grp_deptcc_count;

// for topic detail
var dim_chosen_topic, grp_chosen_topic_value;
var dim_topic_detail, grp_topic_detail_value;

// spinner
var spinner_config = {lines:9, length:8, width:5, radius:10, corners:1, rotate:0
    ,direction:1, color:'#333', speed:1, trail:65, shadow:false
    ,hwaccel:false, className:'spinner', zIndex:2e9, top:'50%', left:'50%'
};
var target = document.getElementById('spinner');
var spinner = new Spinner(spinner_config).spin(target);
var selected_topic_display = document.getElementById('selected_topic');

// helper functions

// read data, do crossfilter and create charts ---------------------------------
// old file emails_withmotherloaddata_topN.csv
d3.csv("/static/data/emails_topic_data.csv", function (data) {

    // convert datatypes
    data.forEach(function (d) {
        d.doc_date = date_format.parse(d.doc_datetime);
        d.topic_cmap = +d.topic_cmap;
        d.topic_prob = +d.topic_prob;
        // d.polarity = +d.polarity;
        // d.subjectivity = +d.subjectivity;
        // d.polarity_round = +d.polarity;
        // d.subjectivity_round = +d.subjectivity;
        d.topic_id = +d.topic_id;
        // d.sentiment = d.sentiment;
        d.sentfullstop = d.sentlist;
    });

    // create crossfilter object
    ndx = crossfilter(data);
    ndx_all = ndx.groupAll();

    // create dimensions and groups
    dim_topic = ndx.dimension(function(d) {return d.topic_id; });
    grp_topic_count = dim_topic.group().reduceCount();

    // dim_sentiment = ndx.dimension(function(d) {return d.sentiment; });
    // grp_sentiment_count = dim_sentiment.group().reduceCount();
    // console.log(dim_sentiment);

    // dim_binpol = ndx.dimension(function(d) {return d.polarity_round; });
    // grp_binpol_count = dim_binpol.group().reduceCount();

    // dim_binsubj = ndx.dimension(function(d) {return d.subjectivity_round; });
    // grp_binsubj_count = dim_binsubj.group().reduceCount();

    dim_date = ndx.dimension(function(d) {return d.doc_date; });
    grp_date_count = dim_date.group().reduceCount();

    // var reduceAdd = function (p, v) {
    //     //console.log("add", "p=", p, "v=", v);
    //     p.sents[v.sentiment] = p.sents[v.sentiment] + 1;
    //     p.sentiment = v.sentiment;
    //     return p;
    // };

    // var reduceRemove = function(p, v) {
    //     //console.log("remove", "p=", p, "v=", v);
    //     p.sents[v.sentiment] = p.sents[v.sentiment] - 1;
    //     p.sentiment = v.sentiment;
    //     return p;
    // };

    // var reduceInitial = function() {
    //     return {
    //         sents : {'neg':0, 'ntl':0, 'pos':0}
    //     }
    // };

    // grp_date_x_sent_count = dim_date.group().reduce(reduceAdd,reduceRemove,reduceInitial);

    // plotting ----------------------------------------------------------------

    // plot helpers
    date_range_full = new d3.extent(data, function(d){return d.doc_date;});

    date_range = [new Date(2000,1,1), date_range_full[1]];
    date_range_last60 = [d3.time.day.offset(date_range_full[1],-60), d3.time.day.offset(date_range_full[1],0)];

    // plot docs by topic
    plot_docs_x_topic
        .width(600)
        .height(300)
        .margins({top: 10, right: 7, bottom: 20, left: 3})
        .group(grp_topic_count)
        .dimension(dim_topic)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer_ext.SlowGreensGray[10][3],colorbrewer_ext.SlowGreensGray[10][8]])
        .label(function (d){
            return "T " + d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return "Topic " + d.key + ": " + comma_format(ttval) + " docs";
        })
        .on('filtered', function(chart){
                if (dim_topic.top(1)[0]["topic_id"] == dim_topic.bottom(1)[0]["topic_id"]){
                    selected_topic_display.innerHTML="Topic " + dim_topic.top(1)[0]["topic_id"];
                }else{
                    selected_topic_display.innerHTML='(select single topic)'
                }
            dc.events.trigger(function(){
                //plot_docs_x_selecteddate.focus(chart.filter());
                dc.redrawAll("plotgroup_b");
            });
        })
        .xAxis().ticks(5);

    // // plot docs by sentiment
    // plot_docs_x_sentiment
    //     .width(300)
    //     .height(100)
    //     .margins({top: 10, right: 17, bottom: 20, left: 3})
    //     .colors(d3.scale.category20())
    //     //.ordinalColors(colorbrewer.RdYlBu[3])
    //     .group(grp_sentiment_count)
    //     .dimension(dim_sentiment)
    //     .valueAccessor(function(d){return d.value})
    //     .renderTitleLabel(false)
    //     .elasticX(true)
    //     .gap(2)
    //     .xAxis().ticks(5);


    // // plot docs by binned polarity
    // plot_docs_x_binpol
    //     .width(300)
    //     .height(100)
    //     .margins({top: 10, right: 10, bottom: 20, left: 40})
    //     .group(grp_binpol_count)
    //     .dimension(dim_binpol)
    //     .x(d3.scale.linear().domain([-1,1]))
    //     .xUnits(dc.units.fp.precision(0.05))
    //     .brushOn(true)
    //     .mouseZoomable(false)
    //     .renderHorizontalGridLines(true)
    //     .elasticY(true)
    //     .centerBar(false)
    //     //.xAxisLabel("Polarity") // use helper function AddXAxis
    //     .gap(2)
    //     .xAxis().ticks(5);
    // plot_docs_x_binpol.yAxis().ticks(5);


    // // plot docs by subjectivity
    // plot_docs_x_binsubj
    //     .width(300)
    //     .height(100)
    //     .margins({top: 10, right: 10, bottom: 20, left: 40})
    //     .group(grp_binsubj_count)
    //     .dimension(dim_binsubj)
    //     .x(d3.scale.linear().domain([0,1]))
    //     .xUnits(dc.units.fp.precision(0.05))
    //     .brushOn(true)
    //     .mouseZoomable(false)
    //     .renderHorizontalGridLines(true)
    //     .elasticY(true)
    //     .centerBar(false)
    //     //.xAxisLabel("Subjectivity")  // use helper function AddXAxis
    //     .gap(2)
    //     .xAxis().ticks(5);
    // plot_docs_x_binsubj.yAxis().ticks(5);


    // plot: docs alldate (daterange selector)
    plot_docs_x_alldate
        .width(900)
        .height(42)
        .margins({top: 0, right: 10, bottom: 20, left: 20})
        .group(grp_date_count)
        .dimension(dim_date)
        .x(d3.time.scale().domain(date_range))
        .xUnits(d3.time.days)
        .elasticY(true)
        .yAxisLabel("")
        .centerBar(false) //true)
        .round(d3.time.day.round)
        .alwaysUseRounding(true)
        .gap(1)
        .brushOn(true)
        .mouseZoomable(false)
        //.turnOnControls()
        .colors("#333333") //colorbrewer_ext.SlowGreensGray[10][3])
        .on('filtered', function(chart){
            dc.events.trigger(function(){
                plot_docs_x_selecteddate.focus(chart.filter());
                // plot_docs_x_sent_x_selecteddate_cmb.focus(chart.filter());
                //dc.redrawAll("plotgroup_a");
                dc.redrawAll(chart.chartGroup());
            });
        })
        .yAxis().ticks(0);


    // plot: subselected daterange
    plot_docs_x_selecteddate
        .width(900)
        .height(180)
        .margins({top: 10, right: 10, bottom: 40, left: 30})
        .group(grp_date_count)
        .dimension(dim_date)
        .x(d3.time.scale().domain(date_range)) //hack60))
        .xUnits(d3.time.days)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .centerBar(false)
        .round(d3.time.day.round)
        .alwaysUseRounding(true)
        .gap(5)
        .brushOn(false)
        .mouseZoomable(false)
        .title(function(d){
            var ttval = d.value.avg ? d.value.avg : d.value;
            if (isNaN(ttval)) ttval = 0;
            return usa_fancy_date_format(d.key) + "\nCount: " + comma_format(ttval);
        })
        .yAxis().ticks(5);


    // plot: docs by date by sentiment root composite chart
    // plot_docs_x_sent_x_selecteddate_cmb
    //     .width(900)
    //     .height(180)
    //     .margins({top: 10, right: 10, bottom: 40, left: 30})
    //     .group(grp_date_x_sent_count)
    //     .dimension(dim_date)
    //     .x(d3.time.scale().domain(date_range))
    //     .xUnits(d3.time.days)
    //     .elasticY(true)
    //     .renderHorizontalGridLines(true)
    //     .brushOn(false)
    //     .mouseZoomable(false);



    // plot: docs by date by sentiment child composite charts
    // plot_docs_x_sent_x_selecteddate_cmb.compose([
    //     dc.lineChart(plot_docs_x_sent_x_selecteddate_cmb)
    //         //.dimension(dim_date)
    //         .colors(clrs(3))
    //         .valueAccessor(function(d) {return d.value.sents['neg'];})

    //     ,dc.lineChart(plot_docs_x_sent_x_selecteddate_cmb)
    //         //.dimension(dim_date)
    //         .colors(clrs(4))
    //         .valueAccessor(function(d) {return d.value.sents['ntl'];})

    //     ,dc.lineChart(plot_docs_x_sent_x_selecteddate_cmb)
    //         //.dimension(dim_date)
    //         .colors(clrs(5))
    //         .valueAccessor(function(d) {return d.value.sents['pos'];})
    // ]);

/*

    // plot docs by product class
    plot_docs_x_productclass
        .width(300)
        .height(200)
        .margins({top: 10, right: 27, bottom: 20, left: 3})
        .group(grp_productclass_count)
        .dimension(dim_productclass)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer.Purples[5][1],colorbrewer.Purples[5][2]])
        .data(function(grp){
            return grp.all().filter(function(kv){return kv.key != ''});
        })
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        })
        .xAxis().ticks(5);


    // plot docs by contract premium status
    plot_docs_x_contractpremstatus
        .width(300)
        .height(200)
        .margins({top: 10, right: 27, bottom: 20, left: 3})
        .group(grp_contractpremstatus_count)
        .dimension(dim_contractpremstatus)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer.Purples[5][1],colorbrewer.Purples[5][2]])
        .data(function(grp){
            return grp.all().filter(function(kv){return kv.key != ''});
        })
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        })
        .xAxis().ticks(5);


    // plot docs by contract risk status
    plot_docs_x_contractriskstatus
        .width(300)
        .height(200)
        .margins({top: 10, right: 27, bottom: 20, left: 3})
        .group(grp_contractriskstatus_count)
        .dimension(dim_contractriskstatus)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer.Purples[5][1],colorbrewer.Purples[5][2]])
        .data(function(grp){
            return grp.all().filter(function(kv){return kv.key != ''});
        })
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        })
        .xAxis().ticks(5);



    // plot docs by dept from
    plot_docs_x_deptfrom
        .width(300)
        .height(200)
        .margins({top: 10, right: 27, bottom: 20, left: 3})
        .group(grp_deptfrom_count)
        .dimension(dim_deptfrom)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer.YlOrRd[5][1],colorbrewer.YlOrRd[5][2]])
        .data(function(grp){
            return grp.all().filter(function(kv){return kv.key != ''});
        })
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        })
        .xAxis().ticks(5);



    // plot docs by dept to
    plot_docs_x_deptto
        .width(300)
        .height(200)
        .margins({top: 10, right: 27, bottom: 20, left: 3})
        .group(grp_deptto_count)
        .dimension(dim_deptto)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer.YlOrRd[5][1],colorbrewer.YlOrRd[5][2]])
        .data(function(grp){
            return grp.all().filter(function(kv){return kv.key != ''});
        })
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        })
        .xAxis().ticks(5);


    // plot docs by dept cc
    plot_docs_x_deptcc
        .width(300)
        .height(200)
        .margins({top: 10, right: 27, bottom: 20, left: 3})
        .group(grp_deptcc_count)
        .dimension(dim_deptcc)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
        .gap(2)
        .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors([colorbrewer.YlOrRd[5][1],colorbrewer.YlOrRd[5][2]])
        .data(function(grp){
            return grp.all().filter(function(kv){return kv.key != ''});
        })
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        })
        .xAxis().ticks(5);

 */

    // selected count
    label_count_selected
        .dimension(ndx)
        .group(ndx_all)
        .html({
            some:"The filters applied on the plots have selected <strong>%filter-count</strong> of the total <strong>%total-count</strong> records. <a href='javascript:dc.filterAll(\"plotgroup_a\"); dc.renderAll(\"plotgroup_a\");'>[reset to all documents]</a>",
            all:"All records selected. Please click on the plots to apply filters."
        });


    // table: subselected emails (to show text-based content)
    // TODO consider using dynatable
    // http://stackoverflow.com/questions/21596616/dc-js-data-table-using-jquery-data-table-plugin
    table_subselected
        .width(960)
        .height(320)
        //.margins({top: 10, right: 20, bottom: 10, left: 20})
        .dimension(dim_date)
        //.group(function (d) {return compressed_date_format(d.doc_date);})
        .group(function (d) {return "<u>Topic " + d.topic_id + "</u>";})
        .size(100)
        .columns([
             function (d) {return "&nbsp;" + date_format(d.doc_date);}
            ,function (d) {return d.topic_id;}
            ,function (d) {return d.sentiment;}
            ,function (d) {return "<a data-toggle='modal' data-target='#remoteModal' href='/comms/emailbody/" + d.doc_id + "'>" + d.sentfullstop + "</a>";}])
        .sortBy(function (d) {return d.doc_date;})
        .order(d3.ascending);

    dc.renderAll("plotgroup_a");

    // Set filter after all rendered
    plot_docs_x_alldate.filter(date_range);
    //dc.redrawAll("plotgroup_a");

    // stop spinner once data is initially loaded
    spinner.stop()

    // read topics, do crossfilter and create charts ---------------------------------
    d3.csv("/static/data/topic_detail.csv", function (data) {

        // convert datatypes
        data.forEach(function (d) {
            d.topic_id = +d.topic_id;
            d.token_order = d.token_order;          // purposefully leave as string for sorting
            d.token_value = +d.token_value;
            d.token = d.token
        });

        // create crossfilter object
        ndx_td = crossfilter(data);
        ndx_all = ndx_td.groupAll();

        // create dimensions and groups
        dim_topic_detail = ndx_td.dimension(function(d) {return [d.topic_id, d.token_order, d.token]; });
        grp_topic_detail_value = dim_topic_detail.group().reduceSum(function (d) {
                                return d.token_value;
                            });

        // plot topic details
        plot_topic_detail
           .width(300)
           .height(300)
           .margins({top: 10, right: 10, bottom: 20, left: 40})
           .dimension(dim_topic_detail)
           .group(grp_topic_detail_value)
           .valueAccessor(function(d){return +d.value})
           .data(function(grp){
               return _.filter(grp.all(),function(e){
                   //return e.key[0] == dim_topic.bottom(1)[0]["topic_id"];
                  if (dim_topic.top(1)[0]["topic_id"] == dim_topic.bottom(1)[0]["topic_id"]){
                       return e.key[0] == dim_topic.top(1)[0]["topic_id"];
                   }else{
                       return e.key[0] == 'hammock' // which is not found in the data and hence not plotted
                   }
               });
           })
           .ordinalColors(colorbrewer_ext.SlowGreensCyclic[10])
           .elasticX(true)
           .gap(2)
           .renderTitleLabel(false)
           .labelOffsetY(8)
           .label(function (d){
               return d.key[2];
           })
           .title(function(d){
               var ttval = d.value;
               if (isNaN(ttval)) ttval = 0;
               return d.key[2] + " " + float_format(ttval);
           })
           .ordering(function(d) { return -d.value })  // doesn't seem to work! instead have padded token_order with zeros
           .xAxis().ticks(5);

        //selected_topic_display.innerHTML=dim_topic.bottom(1)[0]["topic_id"];
        if (dim_topic.top(1)[0]["topic_id"] == dim_topic.bottom(1)[0]["topic_id"]){
            selected_topic_display.innerHTML="Topic " + dim_topic.top(1)[0]["topic_id"];
        }else{
            selected_topic_display.innerHTML='(select a single topic)'
        }

        dc.renderAll("plotgroup_b");
    });

});
