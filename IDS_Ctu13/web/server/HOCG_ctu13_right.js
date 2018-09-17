//TODO:右上，对应的柱子亮起
//TODO:中间历史，数据库中加入精确timestamp和分钟timestamp方便筛选，暂时范围30分钟
//TODO:底下detail,在原始流数据基础上加入timestamp方便筛选，返回JSON查询结果
//TODO:中间的tick没有布满，左右有空隙，看下是不是margin
//TODO:bug 直方图里max value=0就炸了
//TODO:detial里查询范围肯定错了



//TODO:历史曲线是否要进行port和协议的筛选？[已进行]
//TODO:潜在bug，因为是用tick来取范围的，所以首尾可能有一点没取精确

//TODO:遇到01PM会出错【】【】【】【】】【】因为，没有把PM换成+12
//Aug8为止，数据库中timestamp是Python脚本计算，GMT8的。相比UTC-8*3600秒

var express = require('express');
var fs = require('fs')
var app = express();
var MongoClient = require('mongodb').MongoClient;

var mongoUser = 'root';
var mongoPwd = 'vis_ali_mongo';
var url_flyroom = 'mongodb://' + mongoUser + ':' + mongoPwd + '@' + 'ngrok.flyroom.info:27017/admin';
var url = 'mongodb://localhost:27017';
var port_of_right = 5008


gmm_dataset_src = JSON.parse(fs.readFileSync('./data/gmm_src_60s.json', 'utf8'))
gmm_dataset_dst = JSON.parse(fs.readFileSync('./data/gmm_dst_60s.json', 'utf8'))
console.log('gmm_dataset load finish')

// Request URL: http://127.0.0.1:5008/anomalyDetail?dataType=measurement&time=18%3A12%3A24%3A39&
// varName=Traffic+Measurement+for+Host+147.32.87.249&timeWindow_info%5Btime_left%5D=2011-08-18+12%3A15%3A0&
// timeWindow_info%5Btime_right%5D=2011-08-18+12%3A40%3A0&timeWindow_info%5Btime_window_length%5D=1500

// response格式
// 已改用object，可读性增强

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

get_gmms = function (dataset, ip, protocol, port, event_type) {
    let model_name = ip + '_' + protocol + '_' + port
    let host_model = dataset[model_name]
    console.log('in gmm, model_name =', model_name)
    if (typeof(host_model) === "undefined") {
        model_name = port + '_' + protocol
        host_model = dataset[model_name]
    }
    if (typeof(host_model) !== "undefined") {
        if (host_model[event_type] !== "undefined") {
            return host_model[event_type]
        }
    }
    return 'error in get_gmms()'//未来改成更具体的error
}


histogram_build = function (values, anomaly_value) {
    let max_value
    if(values.length>0){
        max_value = Math.max.apply(null, values)
    }
    else{
        max_value=10
    }
    // 最大5（高位234） 10（高位56789） 20(高位为1)
    // 遇到小于1可能存在bug

    let num_length = max_value.toString().split('.')[0].length
    let head_num = parseInt(max_value.toString()[0])
    console.log('max_value:', max_value)
    let res = new Object()
    if (head_num >= 5) {
        res.histogramBase = Math.pow(10, num_length)
        res.axisTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        res.axisMultiple = num_length
    }
    if (head_num === 2 || head_num === 3 || head_num === 4) {
        res.histogramBase = 5 * Math.pow(10, num_length - 1)
        res.axisTicks = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
        res.axisMultiple = num_length - 1
    }
    if (head_num === 1) {
        res.histogramBase = 2 * Math.pow(10, num_length - 1)
        res.axisTicks = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
        res.axisMultiple = num_length - 1
    }

    let frequencys = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    values.forEach(function (d) {
        let index = Math.floor(d * 10 / res.histogramBase)  //max value=0就炸了
        if (index === 10) {
            index = 9
        }
        frequencys[index] += 1
    })
    res.frequency = frequencys
    let anomalyIndex = Math.floor(10 * anomaly_value / res.histogramBase)
    if (anomalyIndex === 10) {
        anomalyIndex = 9
    }

    res.anomalyTick = res.axisTicks[anomalyIndex]
    // res = [res.axis_ticks, frequencys, anomaly_index / 10 * histogram_base, anomaly_index]//柱子X轴，柱子Y轴，异常点在哪个柱子

    return res
}

search_node = function (ip, time) { //输入ip和time，返回对应异常点的对象，包含port,event_type,gmm_params,Variable[也许要返回promise]        time什么鬼，数据库中18:15:0:0，得到的是18:15:03:15这种
    return new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject(err)
            }
            let nodename = 'Net_' + ip
            let mydb = db.db('ctu13_anomaly_graph_10');
            let search_res = mydb.collection('node_filtered_h40_m40').find({'nodeName': nodename})
                .toArray()
            // db.close()//  什么鬼？注释这个就好了？我怎么觉得是超时问题
            resolve(search_res)
        })
    }).then(function (d) {
        let node_info = new Object()
        d[0]['timeSeries'].forEach(function (d) {
                if (d['T_start'] == time) {
                    node_info.event_type = d['event_type'].slice(0, -6)
                    let pp = d['port'].split(':')
                    if (pp.length == 2) {
                        node_info.protocol = pp[0]
                        node_info.port = pp[1]
                    }
                    else {
                        node_info.protocol = pp[0]
                        node_info.port = 'None'
                    }
                    node_info.gmm_parm = d['gmm_params']
                    node_info.value = d['Variable']
                    node_info.direction = d['direction']
                    node_info.score = d['weight']
                }
            }
        )
        console.log('node_info:', node_info.event_type, node_info.protocol, node_info.port)
        console.log('search_node_success')
        return new Promise(resolve => resolve(node_info))
    })
}


search_history = function (ip, event_type, timeJustMinute, timeWindow) {//time似乎是某种表示形式的
    let timestamp = Date.parse(new Date(timeJustMinute)) / 1000;
    let date = new Date(timeJustMinute)
    let focused_time = new Date(Date.parse(date) - date.getTimezoneOffset() * 60000)
    console.log('focused_time', focused_time)

    function get_timestamp(d) {
        return Date.parse(new Date(d)) / 1000;
    }

    return new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            let mydb = db.db('ctu13_feature_data');
            let res = mydb.collection('scenario_10_feature_src_dst').find({
                '$and': [{'host_ip': ip}, {
                    'start_timestamp': {
                        '$gt': get_timestamp(timeWindow.time_left),
                        '$lt': get_timestamp(timeWindow.time_right)
                    }
                }]
            })
                .sort({'start_timestamp': 1}).toArray()
            // db.close()
            resolve(res)
            reject('error')
        })
    }).then(function (d) {
        console.log('in history: res_length = ', d.length)
        console.log('timewindow=', timeWindow)
        start_timestamp = get_timestamp(timeWindow.time_left)
        end_timestamp = get_timestamp(timeWindow.time_right)
        console.log('in history')
        console.log(d)
        console.log('history_count')
        console.log(d.length)
        console.log('start_timestamp, end_timestamp==========================')
        console.log(start_timestamp, end_timestamp)
        let axis_res_list = history_dict2list(d, event_type, start_timestamp, end_timestamp)
        return new Promise(resolve => resolve([axis_res_list, event_type, focused_time]))
    })
}

search_detail = function (ip, timeJustMinute, timeWindow) {// 目前为查询前后10分钟范围
    console.log('in search_detail!!!!')
    console.log(timeJustMinute)
    let timestamp = Date.parse(new Date(timeJustMinute)) / 1000;
    console.log('timestamp_in_search_detail=' + timestamp.toString())
    return new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject('error')
            }
            let mydb = db.db('ctu13_raw_data');
            let res = mydb.collection('scenario_10_ex').find({
                '$and': [{'$or': [{'SrcAddr': ip}, {'DstAddr': ip}]},
                    // {
                    // 'start_timestamp': {
                    //     '$gt': timestamp - 0.5 * timeWindow,
                    //     '$lt': timestamp + 0.5 * timeWindow
                    // }
                    {
                        'start_serial_1min': Math.floor(timestamp / 60)
                    }
                ]
            })
                .sort({'start_timestamp': 1}).limit(100).toArray()
            // db.close()
            resolve(res)
        })
    }).then(function (res) {
        let toDec = function (s) {
            if (s.length > 2 && s[1] === 'x') {
                return parseInt(s, 16).toString()
            }
            else {
                return s
            }
        }
        console.log('detail_res:', res)
        res.forEach(function (d) {
            d['StartTime'] = d['StartTime'].split(' ')[1].split('.')[0]
            if (d['Dur'].split('.')[0] != '0') {
                d['Duration'] = d['Dur'].split('.')[0]
            }
            else {
                try {
                    d['Duration'] = d['Dur'].slice(0, 6)
                }
                catch (err) {
                    console.log('in duration', err)
                }

            }
            d['Flow'] = d['SrcAddr'] + ':' + toDec(d['Sport']) + ' ->\n' + d['DstAddr'] + ':' + toDec(d['Dport'])
                + ' (' + d['Proto'] + ')'
            d['Time'] = d['StartTime']
            d['Bytes'] = d['TotBytes']
        })
        return new Promise(resolve => {
            resolve(res)
        })
    })
}

search_histogram = function (ip, event_type, anomaly_value, protocol, port) { //针对全时间段绘制
    anomaly_value = parseFloat(anomaly_value)
    return new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject('error')
            }
            let mydb = db.db('ctu13_feature_data');
            let res = mydb.collection('scenario_10_feature_src_dst').find({
                // '$and': [{'host_ip': ip}, {'protocol': protocol}, {'dest_port': port},{'time':{'$lt':'2011-08-18 11:00:00'}}]
                '$and': [{'host_ip': ip}, {'protocol': protocol}, {'dest_port': port}]
            }).toArray()
            // db.close()
            resolve(res)
        })
    }).then((d) => {
        let values = new Array()
        d.forEach((d) => {
            values.push(parseFloat(d[event_type]))
        })
        console.log('in histogram: values================', values)
        let res = histogram_build(values, anomaly_value)
        console.log('histogram_res: ', res)
        return new Promise(resolve => resolve(res))
    })
}


search_all = function (ip, timeJustMinute, event_type, value, timeWindow, protocol, port) {
    value = parseFloat(value)
    return Promise.all([search_histogram(ip, event_type, value, protocol, port), search_history(ip, event_type, timeJustMinute, timeWindow), search_detail(ip, timeJustMinute, timeWindow)])
}

var start_timestamp = Date.parse(new Date("2011-08-18 10:18:00"));
var end_timestamp = Date.parse(new Date("2011-08-18 15:04:00"));

function history_dict2list(res, event_type, start_timestamp, end_timestamp) {   //尽早改名，绑定用途。另外，这玩意是和数据集开始时间绑定的
    // res中的timestamp不是整数分钟的
    console.log('in dict2list: res.length = ', res.length)
    var time_axis = new Array()
    var values = new Array()
    // console.log(start_timestamp)
    // console.log(end_timestamp)

    for (var i = 0; i <= (end_timestamp - start_timestamp) / 60; i++) {
        // time_axis[i] = start_timestamp + 60000 * i;
        let t = new Date()
        time_axis[i] = new Date((start_timestamp - t.getTimezoneOffset() * 60 + 60 * i) * 1000)
        values[i] = 0;
    }
    res.forEach(function (d) {
        //我特么吧start_timestamp给算错了
        let minute = Math.floor(Date.parse(d['start_minute']) / 60000) - start_timestamp / 60
        console.log(minute)
        values[minute] = parseFloat(d[event_type])
    })
    console.log('in_history_dict2list:')
    console.log([time_axis, values])
    return [time_axis, values]
}

app.get('/test', function (req, res) {
    console.log(req.query);
    res.json({
        'hhh': 'hello, I am HOCG_web_right',
        'querry': req.query
    })
});

app.get('/anomalyDetail', function (req, res_anomaly) {
    console.log(req.query)
    let varName = req.query['varName'].split(' ')
    let ip = varName[varName.length - 1]
    let timeInQuery = req.query['time']
    let timeWindow = req.query['timeWindow_info']
    let day_hour_min_sec = timeInQuery.split(':')
    let time_normal = '2011-08-' + day_hour_min_sec[0] + ' ' + day_hour_min_sec[1] + ':' + day_hour_min_sec[2] + ':' + day_hour_min_sec[3]

    // 还有其他值应该获取，二次查询的话效率太低了。不管了，直接再查一次。特么还得在二级结构遍历

    let timeJustMinute = (time_normal.slice(0, -2) + '00').replace(/:0/g, ':')   //时间取整数分钟，05换成0
    let time_minute = (timeInQuery.slice(0, -2) + '00').replace(/:0/g, ':')   //天知道当时存了多少种数据格式！！！！！
    let info = new Object()
    info.general = new Object()
    info.gmm = new Object()
    info.request = req.query
    search_node(ip, time_minute).then(function (dn) {
        // console.log('search_node_res:', dn)
        let gmm_dataset = ''
        if (dn.direction == 'src') {
            gmm_dataset = gmm_dataset_src
        }
        else {
            gmm_dataset = gmm_dataset_dst
        }
        info.general.indexType = dn.event_type
        info.general.score = dn.score
        let gmms = get_gmms(gmm_dataset, ip, dn.protocol, dn.port, dn.event_type)
        info.gmm.gmmParmSet = gmms
        info.general.anomalyValue = dn.value
        info.ge
        search_all(ip, timeJustMinute, dn.event_type, dn.value, timeWindow, dn.protocol, dn.port).then(
            function (d) {
                // console.log(d[0])
                // console.log(d[1])
                temp = dn.gmm_parm.split('_')
                info.gmm.selectedGmmParm = {
                    serial: parseInt(temp[0]),
                    weight: parseFloat(temp[1]),
                    mean: parseFloat(temp[2]),
                    deviation: parseFloat(temp[3])
                }

                console.log('gmm_parm_in search_all:', temp)
                // gmm_parms = [parseFloat(temp[0]), parseFloat(temp[1])]//暂时只一条曲线
                gmm_parms = [parseInt(temp[0]), parseFloat(temp[1]), parseFloat(temp[2]), parseFloat(temp[3])]//暂时只一条曲线

                detail = ''
                // let detail = d[2]
                // d[2] = 0
                info.histogram = d[0]

                info.history = d[1]
                info.detail = d[2]
                // response = [req.query, [d[0][0], d[0][1], dn.value],
                //     d[1], detail, gmm_parms, dn.event_type, gmms, gmm_parms, d[2], info]
                //MD 宛如智障，赶紧重写
                // console.log(response)
                //新版本，不同host的模型是不同的
                // console.log(d[2])
                // console.log(d[1][2])
                // console.log(d[2].length)

                // res_anomaly.send(response)
                res_anomaly.send(info)
                console.log('======================info=============================')
                console.log(info)
                console.log('query end')
            }
        )

    })

})


app.listen(port_of_right)

