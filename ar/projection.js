export function project(h,x,y){const w=h[2][0]*x+h[2][1]*y+h[2][2];return [(h[0][0]*x+h[0][1]*y+h[0][2])/w,(h[1][0]*x+h[1][1]*y+h[1][2])/w];}
// WebGL receives homogeneous field coordinates: division by W gives correct perspective,
// including perspective-correct text/texture interpolation. No fixed screen anchors.
export function matrixForGL(h){return new Float32Array([h[0][0],h[1][0],h[2][0],h[0][1],h[1][1],h[2][1],h[0][2],h[1][2],h[2][2]]);}

export function polygonPoints(shape){return shape.points?.length>=3?shape.points:null;}
