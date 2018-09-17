function processIncrementalTree(tree){
    var newTree={};
    for(var i=0;i<tree.length;i++){
        var newGroup={}
        for(var j=0;j<tree[i].length;j++){
            var id=tree[i][j].id;
            var child=tree[i][j].chd;
            var parent=tree[i][j].prt;
            newGroup[id]={child:child, parent:parent};
        }
        var groupID=(i+1)*5;
        newTree[groupID]=newGroup;
    }
//    console.log(newTree);
    data.incrementalTree=newTree;
}