function ifPointInCircle(point,circle){
    var x=point.x;
    var y=point.y;
    var cx=circle.x;
    var cy=circle.y;
    var r=circle.r;
    var dis=getDistance({x:x, y:y},{x:cx, y:cy});
    if(dis<=r)return true;
    else return false;
}
function ifPointInRect(point,rect){

}
function getDistance(p1,p2){
    var dx=p1.x-p2.x;
    var dy=p1.y-p2.y;
    return Math.sqrt(dx*dx+dy*dy);
}
function ratioPoint(p1,p2,ratio){
    var p3={};
    p3.x = p1.x*ratio+p2.x*(1-ratio);
    p3.y = p1.y*ratio+p2.y*(1-ratio);
    return p3;
}
function mergeRect(bounds1,bounds2){
    var minX1=bounds1.x;
    var minY1=bounds1.y;
    var maxX1=bounds1.x+bounds1.width;
    var maxY1=bounds1.y+bounds1.height;
    var minX2=bounds2.x;
    var minY2=bounds2.y;
    var maxX2=bounds2.x+bounds1.width;
    var maxY2=bounds2.y+bounds1.height;
    var minX=d3.min([minX1,minX2]);
    var minY=d3.min([minY1,minY2]);
    var maxX=d3.max([maxX1,maxX2]);
    var maxY=d3.min([maxY1,maxY2]);
    return {
        x:minX,
        y:minY,
        width:maxX-minX,
        height:maxY-minY
    }
}
function vector3d(x,y,z){
    return {x:x, y:y, z:z};
}
function vector3dCross(vec1,vec2){
    var x=vec1.y*vec2.z-vec1.z*vec2.y;
    var y=vec2.x*vec1.z-vec2.z*vec1.x;
    var z=vec1.x*vec2.y-vec1.y*vec2.x;
    return {x:x, y:y, z:z};
}
function vector(p1,p2){
    return [p1, p2];
}
function getNormalized(vec){
    var disX=vec[1].x-vec[0].x;
    var disY=vec[1].y-vec[0].y;
    var dist=Math.sqrt(disX*disX+disY*disY);
    disX/=dist;
    disY/=dist;
    return {x:disX,y:disY};
}
function absAngleBetween(vector1,vector2){
    var angleBetw=angleBetween(vector1,vector2);
    var vector1Norm=getNormalized(vector1);
    var vector2Norm=getNormalized(vector2);
    var dot=-vector1Norm.y*vector2Norm.x+vector1Norm.x*vector2Norm.y;
    if(dot>=0){
        return angleBetw
    }
    else{
        return 2*Math.PI-angleBetw;
    }
}
function angleBetween(vector1,vector2){
    var dotValue=dotProduct(vector1,vector2);
    if(dotValue>=1){
        dotValue=1;
    }
    else if(dotValue<=-1){
        dotValue=-1;
    }
    return Math.acos(dotValue);
}
function dotProduct(vector1,vector2){
    var vector1Norm=getNormalized(vector1);
    var vector2Norm=getNormalized(vector2);
    return vector1Norm.x*vector2Norm.x+vector1Norm.y*vector2Norm.y;
}
function get2PointFun(p1,p2){
    var x1=p1.x;
    var y1=p1.y;
    var x2=p2.x;
    var y2=p2.y;
    if(x1!=x2){
        var k=(y2-y1)/(x2-x1);
        var b=y1-k*x1;
//    return function(x){return k*x+b;}
        return {k:k, b:b,vertical:false}
    }
    else{
        return {x:x1, vertical:true}
    }

}
function getPointSlopeFun(p,k){
    var x0=p.x;
    var y0=p.y;
    var b=y0-k*x0;
    return {k:k, b:b, vertical:false}
}
function getPointToLineCrossPoint(p1,p2,p3){
    //球一点到两点线段垂点的坐标
    var x1=p1.x;
    var x2=p2.x;
    var x3=p3.x;
    var y1=p1.y;
    var y2=p2.y;
    var y3=p3.y;
    var line1=get2PointFun(p1, p2);
    if(line1.vertical){
        return {x:x1,y:y3};
    }
    else{
        var k1=line1.k;
        var b1=line1.b;
        if(k1!=0){
            var k2=-1/k1;
            var line2=getPointSlopeFun(p3, k2);
            var b2=line2.b;
            var x=(b2-b1)/(k1-k2);
            var y=k1*x+b1;
            return {x:x, y:y};
        }
        else{
            return {x:x3, y:y1};
        }
    }
}
function twoPointIntSquareDistance(p1,p2){
    var x1=parseInt(p1.x);
    var y1=parseInt(p1.y);
    var x2=parseInt(p2.x);
    var y2=parseInt(p2.y);
    return Math.sqrt(x1-x2)*(x1-x2)+(y1-y2)*(y1-y2);
}
function isPointInLine(point,line){
    var p1=line.p1;
    var p2=line.p2;
    var maxX=parseInt(d3.max([p1.x, p2.x]));
    var maxY=parseInt(d3.max([p1.y, p2.y]));
    var minX=parseInt(d3.min([p1.x, p2.x]));
    var minY=parseInt(d3.min([p1.y, p2.y]));
    var x=parseInt(point.x);
    var y=parseInt(point.y);
//    var ptop1=twoPointIntSquareDistance(point, p1);
//    var ptop2=twoPointIntSquareDistance(point, p2);
//    var p1top2=twoPointIntSquareDistance(p1, p2);
//    if((ptop1+ptop2)==p1top2){
    if((x>=minX&&x<=maxX)&&(y>=minY&&y<=maxY)){
        return true;
    }
    else return false;

}
function get2LineCrossPoint(l1,l2){
    var p1=l1.p1;
    var p2=l1.p2;
    var p3=l2.p1;
    var p4=l2.p2;

    var y1=get2PointFun(p1, p2);
    var y2=get2PointFun(p3, p4);
    if(!y1.vertical&&!y2.vertical){
        var k1=y1.k;
        var b1=y1.b;
        var k2=y2.k;
        var b2=y2.b;
        var x=(b2-b1)/(k1-k2);
        var y=k1*x+b1;
        var point={x:x, y:y};
        var isPointInLine1=isPointInLine(point, l1);
        var isPointInLine2=isPointInLine(point, l2);
        return {point:point, isPointInLine1:isPointInLine1,isPointInLine2:isPointInLine2};
    }

    else if(y1.vertical&&!y2.vertical){
        var x=y1.x;
        var k=y2.k;
        var b=y2.b;
        var y=k*x+b;
        var point={x:x, y:y};
        var isPointInLine1=isPointInLine(point, l1);
        var isPointInLine2=isPointInLine(point, l2);
        return {point:point, isPointInLine1:isPointInLine1,isPointInLine2:isPointInLine2};
    }
    else if(!y1.vertical&&y2.vertical){
        var x=y2.x;
        var k=y1.k;
        var b=y1.b;
        var y=k*x+b;
        var point={x:x, y:y};
        var isPointInLine1=isPointInLine(point, l1);
        var isPointInLine2=isPointInLine(point, l2);
        return {point:point, isPointInLine1:isPointInLine1,isPointInLine2:isPointInLine2};
    }
    else {
        return false;
    }



}
function getRectangleLineCrossPoint(bounds,line){
    var x=bounds.x;
    var y=bounds.y;
    var width=bounds.width;
    var height=bounds.height;
    var p1={x:x, y:y};
    var p2={x:x+width, y:y};
    var p3={x:x+width, y:y+height};
    var p4={x:x, y:y+height};
    var line1={p1:p1, p2:p4};
    var line2={p1:p3, p2:p4};
    var line3={p1:p1, p2:p2};
    var line4={p1:p2, p2:p3};
    var lines=[line1, line2, line3, line4];
    for(var i=0;i<lines.length;i++){
        var crossPoint=get2LineCrossPoint(line,lines[i]);
        if(crossPoint.isPointInLine1&&crossPoint.isPointInLine2){
            return crossPoint.point;
        }
    }
}
function moveCircleEdge(e1,e2){
    var p1=e1.p1;
    var p2=e1.p2;
    var p3=e2.p1;
    var p4=e2.p2;
    var pi=Math.PI;
    var degree;
    var d=5;
    if(p1.x==p2.x)degree=pi/2;
    else {
        var k=(p1.y-p2.y)/(p1.x-p2.x);
        degree=Math.atan(k);
    }
    var dx=d*Math.sin(degree);
    var dy=d*Math.cos(degree);
    moveToLeft(p1, p2, dx, dy);
    moveToRight(p3, p4, dx, dy);
    function moveToLeft(p1,p2,dx,dy){
        p1.x-=dx;
        p1.y+=dy;
        p2.x-=dx;
        p2.y+=dy;
    }
    function moveToRight(p3,p4,dx,dy){
        p3.x+=dx;
        p3.y-=dy;
        p4.x+=dx;
        p4.y-=dy;

    }
    e1.dx=dx;
    e1.dy=-dy;
    e2.dx=-dx;
    e2.dy=dy;
    return {e1:e1,e2:e2};
}
export{
    ifPointInCircle,
    ifPointInRect,
    getDistance,
    ratioPoint,
    mergeRect,
    vector3d,
    vector3dCross,
    vector,
    getNormalized,
    absAngleBetween,
    angleBetween,
    dotProduct,
    get2PointFun,
    getPointSlopeFun,
    getPointToLineCrossPoint,
    twoPointIntSquareDistance,
    isPointInLine,
    get2LineCrossPoint,
    getRectangleLineCrossPoint,
    moveCircleEdge
};