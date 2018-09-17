function updateCheckBox(d){
    var status=sourceCheckedStatus;
    if(status.left&&status.right){
        d3.selectAll('.'+ d.type+'CheckBox').attrs({
            disabled:function(){return null;}
        })
    }
    else if(status.left){
        d3.select('.'+ d.type+'CheckBox_left')
            .attrs({
                disabled:true
            })
    }
    else if(status.right){
        d3.select('.'+ d.type+'CheckBox_right')
            .attrs({
                disabled:true
            })
    }
}
function updateSvgBySourceCheckBox(){
    var status=sourceCheckedStatus;
    var ratio={};
    var totalWidth=usefulWidth;

    if(status.left&&status.right){
        ratio.left=0.5;
        ratio.mid=0.5;
        ratio.right=0;
        ratio.control=1;
        leftLayer.dataSourceVisibility='visible';
        rightLayer.dataSourceVisibility='visible';
        leftLayer.ifLayout=true;
        rightLayer.ifLayout=true;
        currentLayer=null;
    }
    else if(status.left){
        ratio.left=0.63;
        ratio.mid=0;
        ratio.right=0.37;
        ratio.control=0.63;
        leftLayer.dataSourceVisibility='hidden';
        rightLayer.dataSourceVisibility='hidden';
        currentLayer=leftLayer;
        leftLayer.ifLayout=true;
        rightLayer.ifLayout=false;
    }
    else if(status.right){
        ratio.left=0;
        ratio.mid=0.63;
        ratio.right=0.37;
        ratio.control=0.63;
        leftLayer.dataSourceVisibility='hidden';
        rightLayer.dataSourceVisibility='hidden';
        currentLayer=rightLayer;
        leftLayer.ifLayout=false;
        rightLayer.ifLayout=true;
    }
    var newWidth={};
    newWidth.left=totalWidth*ratio.left;
    newWidth.right=totalWidth*ratio.right;
    newWidth.mid=totalWidth*ratio.mid;
    newWidth.control=totalWidth*ratio.control;
    //console.log(newWidth);
    var transitionData=[
        {class:'.graphDiv_left',ease:'linear',duration:1000,width:newWidth.left,layer:leftLayer},
        {class:'.authorDiv_left',ease:'linear',duration:1000,width:newWidth.left,layer:leftLayer},
        {class:'.graphDiv_right',ease:'linear',duration:1000,width:newWidth.mid,layer:rightLayer},
        {class:'.authorDiv_right',ease:'linear',duration:1000,width:newWidth.mid,layer:rightLayer},
        {class:'.paperDiv',ease:'linear',duration:1000,width:newWidth.right},
        {class:'.topControlDiv',ease:'linear',duration:1000,width:newWidth.control},
        {class:'.bottomControlDiv',ease:'linear',duration:1000,width:newWidth.control},
    ];
    transitionData.forEach(function(item){
        d3.select(item.class)
            //.transition()
            //.ease(item.ease)
            //.duration(item.duration)
            .styles({
                width:item.width+px
            });
        if(item.class=='.graphDiv_left'||item.class=='.graphDiv_right'||item.class=='.authorDiv_left'||item.class=='.authorDiv_right'){
            item.layer.svg
                .attrs({
                    width:item.width
                });
            item.layer.axisSVG
                .attrs({
                    width:item.width
                });
            item.layer.size={
                width: item.layer.svg.attr("width")*0.9,
                height:item.layer.svg.attr("height")*1
            };

        }
    });
    requestData();
    //var layers=[leftLayer,rightLayer];
    //layers.forEach(function(layer){
    //    if(layer.size.width==0)return;
    //    var tmpData={};
    //    clone(layer.data.sourceData[layer.focusedID],tmpData);
    //    layer.processData(tmpData);
    //    if(layer.focusedID&&layer.preFocusedID){
    //        layer.layout(optionNumber,true, 'incremental',layer.data.postData[layer.focusedID]);
    //    }
    //    else{
    //        layer.preLayout(layer.data.postData[layer.focusedID]);
    //    }
    //});
    var animationModeDiv=d3.select('.directionDiv');
    var bottomDiv=d3.select('.bottomControlDiv');
    var bottomLength=bottomDiv.style('width').split('px')[0];
    var animaLength=animationModeDiv.style('width').split('px')[0];
    var leftDistance=(bottomLength-animaLength)/2;
    animationModeDiv.styles({
        'margin-left':leftDistance+px
    });

}
function changeOption(d){
    if(d.fatherID==1){
        leftLayer.filter.mThres=+d.values[d.selectID]*100;
        leftLayer.data.postData={};
        leftLayer.data.screenPreviousData={};
        leftLayer.data.sourceData={};
        leftLayer.data.timeData={};
        search([leftLayer])
        //p(leftLayer.filter);
    }
    else if(d.fatherID==2){
        leftLayer.filter.hThres=+d.values[d.selectID]*100;
        leftLayer.data.postData={};
        leftLayer.data.screenPreviousData={};
        leftLayer.data.sourceData={};
        leftLayer.data.timeData={};
        search([leftLayer])
        //p(leftLayer.filter);
    }
    else if(d.fatherID==3){
        leftLayer.filter.corrScore=+d.values[d.selectID];
        //p(leftLayer.filter);
        leftLayer.data.postData={};
        leftLayer.data.screenPreviousData={};
        leftLayer.data.sourceData={};
        leftLayer.data.timeData={};
        search([leftLayer])
    }

}
export {
    updateCheckBox,
    updateSvgBySourceCheckBox,
    changeOption,
}