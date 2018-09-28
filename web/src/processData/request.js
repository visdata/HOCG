import{leftLayer,server,port} from '../init/init'
import{clone} from '../processData/processData';
function ajax(url,success,data) {
    console.log(url);
    console.log(data);
    //console.log('ajax request data: '+data.timeStart);
    //console.log('ajax request data: '+data.timeEnd);
    $.ajax({
        url: url,
        data: data,
        async: false,
        success: success
    })
}
function requestData(){
    var layers=[leftLayer];
    layers.forEach(function(layer){
        var source=layer.source;
        var filter=layer.filter;
        var clusterCount=layer.clusterCount;
        layer.focusedID=source+'_'+clusterCount;
    });
    search(layers);
}
function search(ids){
    var requests=[];
    ids.forEach(function(item){
        var id=item.focusedID;
        var data=item.data;
	//console.log(item)
        //if(!(id in data.sourceData)||!data.sourceData[id]){
            requests.push(item);
        //}
    });
    if(requests.length==0){
        //data all exist, call layout function
        ids.forEach(function(item){
            if(item.layer.ifLayout) {
                var source = item.source;
                var tmpData = {};
                tmpData=clone(item.layer.data.sourceData[item.layer.focusedID], tmpData);
                item.layer.processData(tmpData);
                if (item.layer.focusedID && item.layer.preFocusedID) {
                    item.layer.layout(optionNumber, true, 'incremental', item.layer.data.postData[item.layer.focusedID]);
                }
                else {
                    item.layer.preLayout(item.layer.data.postData[item.layer.focusedID]);
                }
            }
        });
    }
    else{
        var url='http://'+server+':'+port+'/GetAnomalyGraph';
        var reqData;
        requests.forEach(function(item){
            reqData=item.filter;
            item.focusedID=item.source+'_'+item.clusterCount;
        });
        //console.log(reqData);
        var startTime=reqData.timeStart;
        var endTime=reqData.timeEnd;
        //console.log("In search Time range: "+startTime+"->"+endTime);
        var success=function(d){
            if(d['error']){
            }
            else{
                function fixError(d){
                    //var newNodes={};
                    //var oriNodes;
                    //for(var key in d.nodes){
                    //    oriNodes= d.nodes[key];
                    //    break;
                    //}
                    //oriNodes.forEach(function(item){
                    //    var id=item.node_index;
                    //    newNodes[id]=item;
                    //})
                    //d.nodes=newNodes;
                    d.cluster= d.nodes;
                    d.edge= d.edges;
                    for(var key in d.cluster){
                        d.cluster[key].keywords=[d.cluster[key].nodeName];
                        d.cluster[key].frequencyKeywords=[''];
                    }
                }
                fixError(d);
                //console.log(d);
                ids.forEach(function(item,i){
                    //if(i==1)return;
                    var source=item.source;
                    //if(source=='aminerV8')item.layer.sourceText='AMiner';
                    //else if(source=='citeseerx')item.layer.sourceText='CiteseerX';
                    var tmpData={};
                    item.sourceText = 'Anomaly Graph';
                    var focused=item.source+'_'+item.clusterCount;
                    item.focusedID=focused;
                    var data=item.data;
                    if(data.sourceData[focused]){
                        tmpData=clone(data.sourceData[focused],tmpData);
                    }
                    else{
                        tmpData=JSON.parse(JSON.stringify(d));

                        //clone(d,tmpData);
                        item.data.sourceData[item.focusedID]= d;
                    }
                    if(item.ifLayout){
                        item.processData(tmpData);
                        //if(item.focusedID&&item.preFocusedID){
                        //    item.layout(optionNumber,true, 'incremental',item.data.postData[item.focusedID]);
                        //}
                        //else{
                        if(item.fullGraph==1){
                            item.preLayout(item.data.postData[item.focusedID]);
                        }
                        else{
                            item.preLayout(item.data.postData[item.focusedID]);
                        }
                        //}
                    }


                });
            }
        };
        //d3.json('data/anomaly_0.5.json',success);
        ajax(url,success,reqData);
    }
}
function FSubmit(e){
    if(e ==13){
        search();
    }
}
function getUrlParam(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r!=null) return unescape(r[2]); return null; //返回参数值
}

export{
    ajax,
    requestData,
    search,
    getUrlParam
};
