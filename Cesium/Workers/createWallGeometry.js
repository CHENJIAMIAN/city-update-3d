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
define(["./defaultValue-4607806f","./Matrix2-21f90abf","./Transforms-c450597e","./ComponentDatatype-4028c72d","./RuntimeError-cef79f54","./GeometryAttribute-3c090c07","./GeometryAttributes-acac33d2","./IndexDatatype-20e78e57","./VertexFormat-75e8069c","./WallGeometryLibrary-e223d3bd","./commonjsHelpers-a32ac251","./combine-fc59ba59","./WebGLConstants-f100e3dd","./arrayRemoveDuplicates-63c6b4d8","./PolylinePipeline-2aac2bf9","./EllipsoidGeodesic-b1c7082b","./EllipsoidRhumbLine-bf1c0ab0","./IntersectionTests-ef65540c","./Plane-1c5eb32d"],(function(e,t,n,i,a,o,r,s,l,m,c,u,p,d,f,y,g,h,C){"use strict";const b=new t.Cartesian3,x=new t.Cartesian3,A=new t.Cartesian3,_=new t.Cartesian3,E=new t.Cartesian3,w=new t.Cartesian3,F=new t.Cartesian3;function v(n){const a=(n=e.defaultValue(n,e.defaultValue.EMPTY_OBJECT)).positions,o=n.maximumHeights,r=n.minimumHeights,s=e.defaultValue(n.vertexFormat,l.VertexFormat.DEFAULT),m=e.defaultValue(n.granularity,i.CesiumMath.RADIANS_PER_DEGREE),c=e.defaultValue(n.ellipsoid,t.Ellipsoid.WGS84);this._positions=a,this._minimumHeights=r,this._maximumHeights=o,this._vertexFormat=l.VertexFormat.clone(s),this._granularity=m,this._ellipsoid=t.Ellipsoid.clone(c),this._workerName="createWallGeometry";let u=1+a.length*t.Cartesian3.packedLength+2;e.defined(r)&&(u+=r.length),e.defined(o)&&(u+=o.length),this.packedLength=u+t.Ellipsoid.packedLength+l.VertexFormat.packedLength+1}v.pack=function(n,i,a){let o;a=e.defaultValue(a,0);const r=n._positions;let s=r.length;for(i[a++]=s,o=0;o<s;++o,a+=t.Cartesian3.packedLength)t.Cartesian3.pack(r[o],i,a);const m=n._minimumHeights;if(s=e.defined(m)?m.length:0,i[a++]=s,e.defined(m))for(o=0;o<s;++o)i[a++]=m[o];const c=n._maximumHeights;if(s=e.defined(c)?c.length:0,i[a++]=s,e.defined(c))for(o=0;o<s;++o)i[a++]=c[o];return t.Ellipsoid.pack(n._ellipsoid,i,a),a+=t.Ellipsoid.packedLength,l.VertexFormat.pack(n._vertexFormat,i,a),i[a+=l.VertexFormat.packedLength]=n._granularity,i};const L=t.Ellipsoid.clone(t.Ellipsoid.UNIT_SPHERE),H=new l.VertexFormat,V={positions:void 0,minimumHeights:void 0,maximumHeights:void 0,ellipsoid:L,vertexFormat:H,granularity:void 0};return v.unpack=function(n,i,a){let o;i=e.defaultValue(i,0);let r=n[i++];const s=new Array(r);for(o=0;o<r;++o,i+=t.Cartesian3.packedLength)s[o]=t.Cartesian3.unpack(n,i);let m,c;if(r=n[i++],r>0)for(m=new Array(r),o=0;o<r;++o)m[o]=n[i++];if(r=n[i++],r>0)for(c=new Array(r),o=0;o<r;++o)c[o]=n[i++];const u=t.Ellipsoid.unpack(n,i,L);i+=t.Ellipsoid.packedLength;const p=l.VertexFormat.unpack(n,i,H),d=n[i+=l.VertexFormat.packedLength];return e.defined(a)?(a._positions=s,a._minimumHeights=m,a._maximumHeights=c,a._ellipsoid=t.Ellipsoid.clone(u,a._ellipsoid),a._vertexFormat=l.VertexFormat.clone(p,a._vertexFormat),a._granularity=d,a):(V.positions=s,V.minimumHeights=m,V.maximumHeights=c,V.granularity=d,new v(V))},v.fromConstantHeights=function(t){const n=(t=e.defaultValue(t,e.defaultValue.EMPTY_OBJECT)).positions;let i,a;const o=t.minimumHeight,r=t.maximumHeight,s=e.defined(o),l=e.defined(r);if(s||l){const e=n.length;i=s?new Array(e):void 0,a=l?new Array(e):void 0;for(let t=0;t<e;++t)s&&(i[t]=o),l&&(a[t]=r)}return new v({positions:n,maximumHeights:a,minimumHeights:i,ellipsoid:t.ellipsoid,vertexFormat:t.vertexFormat})},v.createGeometry=function(a){const l=a._positions,c=a._minimumHeights,u=a._maximumHeights,p=a._vertexFormat,d=a._granularity,f=a._ellipsoid,y=m.WallGeometryLibrary.computePositions(f,l,u,c,d,!0);if(!e.defined(y))return;const g=y.bottomPositions,h=y.topPositions,C=y.numCorners;let v=h.length,L=2*v;const H=p.position?new Float64Array(L):void 0,V=p.normal?new Float32Array(L):void 0,k=p.tangent?new Float32Array(L):void 0,G=p.bitangent?new Float32Array(L):void 0,D=p.st?new Float32Array(L/3*2):void 0;let P,T=0,z=0,O=0,R=0,S=0,I=F,N=w,M=E,W=!0;v/=3;let B=0;const U=1/(v-C-1);for(P=0;P<v;++P){const e=3*P,n=t.Cartesian3.fromArray(h,e,b),a=t.Cartesian3.fromArray(g,e,x);if(p.position&&(H[T++]=a.x,H[T++]=a.y,H[T++]=a.z,H[T++]=n.x,H[T++]=n.y,H[T++]=n.z),p.st&&(D[S++]=B,D[S++]=0,D[S++]=B,D[S++]=1),p.normal||p.tangent||p.bitangent){let a=t.Cartesian3.clone(t.Cartesian3.ZERO,_);const o=t.Cartesian3.subtract(n,f.geodeticSurfaceNormal(n,x),x);if(P+1<v&&(a=t.Cartesian3.fromArray(h,e+3,_)),W){const e=t.Cartesian3.subtract(a,n,A),i=t.Cartesian3.subtract(o,n,b);I=t.Cartesian3.normalize(t.Cartesian3.cross(i,e,I),I),W=!1}t.Cartesian3.equalsEpsilon(n,a,i.CesiumMath.EPSILON10)?W=!0:(B+=U,p.tangent&&(N=t.Cartesian3.normalize(t.Cartesian3.subtract(a,n,N),N)),p.bitangent&&(M=t.Cartesian3.normalize(t.Cartesian3.cross(I,N,M),M))),p.normal&&(V[z++]=I.x,V[z++]=I.y,V[z++]=I.z,V[z++]=I.x,V[z++]=I.y,V[z++]=I.z),p.tangent&&(k[R++]=N.x,k[R++]=N.y,k[R++]=N.z,k[R++]=N.x,k[R++]=N.y,k[R++]=N.z),p.bitangent&&(G[O++]=M.x,G[O++]=M.y,G[O++]=M.z,G[O++]=M.x,G[O++]=M.y,G[O++]=M.z)}}const q=new r.GeometryAttributes;p.position&&(q.position=new o.GeometryAttribute({componentDatatype:i.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:H})),p.normal&&(q.normal=new o.GeometryAttribute({componentDatatype:i.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:V})),p.tangent&&(q.tangent=new o.GeometryAttribute({componentDatatype:i.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:k})),p.bitangent&&(q.bitangent=new o.GeometryAttribute({componentDatatype:i.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:G})),p.st&&(q.st=new o.GeometryAttribute({componentDatatype:i.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:D}));const J=L/3;L-=6*(C+1);const Y=s.IndexDatatype.createTypedArray(J,L);let j=0;for(P=0;P<J-2;P+=2){const e=P,n=P+2,a=t.Cartesian3.fromArray(H,3*e,b),o=t.Cartesian3.fromArray(H,3*n,x);if(t.Cartesian3.equalsEpsilon(a,o,i.CesiumMath.EPSILON10))continue;const r=P+1,s=P+3;Y[j++]=r,Y[j++]=e,Y[j++]=s,Y[j++]=s,Y[j++]=e,Y[j++]=n}return new o.Geometry({attributes:q,indices:Y,primitiveType:o.PrimitiveType.TRIANGLES,boundingSphere:new n.BoundingSphere.fromVertices(H)})},function(n,i){return e.defined(i)&&(n=v.unpack(n,i)),n._ellipsoid=t.Ellipsoid.clone(n._ellipsoid),v.createGeometry(n)}}));
