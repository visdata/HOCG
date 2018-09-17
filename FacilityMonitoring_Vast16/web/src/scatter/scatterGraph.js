import {ajax} from '../processData/request'


// 如果gmm_param是error的话后续都会失败
// history方面，tick传时间更好，方便显示。从0开始的index只为了res2list
// 解决因为Date涉及时区导致的各种问题【重要】
// TODO: 直方图的倍率显示
// TODO: gmm和曲线可能出现一定便宜，怀疑是使用数据来源的精度差异
// TODO: 替换CSS，更改右侧窗口大小
// TODO: 曲线换成黑色
var is_dev = 1

function normal(x, mean, deviation) { //注意别输入方差
    var y = 1.0 / (Math.sqrt(2 * Math.PI) * deviation) * Math.exp(-Math.pow((x - mean), 2) / (2 * Math.pow(deviation, 2)))
    return y
}


function normal_xy(mean, deviation, weight = 1) {
    var x = new Array()
    var y = new Array()
    var t = -5 * deviation + mean
    for (var i = 0; i <= 101; i++) {
        x.push(t);
        y.push(weight * normal(t, mean, deviation));
        t = t + 0.1 * deviation;
    }
    return [x, y]
}

var gmmObj2list = function (obj) {
    let gmm_parm_list = new Array()
    obj.forEach(function (d) {
        let gmm_parm = [d['mean'], Math.sqrt(d['cov']), d['weight']]
        gmm_parm_list.push(gmm_parm)
    })
    return gmm_parm_list
}

function gmm_fix(data, min, max) { //用于去除超出直方图X轴范围的数据点，待改名  data什么格式？？？
    let min_pos = 0
    let max_pos = 0
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] < min) {
            min_pos = i
        }
        if (data[i][0] < max) {
            max_pos = i
        }

    }
    let t = data.slice(min_pos + 1, max_pos + 1)
    return t
}

function rightPanelLayout(d) {
    var tabLayer = d3.select('.optionTab');
    var scatterGraphLayer = d3.select('.scatterDiagram');
    var timeChartLayer = d3.select('.subChart');
    var roomLayer = d3.select('.room');
    //draw whatever you like in the above four layers(div)

    var color = this.color;
    //you can change color in 'src/init/initColor.js'

    var dataType = d.dataType;
    var time = d.time;
    var varName = d.varName;
    console.log('raw_data in right', d)

    var server = this.server;//'139.129.203.9'
    var port = this.scatterPort;//5008
    var url = 'http://' + server + ':' + port + '/anomalyDetail';
    let get_time_window = function () { //现在这个是凑合用的。遇到左下角tick和范围有差异时会产生误差。同时遇到PM就会很尴尬
        let time_fix = function (timeString) {
            // 01:20  这是一个下午的时间
            let t = timeString.replace(' PM', ':00').replace(' AM', ':00')
            let hour = t.split(':')[0]
            let minute = t.split(':')[1]
            if (hour[0] == '0') {
                hour = (12 + parseInt(hour)).toString()
            }
            return hour + ':' + minute
        }
        let time_window_info = new Object()
        let tmp_all = d3.select(".nodeAxisSVG").select(".axis--x").selectAll(".tick")
        let tmp_count = tmp_all.size()
        let tmp_left = time_fix(tmp_all.filter(function (d, i) {
            return i == 0
        }).text())


        let tmp_right = time_fix(tmp_all.filter(function (d, i) {
            return i == tmp_count - 1
        }).text())
        time_window_info.time_left = '2011-08-18 ' + tmp_left + ':0'
        time_window_info.time_right = '2011-08-18 ' + tmp_right + ':0'
        time_window_info.time_window_length = (Date.parse(new Date(time_window_info.time_right))
            - Date.parse(new Date(time_window_info.time_left))) / 1000; //时间窗口的秒数。因为算差值不涉及时区
        console.log(time_window_info)
        return time_window_info
    }


    var requestData = {
        dataType: dataType,
        time: time,
        varName: varName, //由后端去处理找ip吧
        timeWindow_info: get_time_window()
    };

    var success = function (data) {
        console.log('succ');
        console.log(data);

        //show detail here
        let t = varName.split(' ')
        let ip = t[t.length - 1]
        cnt++;
        w2ui.rightTabs.add({id: 'tab' + cnt, text: ip, closable: true});
        scatterGraphLayer.append("div")
            .attr("id", "scatterDiagram_tab" + cnt);  // id先不改了，不然init里一堆都要动
        timeChartLayer.append("div")
            .attr("id", "subChart_tab" + cnt);
        roomLayer.append("div")
            .attr("id", "room_tab" + cnt);//就暂时用这3个图表位置
        w2ui.rightTabs.click('tab' + cnt);

        drawMeasurementChart(data, requestData);
    };
    ajax(url, success, requestData)
}


function drawMeasurementChart(data) {
    let focused_time = data.history[2]
    let anomalyValue = data.general.anomalyValue
    let anomalyType = data.history[1]
    let label_width = 40
    // let margin = {top: 20, right: 20, bottom: 20, left: 40} //720p
    let margin = {top: 30, right: 30, bottom: 30, left: 60} //720p

    let chart1_margin = margin,
        // let chart1_margin = {top: 20, right: 20, bottom: 20, left: 40},
        chart1_width = $(".scatterDiagram").width() - chart1_margin.left - chart1_margin.right - 50 - label_width,
        chart1_height = $(".scatterDiagram").height() - chart1_margin.top - chart1_margin.bottom;

    let chart2_margin = margin,
        // let chart2_margin = {top: 20, right: 0, bottom: 20, left: 0},
        // chart2_width = $(".subChart").width() - chart2_margin.left - chart2_margin.right - 10,
        chart2_width = $(".subChart").width() - chart2_margin.left - chart2_margin.right - 50 - label_width,
        chart2_height = $(".subChart").height() - chart2_margin.top - chart2_margin.bottom;

    console.log('subChart Width')
    console.log($(".subChart").width())
    let chart3_margin = {top: 20, right: 20, bottom: 20, left: 40},
        chart3_width = $(".roomLayer").width() - chart3_margin.left - chart3_margin.right,
        chart3_height = $(".roomLayer").height() - chart3_margin.top - chart3_margin.bottom;

    if (is_dev) {
        console.log('chart1 scatterDiagram width')
        console.log($(".scatterDiagram").width())
        console.log(chart1_width)
        console.log(chart1_height)
        console.log('chart1-3,width and height')
        console.log(chart1_width)
        console.log(chart1_height)
        console.log(chart1_width)
        console.log(chart1_height)
        console.log(chart1_width)
        console.log(chart1_height)
    }

    var fix_value = function (d) {
        let havePoint = d.toString().split('.').length
        if (havePoint === 2) {
            return d.toFixed(2)
        }
        else return d
    }

    // set the ranges  现在改为在函数内设定

    var draw_histogram_and_gmm = function (histogram = '', gmm = '', general = '') {
        // let index_range = data[1][0]
        // let index_count = data[1][1]
        // let index_tick_foucs = data[1][2]
        // let anomaly_index = data[1][3]
        let indexType = general.indexType
        let axisTicks = histogram.axisTicks
        let frequency = histogram.frequency
        if (is_dev) {
            console.log('axisTicks', axisTicks)
        }

        // set the ranges
        // var chart1_x = d3.scaleBand().rangeRound([0, chart1_width]).padding(0.1);
        var chart1_x = d3.scaleLinear().rangeRound([0, chart1_width]);
        var chart1_y = d3.scaleLinear().range([chart1_height, 0]);

        // create chart 1, 显示在数据集整个时段中，用于计算异常度的指标的分布
        var chart1 = d3.select("#scatterDiagram_tab" + cnt).append("svg")    // jquery, 选择唯一id
            .attr("width", $(".scatterDiagram").width())
            .attr("height", $(".scatterDiagram").height()) //3张图够了，scatterDiagram位只放一张
            .append("g")
            .attr("transform",
                "translate(" + chart1_margin.left + "," + chart1_margin.top + ")"); //top是图顶部的位置，left是图左部的位置。向下向右为正
        // 小的width是图的本体空间，边缘要留给tick之类的东西
        if (is_dev) {
            console.log('chart1的svg的width')
            console.log($(".scatterDiagram").width())
        }

        var chart1_data = d3.zip(axisTicks, frequency).map(function (d) {
            return {
                axisTick: d[0],
                frequency: d[1]
            };
        })

        let max_x = d3.max(axisTicks) * Math.pow(10, histogram.axisMultiple - 1)
        // chart1_x.domain(axisTicks);
        chart1_x.domain([0, parseInt(axisTicks[axisTicks.length - 1])]);
        chart1_y.domain([0, d3.max(chart1_data, function (d) {
            return d.frequency
        })])

        chart1.selectAll(".bar")
            .data(chart1_data)
            .enter().append("rect")
            .style("fill", function (d) {
                // return ((d.axisTick === histogram.anomalyTick) ? '#f27b81' : '#99D3F8');
                return '#99D3F8'
            })
            .attr("x", function (d) {
                // return chart1_x(d.axisTick);
                return chart1_x(parseInt(d.axisTick)) - chart1_width / 10 * 0.95;
            })
            .attr("y", function (d) {
                return chart1_y(d.frequency);
            })
            // .attr("width", chart1_x.bandwidth() / 2)
            .attr("width", chart1_width / 10 * 0.9)
            .attr("height", function (d) {
                return chart1_height - chart1_y(d.frequency);
            })
            .on("mouseover", function () {
                d3.select(this)
                    .style("opacity", .5);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("opacity", 1);
            })
            .append("title")
            .html(function (d) {
                return indexType + ': ' + d.axisTick + '<br/>' + 'Count: ' + d.frequency;
            });

/////////////////

        function draw_gmm_line(g, gmm_parm, min, max, selectedMean) {
            let xy = normal_xy(gmm_parm[0], gmm_parm[1], gmm_parm[2])
            let x = xy[0]
            let y = xy[1]
            let data_gmm = gmm_fix(d3.zip(x, y), min, max)

            if (Math.abs((gmm_parm[0] / selectedMean) - 1) < 0.01) {
                g.append("path")
                    .attr("d", line_generator(data_gmm))
                    // .attr('stroke', '#f27b81')
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1)
                    .attr("fill", "none")
            }
            else {
                g.append("path")
                    .attr("d", line_generator(data_gmm))
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1)
                    .attr("fill", "none")
            }

        }

        function get_weight(gmm_parm_json, mean) {
            let weight = 0
            gmm_parm_json.forEach(function (d) {
                if (Math.abs(d['mean'] / mean - 1) < 0.01) {
                    weight = d['weight']
                }
            })
            return weight
        }

        function cal_max_y(gmm_parm_json) {
            let max_y = 0
            gmm_parm_json.forEach(function (d) {
                if (d['cov'] !== 0) {
                    let y = normal_xy(d['mean'], Math.sqrt(d['cov']), d['weight'])[1]
                    y.push(max_y)
                    max_y = d3.max(y)
                }
            })
            console.log('max_y:')
            console.log(max_y)
            // if (max_y > 1) {
            //     return 1
            // }
            return max_y
        }

        let gmmParmSet = gmm.gmmParmSet
        let max_y = cal_max_y(gmmParmSet)
        // let y_select = normal_xy(data[4][0], data[4][1])[1]   //选中点所在区县y轴
        let y_select = 0 //选中点所在区县y轴
        // 之后处理一下，保证只显示正半轴数据。
        var x_min = 0
        var xscale = d3.scaleLinear()
            .domain([x_min, histogram.histogramBase])  //可能反而导致难看了
            .range([0, chart1_width])
        var yscale = d3.scaleLinear() //for gmm
            .domain([0, max_y])
            .range([chart1_height, 0])
        //绘制图形

        var line_generator = d3.line()
            .x(function (d) {
                return xscale(d[0])//x轴的点用数据下标表示
            })
            .y(function (d) {
                return yscale(d[1])
            });
        var g = chart1.append("g")
            .attr("transform", "translate(" + 0 + "," + 0 + ")")

        if (gmm.gmmParmSet !== 'error in get_gmms()') {
            gmm.gmmParmSet.forEach(function (d) {
                console.log(d)
                console.log(d['mean'])
                draw_gmm_line(g, [d['mean'], Math.sqrt(d['cov']), d['weight']], 0, max_x, gmm.selectedGmmParm.mean)
            })
        }


        if (anomalyType === 'ANF') {
            anomalyLabel = '#Flow/#Host'// 难以缩短啊
        }
        if (anomalyType === 'ND') {
            anomalyLabel = 'Flow Duration'
        }
        if (anomalyType === 'NF') {
            anomalyLabel = '# Flow'
        }
        if (anomalyType === 'NB') {
            anomalyLabel = '# Flow Byte'
        }
        if (anomalyType === 'NH') {
            anomalyLabel = '# Host'
        }

        let axisMultipleLabel = ''
        if (histogram.axisMultiple !== 1 && histogram.axisMultiple !== 0) {
            axisMultipleLabel = 'x 10^' + histogram.axisMultiple.toString()

        }

        let tick1 = chart1.append("g")
            .attr("transform", "translate(0," + chart1_height + ")")
            // .call(d3.axisBottom(chart1_x).ticks(data[1][1]));
            .call(d3.axisBottom(chart1_x).tickFormat(function (d) {
                return d
            }).tickSize(5))
        if (axisMultipleLabel !== '') {
            tick1.append('text')
                .attr('x', chart1_width + 35)
                .attr('y', 10 + 3 + 5)
                .style("fill", "black")
                .attr("text-anchor", "start")
                .text(axisMultipleLabel) //+
            tick1.append('text')
                .attr('x', chart1_width + 15)
                .attr('y', 0)
                .style("fill", "black")
                .attr("text-anchor", "start")
                .text(anomalyLabel);
        }
        else {
            tick1.append('text')
                .attr('x', chart1_width + 15)
                .attr('y', 10 + 3 + 5)
                .style("fill", "black")
                .attr("text-anchor", "start")
                .text(anomalyLabel);
        }


        // .text(axisMultipleLabel+'\\n'+anomalyLabel);
        //     .append('textarea')
        //     .attr('cols',60)
        //     .attr('x', 200)
        //     .attr('y', 0)
        //     // .attr('value',axisMultipleLabel+'\n'+anomalyLabel)
        //     .attr('id','anomalyLabel')
        // var obj = document.getElementById('anomalyLabel')
        // obj.value='asdads'


        chart1.append("g")
        // .call(d3.axisLeft(chart1_y).ticks(5, "%")) //百分比标尺
            .call(d3.axisLeft(chart1_y).ticks(5)) //画5条标尺
            .append("text")
            .attr("x", 0)
            .attr("y", -5)
            .style("fill", "black")
            .attr("text-anchor", "middle")
            .text('Record Count');

        // console.log('weigt========', get_weight(gmm_parm_json, data[7][0]))
        let temp_y = get_weight(gmm.gmmParmSet, gmm.selectedGmmParm.mean) * normal(anomalyValue, gmm.selectedGmmParm.mean, gmm.selectedGmmParm.deviation)
        chart1.append("circle")
        // .attr("cx", chart2_x(timeFixed(data[0][0]) + ":" + timeFixed(data[0][1])))
            .attr("cx", xscale(anomalyValue))
            .attr("cy", yscale(temp_y))
            .attr("r", 4)
            .style("fill", "red")
            .style("opacity", .5);
        //
        let anomalyLabel
        let anomalyValuePrint = fix_value(anomalyValue).toString()
        if (anomalyValuePrint.length > 8) {
            anomalyValuePrint = anomalyValue.toPrecision(8).toString()
        }


        let anomalyMsg = 'value: ' + anomalyValuePrint + ' (anomaly: ' + fix_value(parseFloat(data.general.score)) + ')'
        chart1.append("text")
            .attr("x", xscale(anomalyValue) + 6)
            .attr("y", yscale(temp_y) - 2)
            .style("fill", "black")
            .attr("text-anchor", "right")
            .style("fill", "red")
            .text(anomalyMsg);

    }
    console.log('data.histogram', data.histogram)
    draw_histogram_and_gmm(data.histogram, data.gmm, data.general)


    function draw_detail_table(detail) {

        // let chart_margin = {top: 20, right: 20, bottom: 20, left: 30},
        //     chart_width = $(".room").width() - chart_margin.left - chart_margin.right,
        //     chart_height = $(".room").height() - chart_margin.top - chart_margin.bottom;

        let chart = d3.select("#room_tab" + cnt).append("table")
            .attr("width", $(".room").width() - 15)
            .attr("height", $(".room").height())
            .attr("height", 0)
            .attr("border", 1)
            .attr("cellspacing", 0)
            .style("border-collapse", "collapse")
        // .style("font-size",5)
        d3.select(".room").style("overflow-x", "auto")
        d3.select(".room").style("overflow-y", "auto")

        // let columns = ['StartTime','Dur','Proto','SrcAddr','Sport','Dir','DstAddr','Dport','State','sTos','dTos','TotPkts','TotBytes','SrcBytes','Label']
        let columns = ['Time', 'Flow', 'Duration', 'Bytes']
        let columns_title = ['Time', 'Flow', 'Duration(s)', 'Bytes(B)']
        //要合并部分列，并做格式修正。写在前端还是后端好呢

        var thead = chart.append("thead")
        var tbody = chart.append("tbody")

        thead.append("tr")
            .style('height', '30px')
            .style('valign', 'middle')
            .selectAll('th')
            .data(columns_title).enter()
            .append('th')
            .text(function (column) {
                return column;
            })
        // .style('width','150px');
        // chart.selectAll("th").style("width", "200px")

        var rows = tbody.selectAll('tr')
            .data(detail)
            .enter()
            .append('tr')
            .style('height', '3rem')
            .style('valign', 'middle')

        var cells = rows.selectAll('td')
            .data(function (row) {
                return columns.map(function (column) {
                    return {column: column, value: row[column]};
                });
            })
            .enter()
            .append('td')
            .text(function (d) {
                return d.value;
            })
        // .attr('width','150px');

        chart.selectAll("th").style("min-width", "50px")
        chart.selectAll("td").style("min-width", "50px")
        // chart.selectAll("th").style("background-color", "#CCCCCC")
        chart.selectAll("th").style("background-color", "#F0F8FF")

    }

    draw_detail_table(data.detail)

    function drawDetail(data_type, data) {
        var label = ["Focus", "Avg"]
        var chart_margin = {top: 20, right: 20, bottom: 20, left: 30},
            chart_width = $(".room").width() / 3 - chart_margin.left - chart_margin.right,
            chart_height = $(".room").height() / 2.4 - chart_margin.top - chart_margin.bottom;

        var chart_x = d3.scaleBand().rangeRound([0, chart_width]).padding(0.1);
        var chart_y = d3.scaleLinear().range([chart_height, 0]);

        var chart = d3.select("#room_tab" + cnt).append("svg")
            .attr("width", $(".room").width() / 3)
            .attr("height", $(".room").height() / 2.4)

            .append("g")
            .attr("transform",
                "translate(" + chart_margin.left + "," + chart_margin.top + ")");
        var chart_data = d3.zip(label, data).map(function (d) {
            return {
                axisTick: d[0],
                frequency: d[1]
            }
        });
        // console.log(chart_data)
        chart_x.domain(chart_data.map(function (d) {
            return d.axisTick;
        }));
        chart_y.domain([0, d3.max(data)]);
        chart.selectAll(".bar")
            .data(chart_data)
            .enter().append("rect")
            .style("fill", function (d) {
                return (d.axisTick == "Focus") ? '#f27b81' : '#99D3F8';
            })
            .attr("x", function (d) {

                return chart_x(d.axisTick);
                // return 20;
            })
            .attr("y", function (d) {
                // console.log(chart_y(d.frequency))
                return chart_y(d.frequency);
                // return 30;
            })
            .attr("width", chart_x.bandwidth())
            .attr("height", function (d) {
                // return chart_height - chart_y(d.frequency);
                return chart_height - chart_y(d.frequency);
            });

        chart.append("text").text(data_type + ": " + data[0] + " / " + data[1]);

        chart.append("g")
            .attr("transform", "translate(0," + chart_height + ")")
            .call(d3.axisBottom(chart_x).ticks(label));
        chart.append("g")
            .call(d3.axisLeft(chart_y).ticks(5)); //画5条标尺

    }


    function draw_history_data(x_list, y_list) {   //TODO：目前，如果Y轴标签超过5位数，会显示不全。
        // var chart2_x = d3.scalePoint().rangeRound([0, chart2_width]).padding(0);
        var chart2_x = d3.scaleLinear().rangeRound([0, chart2_width]);
        ;
        var chart2_y = d3.scaleLinear().range([chart2_height, 0]);

        // create measurement line chart for selected dot
        var chart2 = d3.select("#subChart_tab" + cnt).append("svg")
        // .attr("width", chart2_width + chart2_margin.left + chart2_margin.right)
            .attr("width", $(".subChart").width())
            // .attr("height", chart2_height + chart2_margin.top + chart2_margin.bottom)
            .attr("height", $(".subChart").height())
            .append("g")
            // .attr("transform", "translate(" + chart2_margin.left + "," + (chart2_margin.top + 5) + ")");
            .attr("transform", "translate(" + chart2_margin.left + "," + (chart2_margin.top) + ")");
//
//     // var parseTime = d3.timeParse("%H:%M");
//
        var line = d3.line()
            .x(function (d) {
                return chart2_x(Date.parse(new Date(d.time)));
            })
            .y(function (d) {
                return chart2_y(d.value);
            });
        let time_label = x_list
//
        let selected_line_value = y_list;

        var time_start = time_label[0]
        var time_end = time_label[-1]
        var value_min = d3.min(selected_line_value);
        var value_max = d3.max(selected_line_value);
        var selected_line_data = d3.zip(time_label, selected_line_value).map(function (d) {
            return {
                time: d[0],
                value: d[1]
            };
        });


        chart2_x.domain([Date.parse(new Date(time_label[0])), Date.parse(new Date(time_label[time_label.length - 1]))]);

        chart2_y.domain([value_min, value_max]);
//
        chart2.append("path")
            .data([selected_line_data])
            .attr("d", line)
            .style("fill", "none")
            .style("stroke-width", "2px")
            .style("stroke", "#99D3F8");

//
        chart2.append("g")
            .attr("transform", "translate(0," + chart2_height + ")")
            // .call(d3.axisBottom(chart2_x).tickSize(1).tickFormat(function (d) {
            //     //2011-08-18T03:39:00.000Z
            //     let minute = d.toString().slice(14, 16)
            //     if (minute === '00' || minute === '20' || minute === '40') {
            //         return d.toString().slice(11, 16)
            //     }
            // }))
            .call(d3.axisBottom(chart2_x).tickSize(5).tickFormat(function (d) {
                //2011-08-18T03:39:00.000Z
                // let minute = d.toString().slice(14, 16)
                // if (minute === '00' || minute === '20' || minute === '40') {
                //     return d.toString().slice(11, 16)
                // }
                // 1313670200000
                // if (d % 1200000 === 0) {
                //     return Date.parse(d).toString().slice(11, 16)
                // }

                // return Date.parse(d).toString().slice(11, 16)
                // console.log(Date(1313670200000).toString())
                return new Date(d - 60000 * 60 * 8).toString().slice(16, 21)
            }))
            .append('text')
            .attr('x', chart2_width + 30)
            .attr('y', 10 + 3 + 5)
            .style("fill", "black")
            .attr("text-anchor", "start")
            .text('Time');


        let anomalyLabel
        if (anomalyType === 'ANF') {
            anomalyLabel = '#Flow/#Hosts'
        }
        if (anomalyType === 'ND') {
            anomalyLabel = 'Flow Duration'
        }
        if (anomalyType === 'NF') {
            anomalyLabel = '# Flow'
        }
        if (anomalyType === 'NB') {
            anomalyLabel = '# Flow Bytes'
        }
        if (anomalyType === 'NH') {
            anomalyLabel = '# Hosts'
        }
        chart2.append("g")
            .call(d3.axisLeft(chart2_y).ticks(5).tickFormat(function (d) {
                if (d > 10000) {
                    return d.toExponential(0)
                } else {
                    return d
                }

            }))
            .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("x", 0)
            .attr("y", -5)
            // .attr("dy", "0.71em")
            .style("fill", "black")
            .attr("text-anchor", "middle")
            // .text(requestData.varName);
            .text(anomalyLabel);

        chart2.append("circle")
            .attr("cx", chart2_x(Date.parse(new Date(focused_time))))
            .attr("cy", chart2_y(anomalyValue))
            .attr("r", 4)
            .style("fill", "red")
            .style("opacity", .5);

        // chart2.append('text')
        //     .attr("x", chart2_x(focused_time))
        //     .attr("y", chart2_height + 16)
        //     .style("fill", "black")
        //     .style("font-size", 10)
        //     .attr("text-anchor", "middle")
        //     .text(focused_time.slice(11, 16));  //底部时间
        // 改成线性后鼠标追随有点问题，刻度也是个问题
        let valueTime = fix_value(anomalyValue) + ' at ' + focused_time.slice(11, 16)
        chart2.append('text')
            .attr("x", chart2_x(Date.parse(new Date(focused_time))) + 5)
            .attr("y", chart2_y(anomalyValue) - 2)
            .style("fill", "black")
            .attr("text-anchor", "start")
            .style("fill", "red")
            .text(valueTime);

        var chart2_focus = chart2.append("g")
            .style("fill", "none")
            .style("display", "none");
        chart2_focus.append("circle")
            .style("stroke", "#4BA0D6")
            .attr("r", 4.5);
        chart2_focus.append("text")
            .attr("x", 9)
            .attr("y", -5)
            .style("fill", "red")
            .style("fill", "black");
        chart2.append("rect")
            .style("fill", "none")
            .attr("pointer-events", "all")
            .attr("width", chart2_width)
            .attr("height", chart2_height)
            .on("mouseover", function () {
                chart2_focus.style("display", null);
            })
            .on("mouseout", function () {
                chart2_focus.style("display", "none");
            })
            .on("mousemove", function () {
                var index = Math.round(d3.mouse(this)[0] / (chart2_width / (time_label.length - 1)));
                var t = (chart2_width / (time_label.length - 1)) * index
                // chart2_focus.attr("transform", "translate(" + chart2_x(Date.parse(new Date(t))) + "," + chart2_y(selected_line_data[index].value) + ")");
                chart2_focus.attr("transform", "translate(" + t + "," + chart2_y(selected_line_data[index].value) + ")");
                chart2_focus.select("text").text(selected_line_data[index].value);
            });
    }

    let x = data.history[0][0]
    let y = data.history[0][1]
    draw_history_data(x, y);

    d3.selectAll("g.tick text")
        .attr('font-size', '1rem')
    d3.selectAll("text")
        .attr('font-size', '1rem')
    // .attr("x", -24)
    // .attr("transform", "rotate(-30)");

}


export {
    rightPanelLayout
};
