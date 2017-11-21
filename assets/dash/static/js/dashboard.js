// create globally-scoped chart objects
var plot_docs_x_topic = dc.rowChart("#dom_plot_docs_x_topic", "plotgroup_a");
var plot_docs_x_selecteddate = dc.barChart("#dom_plot_docs_x_selecteddate", "plotgroup_a");
var plot_docs_x_topic_x_selecteddate = dc.seriesChart("#dom_plot_docs_x_topic_x_selecteddate", "plotgroup_a");
var plot_docs_x_alldate = dc.barChart("#dom_plot_docs_x_alldate", "plotgroup_a")
var plot_docs_x_frm = dc.pieChart("#dom_plot_docs_x_frm","plotgroup_a");
var plot_docs_x_to = dc.pieChart("#dom_plot_docs_x_to","plotgroup_a");
var label_count_selected = dc.dataCount("#dom_label_count_selected", "plotgroup_a")
var table_subselected = dc.dataTable("#dom_table_subselected", "plotgroup_a");

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

// global crossfilter dimensions
var dim_topic, grp_topic_count;
var dim_date, grp_date_count;
var dim_frm, grp_frm_count;
var dim_to, grp_to_count;


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


// read data, do crossfilter and create charts ---------------------------------
d3.csv("static/data/m2_doctopic_2.csv", function (data) {

    // convert datatypes
    data.forEach(function (d) {
        d.doc_id = d.doc_id;
        d.doc_date = date_format.parse(d.doc_datetime);
        d.topic_id = d.topic_id;
        d.frm = d.frm;
        d.to = d.to
    });

    // create crossfilter object
    ndx = crossfilter(data);
    ndx_all = ndx.groupAll();

    // create dimensions and groups
    dim_topic = ndx.dimension(function(d) {return [d.topic_id, d.topic_name]; });
    grp_topic_count = dim_topic.group().reduceCount();

    dim_date = ndx.dimension(function(d) {return d.doc_date; });
    grp_date_count = dim_date.group().reduceCount();

    dim_topic_x_date = ndx.dimension(function(d) {return [d.topic_id, d.doc_date, d.topic_name]});
    grp_topic_x_date_count = dim_topic_x_date.group().reduceCount();

    dim_frm = ndx.dimension(function(d) {return d.ocfrm; });
    grp_frm_count = dim_frm.group().reduceCount();

    dim_to = ndx.dimension(function(d) {return d.octo; });
    grp_to_count = dim_to.group().reduceCount();

    // plotting ----------------------------------------------------------------

    // plot helpers
    date_range_full = new d3.extent(data, function(d){return d.doc_date;});

    date_range = [new Date(1999,0,1), date_range_full[1]];

    // plot docs by topic
    plot_docs_x_topic
        .width(600)
        .height(500)
        .margins({top: 10, right: 10, bottom: 20, left: 30})
        .group(grp_topic_count)
        .dimension(dim_topic)
        .valueAccessor(function(d){return d.value})
        .elasticX(true)
	    .ordering(function(d){ return d.key[1] })
        .gap(2)
	    .renderTitleLabel(false)
        .labelOffsetY(11)
        .ordinalColors(colorbrewer.Paired[10])
        .label(function (d){
            return d.key[1];
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return "Topic " + d.key[1] + ": " + comma_format(ttval) + " docs";
        })
        .on('filtered', function(chart){
                if (dim_topic.top(1)[0]["topic_id"] == dim_topic.bottom(1)[0]["topic_id"]){
                    selected_topic_display.innerHTML= dim_topic.top(1)[0]["topic_name"];
                }else{
                    selected_topic_display.innerHTML='(select single topic)'
                }
            dc.events.trigger(function(){
                dc.redrawAll("plotgroup_b");
            });
        })
        .xAxis().ticks(5);


    // daterange selector for documents
    plot_docs_x_alldate
        .width(1200)
        .height(42)
        .margins({top: 0, right: 10, bottom: 20, left: 30})
        .group(grp_date_count)
        .dimension(dim_date)
        .x(d3.time.scale().domain(date_range))
        .xUnits(d3.time.days)
        .centerBar(false) //true)
        .round(d3.time.day.round)
        .alwaysUseRounding(true)
        .gap(1)
        .brushOn(true)
        .mouseZoomable(false)
        .colors("#333333")
        .on('filtered', function(chart){
            dc.events.trigger(function(){
                plot_docs_x_selecteddate.focus(chart.filter());
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
        .x(d3.time.scale().domain(date_range))
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


   // plot: count docs by topic by subselected daterange
    plot_docs_x_topic_x_selecteddate
        .width(1200)
        .height(400)
        .margins({top: 10, right: 10, bottom: 40, left: 30})
        .chart(function(c) {
            return dc.lineChart(c).interpolate('basis');
        })
        .dimension(dim_topic_x_date)
        .group(grp_topic_x_date_count)
        .ordering(function(d){ return d.key[2] })
        .seriesAccessor(function(d) {
            return d.key[2];
        })
        .keyAccessor(function(d) {
            return d.key[1];
        })
        .valueAccessor(function(d) {
            return d.value;
        })
        .legend(
            dc.legend()
                .x(50)
                .y(0)
                .itemHeight(20)
                .gap(10)
                .horizontal(10)
                .legendWidth(850)
                .itemWidth(200)
        )
        .ordinalColors(colorbrewer.Paired[10])
        .x(d3.time.scale().domain(date_range))
        .xUnits(d3.time.days)
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .yAxis().ticks(5);


    plot_docs_x_frm.width(180)
        .height(180)
        .radius(80)
        .innerRadius(30)
        //.margins({top: 10, right: 27, bottom: 20, left: 3})
        .dimension(dim_frm)
        .group(grp_frm_count)
        .valueAccessor(function(d){return d.value})
        .ordinalColors(colorbrewer.BuPu[3])
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        });


    plot_docs_x_to.width(180)
        .height(180)
        .radius(80)
        .innerRadius(30)
        //.margins({top: 10, right: 27, bottom: 20, left: 3})
        .dimension(dim_to)
        .group(grp_to_count)
        .ordinalColors(colorbrewer.BuPu[3]) //[colorbrewer.YlOrRd[5][1],colorbrewer.YlOrRd[5][2]])
        .label(function (d){
            return d.key;
        })
        .title(function(d){
            var ttval = d.value;
            if (isNaN(ttval)) ttval = 0;
            return d.key + ": " + comma_format(ttval) + " docs";
        });

    // selected count
    label_count_selected
        .dimension(ndx)
        .group(ndx_all)
        .html({
            some:"The filters applied to the plots have selected <strong>%filter-count</strong> of the total <strong>%total-count</strong> records. <a href='javascript:dc.filterAll(\"plotgroup_a\"); dc.renderAll(\"plotgroup_a\");'>[reset to all documents]</a>",
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
        .group(function (d) {return "<u>Topic " + d.topic_name + "</u>";})
        .size(100)
        .columns([
            function (d) {return "&nbsp;" + date_format(d.doc_date);}
            ,function (d) {return d.doc_name;}
            ,function (d) {return d.topic_id;}
            ,function (d) {return d.frm;}
            ,function (d) {return d.to;}
            //,function (d) {return "<a data-toggle='modal' data-target='#remoteModal' href='/comms/emailbody/" + d.doc_id + "'>" + d.sentfullstop + "</a>";}
            ])
        .sortBy(function (d) {return d.doc_date;})
        .order(d3.ascending);

    dc.renderAll("plotgroup_a");

    // Set filter after all rendered
    plot_docs_x_alldate.filter(date_range);
    //dc.redrawAll("plotgroup_a");

    // stop spinner once data is initially loaded
    spinner.stop()

    // read topics, do crossfilter and create charts ---------------------------------
    d3.csv("static/data/m1_topicword_adj_topN_stack.csv", function (data) {

        // convert datatypes
        data.forEach(function (d) {
            d.topic_id = +d.topic_id;
            d.token_order = d.token_order;  // purposefully leave as string for sorting
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
           .width(400)
           .height(500)
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
                       return e.key[0] == 'this_isnt_found_in_the_dataset_so_nothing_is_plotted'
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
        } else {
            selected_topic_display.innerHTML='(select a single topic)'
        }

        dc.renderAll("plotgroup_b");
    });
});
