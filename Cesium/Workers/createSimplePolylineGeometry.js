/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.96
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */
define(["./defaultValue-4607806f","./Matrix2-21f90abf","./ArcType-f5af12f9","./Transforms-c450597e","./Color-9a6f77d5","./ComponentDatatype-4028c72d","./RuntimeError-cef79f54","./GeometryAttribute-3c090c07","./GeometryAttributes-acac33d2","./IndexDatatype-20e78e57","./PolylinePipeline-2aac2bf9","./commonjsHelpers-a32ac251","./combine-fc59ba59","./WebGLConstants-f100e3dd","./EllipsoidGeodesic-b1c7082b","./EllipsoidRhumbLine-bf1c0ab0","./IntersectionTests-ef65540c","./Plane-1c5eb32d"],(function(e,o,t,l,r,n,i,a,s,c,p,f,d,y,u,h,C,m){"use strict";function T(e,o,t,l,n,i,a){const s=p.PolylinePipeline.numberOfPoints(e,o,n);let c;const f=t.red,d=t.green,y=t.blue,u=t.alpha,h=l.red,C=l.green,m=l.blue,T=l.alpha;if(r.Color.equals(t,l)){for(c=0;c<s;c++)i[a++]=r.Color.floatToByte(f),i[a++]=r.Color.floatToByte(d),i[a++]=r.Color.floatToByte(y),i[a++]=r.Color.floatToByte(u);return a}const g=(h-f)/s,b=(C-d)/s,_=(m-y)/s,P=(T-u)/s;let B=a;for(c=0;c<s;c++)i[B++]=r.Color.floatToByte(f+c*g),i[B++]=r.Color.floatToByte(d+c*b),i[B++]=r.Color.floatToByte(y+c*_),i[B++]=r.Color.floatToByte(u+c*P);return B}function g(l){const i=(l=e.defaultValue(l,e.defaultValue.EMPTY_OBJECT)).positions,a=l.colors,s=e.defaultValue(l.colorsPerVertex,!1);this._positions=i,this._colors=a,this._colorsPerVertex=s,this._arcType=e.defaultValue(l.arcType,t.ArcType.GEODESIC),this._granularity=e.defaultValue(l.granularity,n.CesiumMath.RADIANS_PER_DEGREE),this._ellipsoid=e.defaultValue(l.ellipsoid,o.Ellipsoid.WGS84),this._workerName="createSimplePolylineGeometry";let c=1+i.length*o.Cartesian3.packedLength;c+=e.defined(a)?1+a.length*r.Color.packedLength:1,this.packedLength=c+o.Ellipsoid.packedLength+3}g.pack=function(t,l,n){let i;n=e.defaultValue(n,0);const a=t._positions;let s=a.length;for(l[n++]=s,i=0;i<s;++i,n+=o.Cartesian3.packedLength)o.Cartesian3.pack(a[i],l,n);const c=t._colors;for(s=e.defined(c)?c.length:0,l[n++]=s,i=0;i<s;++i,n+=r.Color.packedLength)r.Color.pack(c[i],l,n);return o.Ellipsoid.pack(t._ellipsoid,l,n),n+=o.Ellipsoid.packedLength,l[n++]=t._colorsPerVertex?1:0,l[n++]=t._arcType,l[n]=t._granularity,l},g.unpack=function(t,l,n){let i;l=e.defaultValue(l,0);let a=t[l++];const s=new Array(a);for(i=0;i<a;++i,l+=o.Cartesian3.packedLength)s[i]=o.Cartesian3.unpack(t,l);a=t[l++];const c=a>0?new Array(a):void 0;for(i=0;i<a;++i,l+=r.Color.packedLength)c[i]=r.Color.unpack(t,l);const p=o.Ellipsoid.unpack(t,l);l+=o.Ellipsoid.packedLength;const f=1===t[l++],d=t[l++],y=t[l];return e.defined(n)?(n._positions=s,n._colors=c,n._ellipsoid=p,n._colorsPerVertex=f,n._arcType=d,n._granularity=y,n):new g({positions:s,colors:c,ellipsoid:p,colorsPerVertex:f,arcType:d,granularity:y})};const b=new Array(2),_=new Array(2),P={positions:b,height:_,ellipsoid:void 0,minDistance:void 0,granularity:void 0};return g.createGeometry=function(i){const f=i._positions,d=i._colors,y=i._colorsPerVertex,u=i._arcType,h=i._granularity,C=i._ellipsoid,m=n.CesiumMath.chordLength(h,C.maximumRadius),g=e.defined(d)&&!y;let B;const A=f.length;let E,k,G,D,L=0;if(u===t.ArcType.GEODESIC||u===t.ArcType.RHUMB){let o,l,i;u===t.ArcType.GEODESIC?(o=n.CesiumMath.chordLength(h,C.maximumRadius),l=p.PolylinePipeline.numberOfPoints,i=p.PolylinePipeline.generateArc):(o=h,l=p.PolylinePipeline.numberOfPointsRhumbLine,i=p.PolylinePipeline.generateRhumbArc);const a=p.PolylinePipeline.extractHeights(f,C),s=P;if(u===t.ArcType.GEODESIC?s.minDistance=m:s.granularity=h,s.ellipsoid=C,g){let t=0;for(B=0;B<A-1;B++)t+=l(f[B],f[B+1],o)+1;E=new Float64Array(3*t),G=new Uint8Array(4*t),s.positions=b,s.height=_;let n=0;for(B=0;B<A-1;++B){b[0]=f[B],b[1]=f[B+1],_[0]=a[B],_[1]=a[B+1];const o=i(s);if(e.defined(d)){const e=o.length/3;D=d[B];for(let o=0;o<e;++o)G[n++]=r.Color.floatToByte(D.red),G[n++]=r.Color.floatToByte(D.green),G[n++]=r.Color.floatToByte(D.blue),G[n++]=r.Color.floatToByte(D.alpha)}E.set(o,L),L+=o.length}}else if(s.positions=f,s.height=a,E=new Float64Array(i(s)),e.defined(d)){for(G=new Uint8Array(E.length/3*4),B=0;B<A-1;++B){L=T(f[B],f[B+1],d[B],d[B+1],m,G,L)}const e=d[A-1];G[L++]=r.Color.floatToByte(e.red),G[L++]=r.Color.floatToByte(e.green),G[L++]=r.Color.floatToByte(e.blue),G[L++]=r.Color.floatToByte(e.alpha)}}else{k=g?2*A-2:A,E=new Float64Array(3*k),G=e.defined(d)?new Uint8Array(4*k):void 0;let t=0,l=0;for(B=0;B<A;++B){const n=f[B];if(g&&B>0&&(o.Cartesian3.pack(n,E,t),t+=3,D=d[B-1],G[l++]=r.Color.floatToByte(D.red),G[l++]=r.Color.floatToByte(D.green),G[l++]=r.Color.floatToByte(D.blue),G[l++]=r.Color.floatToByte(D.alpha)),g&&B===A-1)break;o.Cartesian3.pack(n,E,t),t+=3,e.defined(d)&&(D=d[B],G[l++]=r.Color.floatToByte(D.red),G[l++]=r.Color.floatToByte(D.green),G[l++]=r.Color.floatToByte(D.blue),G[l++]=r.Color.floatToByte(D.alpha))}}const w=new s.GeometryAttributes;w.position=new a.GeometryAttribute({componentDatatype:n.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:E}),e.defined(d)&&(w.color=new a.GeometryAttribute({componentDatatype:n.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,values:G,normalize:!0})),k=E.length/3;const V=2*(k-1),x=c.IndexDatatype.createTypedArray(k,V);let S=0;for(B=0;B<k-1;++B)x[S++]=B,x[S++]=B+1;return new a.Geometry({attributes:w,indices:x,primitiveType:a.PrimitiveType.LINES,boundingSphere:l.BoundingSphere.fromPoints(f)})},function(t,l){return e.defined(l)&&(t=g.unpack(t,l)),t._ellipsoid=o.Ellipsoid.clone(t._ellipsoid),g.createGeometry(t)}}));
