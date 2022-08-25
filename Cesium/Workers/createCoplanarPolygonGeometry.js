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
define(["./arrayRemoveDuplicates-63c6b4d8","./BoundingRectangle-da157936","./Transforms-c450597e","./Matrix2-21f90abf","./RuntimeError-cef79f54","./ComponentDatatype-4028c72d","./CoplanarPolygonGeometryLibrary-23e4fbf4","./defaultValue-4607806f","./GeometryAttribute-3c090c07","./GeometryAttributes-acac33d2","./GeometryInstance-b34e2b9d","./GeometryPipeline-b9f29df3","./IndexDatatype-20e78e57","./PolygonGeometryLibrary-1c72970e","./PolygonPipeline-13d40849","./VertexFormat-75e8069c","./commonjsHelpers-a32ac251","./combine-fc59ba59","./WebGLConstants-f100e3dd","./OrientedBoundingBox-5c06247e","./EllipsoidTangentPlane-69b6e1fd","./AxisAlignedBoundingBox-cd3761c7","./IntersectionTests-ef65540c","./Plane-1c5eb32d","./AttributeCompression-b8c8fcdc","./EncodedCartesian3-f98850c6","./ArcType-f5af12f9","./EllipsoidRhumbLine-bf1c0ab0"],(function(e,t,n,o,r,a,i,s,l,c,y,p,u,d,m,g,f,b,C,h,x,P,A,L,w,G,F,v){"use strict";const E=new o.Cartesian3,_=new t.BoundingRectangle,T=new o.Cartesian2,k=new o.Cartesian2,D=new o.Cartesian3,V=new o.Cartesian3,R=new o.Cartesian3,H=new o.Cartesian3,I=new o.Cartesian3,M=new o.Cartesian3,B=new n.Quaternion,O=new o.Matrix3,z=new o.Matrix3,S=new o.Cartesian3;function N(e,t,r,i,y,p,d,g,f){const b=e.positions;let C=m.PolygonPipeline.triangulate(e.positions2D,e.holes);C.length<3&&(C=[0,1,2]);const h=u.IndexDatatype.createTypedArray(b.length,C.length);h.set(C);let x=O;if(0!==i){let e=n.Quaternion.fromAxisAngle(d,i,B);if(x=o.Matrix3.fromQuaternion(e,x),t.tangent||t.bitangent){e=n.Quaternion.fromAxisAngle(d,-i,B);const r=o.Matrix3.fromQuaternion(e,z);g=o.Cartesian3.normalize(o.Matrix3.multiplyByVector(r,g,g),g),t.bitangent&&(f=o.Cartesian3.normalize(o.Cartesian3.cross(d,g,f),f))}}else x=o.Matrix3.clone(o.Matrix3.IDENTITY,x);const P=k;t.st&&(P.x=r.x,P.y=r.y);const A=b.length,L=3*A,w=new Float64Array(L),G=t.normal?new Float32Array(L):void 0,F=t.tangent?new Float32Array(L):void 0,v=t.bitangent?new Float32Array(L):void 0,_=t.st?new Float32Array(2*A):void 0;let D=0,V=0,R=0,H=0,I=0;for(let e=0;e<A;e++){const n=b[e];if(w[D++]=n.x,w[D++]=n.y,w[D++]=n.z,t.st)if(s.defined(y)&&y.positions.length===A)_[I++]=y.positions[e].x,_[I++]=y.positions[e].y;else{const e=p(o.Matrix3.multiplyByVector(x,n,E),T);o.Cartesian2.subtract(e,P,e);const t=a.CesiumMath.clamp(e.x/r.width,0,1),i=a.CesiumMath.clamp(e.y/r.height,0,1);_[I++]=t,_[I++]=i}t.normal&&(G[V++]=d.x,G[V++]=d.y,G[V++]=d.z),t.tangent&&(F[H++]=g.x,F[H++]=g.y,F[H++]=g.z),t.bitangent&&(v[R++]=f.x,v[R++]=f.y,v[R++]=f.z)}const M=new c.GeometryAttributes;return t.position&&(M.position=new l.GeometryAttribute({componentDatatype:a.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:w})),t.normal&&(M.normal=new l.GeometryAttribute({componentDatatype:a.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:G})),t.tangent&&(M.tangent=new l.GeometryAttribute({componentDatatype:a.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:F})),t.bitangent&&(M.bitangent=new l.GeometryAttribute({componentDatatype:a.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:v})),t.st&&(M.st=new l.GeometryAttribute({componentDatatype:a.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:_})),new l.Geometry({attributes:M,indices:h,primitiveType:l.PrimitiveType.TRIANGLES})}function Q(e){const t=(e=s.defaultValue(e,s.defaultValue.EMPTY_OBJECT)).polygonHierarchy,n=e.textureCoordinates,r=s.defaultValue(e.vertexFormat,g.VertexFormat.DEFAULT);this._vertexFormat=g.VertexFormat.clone(r),this._polygonHierarchy=t,this._stRotation=s.defaultValue(e.stRotation,0),this._ellipsoid=o.Ellipsoid.clone(s.defaultValue(e.ellipsoid,o.Ellipsoid.WGS84)),this._workerName="createCoplanarPolygonGeometry",this._textureCoordinates=n,this.packedLength=d.PolygonGeometryLibrary.computeHierarchyPackedLength(t,o.Cartesian3)+g.VertexFormat.packedLength+o.Ellipsoid.packedLength+(s.defined(n)?d.PolygonGeometryLibrary.computeHierarchyPackedLength(n,o.Cartesian2):1)+2}Q.fromPositions=function(e){return new Q({polygonHierarchy:{positions:(e=s.defaultValue(e,s.defaultValue.EMPTY_OBJECT)).positions},vertexFormat:e.vertexFormat,stRotation:e.stRotation,ellipsoid:e.ellipsoid,textureCoordinates:e.textureCoordinates})},Q.pack=function(e,t,n){return n=s.defaultValue(n,0),n=d.PolygonGeometryLibrary.packPolygonHierarchy(e._polygonHierarchy,t,n,o.Cartesian3),o.Ellipsoid.pack(e._ellipsoid,t,n),n+=o.Ellipsoid.packedLength,g.VertexFormat.pack(e._vertexFormat,t,n),n+=g.VertexFormat.packedLength,t[n++]=e._stRotation,s.defined(e._textureCoordinates)?n=d.PolygonGeometryLibrary.packPolygonHierarchy(e._textureCoordinates,t,n,o.Cartesian2):t[n++]=-1,t[n++]=e.packedLength,t};const j=o.Ellipsoid.clone(o.Ellipsoid.UNIT_SPHERE),U=new g.VertexFormat,Y={polygonHierarchy:{}};return Q.unpack=function(e,t,n){t=s.defaultValue(t,0);const r=d.PolygonGeometryLibrary.unpackPolygonHierarchy(e,t,o.Cartesian3);t=r.startingIndex,delete r.startingIndex;const a=o.Ellipsoid.unpack(e,t,j);t+=o.Ellipsoid.packedLength;const i=g.VertexFormat.unpack(e,t,U);t+=g.VertexFormat.packedLength;const l=e[t++],c=-1===e[t]?void 0:d.PolygonGeometryLibrary.unpackPolygonHierarchy(e,t,o.Cartesian2);s.defined(c)?(t=c.startingIndex,delete c.startingIndex):t++;const y=e[t++];return s.defined(n)||(n=new Q(Y)),n._polygonHierarchy=r,n._ellipsoid=o.Ellipsoid.clone(a,n._ellipsoid),n._vertexFormat=g.VertexFormat.clone(i,n._vertexFormat),n._stRotation=l,n._textureCoordinates=c,n.packedLength=y,n},Q.createGeometry=function(t){const r=t._vertexFormat,c=t._polygonHierarchy,m=t._stRotation,g=t._textureCoordinates,f=s.defined(g);let b=c.positions;if(b=e.arrayRemoveDuplicates(b,o.Cartesian3.equalsEpsilon,!0),b.length<3)return;let C=D,h=V,x=R,P=I;const A=M;if(!i.CoplanarPolygonGeometryLibrary.computeProjectTo2DArguments(b,H,P,A))return;if(C=o.Cartesian3.cross(P,A,C),C=o.Cartesian3.normalize(C,C),!o.Cartesian3.equalsEpsilon(H,o.Cartesian3.ZERO,a.CesiumMath.EPSILON6)){const e=t._ellipsoid.geodeticSurfaceNormal(H,S);o.Cartesian3.dot(C,e)<0&&(C=o.Cartesian3.negate(C,C),P=o.Cartesian3.negate(P,P))}const L=i.CoplanarPolygonGeometryLibrary.createProjectPointsTo2DFunction(H,P,A),w=i.CoplanarPolygonGeometryLibrary.createProjectPointTo2DFunction(H,P,A);r.tangent&&(h=o.Cartesian3.clone(P,h)),r.bitangent&&(x=o.Cartesian3.clone(A,x));const G=d.PolygonGeometryLibrary.polygonsFromHierarchy(c,f,L,!1),F=G.hierarchy,v=G.polygons,E=f?d.PolygonGeometryLibrary.polygonsFromHierarchy(g,!0,(function(e){return e}),!1).polygons:void 0;if(0===F.length)return;b=F[0].outerRing;const T=n.BoundingSphere.fromPoints(b),k=d.PolygonGeometryLibrary.computeBoundingRectangle(C,w,b,m,_),B=[];for(let e=0;e<v.length;e++){const t=new y.GeometryInstance({geometry:N(v[e],r,k,m,f?E[e]:void 0,w,C,h,x)});B.push(t)}const O=p.GeometryPipeline.combineInstances(B)[0];O.attributes.position.values=new Float64Array(O.attributes.position.values),O.indices=u.IndexDatatype.createTypedArray(O.attributes.position.values.length/3,O.indices);const z=O.attributes;return r.position||delete z.position,new l.Geometry({attributes:z,indices:O.indices,primitiveType:O.primitiveType,boundingSphere:T})},function(e,t){return s.defined(t)&&(e=Q.unpack(e,t)),Q.createGeometry(e)}}));
