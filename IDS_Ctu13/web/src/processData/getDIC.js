function getNodeDic(nodes){
    var dic={};
    for(var i= 0,len=nodes.length;i<len;i++){
        var key=nodes[i].oldKey
        dic[key]=nodes[i];
    }
    return dic;
}
export{
    getNodeDic
};