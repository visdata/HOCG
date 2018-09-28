import {clone, getTime, getTimeString, getTimeStringWithoutYear} from '../processData/processData';
import {doubleClick} from '../event/doubleClickEvent';
import {hsl} from './graphLayout';

function drawNodes(optionNumber, doTransition, transitionType, dd, minWeight, maxWeight) {
    //console.trace();
    var color = this.color;

    function dataBundling(d, i, thisNode) {
        thisNode.append('circle')
            .attrs({
                type: 'circle',
                class: 'node',
                cluster: d.oldKey,
                cx: d.x,
                cy: d.y,
                r: 20
            })
    }

    var focusedNodeData;
    var that=this;
    var nodes= dd.node;
    var edges= dd.edge;
    var focusedID=this.focusedID;
    var drag=this.drag;
    var timeMeasure=this.timeMeasure;
    var textElem=this.textElem;
    var relation=this.relation;
    var edgeLabelElem=this.edgeLabelElem;
    var pathElem=this.pathElem;
    var data=this.data;
    var drawnodes=this.drawnodes;
    var duration=this.duration;
    var nodeClick=this.nodeClick;
    var mouseover=this.mouseover;
    var mouseout=this.mouseout;
    var lScale=d3.scaleLinear().domain([0,1]).range([0.9,0.5]);
    var minNodeSize=this.minNodeSize;
    var maxNodeSize=this.maxNodeSize;
    var rScale=d3.scaleLinear()
        .domain([0,that.topTimeLength||0])
        .range([minNodeSize,maxNodeSize]);
    that.rScale=rScale;
    var g=drawnodes.append('g').datum({index:1}).attr('id','outerLayer').attr('class','nodeLayer');
    var timeFilterSecond=that.timeFilterSecond||[0,0];
    //console.log('flyroom drawNodes timeFilterSecond : '+timeFilterSecond)

    var edgeSet = {};
    var nodesDic = {};
    nodes.forEach(function (node) {
        node.sourceNodes = [];
        node.targetNodes = [];
        nodesDic[node.id] = node;
    });
    edges.forEach(function (edge) {
        var source = edge.source;
        var target = edge.target;
        var key = source + '-' + target;
        if (!edgeSet[key]) {
            edgeSet[key] = 1;
            var sn = nodesDic[source];
            var tn = nodesDic[target];
            sn.targetNodes.push(tn);
            tn.sourceNodes.push(sn);
            //edge.sourceNode=sn;
            //edge.targetNode=tn;
        }
    });

    edges.forEach(function (edge) {
        var source = edge.source;
        var target = edge.target;
        var key = source + '-' + target;
        //if(!edgeSet[key]){
        //    edgeSet[key]=1;
        var sn = nodesDic[source];
        var tn = nodesDic[target];
        //sn.targetNodes.push(tn);
        //tn.sourceNodes.push(sn);
        edge.sourceNode = sn;
        edge.targetNode = tn;
        //}
    });
    var arcRelation = [];
    edges.forEach(function (edge) {
        var timeMeasure = 'second';
        var parseDate = d3.timeParse("%Y:%j:%H:%M:%S");
        var layoutTime;
        layoutTime = edge.timeSeries;
        layoutTime.forEach(function (item) {

            var sourceT = item.sourceTime;
            var targetT = item.targetTime;
            var sStart = +getTime(sourceT.start, timeMeasure);
            var sEnd = +getTime(sourceT.end, timeMeasure);
            var tStart = +getTime(targetT.start, timeMeasure);
            var tEnd = +getTime(targetT.end, timeMeasure);
            var flag = 1;
            var spaceFilter = 0;
            var temporalFilter = 0;


            if (flag == 1) {
                if (item.spatialValue >= spaceFilter && item.temporalValue >= temporalFilter) {
                    item.visible = 'visible';
                    //item.opacity=item.temporalValue*20;
                    item.opacity = 1;
                    (item.opacity > 1) ? item.opacity = 1 : item.opacity += 0;
                    var sourceTime = parseDate(getTimeString(parseInt((sStart + sEnd) / 2), timeMeasure));
                    var targetTime = parseDate(getTimeString(parseInt((tStart + tEnd) / 2), timeMeasure));
                    arcRelation.push({
                        source: edge.source,
                        target: edge.target,
                        sStart: sStart,
                        sEnd: sEnd,
                        tStart: tStart,
                        tEnd: tEnd
                    });
                }

            }
        });
    });
    var arcIdList = [];

    function highlightRelation(d, node_data, node_index, gz, arcDataSeries) {
        var highlightList = [];
        //console.log('entering highlightRelation');
        //console.log(arcRelation);
        //console.log(d.data.data.time_range);
        //console.log(node_index);

        for (var i = 0; i < arcRelation.length; i++) {
            var gid;
            var stime = -1, ttime = -1;
            if (arcRelation[i].source.toString() == node_index) {
                gid = arcRelation[i].target.toString();
                var start = d.data.data.time_range.s;
                var end = d.data.data.time_range.e;
                if (!(start > arcRelation[i].sEnd || end < arcRelation[i].sStart)) {
                    stime = start;
                    ttime = end;
                }

            }
            else if (arcRelation[i].target.toString() == node_index) {
                gid = arcRelation[i].source.toString();
                //console.log("gid as target is " +gid);
                var start = d.data.data.time_range.s;
                var end = d.data.data.time_range.e;
                if (!(start > arcRelation[i].tEnd || end < arcRelation[i].tStart)) {
                    stime = start;
                    ttime = end;
                }
            }

            if (stime != -1 && ttime != -1) {
                //console.log(stime);
                //console.log(ttime);
                //console.log(nodes[gid].timeSeries);
                var z = gz.select('#g' + gid).selectAll('.arc');
                z.each(function (p, j) {
                    var child_z = d3.select(this).selectAll("path");
                    //console.log(child_z);
                    child_z.each(function (arc_z, j) {
                        //console.log(arc_z);
                        if (arc_z.data_color == 0)
                            return;
                        if (arc_z.node_port != d.data.data.port)
                            return;
                        var start_time = arc_z.data.data.time_range.s;
                        var end_time = arc_z.data.data.time_range.e;
                        var target_port = arc_z.node_port;
                        //console.log('highlight arc anomalyWeight '+arc_z.data_color);
                        //console.log('highlight arc time range '+start_time+' -> '+end_time);
                        //console.log('current arc time range '+stime + ' -> '+ttime);
                        if (!(start_time > ttime || end_time < stime)) {
                            //z.select('#arc'+j).select('path').style('stroke',color.nodeHighlightStroke)
                            //z.select('#arc0').select('path').style('stroke',color.nodeHighlightStroke)
                            //console.log('arc_layer element');
                            var arc_layer = d3.select(this);
                            arc_layer.style('stroke', color.nodeHighlightStroke)
                                .style("stroke-width", '2px')
                                .style('z-index', '777');
                            //arcIdList.push(j);
                            arcIdList.push(0);
                            highlightList.push({
                                node: gid,
                                //arc:j,
                                arc: 0,
                                arcdata: arcDataSeries[gid]
                            });


                        }
                    });
                });
            }
        }
        var nodeList = [];
        highlightList.forEach(function (t) {
            if (nodeList.indexOf(t.node) == -1) {
                nodeList.push({
                    node: t.node
                });
            }
        });
        return nodeList;
    }

    function recovery(highlightList) {
        highlightList.forEach(function (d1) {
            var i = 0;
            //gz.select('#g'+d1.node).selectAll('path').remove();
            gz.select('#g' + d1.node).selectAll('path').style('stroke', 'white')
                .each(function (d2) {
                    // console.log(arc(d));
                    d2.that = that;
                    d2.points = d3.select(this).attr('d');
                    d2.arcdata = d1.arcdata;
                    d2.flag = d3.select(this).attr('id');
                    d2.select = d3.select(this);
                    i++;
                    //d1.nodeR=d.nodeR;

                });
        });
    }

    function drawNodes_mouseover(cur_arc_dom, d, node_data, node_index, highlightList) {
        node_data.highlightList = [];
        if (d.data_color != 0) {
            //console.log('entering drawNodes_mouseover');
            //console.log(d.data_color);
            //console.log(d);
            //console.log('mouseover cur_arc');
            //console.log(cur_arc_dom);
            cur_arc_dom.styles({
                'stroke': color.nodeHighlightStroke,
                'stroke_width': '2px',
                'z-index': '999999'
            })
            //console.log(arcDataSeries);
            highlightList = highlightRelation(d, node_data, node_index, gz, arcDataSeries);
            node_data.highlightList = highlightList;
            //console.log('highlightList ');
            //console.log(highlightList);
            for (var i = 0, len = highlightList.length; i < len; i++) {
                for (var j = 0; j < node_data.pathElem.length; j++) {
                    if ((node_data.pathElem[j].attr('source') == node_index && node_data.pathElem[j].attr('target') == highlightList[i].node) || (node_data.pathElem[j].attr('source') == highlightList[i].node && node_data.pathElem[j].attr('target') == node_index)) {
                        node_data.pathElem[j].style('stroke', color.edgeHightLightColor);
                    }
                }
            }
            for (var i = 0, len = highlightList.length; i < len; i++) {
                for (var j = 0; j < node_data.arrow.length; j++) {
                    if ((node_data.arrow[j].source == node_index && node_data.arrow[j].target == highlightList[i].node) || (node_data.arrow[j].source == highlightList[i].node && node_data.arrow[j].target == node_index)) {
                        node_data.arrow[j].arrow.style('stroke', color.edgeHightLightColor);
                    }
                }
            }
        }
        // return mouseover(d,that);
    }

    function drawNodes_mouseout(cur_arc_dom, dd, node_data, node_index) {
        //console.log('entering drawNodes_mouseout highlightList');
        //console.log(node_data.highlightList);
        var highlightList = node_data.highlightList;

        cur_arc_dom.style('stroke', function (t) {
            return d3.select(this).style('fill');
        })
            .style("stroke-width", '2px')
            .style('z-index', '200');
        highlightList.forEach(function (d1) {
            //gz.select('#g'+d1.node).selectAll('path').remove();
            // console.log( gz.select('#g'+d1.node).selectAll('path'));
            gz.select('#g' + d1.node).selectAll('path').style('stroke', function (t) {
                return d3.select(this).style('fill');
            })
                .style("stroke-width", '2px')
                .style('z-index', '200')
                .each(function (d2) {
                    // console.log(arc(d));
                    d2.that = that;
                    d2.points = d3.select(this).attr('d');
                    d2.arcdata = arcDataSeries[d1.node];
                    //console.log(arcDataSeries[d1.node]);
                    //console.log(d3.select(this).attr('id'));
                    d2.flag = d3.select(this).attr('id');
                    d2.select = d3.select(this);
                    //d1.nodeR=d.nodeR;

                });
        });

        for (var i = 0, len = highlightList.length; i < len; i++) {
            var d = node_data;
            //console.log('node_data pathElem ');
            //console.log(d.pathElem);
            for (var j = 0; j < d.pathElem.length; j++) {
                //console.log('recovering highlighted edges of node '+node_index);
                //console.log('highlighted target node '+highlightList[i].node);
                //console.log('edge source: '+d.pathElem[j].attr('source'));
                //console.log('edge target: '+d.pathElem[j].attr('target'));
                if ((d.pathElem[j].attr('source') == node_index && d.pathElem[j].attr('target') == highlightList[i].node) || (d.pathElem[j].attr('source') == highlightList[i].node && d.pathElem[j].attr('target') == node_index)) {
                    d.pathElem[j].style('stroke', color.edgeColor);
                }
            }
        }
        for (var i = 0, len = highlightList.length; i < len; i++) {
            var d = node_data;
            for (var j = 0; j < d.arrow.length; j++) {
                if ((d.arrow[j].source == node_index && d.arrow[j].target == highlightList[i].node) || (d.arrow[j].source == highlightList[i].node && d.arrow[j].target == node_index)) {
                    d.arrow[j].arrow.style('stroke', color.edgeColor);
                }
            }
        }
    }

    function event_time_reform(item, timeFilter, subTimeMeasure) {
        item.start = +getTime(item.T_start, subTimeMeasure);
        item.end = +getTime(item.T_end, subTimeMeasure);
        var flag = false;
        if (item.start <= timeFilter[0] && item.end >= timeFilter[1]) {
            item.start = timeFilter[0];
            item.end = timeFilter[1];
            flag = true;
        }
        else if (item.start <= timeFilter[0] && item.end >= timeFilter[0]) {
            item.start = timeFilter[0];
            flag = true;
        }
        else if (item.start <= timeFilter[1] && item.end >= timeFilter[1]) {
            item.end = timeFilter[1];
            flag = true;
        }
        else if (item.start >= timeFilter[0] && item.end <= timeFilter[1]) {
            flag = true;
        }
        return flag
    }

    function get_average(arr) {
        var sum = 0, avg = 0;
        if (arr.length) {
            sum = arr.reduce(function (a, b) {
                return a + b;
            });
            avg = sum / arr.length;
        }
        return avg;
    }

    function time_range_intersect(range_a, range_b) {
        if ((range_a.s >= range_b.e) | (range_a.e <= range_b.s)) return false;
        return true;
    }

    function create_new_record(anomalyTime, weight, port, time_range) {
        var t = {};
        t.anomalyTime = anomalyTime;
        t.anomalyWeight = weight;
        t.port = port;
        t.layer_index = that.color_map[port][1];
        var time_range_new = {s: time_range.s, e: time_range.e};
        t.time_range = time_range_new;
        return t;
    }

    function set_record_value(t, anomalyTime, weight, port, time_range) {
        t.anomalyTime = anomalyTime;
        t.anomalyWeight = weight;
        t.port = port;
        t.layer_index = that.color_map[port][1];
        var new_time_range = {s: time_range.s, e: time_range.e};
        t.time_range = new_time_range;
    }

    function javascript_abort() {
        throw new Error('This is not an error. This is just to abort javascript');
    }

    function merge_next_layer_if_possible(cur_layer, cur_record, next_layer, new_record_array) {
        var layer_record_num = next_layer.length;
        var merged_something = false;
        for (var j = 0; j < layer_record_num; j++) {
            var record = next_layer[j];
            if (!record) continue;
            if (record.anomalyWeight == 0)
                continue;
            //console.log('looking into record of next layer');
            //console.log(record);
            if (time_range_intersect(cur_record.time_range, record.time_range)) {
                var c_s = cur_record.time_range.s;
                var c_e = cur_record.time_range.e;
                var n_s = record.time_range.s;
                var n_e = record.time_range.e;
                //console.log('merging next layer '+n_s + ' -> ' + n_e+' into cur layer '+ c_s + ' -> ' + c_e);
                //n     ***********
                //c     ***********
                if ((c_s == n_s) & (c_e == n_e)) {
                    //console.log('entering equal');
                    // fixing existing record of current layer
                    set_record_value(cur_record, cur_record.anomalyTime, record.anomalyWeight, record.port, cur_record.time_range);
                    // fixing existing record of next layer
                    set_record_value(record, record.anomalyTime, 0, record.port, record.time_range);
                    merged_something = true;
                    break;
                }
                //n     ***********
                //c     *****
                else if ((c_s == n_s) & (c_e < n_e)) {
                    //console.log('entering left equal 0');
                    // fixing existing record of current layer
                    set_record_value(cur_record, cur_record.anomalyTime, record.anomalyWeight, record.port, cur_record.time_range);
                    // fixing existing record as right-hand record of next layer
                    var right_time_range = {s: c_e, e: n_e};
                    var right_anomalyTime = right_time_range.e - right_time_range.s;
                    set_record_value(record, right_anomalyTime, record.anomalyWeight, record.port, right_time_range);
                    // inserting vacant record into next layer
                    var record_insert_into_next_layer = create_new_record(cur_record.anomalyTime, 0, record.port, cur_record.time_range);
                    next_layer.splice(j, 0, record_insert_into_next_layer);
                    merged_something = true;
                    break;
                }
                //n     *****
                //c     **********
                else if ((c_s == n_s) & (c_e > n_e)) {
                    //console.log('entering left equal 1');
                    // fixing current record as right-hand record in cur layer
                    var cur_timerange = {s: n_e, e: c_e};
                    var cur_timelen = cur_timerange.e - cur_timerange.s;
                    set_record_value(cur_record, cur_timelen, cur_record.anomalyWeight, cur_record.port, cur_timerange);
                    // add new falling record in cur layer
                    var new_record = create_new_record(record.anomalyTime, record.anomalyWeight, record.port, record.time_range);
                    new_record_array.push([0, new_record]);
                    // fixing existing record in next layer
                    set_record_value(record, record.anomalyTime, 0, record.port, record.time_range);
                    merged_something = true;
                    break;
                }
                //n           **********
                //c     *********
                else if ((c_s < n_s) & (c_e > n_s) & (c_e < n_e)) {
                    //console.log('entering 1');
                    var cur_record_time_s = cur_record.time_range.s;
                    var cur_record_time_e = cur_record.time_range.e;
                    var next_record_time_s = record.time_range.s;
                    var next_record_time_e = record.time_range.e;
                    // inserting new record into current layer
                    var new_time_range = {s: record.time_range.s, e: cur_record.time_range.e};
                    var new_anomalyTime = new_time_range.e - new_time_range.s;
                    var new_record = create_new_record(new_anomalyTime, record.anomalyWeight, record.port, new_time_range);
                    new_record_array.push([1, new_record]);
                    // fixing existing record of current layer
                    cur_record.anomalyTime -= new_anomalyTime;
                    cur_record.time_range.e = record.time_range.s;

                    // fix existing record of next layer
                    record.anomalyTime -= new_anomalyTime;
                    record.time_range.s = cur_record_time_e;

                    // inserting vacant record into next layer
                    var record_insert_into_next_layer = create_new_record(new_anomalyTime, 0, record.port, new_time_range);
                    next_layer.splice(j, 0, record_insert_into_next_layer);
                    merged_something = true;
                    break;
                }
                //n           **********
                //c     ***********************
                else if ((c_s < n_s) & (c_e >= n_e)) {
                    //console.log('entering 2');
                    // fixing existing record as falling record in current layer
                    var new_time_range = {s: record.time_range.s, e: record.time_range.e};
                    var new_anomalyTime = new_time_range.e - new_time_range.s;
                    set_record_value(cur_record, new_anomalyTime, record.anomalyWeight, record.port, new_time_range);

                    // fixing existing record in next layer
                    record.anomalyWeight = 0;

                    // add left-hand new record into current layer
                    var left_time_range = {s: c_s, e: n_s};
                    var left_atime = left_time_range.e - left_time_range.s;
                    var left_record = create_new_record(left_atime, 0, cur_record.port, left_time_range);
                    new_record_array.push([0, left_record]);
                    if (c_e != n_e) {
                        var right_time_range = {s: n_e, e: c_e};
                        var right_atime = right_time_range.e - right_time_range.s;
                        var right_record = create_new_record(right_atime, 0, cur_record.port, right_time_range);
                        new_record_array.push([2, right_record]);
                    }

                    merged_something = true;
                    break;
                }
                //n         *****************
                //c           **********
                else if ((c_s > n_s) & (c_e <= n_e)) {
                    //console.log('entering 3');
                    var next_left_time_range = {s: record.time_range.s, e: cur_record.time_range.s};
                    var next_left_anomalyTime = next_left_time_range.e - next_left_time_range.s;
                    var cur_record_time_s = cur_record.time_range.s;
                    var cur_record_time_e = cur_record.time_range.e;
                    var next_record_time_s = record.time_range.s;
                    var next_record_time_e = record.time_range.e;
                    // fixing existing record in current layer
                    set_record_value(cur_record, cur_record.anomalyTime, record.anomalyWeight, record.port, cur_record.time_range);
                    // take existing record as left-hand new record in the next layer
                    set_record_value(record, next_left_anomalyTime, record.anomalyWeight, record.port, next_left_time_range);

                    // addd vacant record into next layer
                    var vacant_range = {s: cur_record_time_s, e: cur_record_time_e};
                    var vacant_record = create_new_record(cur_record_time_e - cur_record_time_s, 0, record.port, vacant_range);
                    next_layer.splice(j + 1, 0, vacant_record);

                    if (c_e != n_e) {
                        // add right-hand record into next layer
                        var next_right_time_range = {s: cur_record_time_e, e: next_record_time_e};
                        var next_right_anomalyTime = next_right_time_range.e - next_right_time_range.s;
                        var next_right_new_record = create_new_record(next_right_anomalyTime, record.anomalyWeight, record.port, next_right_time_range);
                        next_layer.splice(j + 2, 0, next_right_new_record);
                    }
                    merged_something = true;
                    break;
                }
                //n    ***********
                //c           **********
                else if ((c_s > n_s) & (c_e > n_e)) {
                    //console.log('entering 4');
                    var cur_record_time_s = cur_record.time_range.s;
                    var cur_record_time_e = cur_record.time_range.e;
                    var next_record_time_s = record.time_range.s;
                    var next_record_time_e = record.time_range.e;
                    // inserting new records into current layer
                    var new_time_range = {s: cur_record_time_s, e: next_record_time_e};
                    var new_anomalyTime = new_time_range.e - new_time_range.s;
                    var new_record = create_new_record(new_anomalyTime, record.anomalyWeight, record.port, new_time_range);
                    new_record_array.push([0, new_record]);

                    // fixing existing records in current layer
                    cur_record.anomalyTime -= new_anomalyTime;
                    cur_record.time_range.s = new_time_range.e;

                    // take existing record as left-hand record in next layer
                    set_record_value(record, record.anomalyTime - new_anomalyTime, record.anomalyWeight, record.port, {
                        s: next_record_time_s,
                        e: cur_record_time_s
                    });

                    // inserting vacant record as right-hand record in next layer
                    var next_right_new_record = create_new_record(new_anomalyTime, 0, record.port, new_time_range);
                    next_layer.splice(j + 1, 0, next_right_new_record);
                    //console.log('inserting vacant record in loc '+j);
                    //console.log(record);
                    //console.log(next_right_new_record);
                    //console.log(next_layer);
                    merged_something = true;
                    break;
                }
                //n   ***********
                //c        ******
                else if ((c_s > n_s) & (c_e == n_e)) {
                    //console.log('entering 5');
                    var cur_record_time_s = cur_record.time_range.s;
                    var cur_record_time_e = cur_record.time_range.e;
                    var next_record_time_s = record.time_range.s;
                    var next_record_time_e = record.time_range.e;

                    // fixing existing records in current layer
                    set_record_value(cur_record, cur_record.anomalyTime, record.anomalyWeight, record.port, cur_record.time_range);
                    // fixing existing records as left record in next layer
                    set_record_value(record, record.anomalyTime - cur_record.anomalyTime, record.anomalyWeight, record.port, {
                        s: next_record_time_s,
                        e: cur_record_time_s
                    });
                    // inserting vacant record in next layer
                    var next_right_new_record = create_new_record(cur_record_time_e - cur_record_time_s, 0, record.port, {
                        s: cur_record_time_s,
                        e: cur_record_time_e
                    });
                    next_layer.splice(j + 1, 0, next_right_new_record);
                    merged_something = true;
                    break;
                }
            }
        }
        return merged_something;
    }

    function falling_down_one_layer(final_result) {
        var fall_to_lower_layer = false;
        for (var i = 0; i < final_result.length - 1; i++) {
            var cur_layer = final_result[i];
            var next_layer = final_result[i + 1];
            //console.log('#################################');
            //console.log('merging cur layer '+i+' with next layer '+(i+1));

            var layer_record_num = cur_layer.length;
            for (var j = 0; j < layer_record_num; j++) {
                var cur_record = cur_layer[j];
                if (!cur_record) continue;
                if (cur_record.anomalyWeight != 0)
                    continue
                var new_record_array = [];
                fall_to_lower_layer |= merge_next_layer_if_possible(cur_layer, cur_record, next_layer, new_record_array);

                for (var m = 0; m < new_record_array.length; m++) {
                    var insert_index = new_record_array[m][0];
                    var insert_record = new_record_array[m][1];
                    cur_layer.splice(j + insert_index, 0, insert_record);
                    layer_record_num += 1;
                }
                //j+=new_record_array.length;
            }
            //show_data_distribution(final_result);
            //console.log('#################################');
        }
        return fall_to_lower_layer;
    }

    function rebuild_data_for_multilayer_visualization(final_result) {
        if (final_result.length <= 1)
            return false;
        var fall_to_lower_layer = false;
        do {
            fall_to_lower_layer = falling_down_one_layer(final_result);
            //break;
        }
        while (fall_to_lower_layer);
        return fall_to_lower_layer;
    }

    function copy_data_result(final_result) {
        var copy_result = [];
        for (var i = 0; i < final_result.length; i++) {
            var cur_layer = final_result[i];
            var argData = []
            for (var m = 0; m < cur_layer.length; m++) {
                var cur_record = cur_layer[m];
                var copy_record = {};
                copy_record.anomalyTime = cur_record.anomalyTime;
                copy_record.anomalyWeight = cur_record.anomalyWeight;
                copy_record.port = cur_record.port;
                var time_range = {};
                time_range.s = cur_record.time_range.s;
                time_range.e = cur_record.time_range.e;
                copy_record.time_range = time_range;
                argData.push(copy_record);
            }
            copy_result.push(argData);
        }
        return copy_result;
    }

    function show_data_distribution(final_result) {
        //var timeFilter=that.timeFilterSecond||[0,0];
        var timeFilter = that.timeFilterFocus || [0, 0];
        //console.log('timeFilterFocus '+timeFilter);
        //console.log(final_result);
        var total_timespan = timeFilter[1] - timeFilter[0];
        if (total_timespan == 0) return;
        if (final_result.length <= 1)
            return final_result
        //console.log('flyroom showing distribution of layered data');
        //console.log(timeFilter);
        var print_char_map = {0: '*', 1: '#', 2: '@', 3: '%', 4: '&', 5: '$', 6: '^'};
        var empty_char = '_';

        for (var i = 0; i < final_result.length; i++) {
            var cur_layer = final_result[i];
            var cur_str = ''
            var anomaly_time_sum = 0;
            for (var m = 0; m < cur_layer.length; m++) {
                var cur_record = cur_layer[m];
                if (m < cur_layer.length - 1) {
                    var next_record = cur_layer[m + 1];
                    if (cur_record.time_range.e != next_record.time_range.s) {

                        console.error('non-continuous time ranges for layer ' + i + ' record ' + m);
                        javascript_abort();
                    }
                }

                var current_len = cur_record.anomalyTime;
                anomaly_time_sum += current_len;

                var print_char = empty_char;
                //console.log(cur_record.anomalyWeight);
                if (cur_record.anomalyWeight != 0)
                    print_char = print_char_map[i];
                var print_count = ((current_len + 0.0) / total_timespan) * 50;
                //console.log('print count '+print_count);
                for (var j = 0; j < print_count; j++) {
                    cur_str += print_char;
                }
            }
            if (anomaly_time_sum != total_timespan) {
                console.error('inconsistent timespan for layer ' + i + ' ' + total_timespan + ' -> ' + anomaly_time_sum);
                javascript_abort();
            }
            //console.log(cur_str);
        }
    }

    function get_unique_value_of_list(source_list) {
        var uniqueNames = [];
        $.each(source_list, function (i, el) {
            if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
        });
        return uniqueNames;
    }

    function sort_port_info(a, b) {
        var port_a = a[0].port;
        var port_b = b[0].port;
        var port_a_num = that.color_map[port_a][1];
        var port_b_num = that.color_map[port_b][1];
        //console.log('sorting port '+port_a+':'+port_a_num+' with '+port_b+':'+port_b_num);
        return port_a_num - port_b_num;
    }

    function get_multiport_info_from_nodes(d, averageColors) {
        var port_list = d.timeSeries.map(function (x) {
            return x.port;
        });
        var timeList = []
        var avc_array = []
        var final_result = []
        var has_record = false;

        var timeFilter=that.timeFilterFocus||[0,0];
        var layers_num_in_six_clock=0;
        var time_midpoint = (timeFilter[1]+timeFilter[0])/2;

        port_list = get_unique_value_of_list(port_list);
        port_list.forEach(function (port_num) {
            var port_events = d.timeSeries.filter(function (x) {
                return x.port == port_num;
            });
            //console.log('port_events len: '+port_events.length);
            var port_events_show = port_events.filter(function (x) {
                return x.show == true;
            });
            //console.log('filtered port_events len: '+port_events_show.length);
            var info = get_single_port_info_from_nodes(port_events_show);
            d.timeList = info.time_list;
            avc_array.push(info.average_color);
            has_record = info.result;

            var anomalyTime = info.anomaly_time;
            var colors = info.local_colors;
            var arcDataLocal = [];
            for (var j = 0; j < anomalyTime.length; j++) {
                var t = {};
                t.anomalyTime = anomalyTime[j];
                t.anomalyWeight = colors[j];
                t.port = port_num;
                t.layer_index = that.color_map[t.port][1];
                var time_range = {};
                time_range.s = d.timeList[j].s;
                time_range.e = d.timeList[j].e;
                if (t.anomalyWeight != 0){
                    if ((time_midpoint>time_range.s) && (time_midpoint<=time_range.e)){ 
                        layers_num_in_six_clock+=1;
                    }
                }
                t.time_range = time_range;
                arcDataLocal.push(t);
            }
            //console.log('showing events for port '+port_num);
            //console.log(arcDataLocal);
            final_result.push(arcDataLocal);
        });
        d.layers_num_in_six_clock=layers_num_in_six_clock;

        final_result.sort(sort_port_info);

	var total_timespan = timeFilter[1]-timeFilter[0];
	if ( (final_result.length > 1) && (total_timespan!=0)){
		//console.log('Node '+d.nodeName);
		//console.log('current multi-layer data');
		var copy_data = copy_data_result(final_result);
		//show_data_distribution(copy_data);
		//console.log(copy_data);
                if (that.wedge_falling){
		    var merged_something = rebuild_data_for_multilayer_visualization(final_result);
                }
		//console.log('transformed multi-layer data');
		//console.log(final_result);
		//show_data_distribution(final_result);
	}
	averageColors.push(get_average(avc_array));
        var nodeR=that.nodeIconSize*2;
	d.nodeR=nodeR;
	d.timeList=timeList;
	return {result:has_record,info:final_result};
    }

    function get_single_port_info_from_nodes(port_events) {
        //var timeFilter=that.timeFilterSecond||[0,0];
        var timeFilter = that.timeFilterFocus || [0, 0];
        var subTimeMeasure = 'second';
        //console.log('timeFilter in get_single_port_info '+timeFilter);

        var anomalyTime = [];
        var colors = [];
        var tmpTime = timeFilter[0];
        var tmpAnomalyColor = [];
        var averageColor = 0;
        var timeList = [];

        var foundAnomaly = false;
        port_events.forEach(function (item) {
            var flag = event_time_reform(item, timeFilter, subTimeMeasure);
            var k = that.colorRingMethod;
            // insert white blank arc in the beginning
            item.t = item.start * k + item.end * (1 - k);
            if (item.start > tmpTime) {
                colors.push(0);
                anomalyTime.push(item.start - tmpTime);
                timeList.push({
                    s: tmpTime,
                    e: item.start
                });
            }
            if (flag) {
                item.timeLen = item.end - item.start;
                foundAnomaly = true;
                //(item.end-item.start>=3600)?item.timeLen=item.end-item.start:item.timeLen=3600;
                var greyness = item.weight;
                //greyness=(greyness-minWeight)/(maxWeight-minWeight);
                //console.log('weight converting to color '+item.weight+' -> '+greyness);
                colors.push(greyness);
                tmpAnomalyColor.push(greyness);

                averageColor = (averageColor * (tmpAnomalyColor.length - 1) + greyness) / tmpAnomalyColor.length;
                anomalyTime.push(item.timeLen);
                timeList.push({
                    s: item.start,
                    e: item.end
                });
                tmpTime = item.end;
            }
        });
        if (tmpTime < timeFilter[1]) {
            colors.push(0);
            anomalyTime.push(timeFilter[1] - tmpTime);
            timeList.push({
                s: tmpTime,
                e: timeFilter[1]
            });
        }
        return {
            result: foundAnomaly,
            time_list: timeList,
            anomaly_time: anomalyTime,
            local_colors: colors,
            average_color: averageColor
        }
    }

    function greyness_to_hsl_color(color_info, greyness) {
        var main_color = color_info[0];
        var saturation = color_info[1];
        var lum_filter = color_info[2];
        var high_l=0.9;
        var low_l=0.5;
        if (lum_filter != 0){
            low_l=lum_filter;
        }
        var lScale=d3.scaleLinear().domain([0,1]).range([high_l,low_l]);

        var transformed_greyness = 0;
        if (greyness == 0) {
            transformed_greyness = '100';
        }
        else {
            minWeight = 0;
            transformed_greyness = (greyness - minWeight) / (maxWeight - minWeight);
            transformed_greyness = lScale(transformed_greyness) * 100;
        }
        var ret_color = 'hsl(' + main_color + ',' + saturation + '%,' + transformed_greyness + '%)';
        return ret_color;
    }

    function draw_stacked_arc_with_port_data(this_node, node_data, node_index, arcData, highlightList) {
        var pie = d3.pie()
                .sort(null)
                .value(function(d1) { return d1.anomalyTime; });
        var pad_angle=0;
        if (that.node_arc_padding){
            pad_angle=0.1;
        }
        var arc = d3.arc()
		.padAngle(pad_angle);
        //var arc = d3.arc();

        var color_map = that.color_map;

        var z = this_node;
        var dataset = arcData;
        node_data.layers_num = dataset.length;
        var gs = z.selectAll("g").data(dataset).enter().append("g")
            .attr('class', 'arc')
            .attr('id', function (d, i) {
                return 'arc' + i;
            })
            .attr('transform', 'translate(' + node_data.x + ',' + node_data.y + ')');
        var path = gs.selectAll("path")
            .data(function (d, i) {
                return pie(d).map(function (item) {
                    var weight = item.data.anomalyWeight;
                    var port = item.data.port;
                    return {
                        data: item,
                        layer_index: item.data.layer_index,
                        node_port: port,
                        data_color: weight,
                        parentIndex: i
                    }; // save parent dataset index in parenIndex property
                });
            })
            .enter().append("path")
            .attr('id', function (d, i) {
                //console.log(arc(d));
                //console.log('setting id of arc path ');
                //console.log(d);
                //console.log(i);
                //console.log(node_index);
                return 'arc_layer_' + i;
            })
            .attr('anomalyWeight', function (d, i) {
                return d.data_color;
            })
            .attr('port', function (d, i) {
                return d.node_port;
            })
            .attr('time_start', function (d, i) {
                return d.data.data.time_range.s;
            })
            .attr('time_end', function (d, i) {
                return d.data.data.time_range.e;
            })
            //colors.push(hsl(hslInfo.h,hslInfo.s,hslInfo.l));
            .attr("fill", function (d, i) {
                var greyness = d.data_color;
                if (!(d.node_port in color_map)) {
                    console.error('color not found for port ' + d.node_port);
                }
                var ret_color = greyness_to_hsl_color(color_map[d.node_port][0], greyness);
                d.show_color = ret_color;
                return ret_color;
            })
            .attr("d", function (d, i) {
                //console.log('nodeIconSize '+that.nodeIconSize);
                //console.log('radiusDelta '+that.radiusDelta);
                var zoomedInnerR = that.nodeIconSize*2+2 + that.radiusDelta *  (d.parentIndex);
                var zoomedOuterR = that.nodeIconSize*2+2+ that.radiusDelta * (d.parentIndex + 1)
                return arc.innerRadius(zoomedInnerR).outerRadius(zoomedOuterR)(d.data);
                //return arc.innerRadius(2 + that.nodeIconSize * 2 * (d.parentIndex + 1)).outerRadius(that.nodeIconSize * 2 * (d.parentIndex + 2))(d.data);
            })
            .style("stroke", function (d, i) {
                return d.show_color;
            })
            .style("stroke-width", '2px')
            .style('opacity', function (d, i) {
                var greyness = d.data_color;
                if (greyness == 0) {
                    return 0;
                }
            })
            .on('mouseover', function (d1, i) {
                var cur_arc = d3.select(this);
                return drawNodes_mouseover(cur_arc, d1, node_data, node_index, highlightList);
            })
            .on('click', function (d, i) {
                //console.log('wedge click');
                //console.log(d.layer_index);
                var cur_index = d.layer_index
                var add_group = [];
                for (var key in that.color_map) {
                    var color_info = that.color_map[key];
                    if (color_info[1] < cur_index) {
                        add_group.push(key);
                    }
                }
                for (var key in that.color_map) {
                    var color_info = that.color_map[key];
                    if (add_group.indexOf(key) != -1) {
                        color_info[1] += 1;
                        continue;
                    }
                    if (color_info[1] == cur_index) {
                        color_info[1] = 0;
                    }
                }
                that.layout(optionNumber, doTransition, transitionType, dd);
            })
            .on('mouseout', function (dd) {
                var cur_arc = d3.select(this);
                return drawNodes_mouseout(cur_arc, dd, node_data, node_index);
            });
        ;
        return gs
    }

    function plot_node_multi_layer(d, thisNode, node_index, averageColors) {
        var returned_info = get_multiport_info_from_nodes(d, averageColors)
        if (returned_info.result) {
            var arcData = returned_info.info
            arcDataSeries[d.id] = arcData;
            var highlightList = []
            var bz = draw_stacked_arc_with_port_data(thisNode, d, node_index, arcData, highlightList);
        }
        return bz;
    }

    var averageColors=[];
    var arcDataSeries=[];
    var gz=g;
        g.selectAll('node').data(nodes)
            .enter()
            .append('g')
            .attr('id',function(d){return 'g'+d.id;})
            .attr('cluster',function(d){return d.oldKey})
            .attr('class','test')
            .each(function(d,i){
                var thisNode=d3.select(this);
                dataBundling(d,i,thisNode);
                //console.log('plotting Node '+d.nodeName);

		//var bz = plot_node_single_layer(d,thisNode,averageColors);
		var bz = plot_node_multi_layer(d,thisNode,d.id,averageColors);
                //console.log('drawNodes ');
                //console.log(d);
                var nodeR=that.nodeIconSize*2;
                if (!(typeof d.propagate == 'undefined')){
                    thisNode.append("circle")
                        .call(drag)
                        .style("stroke", "gray")
                        .style("fill", "none")
                        .style("stroke-dasharray", ("3, 3")) 
                        .attr("r", nodeR)
                        .attr("cx", d.x)
                        .attr("cy", d.y)
                        .each(function(d){
                            var img=d3.select(this);
                            d.propagate_circle=img;
                        });
                }

                d.arctrans=[d.x,d.y];
                d.arc=bz;
                thisNode.selectAll('*')
                    .attrs({
                        transitionStatus:'end'
                    })
            })
            .call(drag);


        var iconsize=20;
        g.selectAll('.node')
            .data(nodes)
            .attr('id',function(d){return 'node'+d.id;})
            //.on('dblclick',doubleClick)
            .on('click',function(d){return nodeClick(d,that);})
            .on('mouseover',function(d){return mouseover(d,that);})
            .on('mouseout',function(d){return mouseout(d,that);})
            .each(function(d){
                d.that=that;
            })
            //.call(drag)
            .styles({
                "fill":function(d){return "url(#radialGradient"+ d.id+")"},
//            'fill':'rgb(0,220,225)',
            "opacity": 1,
            "cursor": "hand"
        })
        .attr('r', function (d) {
            return iconsize;
        })
        .transition()
        .duration(function (d) {
            if (transitionType == 'flowMap') {
                return d.duration;
            }
            else {
                return 1;
            }
        })
        .delay(function (d) {
            if (transitionType == 'flowMap') {
                return d.delay[0];
            }
            else {
                return 1;
            }
        })
        .attr('r', function (d) {
            return iconsize;
        })
        .styles({
            "fill": function (d) {
                return "url(#radialGradient" + d.id + ")"
            },
//            'fill':'rgb(0,220,225)',
            "opacity": 1,
            "cursor": "hand"
        })
        .each(function (d, i) {
            if (d.size == 0) {
                d3.select(this).remove();
            }
            d.clicked = false;
            d.edgeLabelElem = [];
            d.pathElem = [];
            d.textElem = {
                textElem: [],
                id: d.id
            };

            d.self = d3.select(this);
            if (textElem[d.id]) d.textElem.textElem = textElem[d.id].textElem;
            for (var j = 0; j < relation[d.id].edges.length; j++) {
                d.edgeLabelElem.push(edgeLabelElem[relation[d.id].edges[j]]);
                d.pathElem.push(pathElem[relation[d.id].edges[j]]);
            }
        });

    g.selectAll('.node')
        .data(nodes)
        .transition()
        .duration(function (d) {
            if (transitionType == 'flowMap') {
                return d.duration;
            }
            else {
                return 0;
            }
        })
        .delay(function (d) {
            if (transitionType == 'flowMap') {
                return d.delay[0];
            }
            else {
                return 0;
            }
        })
        .styles({
            "fill": function (d) {
                return "url(#radialGradient" + d.id + ")"
            },
            'cursor': 'hand'
        });


    var r = 0;
    g.select('defs').remove();
    var defs = g.append('defs').attr('class', 'radialGradientDefs');
    defs.selectAll('radialGradient').data(nodes).enter()
        .append('radialGradient')
        .attr('class', 'radialGradient')
        .attr('id', function (d) {
            return 'radialGradient' + d.id;
        })
        .each(function (d, i) {
            var nodeR = that.nodeIconSize * 2;
            r = parseFloat(that.nodeIconSize / nodeR);
            var stopData = [{offset: r * 100 + '%', color: 'white'}];
            //var r=0.2;
	    var node_filling_color = greyness_to_hsl_color([204,50,0],averageColors[i]);
            stopData.push({offset:r*150+'%',color:node_filling_color});
            //console.log(d);
            var rg=d3.select(this);
            //var data=[{offset:0,color:color.nodeGreyColor,opacity:1},{offset:0,color:color.nodeGreyColor,opacity:1},{offset:0,color:color.nodeColor,opacity:1},{offset:1,color:color.nodeColor,opacity:1}]
            rg.selectAll('whatever').data(stopData).enter()
                .append('stop')
                .attrs({
                    offset: function (d) {
                        return d.offset
                    },
                    'stop-color': function (d) {
                        return d.color
                    }
                    //'stop-opacity':function(d){return d.opacity}
                    /*'stop-opacity':function(d,i){
                        if(i==0)    return 0;
                    }*/
                });
        });


    this.focusedNodeData = focusedNodeData;
}

export {drawNodes}
