import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = 'https://gate-ai-backend-production.up.railway.app';

export default function Contact() {
  const navigate = useNavigate();
  const globeCanvasRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const goAuth = (e) => { e.preventDefault(); navigate('/auth'); };
  const goPage = (e, path) => { e.preventDefault(); navigate(path); };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company || !form.phone || !form.message) return;
    setStatus('sending');
    try {
      const res = await fetch(`${BACKEND}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', company: '', phone: '', message: '' });
      } else {
        throw new Error('Failed');
      }
    } catch {
      // Fallback: open mailto
      const body = `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\nPhone: ${form.phone}\n\nMessage:\n${form.message}`;
      window.location.href = `mailto:hello@gate-ai.io?subject=Contact from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(body)}`;
      setStatus('idle');
    }
  };

  // Globe animation
  useEffect(() => {
    const cv = globeCanvasRef.current;
    if (!cv) return;
    let animId, renderer, scene, camera;
    let meteors = [], bursts = [], activePulses = [], globeHits = [];
    let frame = 0, spawnTimer = 0;
    let ambPos, ambVel = [], ambGeo;
    const MAX_HITS = 5;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => initGlobe();
    document.head.appendChild(script);

    function initGlobe() {
      const THREE = window.THREE;
      const W = cv.parentElement.offsetWidth;
      const H = cv.parentElement.offsetHeight;

      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.setClearColor(0x08090d, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 500);
      camera.position.set(0, 0, 5.8);

      const handleResize = () => {
        const w = cv.parentElement.offsetWidth;
        const h = cv.parentElement.offsetHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // Lighting
      scene.add(new THREE.AmbientLight(0x2030a0, 0.5));
      const pl1 = new THREE.PointLight(0x6c5ce7, 1.8, 20); pl1.position.set(-4, 3, 3); scene.add(pl1);
      const pl2 = new THREE.PointLight(0x2060d0, 1.4, 20); pl2.position.set(4, -2, 2); scene.add(pl2);

      // Stars
      const SC = 1800;
      const sPos = new Float32Array(SC*3), sSz = new Float32Array(SC), sPh = new Float32Array(SC), sSp = new Float32Array(SC);
      for (let i = 0; i < SC; i++) {
        const phi = Math.acos(2*Math.random()-1), th = Math.random()*Math.PI*2, r = 65+Math.random()*80;
        sPos[i*3]=r*Math.sin(phi)*Math.cos(th); sPos[i*3+1]=r*Math.cos(phi); sPos[i*3+2]=r*Math.sin(phi)*Math.sin(th);
        sSz[i]=2.5+Math.random()*4.5; sPh[i]=Math.random()*Math.PI*2; sSp[i]=0.5+Math.random()*2.2;
      }
      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
      sGeo.setAttribute('size', new THREE.BufferAttribute(sSz, 1));
      sGeo.setAttribute('phase', new THREE.BufferAttribute(sPh, 1));
      sGeo.setAttribute('spd', new THREE.BufferAttribute(sSp, 1));
      const sMat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, uniforms:{time:{value:0}},
        vertexShader:`attribute float size;attribute float phase;attribute float spd;uniform float time;varying float vA;void main(){float tw=0.2+0.8*abs(sin(time*spd+phase));vA=tw;gl_PointSize=size*tw;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.05,d);float cr=max(smoothstep(0.09,0.0,abs(gl_PointCoord.x-0.5)),smoothstep(0.09,0.0,abs(gl_PointCoord.y-0.5)))*0.5;gl_FragColor=vec4(1.,1.,1.,(a+cr*vA)*vA);}`
      });
      scene.add(new THREE.Points(sGeo, sMat));

      // Globe
      const GLOBE_R = 1.6, FF_R = GLOBE_R + 0.52, BLOCK_DIST = FF_R + 0.12;
      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = THREE.MathUtils.degToRad(23);
      scene.add(globeGroup);

      // Cell glow shader on globe
      const globeGlowMat = new THREE.ShaderMaterial({
        uniforms:{
          hitPos:   { value: Array.from({length:MAX_HITS}, ()=>new THREE.Vector3()) },
          hitTimes: { value: new Array(MAX_HITS).fill(0.0) },
          hitCount: { value: 0 },
        },
        vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`
          #define MAX_HITS 5
          #define PI 3.14159265
          uniform vec3  hitPos[MAX_HITS];
          uniform float hitTimes[MAX_HITS];
          uniform float hitCount;
          varying vec3 vPos;
          void main(){
            vec3 n=normalize(vPos);
            float phi=acos(clamp(n.y,-1.0,1.0));
            float theta=atan(n.z,n.x);
            float cPhi=PI/10.0;float cTheta=2.0*PI/12.0;
            float ci=floor(phi/cPhi)+0.5;float cj=floor((theta+PI)/cTheta)+0.5;
            float cphi=ci*cPhi;float ctheta=cj*cTheta-PI;
            vec3 cell=vec3(sin(cphi)*cos(ctheta),cos(cphi),sin(cphi)*sin(ctheta));
            float rim=1.0-abs(dot(n,vec3(0,0,1)));
            vec3 base=vec3(0.047,0.043,0.148)+vec3(0.12,0.10,0.45)*pow(rim,2.5)*0.35;
            float glow=0.0;
            for(int i=0;i<MAX_HITS;i++){
              if(float(i)>=hitCount)break;
              float ht=hitTimes[i];if(ht<=0.0||ht>=1.0)continue;
              float ang=acos(clamp(dot(cell,normalize(hitPos[i])),-1.0,1.0));
              float radius=ht*1.2;float width=0.22;
              float ring=smoothstep(radius+width,radius,ang)*smoothstep(radius-width,radius,ang);
              float core=smoothstep(0.35,0.0,ang)*(1.0-ht)*1.5;
              glow+=max(ring,core)*pow(1.0-ht,1.2);
            }
            glow=clamp(glow,0.0,1.0);
            float eu=fract(phi/cPhi);float ev=fract((theta+PI)/cTheta);
            float edgeDist=min(min(eu,1.0-eu),min(ev,1.0-ev))*2.0;
            float cellEdge=smoothstep(0.0,0.22,edgeDist);
            vec3 col=mix(base,vec3(0.0,0.95,0.42)*1.2,glow*cellEdge*0.85);
            gl_FragColor=vec4(col,1.0);
          }`
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R, 64, 64), globeGlowMat);
      globeGroup.add(globe);

      // Grid lines
      const lm = new THREE.LineBasicMaterial({ color:0x3344aa, transparent:true, opacity:0.10 });
      const gridG = new THREE.Group();
      for (let i=1;i<10;i++) {
        const phi=(i/10)*Math.PI,r2=GLOBE_R*Math.sin(phi),y2=GLOBE_R*Math.cos(phi),pts=[];
        for(let j=0;j<=60;j++){const a=(j/60)*Math.PI*2;pts.push(new THREE.Vector3(r2*Math.cos(a),y2,r2*Math.sin(a)));}
        gridG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm));
      }
      for (let i=0;i<12;i++) {
        const th=(i/12)*Math.PI*2,pts=[];
        for(let j=0;j<=60;j++){const ph=(j/60)*Math.PI;pts.push(new THREE.Vector3(GLOBE_R*Math.sin(ph)*Math.cos(th),GLOBE_R*Math.cos(ph),GLOBE_R*Math.sin(ph)*Math.sin(th)));}
        gridG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm));
      }
      globe.add(gridG);

      // Axis line
      const axisPts = [new THREE.Vector3(0,GLOBE_R*1.08,0), new THREE.Vector3(0,-GLOBE_R*1.08,0)];
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisPts), new THREE.LineBasicMaterial({color:0x8888cc,transparent:true,opacity:0.30})));

      // Ambient particles
      const AMBIENT_COUNT = 180;
      ambPos = new Float32Array(AMBIENT_COUNT*3);
      const ambPhase = new Float32Array(AMBIENT_COUNT);
      for(let i=0;i<AMBIENT_COUNT;i++){
        const r=GLOBE_R+0.08+Math.random()*(FF_R-GLOBE_R-0.16);
        const phi=Math.acos(2*Math.random()-1),th=Math.random()*Math.PI*2;
        ambPos[i*3]=r*Math.sin(phi)*Math.cos(th); ambPos[i*3+1]=r*Math.cos(phi); ambPos[i*3+2]=r*Math.sin(phi)*Math.sin(th);
        ambVel.push(new THREE.Vector3((Math.random()-.5)*0.0018,(Math.random()-.5)*0.0018,(Math.random()-.5)*0.0018));
        ambPhase[i]=Math.random()*Math.PI*2;
      }
      ambGeo = new THREE.BufferGeometry();
      ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
      ambGeo.setAttribute('phase', new THREE.BufferAttribute(ambPhase, 1));
      const ambMat = new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,uniforms:{time:{value:0}},
        vertexShader:`attribute float phase;uniform float time;varying float vA;void main(){float tw=0.3+0.7*abs(sin(time*0.8+phase));vA=tw;gl_PointSize=1.8*tw;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.1,d);gl_FragColor=vec4(0.55,0.50,1.0,a*vA*0.55);}`
      });
      scene.add(new THREE.Points(ambGeo, ambMat));

      // Force field
      const MP = 10;
      const ffU = {
        time:{value:0}, breath:{value:0}, camPos:{value:camera.position},
        baseColor:{value:new THREE.Color(0x5548d0)},
        pulsePos:{value:Array.from({length:MP},()=>new THREE.Vector3())},
        pulseTimes:{value:new Array(MP).fill(0)},
        pulseColors:{value:Array.from({length:MP},()=>new THREE.Color(0xff4d6d))},
        pulseCount:{value:0},
      };
      const ffMat = new THREE.ShaderMaterial({
        transparent:true, side:THREE.FrontSide, depthWrite:false, uniforms:ffU,
        vertexShader:`varying vec3 vN,vPos,vWP;varying vec2 vUv;void main(){vN=normalize(normalMatrix*normal);vPos=position;vUv=uv;vWP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`#define MP 10
          uniform float time,breath;uniform vec3 baseColor,camPos;
          uniform vec3 pulsePos[MP];uniform float pulseTimes[MP];uniform vec3 pulseColors[MP];uniform float pulseCount;
          varying vec3 vN,vPos,vWP;varying vec2 vUv;
          void main(){
            vec3 n=normalize(vN);vec3 viewDir=normalize(camPos-vWP);
            float fr=pow(1.0-max(0.0,dot(n,viewDir)),3.0);
            vec2 p=vUv*22.;vec2 h=vec2(p.x+p.y*0.5,p.y*0.866);vec2 fh=fract(h)-0.5;
            float hexDist=max(abs(fh.x),abs(fh.x*0.5+fh.y*0.866));float hex=smoothstep(0.44,0.47,hexDist)*0.07;
            float b1=pow(sin(vUv.y*26.+time*2.0)*0.5+0.5,3.)*0.09;float b2=pow(sin(vUv.x*18.-time*1.4)*0.5+0.5,3.)*0.07;
            float arc=pow(sin(vUv.x*30.+vUv.y*14.+time*1.6)*0.5+0.5,7.)*0.10;
            float breathe=0.80+0.20*breath;
            vec3 col=baseColor*(fr*1.2+hex+b1+b2+arc)*breathe;col+=baseColor*pow(fr,1.5)*0.5*breathe;
            float pA=0.;vec3 pC=vec3(0.);
            for(int i=0;i<MP;i++){if(float(i)>=pulseCount)break;float pt=pulseTimes[i];if(pt<=0.||pt>=1.)continue;float dist=acos(clamp(dot(normalize(vPos),normalize(pulsePos[i])),-1.,1.));float maxR=0.42;float ring=smoothstep(pt*maxR+0.028,pt*maxR,dist)*smoothstep(pt*maxR-0.09,pt*maxR,dist);float pa=ring*pow(1.-pt,1.5)*3.5;pA+=pa;pC+=pulseColors[i]*pa;}
            float alpha=(fr*0.88+hex*0.8+(b1+b2)*0.7+arc*0.6)*breathe+pA*0.92;
            if(pA>0.)col=mix(col,pC/pA,clamp(pA,0.,1.));gl_FragColor=vec4(col,clamp(alpha,0.,0.90));
          }`
      });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(FF_R,80,80), ffMat));

      let pulseSlot = 0;
      function addPulse(hitPoint, color) {
        const idx = pulseSlot % MP; pulseSlot++;
        ffU.pulsePos.value[idx].copy(hitPoint.clone().normalize());
        ffU.pulseTimes.value[idx] = 0.001;
        ffU.pulseColors.value[idx].set(color);
        ffU.pulseCount.value = Math.min(pulseSlot, MP);
        const ex = activePulses.findIndex(p => p.idx === idx);
        if (ex >= 0) activePulses.splice(ex, 1);
        activePulses.push({ idx, t: 0 });
      }

      function createBurst(surfacePos, colHex) {
        const count=9, geo=new THREE.BufferGeometry(), arr=new Float32Array(count*3);
        for(let i=0;i<count*3;i+=3){arr[i]=surfacePos.x;arr[i+1]=surfacePos.y;arr[i+2]=surfacePos.z;}
        geo.setAttribute('position', new THREE.BufferAttribute(arr,3));
        const mat = new THREE.PointsMaterial({color:new THREE.Color(colHex),size:0.020,transparent:true,opacity:1.0,depthWrite:false});
        const pts = new THREE.Points(geo,mat); scene.add(pts);
        const normal=surfacePos.clone().normalize(), vels=[];
        for(let i=0;i<count;i++){
          const rand=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5);
          const tang=rand.sub(normal.clone().multiplyScalar(rand.dot(normal))).normalize();
          tang.multiplyScalar(0.007+Math.random()*0.010); vels.push(tang);
        }
        bursts.push({pts,vels,pa:geo.attributes.position,life:1.0});
      }

      function makePhoneTex(color) {
        const s=128,tc=document.createElement('canvas');tc.width=tc.height=s;
        const ctx=tc.getContext('2d'),c=s/2;
        const grd=ctx.createRadialGradient(c,c,8,c,c,c);grd.addColorStop(0,color+'40');grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd;ctx.beginPath();ctx.arc(c,c,c,0,Math.PI*2);ctx.fill();
        ctx.save();ctx.translate(c*0.92,c*1.08);ctx.fillStyle=color;
        const k=1.25;ctx.scale(k,k);
        ctx.beginPath();ctx.moveTo(-5.5,-10);ctx.bezierCurveTo(-9.5,-10,-9.5,-4,-7.5,-2);ctx.lineTo(-4.5,1);ctx.bezierCurveTo(-3,2.5,-3,4,-1.5,5.5);ctx.lineTo(2,9);ctx.bezierCurveTo(3.5,10.5,5,10.5,6.5,9);ctx.lineTo(9,6.5);ctx.bezierCurveTo(10.5,5,10,3.5,8.5,2);ctx.lineTo(5.5,-0.5);ctx.bezierCurveTo(4,-2,2.5,-2,1,-0.5);ctx.lineTo(-1,1.5);ctx.lineTo(-5,-3);ctx.lineTo(-3,-5);ctx.bezierCurveTo(-1.5,-6.5,-1.5,-8,-3,-9.5);ctx.lineTo(-5.5,-10);
        ctx.fill();ctx.restore();
        return new THREE.CanvasTexture(tc);
      }
      const texRed=makePhoneTex('#ff4d6d'), texGreen=makePhoneTex('#00f5a0');
      const SPRITE_SCALE=0.64;

      function rDir() {
        let v;
        do {
          const phi=Math.acos(2*Math.random()-1),th=Math.random()*Math.PI*2;
          v=new THREE.Vector3(Math.sin(phi)*Math.cos(th),Math.cos(phi),Math.sin(phi)*Math.sin(th));
        } while(Math.abs(v.z)>0.42||v.z<0);
        return v.normalize();
      }

      function spawnMeteor() {
        const isCold=Math.random()<0.70;
        const dir=rDir(),startPos=dir.clone().multiplyScalar(9+Math.random()*2.5);
        const speed=0.014+Math.random()*0.009;
        const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:isCold?texRed:texGreen,transparent:true,depthWrite:false,opacity:0.95}));
        sprite.scale.set(SPRITE_SCALE,SPRITE_SCALE,SPRITE_SCALE);
        sprite.position.copy(startPos); scene.add(sprite);
        const TRAIL=12,tPos=new Float32Array(TRAIL*3),tGeo=new THREE.BufferGeometry();
        tGeo.setAttribute('position',new THREE.BufferAttribute(tPos,3));
        const tLine=new THREE.Line(tGeo,new THREE.LineBasicMaterial({color:isCold?0xff4d6d:0x00f5a0,transparent:true,opacity:0,depthWrite:false}));
        scene.add(tLine);
        const hist=Array.from({length:TRAIL},()=>startPos.clone());
        meteors.push({sprite,tLine,tPos,hist,dir:dir.clone().negate().normalize(),speed,isCold,phase:'flying',alive:true});
      }

      function animate() {
        animId = requestAnimationFrame(animate); frame++;
        const t = frame * 0.01;
        ffU.time.value=t; ffU.breath.value=Math.sin(t*1.4)*0.5+0.5;
        ffU.camPos.value.copy(camera.position);
        sMat.uniforms.time.value=t; ambMat.uniforms.time.value=t;
        globe.rotation.y+=0.003;

        // Ambient
        for(let i=0;i<AMBIENT_COUNT;i++){
          let px=ambPos[i*3]+ambVel[i].x,py=ambPos[i*3+1]+ambVel[i].y,pz=ambPos[i*3+2]+ambVel[i].z;
          const r=Math.sqrt(px*px+py*py+pz*pz);
          if(r>FF_R-0.06||r<GLOBE_R+0.06){ambVel[i].negate();px+=ambVel[i].x*2;py+=ambVel[i].y*2;pz+=ambVel[i].z*2;}
          ambPos[i*3]=px;ambPos[i*3+1]=py;ambPos[i*3+2]=pz;
        }
        ambGeo.attributes.position.needsUpdate=true;

        // Globe cell glow decay
        for(let i=globeHits.length-1;i>=0;i--){
          globeHits[i].t+=0.016;
          globeGlowMat.uniforms.hitTimes.value[i]=globeHits[i].t;
          if(globeHits[i].t>=1.0){
            globeHits.splice(i,1);
            for(let j=0;j<MAX_HITS;j++){
              if(j<globeHits.length){globeGlowMat.uniforms.hitPos.value[j].copy(globeHits[j].pos);globeGlowMat.uniforms.hitTimes.value[j]=globeHits[j].t;}
              else{globeGlowMat.uniforms.hitTimes.value[j]=0;}
            }
            globeGlowMat.uniforms.hitCount.value=globeHits.length;
          }
        }

        // FF pulse decay
        for(let i=activePulses.length-1;i>=0;i--){
          activePulses[i].t+=0.013;ffU.pulseTimes.value[activePulses[i].idx]=activePulses[i].t;
          if(activePulses[i].t>=1.0){ffU.pulseTimes.value[activePulses[i].idx]=0;activePulses.splice(i,1);}
        }

        spawnTimer++;
        if(spawnTimer>=85+Math.floor(Math.random()*40)){spawnMeteor();spawnTimer=0;}

        for(let i=meteors.length-1;i>=0;i--){
          const m=meteors[i];if(!m.alive){meteors.splice(i,1);continue;}
          m.sprite.position.addScaledVector(m.dir,m.speed);
          const dist=m.sprite.position.length();
          if(m.phase==='flying'&&m.isCold&&dist<=BLOCK_DIST){
            const hit=m.sprite.position.clone().normalize().multiplyScalar(FF_R);
            addPulse(hit,0xff4d6d);createBurst(m.sprite.position.clone(),0xff4d6d);
            scene.remove(m.sprite);scene.remove(m.tLine);m.alive=false;continue;
          }
          if(m.phase==='flying'&&!m.isCold&&dist<=FF_R+0.05){
            const hit=m.sprite.position.clone().normalize().multiplyScalar(FF_R);
            addPulse(hit,0x00f5a0);createBurst(hit,0x00f5a0);
            m.sprite.material.color.set(0x00f5a0);m.tLine.material.color.set(0x00f5a0);m.phase='passing';
          }
          if(m.phase==='passing'){
            const fade=Math.min(1,dist/GLOBE_R);m.sprite.material.opacity=fade*0.9;
            if(!m.hitRecorded&&dist<=GLOBE_R+0.05){
              m.hitRecorded=true;
              const hitDir=m.sprite.position.clone().normalize().multiplyScalar(GLOBE_R);
              if(globeHits.length<MAX_HITS) globeHits.push({pos:hitDir,t:0.001});
              else{globeHits[MAX_HITS-1].pos.copy(hitDir);globeHits[MAX_HITS-1].t=0.001;}
              for(let j=0;j<MAX_HITS;j++){
                if(j<globeHits.length){globeGlowMat.uniforms.hitPos.value[j].copy(globeHits[j].pos);globeGlowMat.uniforms.hitTimes.value[j]=globeHits[j].t;}
              }
              globeGlowMat.uniforms.hitCount.value=globeHits.length;
            }
            if(dist<0.22){scene.remove(m.sprite);scene.remove(m.tLine);m.alive=false;continue;}
          }
          m.hist.unshift(m.sprite.position.clone());if(m.hist.length>12)m.hist.pop();
          for(let j=0;j<12;j++){const p=m.hist[Math.min(j,m.hist.length-1)];m.tPos[j*3]=p.x;m.tPos[j*3+1]=p.y;m.tPos[j*3+2]=p.z;}
          m.tLine.geometry.attributes.position.needsUpdate=true;
          m.tLine.material.opacity=Math.min(0.35,(9-dist)/5);
          if(dist>13){scene.remove(m.sprite);scene.remove(m.tLine);m.alive=false;}
        }

        for(let i=bursts.length-1;i>=0;i--){
          const b=bursts[i];b.life-=0.12;b.pts.material.opacity=b.life;
          for(let j=0;j<b.vels.length;j++){b.pa.array[j*3]+=b.vels[j].x;b.pa.array[j*3+1]+=b.vels[j].y;b.pa.array[j*3+2]+=b.vels[j].z;b.vels[j].multiplyScalar(0.82);}
          b.pa.needsUpdate=true;if(b.life<=0){scene.remove(b.pts);bursts.splice(i,1);}
        }

        camera.position.x=Math.sin(t*0.07)*0.35;
        camera.position.y=Math.cos(t*0.045)*0.2;
        camera.lookAt(0,0,0);
        renderer.render(scene,camera);
      }

      for(let i=0;i<3;i++) setTimeout(spawnMeteor,i*700);
      animate();
    }

    return () => {
      cancelAnimationFrame(animId);
      if (renderer) renderer.dispose();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo" onClick={e => goPage(e, '/')} style={{ gap: 12 }}>
            <NavLogo />
            <span style={{ fontFamily: "Inter,'DM Sans',sans-serif", fontWeight: 600, letterSpacing: '-0.3px' }}>
              Gate<span style={{ color: 'var(--accent-2)', fontWeight: 500 }}> AI</span>
            </span>
          </a>
          <ul className="nav-links">
            <li><a href="/capabilities" onClick={e => goPage(e, '/capabilities')}>Capabilities</a></li>
            <li><a href="/pricing" onClick={e => goPage(e, '/pricing')}>Pricing</a></li>
            <li><a href="/integrations" onClick={e => goPage(e, '/integrations')}>Integrations</a></li>
            <li><a href="/faq" onClick={e => goPage(e, '/faq')}>FAQ</a></li>
            <li><a href="/contact" onClick={e => goPage(e, '/contact')}>Contact</a></li>
          </ul>
          <div className="nav-cta">
            <a href="/auth" onClick={goAuth} className="btn btn-ghost nav-btn">Sign Up / Sign In</a>
            <a href="/book-demo" onClick={e => goPage(e, '/book-demo')} className="btn btn-primary nav-btn">Book Demo</a>
          </div>
        </div>
      </nav>

      {/* CONTACT */}
      <section className="contact-section">
        <div className="container contact-inner">

          {/* LEFT — form + contact info */}
          <div className="contact-left">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Get in touch</div>
            <h1 className="contact-title">Talk to us</h1>
            <p className="contact-sub">
              Have a question about Gate AI, need a custom plan, or want to explore how call screening fits your business? We're here.
            </p>

            {/* Contact info */}
            <div className="contact-info">
              <a href="tel:+18337142521" className="contact-info-item">
                <div className="cii-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="cii-text">
                  <span className="cii-label">Call us</span>
                  <span className="cii-value">+1 (833) 714-2521</span>
                </div>
              </a>
              <a href="mailto:hello@gate-ai.io" className="contact-info-item">
                <div className="cii-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="cii-text">
                  <span className="cii-label">Email us</span>
                  <span className="cii-value">hello@gate-ai.io</span>
                </div>
              </a>
            </div>

            {/* Form */}
            {status === 'success' ? (
              <div className="contact-success">
                <div className="success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3>Message sent!</h3>
                <p>We'll get back to you at <strong>{form.email || 'your email'}</strong> within 24 hours.</p>
                <button className="btn btn-ghost" onClick={() => setStatus('idle')}>Send another message</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full name <span className="required">*</span></label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
                  </div>
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@yourcompany.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Company <span className="required">*</span></label>
                    <input name="company" value={form.company} onChange={handleChange} placeholder="Your company name" required />
                  </div>
                  <div className="form-group">
                    <label>Phone <span className="required">*</span></label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Message <span className="required">*</span></label>
                  <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your business and what you're looking for..." rows={5} required />
                </div>
                <button type="submit" className="btn btn-primary contact-submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send message →'}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT — globe */}
          <div className="contact-right">
            <canvas ref={globeCanvasRef} className="contact-globe-canvas" />
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container footer-inner">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <NavLogo />
            <span style={{ fontFamily:"Inter,'DM Sans',sans-serif", fontWeight:600, letterSpacing:'-0.3px', fontSize:15 }}>
              Gate<span style={{ color:'var(--accent-2)', fontWeight:500 }}> AI</span>
            </span>
          </div>
          <ul className="footer-links">
            <li><a href="/capabilities" onClick={e => goPage(e,'/capabilities')}>Capabilities</a></li>
            <li><a href="/pricing" onClick={e => goPage(e,'/pricing')}>Pricing</a></li>
            <li><a href="/faq" onClick={e => goPage(e,'/faq')}>FAQ</a></li>
            <li><a href="/contact" onClick={e => goPage(e,'/contact')}>Contact</a></li>
            <li><a href="mailto:hello@gate-ai.io">hello@gate-ai.io</a></li>
          </ul>
          <span className="footer-copy">© {new Date().getFullYear()} Gate AI. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}

function NavLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ngC" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="ngM">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#ngC)" mask="url(#ngM)"/>
    </svg>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Inter:wght@500;600;700&display=swap');
:root{
  --bg:#08090d;--bg-2:#0d0e14;--bg-3:#13141b;--bg-4:#1a1c26;
  --border:#1f2130;--border-2:#2a2d40;
  --text:#f0f1f5;--text-2:#9da1b5;--text-3:#5c6078;
  --accent:#6c5ce7;--accent-2:#a29bfe;--accent-glow:rgba(108,92,231,0.35);
  --green:#00d68f;--red:#ff6b6b;
  --radius:14px;--radius-lg:20px;
  --font:'DM Sans',-apple-system,system-ui,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.5;overflow-x:hidden;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;border:none;cursor:pointer;}
.container{max-width:1240px;margin:0 auto;padding:0 32px;}
@media(max-width:720px){.container{padding:0 20px;}}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 32px;backdrop-filter:blur(16px);background:rgba(8,9,13,0.72);border-bottom:1px solid rgba(31,33,48,0.6);}
.nav-inner{max-width:1240px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;}
.logo{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;letter-spacing:-0.3px;}
.nav-links{display:flex;gap:28px;list-style:none;}
.nav-links a{font-size:14px;color:var(--text-2);font-weight:500;transition:color 180ms ease;}
.nav-links a:hover{color:var(--text);}
.nav-cta{display:flex;gap:10px;align-items:center;}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:100px;font-size:14px;font-weight:600;transition:all 200ms ease;white-space:nowrap;cursor:pointer;}
.btn-primary{background:var(--text);color:var(--bg);border:none;}
.btn-primary:hover{background:white;transform:translateY(-1px);box-shadow:0 10px 30px rgba(255,255,255,0.15);}
.btn-primary:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border-2);}
.btn-ghost:hover{background:var(--bg-3);border-color:var(--text-3);}
.nav-btn{padding:10px 20px;font-size:13px;}
@media(max-width:820px){.nav-links{display:none;}.nav{padding:16px 20px;}}
@media(max-width:480px){.nav{padding:12px 16px;}.logo{font-size:15px;gap:7px;white-space:nowrap;}.nav-cta{gap:6px;}.nav-btn{padding:8px 12px;font-size:12px;}}

/* EYEBROW */
.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--accent-2);text-transform:uppercase;letter-spacing:1.5px;padding:7px 14px;background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.25);border-radius:100px;margin-bottom:24px;}
.eyebrow-dot{width:5px;height:5px;min-width:5px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 10px var(--accent-2);animation:edot 2s ease infinite;}
@keyframes edot{0%,100%{box-shadow:0 0 6px var(--accent-2);}50%{box-shadow:0 0 14px var(--accent-2),0 0 22px rgba(162,155,254,0.4);}}

/* CONTACT SECTION */
.contact-section{min-height:100vh;padding:120px 0 80px;position:relative;}
.contact-inner{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;min-height:calc(100vh - 200px);}
@media(max-width:1000px){.contact-inner{grid-template-columns:1fr;gap:48px;}}

/* LEFT */
.contact-left{position:relative;z-index:1;}
.contact-title{font-size:clamp(36px,4.5vw,62px);font-weight:800;letter-spacing:-0.04em;line-height:1.0;margin-bottom:16px;}
.contact-sub{font-size:16px;color:var(--text-2);line-height:1.65;margin-bottom:36px;max-width:460px;}

/* Contact info pills */
.contact-info{display:flex;flex-direction:column;gap:12px;margin-bottom:36px;}
.contact-info-item{display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);transition:all 200ms ease;cursor:pointer;}
.contact-info-item:hover{border-color:var(--accent);background:var(--bg-3);}
.cii-icon{width:36px;height:36px;border-radius:10px;background:rgba(108,92,231,0.12);border:1px solid rgba(108,92,231,0.2);display:flex;align-items:center;justify-content:center;color:var(--accent-2);flex-shrink:0;}
.cii-text{display:flex;flex-direction:column;gap:2px;}
.cii-label{font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.8px;}
.cii-value{font-size:14px;font-weight:600;color:var(--text);}

/* Form */
.contact-form{display:flex;flex-direction:column;gap:16px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:600px){.form-row{grid-template-columns:1fr;}}
.form-group{display:flex;flex-direction:column;gap:6px;}
.form-group label{font-size:13px;font-weight:600;color:var(--text-2);}
.required{color:var(--accent-2);}
.form-group input,
.form-group textarea{background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);font-family:var(--font);outline:none;resize:vertical;transition:border 180ms ease;}
.form-group input::placeholder,
.form-group textarea::placeholder{color:var(--text-3);}
.form-group input:focus,
.form-group textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(108,92,231,0.12);}
.contact-submit{align-self:flex-start;margin-top:4px;}

/* Success state */
.contact-success{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:32px;background:rgba(0,214,143,0.06);border:1px solid rgba(0,214,143,0.2);border-radius:var(--radius-lg);}
.success-icon{width:52px;height:52px;border-radius:50%;background:rgba(0,214,143,0.12);display:flex;align-items:center;justify-content:center;}
.contact-success h3{font-size:20px;font-weight:700;color:var(--green);}
.contact-success p{font-size:14px;color:var(--text-2);line-height:1.6;}

/* RIGHT — globe */
.contact-right{position:relative;height:600px;border-radius:24px;overflow:hidden;background:rgba(8,9,13,0.4);border:1px solid var(--border);}
.contact-globe-canvas{position:absolute;inset:0;width:100%;height:100%;}
@media(max-width:1000px){.contact-right{height:400px;}}
@media(max-width:720px){.contact-right{height:320px;}}

/* FOOTER */
footer{padding:48px 0 40px;border-top:1px solid var(--border);}
.footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;}
.footer-links{display:flex;gap:24px;list-style:none;flex-wrap:wrap;}
.footer-links a{font-size:13px;color:var(--text-3);transition:color 180ms ease;}
.footer-links a:hover{color:var(--text);}
.footer-copy{font-size:13px;color:var(--text-3);}
`;
