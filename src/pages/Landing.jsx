import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const timersRef = useRef([]);
  const globeCanvasRef = useRef(null);

  useEffect(() => {
    // Scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Stat counter
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.target, 10);
        if (!target) { statIO.unobserve(el); return; }
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const tick = () => {
          cur += step; if (cur >= target) cur = target;
          if (el.dataset.target === '24') el.innerHTML = cur + '<span style="font-size:0.5em;color:var(--text-3)">/7</span>';
          else if (el.dataset.target === '12') el.innerHTML = cur + '<span style="font-size:0.5em;color:var(--text-3)">hrs/wk</span>';
          else el.innerHTML = cur + '%';
          if (cur < target) requestAnimationFrame(tick);
        };
        tick(); statIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat-num[data-target]').forEach(el => statIO.observe(el));

    // Chat animation
    startChatSequence(timersRef.current);

    return () => {
      io.disconnect(); statIO.disconnect();
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // ── GLOBE BACKGROUND ──────────────────────────────────────────────────
  useEffect(() => {
    const cv = globeCanvasRef.current;
    if (!cv) return;
    let animId, renderer, scene, camera;
    let meteors = [], bursts = [], activePulses = [], flashes = [];
    let blockedCount = 0, forwardedCount = 0;
    let frame = 0, spawnTimer = 0;
    let ambPos, ambVel = [], ambGeo;

    // Load Three.js from CDN then init
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
      renderer.setClearColor(0x08090d, 0); // transparent so page bg shows

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 500);
      const isMobile = W < 720;
      const isLandscapeMobile = H < 500 && W > H;
      const camZ = isLandscapeMobile ? 8.5 : isMobile ? 10.5 : 6.3;
      const camX = isLandscapeMobile ? -2.0 : isMobile ? 0 : -2.2;
      camera.position.set(camX, 0, camZ);

      const handleResize = () => {
        const w = cv.parentElement.offsetWidth;
        const h = cv.parentElement.offsetHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        const mob = w < 720;
        const land = h < 500 && w > h;
        camera.position.z = land ? 8.5 : mob ? 10.5 : 6.3;
        camera.position.x = land ? -2.0 : mob ? 0 : -2.2;
      };
      window.addEventListener('resize', handleResize);

      // Lighting
      scene.add(new THREE.AmbientLight(0x2030a0, 0.5));
      const pl1 = new THREE.PointLight(0x6c5ce7, 1.8, 20); pl1.position.set(-4, 3, 3); scene.add(pl1);
      const pl2 = new THREE.PointLight(0x2060d0, 1.4, 20); pl2.position.set(4, -2, 2); scene.add(pl2);

      // Stars
      const SC = 2400;
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
      const GLOBE_R = 1.2, FF_R = GLOBE_R + 0.45, BLOCK_DIST = FF_R + 0.12;
      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = THREE.MathUtils.degToRad(23);
      globeGroup.position.set(0, 0, 0); // origin — force field and globe stay aligned
      scene.add(globeGroup);
      // Globe — cell glow shader material
      const MAX_HITS = 5;
      const globeHits = [];
      const globeGlowMat = new THREE.ShaderMaterial({
        uniforms:{
          hitPos:   { value: Array.from({length:5}, ()=>new THREE.Vector3()) },
          hitTimes: { value: new Array(5).fill(0.0) },
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
            float cPhi=PI/10.0; float cTheta=2.0*PI/12.0;
            float ci=floor(phi/cPhi)+0.5; float cj=floor((theta+PI)/cTheta)+0.5;
            float cphi=ci*cPhi; float ctheta=cj*cTheta-PI;
            vec3 cell=vec3(sin(cphi)*cos(ctheta),cos(cphi),sin(cphi)*sin(ctheta));
            float rim=1.0-abs(dot(n,vec3(0,0,1)));
            vec3 base=vec3(0.047,0.043,0.148)+vec3(0.12,0.10,0.45)*pow(rim,2.5)*0.35;
            float glow=0.0;
            for(int i=0;i<MAX_HITS;i++){
              if(float(i)>=hitCount) break;
              float ht=hitTimes[i]; if(ht<=0.0||ht>=1.0) continue;
              float ang=acos(clamp(dot(cell,normalize(hitPos[i])),-1.0,1.0));
              float radius=ht*1.2; float width=0.22;
              float ring=smoothstep(radius+width,radius,ang)*smoothstep(radius-width,radius,ang);
              float core=smoothstep(0.35,0.0,ang)*(1.0-ht)*1.5;
              glow+=max(ring,core)*pow(1.0-ht,1.2);
            }
            glow=clamp(glow,0.0,1.0);
            float eu=fract(phi/cPhi); float ev=fract((theta+PI)/cTheta);
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
      [GLOBE_R*1.08,-GLOBE_R*1.08].forEach(y => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8), new THREE.MeshBasicMaterial({color:0xaaaaee,transparent:true,opacity:0.45}));
        dot.position.set(0,y,0); globe.add(dot);
      });

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

      // Mini burst
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

      // Phone textures
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

      // Animate
      function animate() {
        animId = requestAnimationFrame(animate); frame++;
        const t = frame * 0.01;
        ffU.time.value=t; ffU.breath.value=Math.sin(t*1.4)*0.5+0.5;
        ffU.camPos.value.copy(camera.position); // keep fresnel accurate as camera drifts
        sMat.uniforms.time.value=t; ambMat.uniforms.time.value=t;
        globe.rotation.y+=0.003;

        // Ambient particles
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

        // Force field pulse decay
        for(let i=activePulses.length-1;i>=0;i--){
          activePulses[i].t+=0.013;ffU.pulseTimes.value[activePulses[i].idx]=activePulses[i].t;
          if(activePulses[i].t>=1.0){ffU.pulseTimes.value[activePulses[i].idx]=0;activePulses.splice(i,1);}
        }

        spawnTimer++;
        if(spawnTimer>=85+Math.floor(Math.random()*40)){spawnMeteor();spawnTimer=0;}

        // Meteors
        for(let i=meteors.length-1;i>=0;i--){
          const m=meteors[i];if(!m.alive){meteors.splice(i,1);continue;}
          m.sprite.position.addScaledVector(m.dir,m.speed);
          const dist=m.sprite.position.length();
          if(m.phase==='flying'&&m.isCold&&dist<=BLOCK_DIST){
            const hit=m.sprite.position.clone().normalize().multiplyScalar(FF_R);
            const burstAt=m.sprite.position.clone();
            addPulse(hit,0xff4d6d);createBurst(burstAt,0xff4d6d);
            scene.remove(m.sprite);scene.remove(m.tLine);
            m.alive=false;blockedCount++;
            const bc=document.getElementById('globe-bc'); if(bc) bc.textContent=blockedCount;
            continue;
          }
          if(m.phase==='flying'&&!m.isCold&&dist<=FF_R+0.05){
            const hit=m.sprite.position.clone().normalize().multiplyScalar(FF_R);
            addPulse(hit,0x00f5a0);createBurst(hit,0x00f5a0);
            m.sprite.material.color.set(0x00f5a0);m.tLine.material.color.set(0x00f5a0);m.phase='passing';
          }
          if(m.phase==='passing'){
            const fade=Math.min(1,dist/GLOBE_R);m.sprite.material.opacity=fade*0.9;
            if(!m.hitRecorded && dist<=GLOBE_R+0.05){
              m.hitRecorded=true;
              const hitDir=m.sprite.position.clone().normalize().multiplyScalar(GLOBE_R);
              if(globeHits.length<MAX_HITS) globeHits.push({pos:hitDir,t:0.001});
              else{globeHits[MAX_HITS-1].pos.copy(hitDir);globeHits[MAX_HITS-1].t=0.001;}
              for(let j=0;j<MAX_HITS;j++){
                if(j<globeHits.length){globeGlowMat.uniforms.hitPos.value[j].copy(globeHits[j].pos);globeGlowMat.uniforms.hitTimes.value[j]=globeHits[j].t;}
              }
              globeGlowMat.uniforms.hitCount.value=globeHits.length;
            }
            if(dist<0.22){
              scene.remove(m.sprite);scene.remove(m.tLine);m.alive=false;forwardedCount++;
              const fc=document.getElementById('globe-fc'); if(fc) fc.textContent=forwardedCount;
              continue;
            }
          }
          m.hist.unshift(m.sprite.position.clone());if(m.hist.length>12)m.hist.pop();
          for(let j=0;j<12;j++){const p=m.hist[Math.min(j,m.hist.length-1)];m.tPos[j*3]=p.x;m.tPos[j*3+1]=p.y;m.tPos[j*3+2]=p.z;}
          m.tLine.geometry.attributes.position.needsUpdate=true;
          m.tLine.material.opacity=Math.min(0.35,(9-dist)/5);
          if(dist>13){scene.remove(m.sprite);scene.remove(m.tLine);m.alive=false;}
        }

        // Bursts
        for(let i=bursts.length-1;i>=0;i--){
          const b=bursts[i];b.life-=0.12;b.pts.material.opacity=b.life;
          for(let j=0;j<b.vels.length;j++){b.pa.array[j*3]+=b.vels[j].x;b.pa.array[j*3+1]+=b.vels[j].y;b.pa.array[j*3+2]+=b.vels[j].z;b.vels[j].multiplyScalar(0.82);}
          b.pa.needsUpdate=true;if(b.life<=0){scene.remove(b.pts);bursts.splice(i,1);}
        }

        camera.position.x = camX + Math.sin(t*0.07)*0.35;
        camera.position.y = Math.cos(t*0.045)*0.2;
        camera.position.z = camZ;
        camera.lookAt(0, 0, 0);
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

  const goAuth   = (e, plan) => { e.preventDefault(); navigate(plan ? `/auth?plan=${plan}` : '/auth'); };
  const goDemo   = (e) => { e.preventDefault(); navigate('/book-demo'); };
  const goPage   = (e, path) => { e.preventDefault(); navigate(path); };

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo" style={{ gap: 12 }}>
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
            <a href="/auth" onClick={e => goAuth(e)} className="btn btn-ghost nav-btn">Sign Up / Sign In</a>
            <a href="/book-demo" onClick={goDemo} className="btn btn-primary nav-btn">Book Demo</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── two-column layout */}
      <section className="hero">
        {/* Globe background canvas */}
        <canvas ref={globeCanvasRef} className="hero-globe-canvas" />
        {/* Globe counter — centred under the globe (right half of hero) */}
        <div className="hero-globe-counter">
          <div className="hgc-item"><span className="hgc-dot hgc-red"></span>Blocked <strong id="globe-bc">0</strong></div>
          <div className="hgc-item"><span className="hgc-dot hgc-green"></span>Forwarded <strong id="globe-fc">0</strong></div>
        </div>
        <div className="container hero-inner">
          {/* Left */}
          <div className="hero-left">
            <div className="eyebrow"><span className="eyebrow-dot"></span>AI Call Screening · Built for SMBs</div>
            <h1 className="h-display">
              Block the noise.<br />
              Forward what<br />
              <span className="accent">matters.</span>
            </h1>
            <p className="hero-lede">
              Gate AI answers every incoming call,<br />
              detects cold sales pitches in seconds,<br />
              and routes legitimate calls to the right person —<br />
              with a full AI briefing before the phone even rings.
            </p>
            <div className="hero-ctas">
              <a href="/book-demo" onClick={goDemo} className="btn btn-primary">Book a Demo →</a>
              <a href="#capabilities" className="btn btn-ghost">See how it works</a>
            </div>
          </div>

          {/* Right — animated chat widget */}
          <div className="hero-right">
            <div className="phone-shell">
              <div className="phone-frame">
                {/* Mac bar */}
                <div className="pf-top">
                  <div className="mac-dot mac-r"></div>
                  <div className="mac-dot mac-y"></div>
                  <div className="mac-dot mac-g"></div>
                  <div className="pf-bar-right">
                    <ShieldLogo size={13} id="bar" />
                    <span className="pf-label"><b>Gate AI</b> · screening call</span>
                  </div>
                </div>

                <div className="pf-body">
                  {/* Phase 1: ringing */}
                  <div className="ph ph-ring" id="ph-ring">
                    <div className="ring-bg"></div>
                    <div className="ring-content">
                      <div className="ring-wrap">
                        <div className="rp"></div><div className="rp"></div><div className="rp"></div>
                        <div className="ring-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#08090d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                        </div>
                      </div>
                      <span className="ring-lbl">Incoming call · screening...</span>
                    </div>
                  </div>

                  {/* Phase 2: answered */}
                  <div className="ph ph-done" id="ph-done">
                    <div className="done-circle" id="done-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span className="done-lbl" id="done-lbl">Gate AI answered</span>
                  </div>

                  {/* Phase 3: chat */}
                  <div className="ph ph-chat" id="ph-chat">
                    <div className="chat-tabs">
                      <button className="c-tab active" id="tab-b" onClick={() => window.switchChatTab('blocked')}>Blocked call</button>
                      <button className="c-tab" id="tab-f" onClick={() => window.switchChatTab('forwarded')}>Forwarded call</button>
                    </div>
                    <div className="chat-hdr">
                      <div className="hdr-pill">
                        <ShieldLogo size={12} id="hdr" />
                        <span className="hdr-live"></span>
                        Call started
                      </div>
                    </div>
                    <div className="msgs-wrap">
                      <div className="msgs" id="chat-msgs"></div>
                      <div className="result-takeover" id="result-takeover">
                        <div className="shield-big" id="shield-big"></div>
                        <div className="result-title" id="result-title"></div>
                        <div className="result-sub" id="result-sub"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="industries">
        <div className="container">
          <div className="industries-label">Built for the industries that pick up every call</div>
          <div className="industries-grid">
            {[
              { label: 'Logistics & Freight', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
              { label: 'Manufacturing', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20"/><path d="M4 20V8l8-5 8 5v12"/><path d="M10 20v-6h4v6"/></svg> },
              { label: 'Warehousing', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg> },
              { label: 'Construction', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
              { label: 'Distribution', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg> },
              { label: 'Fleet Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg> },
              { label: 'Industrial Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg> },
            ].map((item, i) => (
              <div key={i} className="industry-chip">{item.icon}{item.label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container">
          <div className="stats-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>The numbers after 30 days</div>
            <h2 className="h-section">Real results from real call logs.</h2>
          </div>
          <div className="stats-grid reveal">
            <div className="stat"><div className="stat-num" data-target="94">0%</div><div className="stat-label">of cold calls<br/>blocked automatically</div></div>
            <div className="stat"><div className="stat-num" data-target="12">0<span style={{fontSize:'0.5em',color:'var(--text-3)'}}>hrs/wk</span></div><div className="stat-label">saved per team<br/>on unwanted calls</div></div>
            <div className="stat"><div className="stat-num" data-target="24">24<span style={{fontSize:'0.5em',color:'var(--text-3)'}}>/7</span></div><div className="stat-label">coverage,<br/>no shifts, no sick days</div></div>
            <div className="stat"><div className="stat-num">$0</div><div className="stat-label">upfront cost —<br/>14 day free trial</div></div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
        <div className="container">
          <div className="problem-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>The Problem</div>
            <h2 className="h-section">Cold calls are eating your day.</h2>
            <p className="lede">The average logistics SMB fields 15–40 cold sales calls every single day. Every one interrupts a dispatcher, a driver, or a manager who should be moving freight.</p>
          </div>
          <div className="problem-grid">
            <div className="problem-card reveal"><div className="big">25<span className="unit">calls/day</span></div><div className="head">Unwanted sales calls</div><div className="sub">The median logistics SMB logs 25 cold pitches per day — solar, insurance, SEO, warranties, the works.</div></div>
            <div className="problem-card reveal"><div className="big">3<span className="unit">min each</span></div><div className="head">Stolen from real work</div><div className="sub">Every cold call costs 2–5 minutes between answering, declining, and refocusing. That's over an hour a day, per employee.</div></div>
            <div className="problem-card reveal"><div className="big">$14k<span className="unit">/year</span></div><div className="head">Wasted payroll</div><div className="sub">At $25/hour loaded cost, a 5-person ops team loses roughly $14,000 a year to calls that should never have been picked up.</div></div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities">
        <div className="container">
          <div className="caps-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Capabilities</div>
            <h2 className="h-section">Four things. All at once.<br/>Every single call.</h2>
            <p className="lede">Gate AI is not a voicemail menu. It's a real conversational agent that screens, classifies, routes, and summarizes in real time — powered by Vapi, Twilio, and Claude.</p>
          </div>
          <div className="caps-grid">
            <div className="cap reveal"><span className="cap-num">01 · DETECT</span><h3>Cold-call detection in under 10 seconds</h3><p>Our AI listens to the opening line and classifies intent before the caller finishes their pitch. Solar, SEO, warranties, robocalls — gone.</p><div className="cap-demo"><span className="prompt">caller:</span> "Hi, I'm calling about your commercial solar..."<br/><span className="ok">gate-ai:</span> <span className="err">→ blocked (98% confidence)</span></div></div>
            <div className="cap reveal"><span className="cap-num">02 · SCREEN</span><h3>Polite rejection in your voice</h3><p>Cold callers hear a professional, branded decline message — not dead air. Your brand stays intact, your team stays focused.</p><div className="cap-demo"><span className="prompt">gate-ai:</span> "Thanks for calling. We're not taking<br/>unsolicited calls right now. Have a good day."</div></div>
            <div className="cap reveal"><span className="cap-num">03 · ROUTE</span><h3>Smart routing by intent</h3><p>Legit callers get matched to the right person based on what they're calling about — logistics goes to ops, vendors go to purchasing, IT goes to IT.</p><div className="cap-demo"><span className="prompt">intent:</span> Logistics Coordination<br/><span className="ok">route →</span> Dave M. (Ops Manager, ext. 201)</div></div>
            <div className="cap reveal"><span className="cap-num">04 · SUMMARIZE</span><h3>Pre-call AI briefings</h3><p>Before the phone rings, the employee already sees a one-line summary: who's calling, what company, and why. No more "who was that?"</p><div className="cap-demo"><span className="prompt">summary:</span> Daniel at AB Logistics re:<br/>Tuesday pickup — needs dock #3 confirmation.</div></div>
          </div>
          {/* Book Demo CTA at bottom of capabilities */}
          <div className="caps-cta reveal">
            <a href="/capabilities" onClick={e => goPage(e, '/capabilities')} className="btn btn-ghost" style={{marginRight: 12}}>See all capabilities</a>
            <a href="/book-demo" onClick={goDemo} className="btn btn-primary">Book a Demo →</a>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="integrations">
        <div className="container">
          <div className="integrations-label">Works with the stack you already have</div>
          <div className="integrations-grid">
            {[
              { name: 'Twilio', slug: 'twilio' },
              { name: 'Vapi', slug: 'vapi' },
              { name: 'OpenPhone', slug: 'openphone' },
              { name: 'RingCentral', slug: 'ringcentral' },
              { name: 'Avaya', slug: 'avaya' },
              { name: 'Talkroute', slug: 'talkroute' },
              { name: 'Slack', slug: 'slack' },
              { name: 'Microsoft Teams', slug: 'teams' },
              { name: 'Email / SMTP', slug: 'email' },
              { name: 'Zapier', slug: 'zapier' },
            ].map(({ name, slug }) => (
              <div
                key={name}
                className="int-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/integrations#${slug}`)}
              >
                <span className="int-dot"/>{name}
              </div>
            ))}
          </div>
          <div className="integrations-more">
            <a href="/integrations" onClick={e => goPage(e, '/integrations')}>View all integrations →</a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="pricing-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Pricing</div>
            <h2 className="h-section">One flat price.<br/>No per-minute surprises.</h2>
            <p className="lede" style={{margin:'0 auto'}}>Start with a 14-day free trial. No credit card required. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            <div className="tier reveal">
              <div className="tier-name">Starter</div>
              <div className="tier-price"><span className="num">$79</span><span className="per">/ month</span></div>
              <div className="tier-desc">For small teams getting 5–20 calls a day. Everything you need to silence cold callers.</div>
              <ul className="tier-features"><li>1 phone number</li><li>Up to 3 team members</li><li>AI cold-call blocking</li><li>Call summaries by email</li><li>Slack notifications</li></ul>
              <a href="/auth?plan=starter" onClick={e => goAuth(e, 'starter')} className="btn btn-ghost">Get started</a>
            </div>
            <div className="tier featured reveal">
              <div className="tier-name">Pro</div>
              <div className="tier-price"><span className="num">$149</span><span className="per">/ month</span></div>
              <div className="tier-desc">Built for logistics and manufacturing SMBs with real inbound call volume.</div>
              <ul className="tier-features"><li>3 phone numbers</li><li>Unlimited team members</li><li>SMS + Slack + Email alerts</li><li>Custom AI screening scripts</li><li>Intent-based smart routing</li><li>Analytics dashboard</li></ul>
              <a href="/auth?plan=pro" onClick={e => goAuth(e, 'pro')} className="btn btn-primary">Get started</a>
            </div>
            <div className="tier reveal">
              <div className="tier-name">Business</div>
              <div className="tier-price"><span className="num">$249</span><span className="per">/ month</span></div>
              <div className="tier-desc">For multi-location operations that need custom integrations and priority support.</div>
              <ul className="tier-features"><li>Unlimited phone numbers</li><li>Priority support (4h SLA)</li><li>CRM integrations</li><li>Advanced analytics</li><li>Dedicated account manager</li><li>Custom voice cloning</li></ul>
              <a href="/contact" onClick={e => goPage(e, '/contact')} className="btn btn-ghost">Contact sales</a>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:28}}>
            <a href="/pricing" onClick={e => goPage(e, '/pricing')} style={{fontSize:13,color:'var(--accent-2)',fontWeight:500}}>View full pricing details →</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="container">
          <div className="faq-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>FAQ</div>
            <h2 className="h-section">Questions? We've got answers.</h2>
          </div>
          <div className="faq-list">
            {[
              {q:'How long does setup take?',a:"Under 10 minutes. You sign up, we provision a phone number automatically, you configure your team and routing rules, and you're live. Most customers handle their first real call within an hour."},
              {q:'Will Gate AI replace my receptionist?',a:"It depends. Gate AI handles every inbound call before it gets to a human — for many SMBs that removes the need for a part-time receptionist entirely. For larger teams, it works as a force multiplier: your receptionist only sees the 10–20% of calls that actually matter."},
              {q:'What happens if the AI misclassifies a call?',a:"You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and Gate AI learns from corrections. In practice, cold-call detection is 94%+ accurate out of the box."},
              {q:'Does it work with my existing phone system?',a:"Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer without replacing your main phone system."},
              {q:'What about VIP callers — clients who should never be screened?',a:"Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by number, company domain, or individual name."},
              {q:'How much does it actually cost per call?',a:"Less than you think. The average blocked cold call costs us about 3 cents in AI and telephony fees. Your flat monthly subscription covers typical SMB call volume with plenty of headroom."},
            ].map((item,i) => (
              <details key={i} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="faq-more reveal">
            <a href="/faq" onClick={e => goPage(e, '/faq')}>See all frequently asked questions →</a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta-inner reveal">
          <h2>Stop answering<br/>calls that waste your time.</h2>
          <p>Gate AI takes 10 minutes to set up and starts saving your team time on day one.</p>
          <a href="/book-demo" onClick={goDemo} className="btn btn-primary" style={{padding:'16px 32px',fontSize:15}}>Book a Demo →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container footer-inner">
          <a href="/" className="logo" style={{gap:12}}>
            <FootLogo />
            <span style={{fontFamily:"Inter,'DM Sans',sans-serif",fontWeight:600,letterSpacing:'-0.3px'}}>
              Gate<span style={{color:'var(--accent-2)',fontWeight:500}}> AI</span>
            </span>
          </a>
          <ul className="footer-links">
            <li><a href="/capabilities" onClick={e => goPage(e, '/capabilities')}>Capabilities</a></li>
            <li><a href="/pricing" onClick={e => goPage(e, '/pricing')}>Pricing</a></li>
            <li><a href="/integrations" onClick={e => goPage(e, '/integrations')}>Integrations</a></li>
            <li><a href="/faq" onClick={e => goPage(e, '/faq')}>FAQ</a></li>
            <li><a href="/contact" onClick={e => goPage(e, '/contact')}>Contact</a></li>
            <li><a href="/privacy" onClick={e => goPage(e, '/privacy')}>Privacy</a></li>
            <li><a href="/terms" onClick={e => goPage(e, '/terms')}>Terms</a></li>
          </ul>
          <div className="footer-copy">© 2026 Gate AI, Inc. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}

// ─── SVG COMPONENTS ──────────────────────────────────────────
function ShieldLogo({ size = 13, id = '' }) {
  const gId = `sg${id}`, mId = `sm${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id={mId}>
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill={`url(#${gId})`} mask={`url(#${mId})`}/>
    </svg>
  );
}

function NavLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="navM">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#navG)" mask="url(#navM)"/>
    </svg>
  );
}

function FootLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="footG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="footM">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#footG)" mask="url(#footM)"/>
    </svg>
  );
}

// ─── CHAT SCENARIOS ───────────────────────────────────────────
const GATE_AV = `<div class="chat-gate-av"><svg width="10" height="10" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 4L47 10.5V27C47 38 30 50 30 50C30 50 13 38 13 27V10.5L30 4Z" fill="white"/></svg></div>`;
const CALLER_AV = `<div class="chat-caller-av"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5c6078" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

const SHIELD_SVG = {
  blocked: `<svg width="36" height="36" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 4L47 10.5V27C47 38 30 50 30 50C30 50 13 38 13 27V10.5L30 4Z" fill="#ff6b6b" opacity="0.9"/><line x1="22" y1="22" x2="38" y2="38" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="22" x2="22" y2="38" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`,
  forwarded: `<svg width="36" height="36" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 4L47 10.5V27C47 38 30 50 30 50C30 50 13 38 13 27V10.5L30 4Z" fill="#00d68f" opacity="0.9"/><polyline points="20,30 27,37 40,23" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
};

const SCENARIOS = {
  blocked: [
    { r: 'gate',   d: 400,  t: 'Thank you for calling. This is Gate AI, an automated screening assistant. How can I direct your call today?' },
    { r: 'caller', d: 2200, t: "Hi there, I'm calling about your business energy rates — we're offering a free audit that could save you up to 30%..." },
    { r: 'gate',   d: 4200, t: "Thanks for sharing that. Could I ask who specifically you're trying to reach at the company?" },
    { r: 'caller', d: 5800, t: "Oh, I'm looking to speak with whoever handles your energy or utilities budget." },
    { r: 'gate',   d: 7600, t: "Understood. One moment while I check our screening rules." },
    { r: 'result', d: 9200, type: 'blocked', title: '🚫 Call Blocked', sub: 'Cold call detected · 96% confidence · Logged' },
  ],
  forwarded: [
    { r: 'gate',   d: 400,  t: 'Thank you for calling Acme Logistics. This is Gate AI. How can I direct your call?' },
    { r: 'caller', d: 2100, t: "Hi, it's Daniel calling from AB Logistics. I'm calling about a pickup scheduled for Tuesday — need to confirm the dock time." },
    { r: 'gate',   d: 3900, t: "Thanks Daniel. And are you calling about an existing shipment or coordinating a new pickup?" },
    { r: 'caller', d: 5400, t: "Existing — order number 4821, Tuesday morning at dock 3." },
    { r: 'gate',   d: 7000, t: "Got it. I'm going to connect you with our operations team. Dave Miller handles logistics coordination — one moment." },
    { r: 'result', d: 8600, type: 'forwarded', title: '✓ Forwarded to Dave M.', sub: 'AI summary sent · Call logged' },
  ],
};

let _chatTimers = [];
let _curTab = 'blocked';

function clearChatTimers() { _chatTimers.forEach(t => clearTimeout(t)); _chatTimers = []; }

function showChatResult(type, title, sub) {
  const msgs = document.getElementById('chat-msgs');
  const rt = document.getElementById('result-takeover');
  const sb = document.getElementById('shield-big');
  const rtitle = document.getElementById('result-title');
  const rsub = document.getElementById('result-sub');
  if (!msgs || !rt) return;
  msgs.style.opacity = '0';
  setTimeout(() => {
    sb.className = 'shield-big ' + (type === 'blocked' ? 'shield-blocked' : 'shield-forwarded');
    sb.innerHTML = SHIELD_SVG[type];
    rtitle.className = 'result-title ' + type;
    rtitle.textContent = title;
    rsub.textContent = sub;
    rt.style.pointerEvents = 'auto';
    rt.classList.add('show');
    setTimeout(() => { sb.classList.add('pop'); rtitle.classList.add('show'); rsub.classList.add('show'); }, 100);
    setTimeout(() => {
      _curTab = _curTab === 'blocked' ? 'forwarded' : 'blocked';
      const tb = document.getElementById('tab-b');
      const tf = document.getElementById('tab-f');
      if (tb) tb.className = 'c-tab' + (_curTab === 'blocked' ? ' active' : '');
      if (tf) tf.className = 'c-tab' + (_curTab === 'forwarded' ? ' active' : '');
      const m = document.getElementById('chat-msgs');
      if (m) m.style.opacity = '1';
      rt.classList.remove('show'); rt.style.pointerEvents = 'none';
      sb.classList.remove('pop'); rtitle.classList.remove('show'); rsub.classList.remove('show');
      runChatScenario();
    }, 4000);
  }, 400);
}

function runChatScenario() {
  clearChatTimers();
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  el.innerHTML = '';
  const sb = document.getElementById('shield-big');
  const rtitle = document.getElementById('result-title');
  const rsub = document.getElementById('result-sub');
  const rt = document.getElementById('result-takeover');
  if (sb) sb.classList.remove('pop');
  if (rtitle) rtitle.classList.remove('show');
  if (rsub) rsub.classList.remove('show');
  if (rt) { rt.classList.remove('show'); rt.style.pointerEvents = 'none'; }

  SCENARIOS[_curTab].forEach((step, i) => {
    if (step.r === 'result') {
      _chatTimers.push(setTimeout(() => showChatResult(step.type, step.title, step.sub), step.d));
      return;
    }
    if (step.r === 'gate') {
      _chatTimers.push(setTimeout(() => {
        const t = document.createElement('div'); t.className = 'chat-typing'; t.id = 'ctyp' + i;
        t.innerHTML = '<span></span><span></span><span></span>';
        el.appendChild(t); requestAnimationFrame(() => t.classList.add('show')); el.scrollTop = el.scrollHeight;
      }, step.d - 650));
    }
    _chatTimers.push(setTimeout(() => {
      const old = document.getElementById('ctyp' + i); if (old) old.remove();
      const m = document.createElement('div'); m.className = 'chat-msg ' + step.r;
      const av = step.r === 'gate' ? GATE_AV : CALLER_AV;
      const who = step.r === 'gate' ? 'Gate AI' : 'Caller';
      m.innerHTML = `<div class="chat-msg-hdr">${av}<span class="chat-msg-who">${who}</span></div><div class="chat-bubble">${step.t}</div>`;
      el.appendChild(m); requestAnimationFrame(() => m.classList.add('show')); el.scrollTop = el.scrollHeight;
    }, step.d));
  });
}

function startChatSequence(timers) {
  const ring = document.getElementById('ph-ring');
  const done = document.getElementById('ph-done');
  const chat = document.getElementById('ph-chat');
  const dc = document.getElementById('done-circle');
  const dl = document.getElementById('done-lbl');
  if (!ring) return;

  timers.push(setTimeout(() => {
    ring.style.opacity = '0'; ring.style.pointerEvents = 'none';
    done.style.opacity = '1'; dc.style.transform = 'scale(1)'; dl.style.opacity = '1';
  }, 2600));
  timers.push(setTimeout(() => {
    done.style.opacity = '0'; done.style.pointerEvents = 'none';
    chat.style.opacity = '1';
    runChatScenario();
  }, 3900));
}

window.switchChatTab = (tab) => {
  _curTab = tab;
  const tb = document.getElementById('tab-b');
  const tf = document.getElementById('tab-f');
  if (tb) tb.className = 'c-tab' + (tab === 'blocked' ? ' active' : '');
  if (tf) tf.className = 'c-tab' + (tab === 'forwarded' ? ' active' : '');
  const msgs = document.getElementById('chat-msgs');
  if (msgs) msgs.style.opacity = '1';
  runChatScenario();
};

window.replayChatAnim = () => {
  const msgs = document.getElementById('chat-msgs');
  if (msgs) msgs.style.opacity = '1';
  runChatScenario();
};

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Inter:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg:#08090d;--bg-2:#0d0e14;--bg-3:#13141b;--bg-4:#1a1c26;
  --border:#1f2130;--border-2:#2a2d40;
  --text:#f0f1f5;--text-2:#9da1b5;--text-3:#5c6078;
  --accent:#6c5ce7;--accent-2:#a29bfe;--accent-glow:rgba(108,92,231,0.35);
  --green:#00d68f;--red:#ff6b6b;--orange:#ffa94d;
  --radius:14px;--radius-lg:20px;
  --font:'DM Sans',-apple-system,system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.5;overflow-x:hidden;}
::selection{background:var(--accent);color:white;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;border:none;cursor:pointer;}
.container{max-width:1240px;margin:0 auto;padding:0 32px;}
section{position:relative;padding:120px 0;}
@media(max-width:720px){section{padding:72px 0;}.container{padding:0 20px;}}

.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--accent-2);text-transform:uppercase;letter-spacing:1.5px;padding:7px 14px;background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.25);border-radius:100px;margin-bottom:24px;white-space:nowrap;}
.eyebrow-dot{width:5px;height:5px;min-width:5px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 10px var(--accent-2);animation:edot 2s ease infinite;}
@keyframes edot{0%,100%{box-shadow:0 0 6px var(--accent-2);}50%{box-shadow:0 0 14px var(--accent-2),0 0 22px rgba(162,155,254,0.4);}}
h1,h2,h3{font-weight:700;letter-spacing:-0.03em;line-height:1.05;}
.h-display{font-size:clamp(34px,4.2vw,62px);font-weight:800;letter-spacing:-0.04em;line-height:0.97;}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap;align-items:center;}
.hero-globe-counter{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);display:flex;gap:28px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:100px;padding:10px 24px;backdrop-filter:blur(12px);z-index:2;white-space:nowrap;}
@media(max-width:720px){.hero-globe-counter{bottom:16px;padding:8px 18px;gap:20px;font-size:11px;}}.hgc-item{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.7);}
.hgc-item strong{color:#fff;font-weight:700;min-width:20px;}
.hgc-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.hgc-red{background:#ff4d6d;box-shadow:0 0 6px #ff4d6d;}
.hgc-green{background:#00f5a0;box-shadow:0 0 6px #00f5a0;}
.h-section{font-size:clamp(36px,5vw,60px);font-weight:700;letter-spacing:-0.035em;line-height:1.02;margin-bottom:20px;}
.lede{font-size:clamp(16px,1.4vw,19px);color:var(--text-2);max-width:620px;line-height:1.6;}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:100px;font-size:14px;font-weight:600;transition:all 200ms ease;white-space:nowrap;cursor:pointer;}
.btn-primary{background:var(--text);color:var(--bg);border:none;}
.btn-primary:hover{background:white;transform:translateY(-1px);box-shadow:0 10px 30px rgba(255,255,255,0.15);}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border-2);}
.btn-ghost:hover{background:var(--bg-3);border-color:var(--text-3);}
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 32px;backdrop-filter:blur(16px);background:rgba(8,9,13,0.72);border-bottom:1px solid rgba(31,33,48,0.6);}
.nav-inner{max-width:1240px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;}
.logo{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;letter-spacing:-0.3px;}
.nav-links{display:flex;gap:28px;list-style:none;}
.nav-links a{font-size:14px;color:var(--text-2);font-weight:500;transition:color 180ms ease;}
.nav-links a:hover{color:var(--text);}
.nav-cta{display:flex;gap:10px;align-items:center;}
.nav-btn{padding:10px 20px;font-size:13px;}
@media(max-width:820px){.nav-links{display:none;}.nav{padding:16px 20px;}}
/* Mobile nav fix — keep logo on one line */
@media(max-width:480px){
  .nav{padding:12px 16px;}
  .logo{font-size:15px;gap:7px;white-space:nowrap;}
  .nav-cta{gap:6px;}
  .nav-btn{padding:8px 12px;font-size:12px;}
}

.hero{padding:140px 0 80px;position:relative;overflow:hidden;}
.hero-globe-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;}
.hero-inner{position:relative;z-index:1;display:grid;grid-template-columns:1fr 400px;align-items:center;gap:60px;}
@media(max-width:1000px){.hero-inner{grid-template-columns:1fr;gap:48px;}.hero-right{max-width:480px;margin:0 auto;}}
/* Mobile hero — stack properly, globe smaller and centred */
@media(max-width:720px){
  .hero{padding:100px 0 60px;}
  .hero-globe-canvas{opacity:0.45;}
  .hero-inner{gap:32px;}
  .hero-left .h-display{margin-bottom:18px;}
  .hero-lede{font-size:15px;margin-bottom:28px;}
}
/* Landscape mobile — two column layout, globe on right, text on left */
@media(max-height:500px) and (orientation:landscape){
  .hero{padding:70px 0 30px;}
  .hero-globe-canvas{opacity:0.9;}
  .hero-inner{grid-template-columns:1fr 1fr;gap:24px;align-items:center;}
  .hero-right{display:none;}
  .h-display{font-size:clamp(24px,4.5vw,38px)!important;margin-bottom:10px!important;}
  .hero-lede{font-size:13px;margin-bottom:14px;line-height:1.5;}
  .hero-ctas{gap:8px;}
  .btn{padding:10px 18px;font-size:12px;}
  .hgc-inline{padding:7px 14px;gap:14px;font-size:11px;}
  .hero-globe-counter{bottom:12px;right:5%;left:auto;transform:none;}
}
.hero-left .h-display{margin-bottom:24px;}
.hero-left .accent{background:linear-gradient(180deg,var(--accent-2) 0%,var(--accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-style:italic;font-weight:700;}
.hero-lede{font-size:clamp(16px,1.3vw,18px);color:var(--text-2);max-width:520px;margin:0 0 36px;line-height:1.6;}


.phone-shell{padding:3px;border-radius:24px;background:linear-gradient(145deg,rgba(108,92,231,0.45),rgba(162,155,254,0.1),rgba(25,25,45,0.5));box-shadow:0 0 0 1px rgba(108,92,231,0.12),0 32px 64px -16px rgba(0,0,0,0.8),0 0 80px -20px rgba(108,92,231,0.2);}
.phone-frame{background:rgba(13,14,20,0.96);border-radius:21px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);}
.pf-top{display:flex;align-items:center;gap:6px;padding:10px 14px;background:rgba(19,20,27,0.95);border-bottom:1px solid rgba(255,255,255,0.04);}
.mac-dot{width:11px;height:11px;border-radius:50%;}
.mac-r{background:#ff5f57;}.mac-y{background:#febc2e;}.mac-g{background:#28c840;}
.pf-bar-right{display:flex;align-items:center;gap:6px;margin-left:auto;}
.pf-label{font-size:10px;font-family:var(--mono);color:#5c6078;}
.pf-label b{color:var(--accent-2);font-weight:500;}
.pf-body{height:400px;position:relative;overflow:hidden;}
.ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 400ms ease;}
.ph-ring{opacity:1;}.ph-done{opacity:0;}
.ph-chat{opacity:0;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;}
.ring-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(108,92,231,0.08) 0%,transparent 70%);}
.ring-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:14px;}
.ring-wrap{position:relative;width:76px;height:76px;display:flex;align-items:center;justify-content:center;}
.rp{position:absolute;width:76px;height:76px;border-radius:50%;border:1.5px solid rgba(162,155,254,0.35);animation:rout 2s ease infinite;}
.rp:nth-child(2){animation-delay:.65s;}.rp:nth-child(3){animation-delay:1.3s;}
@keyframes rout{0%{transform:scale(0.8);opacity:0.8;}100%{transform:scale(2.4);opacity:0;}}
.ring-icon{width:48px;height:48px;border-radius:50%;background:#f0f1f5;display:flex;align-items:center;justify-content:center;z-index:2;animation:rbob .45s ease infinite alternate;}
@keyframes rbob{0%{transform:rotate(-10deg);}100%{transform:rotate(10deg);}}
.ring-lbl{font-size:11px;color:rgba(240,241,245,0.45);font-weight:500;}
.done-circle{width:56px;height:56px;border-radius:50%;background:#00d68f;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform 450ms cubic-bezier(0.34,1.56,0.64,1);}
.done-lbl{font-size:14px;color:var(--text-2);font-weight:500;opacity:0;transition:opacity 300ms ease 200ms;margin-top:14px;}
.chat-tabs{display:flex;gap:6px;padding:9px 10px 0;}
.c-tab{flex:1;padding:7px 8px;border-radius:9px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#5c6078;font-family:var(--font);transition:all 180ms ease;text-align:center;}
.c-tab.active{background:rgba(108,92,231,0.14);border-color:rgba(108,92,231,0.4);color:var(--accent-2);}
.chat-hdr{display:flex;align-items:center;padding:7px 12px;border-bottom:1px solid rgba(255,255,255,0.04);}
.hdr-pill{display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:100px;font-size:10.5px;color:var(--text-2);font-weight:500;}
.hdr-live{width:6px;height:6px;border-radius:50%;background:#00d68f;animation:livep 1.5s ease infinite;}
@keyframes livep{0%,100%{opacity:1;box-shadow:0 0 5px #00d68f;}50%{opacity:0.4;box-shadow:none;}}
.msgs-wrap{flex:1;position:relative;overflow:hidden;}
.msgs{padding:10px 12px;display:flex;flex-direction:column;gap:8px;position:absolute;inset:0;overflow-y:auto;transition:opacity 500ms ease;}
.msgs::-webkit-scrollbar{display:none;}
.chat-msg{display:flex;flex-direction:column;gap:3px;opacity:0;transform:translateY(7px);transition:opacity 350ms ease,transform 350ms ease;}
.chat-msg.show{opacity:1;transform:translateY(0);}
.chat-msg.gate{align-self:flex-start;max-width:86%;}
.chat-msg.caller{align-self:flex-end;max-width:86%;}
.chat-msg-hdr{display:flex;align-items:center;gap:5px;margin-bottom:2px;}
.chat-msg.caller .chat-msg-hdr{flex-direction:row-reverse;}
.chat-gate-av{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6c5ce7,#a29bfe);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chat-caller-av{width:20px;height:20px;border-radius:50%;background:#1a1c26;border:1px solid #252736;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chat-msg-who{font-size:9.5px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
.chat-msg.gate .chat-msg-who{color:var(--accent-2);}.chat-msg.caller .chat-msg-who{color:#5c6078;}
.chat-bubble{padding:8px 12px;border-radius:13px;font-size:12px;line-height:1.5;}
.chat-msg.gate .chat-bubble{background:rgba(19,20,27,0.9);border:1px solid rgba(255,255,255,0.07);color:var(--text);border-bottom-left-radius:3px;}
.chat-msg.caller .chat-bubble{background:rgba(26,28,38,0.9);border:1px solid rgba(255,255,255,0.06);color:#c8cad8;border-bottom-right-radius:3px;}
.chat-typing{display:flex;align-items:center;gap:3px;padding:8px 12px;background:rgba(19,20,27,0.9);border:1px solid rgba(255,255,255,0.07);border-radius:13px;border-bottom-left-radius:3px;width:fit-content;opacity:0;transition:opacity 220ms ease;}
.chat-typing.show{opacity:1;}
.chat-typing span{width:4px;height:4px;border-radius:50%;background:#5c6078;animation:td 1.2s ease infinite;}
.chat-typing span:nth-child(2){animation-delay:.15s;}.chat-typing span:nth-child(3){animation-delay:.3s;}
@keyframes td{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);background:var(--accent-2);}}
.result-takeover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;pointer-events:none;z-index:10;transition:opacity 500ms ease;padding:20px;}
.result-takeover.show{opacity:1;}
.shield-big{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform 500ms cubic-bezier(0.34,1.56,0.64,1);}
.shield-big.pop{transform:scale(1);}
.shield-blocked{background:rgba(255,107,107,0.12);border:2px solid rgba(255,107,107,0.35);}
.shield-forwarded{background:rgba(0,214,143,0.12);border:2px solid rgba(0,214,143,0.35);}
.shield-blocked.pop{animation:spb 2s ease infinite 500ms;}
.shield-forwarded.pop{animation:spf 2s ease infinite 500ms;}
@keyframes spb{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.4);}50%{box-shadow:0 0 0 18px rgba(255,107,107,0);}}
@keyframes spf{0%,100%{box-shadow:0 0 0 0 rgba(0,214,143,0.4);}50%{box-shadow:0 0 0 18px rgba(0,214,143,0);}}
.result-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;opacity:0;transition:opacity 350ms ease 250ms;text-align:center;}
.result-title.show{opacity:1;}
.result-title.blocked{color:#ff6b6b;}.result-title.forwarded{color:#00d68f;}
.result-sub{font-size:11.5px;color:#5c6078;opacity:0;transition:opacity 350ms ease 400ms;text-align:center;}
.result-sub.show{opacity:1;}

.industries{padding:60px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.industries-label{text-align:center;font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:2px;margin-bottom:32px;font-weight:500;}
.industries-grid{display:flex;justify-content:center;flex-wrap:wrap;gap:14px 18px;}
.industry-chip{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--bg-3);border:1px solid var(--border);border-radius:100px;font-size:13.5px;color:var(--text-2);font-weight:500;transition:all 200ms ease;}
.industry-chip:hover{border-color:var(--accent);color:var(--text);transform:translateY(-2px);}
.industry-chip svg{width:14px;height:14px;color:var(--accent-2);}
.stats{padding:120px 0;}
.stats-head{text-align:center;margin-bottom:72px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;}
@media(max-width:820px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
.stat{background:var(--bg-2);padding:40px 32px;transition:background 250ms ease;}
.stat:hover{background:var(--bg-3);}
.stat-num{font-size:clamp(48px,6vw,72px);font-weight:700;letter-spacing:-0.04em;line-height:1;background:linear-gradient(180deg,var(--text) 0%,var(--text-2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px;}
.stat-label{font-size:13px;color:var(--text-2);font-weight:500;line-height:1.4;}
.problem{background:var(--bg-2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.problem-head{max-width:700px;margin-bottom:64px;}
.problem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
@media(max-width:820px){.problem-grid{grid-template-columns:1fr;}}
.problem-card{background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);padding:36px 32px;transition:all 250ms ease;}
.problem-card:hover{border-color:var(--border-2);transform:translateY(-3px);}
.problem-card .big{font-size:clamp(44px,5vw,60px);font-weight:700;letter-spacing:-0.035em;line-height:1;color:var(--text);margin-bottom:14px;}
.problem-card .big .unit{font-size:0.5em;color:var(--text-3);font-weight:500;margin-left:4px;}
.problem-card .head{font-size:15px;font-weight:600;color:var(--text);margin-bottom:10px;}
.problem-card .sub{font-size:13.5px;color:var(--text-2);line-height:1.55;}
.caps-head{max-width:760px;margin-bottom:64px;}
.caps-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
@media(max-width:820px){.caps-grid{grid-template-columns:1fr;}}
.cap{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px 36px 40px;position:relative;overflow:hidden;transition:all 250ms ease;}
.cap::before{content:'';position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:0;transition:opacity 300ms ease;}
.cap:hover{border-color:var(--border-2);transform:translateY(-3px);}
.cap:hover::before{opacity:1;}
.cap-num{font-family:var(--mono);font-size:12px;color:var(--accent-2);letter-spacing:1px;margin-bottom:20px;display:block;font-weight:500;}
.cap h3{font-size:24px;font-weight:700;letter-spacing:-0.02em;margin-bottom:12px;}
.cap p{font-size:14.5px;color:var(--text-2);line-height:1.6;margin-bottom:24px;}
.cap-demo{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-family:var(--mono);font-size:12px;color:var(--text-2);line-height:1.6;}
.cap-demo .prompt{color:var(--accent-2);}.cap-demo .ok{color:var(--green);}.cap-demo .err{color:var(--red);}
.caps-cta{display:flex;align-items:center;gap:12px;margin-top:40px;flex-wrap:wrap;}
.integrations{padding:80px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--bg-2);}
.integrations-label{text-align:center;font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:2px;margin-bottom:32px;}
.integrations-grid{display:flex;justify-content:center;flex-wrap:wrap;gap:16px;}
.int-card{display:flex;align-items:center;gap:10px;padding:14px 22px;background:var(--bg-3);border:1px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;color:var(--text);transition:all 200ms ease;}
.int-card:hover{border-color:var(--accent);box-shadow:0 0 30px -10px var(--accent-glow);transform:translateY(-2px);}
.int-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);}
.integrations-more{text-align:center;margin-top:24px;}
.integrations-more a{font-size:13px;color:var(--accent-2);font-weight:500;transition:color 180ms;}
.integrations-more a:hover{color:var(--text);}
.pricing-head{text-align:center;margin-bottom:64px;}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:0 auto;}
@media(max-width:900px){.pricing-grid{grid-template-columns:1fr;max-width:440px;}}
.tier{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px 32px;display:flex;flex-direction:column;transition:all 250ms ease;}
.tier:hover{border-color:var(--border-2);transform:translateY(-3px);}
.tier.featured{border-color:var(--accent);background:linear-gradient(180deg,rgba(108,92,231,0.08),var(--bg-2));box-shadow:0 20px 60px -20px var(--accent-glow);position:relative;}
.tier.featured::before{content:'Most Popular';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--accent);color:white;font-size:11px;font-weight:600;padding:5px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:0.8px;}
.tier-name{font-size:14px;color:var(--text-2);font-weight:500;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;}
.tier-price{display:flex;align-items:baseline;gap:6px;margin-bottom:8px;}
.tier-price .num{font-size:52px;font-weight:700;letter-spacing:-0.035em;line-height:1;}
.tier-price .per{font-size:14px;color:var(--text-3);}
.tier-desc{font-size:13.5px;color:var(--text-2);margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--border);line-height:1.5;}
.tier-features{list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:32px;flex:1;}
.tier-features li{display:flex;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.5;}
.tier-features li::before{content:'';min-width:16px;height:16px;margin-top:2px;border-radius:50%;background:rgba(0,214,143,0.14);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2300d68f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;}
.tier .btn{justify-content:center;width:100%;}
.faq-head{text-align:center;margin-bottom:60px;}
.faq-list{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:12px;}
.faq-item{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:all 200ms ease;}
.faq-item[open]{border-color:var(--border-2);}
.faq-item summary{padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;}
.faq-item summary::-webkit-details-marker{display:none;}
.faq-item summary::after{content:'+';font-size:26px;color:var(--text-3);font-weight:300;transition:transform 200ms ease;line-height:1;}
.faq-item[open] summary::after{transform:rotate(45deg);color:var(--accent-2);}
.faq-item p{padding:0 28px 24px;color:var(--text-2);font-size:14.5px;line-height:1.65;}
.faq-more{text-align:center;margin-top:28px;}
.faq-more a{font-size:14px;color:var(--accent-2);font-weight:500;transition:color 180ms;}
.faq-more a:hover{color:var(--text);}
.cta{padding:140px 0;text-align:center;position:relative;overflow:hidden;background:var(--bg-2);border-top:1px solid var(--border);}
.cta::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,var(--accent-glow) 0%,transparent 60%);pointer-events:none;}
.cta-inner{position:relative;z-index:1;max-width:720px;margin:0 auto;}
.cta h2{font-size:clamp(40px,6vw,72px);font-weight:700;letter-spacing:-0.035em;line-height:1.02;margin-bottom:24px;}
.cta p{font-size:17px;color:var(--text-2);margin-bottom:36px;}
footer{padding:48px 0 40px;border-top:1px solid var(--border);}
.footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;}
.footer-links{display:flex;gap:24px;list-style:none;flex-wrap:wrap;}
.footer-links a{font-size:13px;color:var(--text-3);transition:color 180ms ease;}
.footer-links a:hover{color:var(--text);}
.footer-copy{font-size:13px;color:var(--text-3);}
.reveal{opacity:0;transform:translateY(24px);transition:opacity 700ms cubic-bezier(.2,.8,.2,1),transform 700ms cubic-bezier(.2,.8,.2,1);}
.reveal.in{opacity:1;transform:translateY(0);}
`;
