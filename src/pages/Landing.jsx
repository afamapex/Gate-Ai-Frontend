import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [industryModal, setIndustryModal] = useState(null);

  const INDUSTRY_INFO = {
    'Manufacturing': {
      headline: 'Built for the factory floor.',
      body: `Procurement, suppliers, logistics — your lines get real calls all day, plus dozens of cold pitches for energy contracts, warranty services, and equipment financing.\n\nGate AI answers instantly, detects cold pitches in seconds, and routes real callers to the right person with a short AI brief.\n\nNo more interrupting your floor manager for a solar panel pitch.`,
      stats: [{ val: '70%', label: 'of inbound calls are cold pitches' }, { val: '<10s', label: 'cold call detection' }, { val: '24/7', label: 'AI coverage' }],
    },
    'Warehousing': {
      headline: 'Keep your team moving, not answering.',
      body: `Your team is coordinating shipments, picks, and carriers — not fielding cold calls.\n\nGate AI greets every caller, blocks pitches instantly, and routes logistics queries and vendor calls to the right person with a one-line summary.\n\nYou only pick up when it matters.`,
      stats: [{ val: '94%', label: 'cold call block rate' }, { val: '12hrs', label: 'saved per team per week' }, { val: '$0', label: 'upfront cost' }],
    },
    'Logistics & Freight': {
      headline: 'Route calls as efficiently as you route freight.',
      body: `Dispatch, ops, finance, customer service — one number, four teams, plus endless cold pitches for fuel cards and freight software.\n\nGate AI classifies intent and routes automatically. A carrier calling about Tuesday's pickup goes to dispatch. A quote request goes to sales. Cold pitches get declined.\n\nEvery forwarded call arrives with a brief: who, what, and why.`,
      stats: [{ val: '25', label: 'cold calls blocked daily' }, { val: '3min', label: 'saved per blocked call' }, { val: '100%', label: 'calls answered' }],
    },
    'Construction': {
      headline: 'Your site runs on communication. Protect it.',
      body: `Subs, suppliers, inspectors, clients — plus cold callers who pose as vendors to get through.\n\nGate AI screens every caller, blocks unsolicited pitches on the spot, and routes legitimate calls to the right person.\n\nYour PMs stay focused. Your clients always get through.`,
      stats: [{ val: '80%', label: 'reduction in unwanted calls' }, { val: 'Auto', label: 'routing by intent' }, { val: '10min', label: 'setup time' }],
    },
    'Fleet Services': {
      headline: 'Keep your drivers on the road, not on hold.',
      body: `Your business line should be clear for dispatchers, drivers, and clients — not clogged with pitches for tracking software and fuel cards.\n\nGate AI screens every call live, lets legitimate traffic through, and politely declines cold callers before they reach your team.`,
      stats: [{ val: '24/7', label: 'AI receptionist' }, { val: 'Zero', label: 'missed legitimate calls' }, { val: 'Flat', label: 'monthly subscription' }],
    },
    'Distribution': {
      headline: 'Every call handled. Every order protected.',
      body: `High volume from retailers, suppliers, and carriers — plus constant cold outreach for racking, software, everything.\n\nGate AI identifies legitimate partners, routes them instantly with a one-line brief, and blocks cold pitches before they reach anyone.\n\nYour team focuses on fulfilment, not filtering.`,
      stats: [{ val: '15-40', label: 'cold calls blocked daily' }, { val: 'AI', label: 'intent classification' }, { val: '3 tiers', label: 'from $79/mo' }],
    },
    'Industrial Services': {
      headline: 'Professional. Efficient. Always available.',
      body: `HVAC, electrical, mechanical, maintenance — you need to be reachable without drowning in pitches for insurance and marketing tools.\n\nGate AI qualifies every caller, routes real service requests to the right engineer with a brief, and declines cold calls professionally.\n\nAccessible without the noise.`,
      stats: [{ val: '100%', label: 'calls answered' }, { val: 'Smart', label: 'routing by intent' }, { val: '14-day', label: 'free trial' }],
    },
  };
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
      renderer.setClearColor(0xffffff, 0); // transparent so light hero background shows

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 500);
      const isMobile = W < 720;
      const isLandscapeMobile = H < 500 && W > H;
      const camZ = isLandscapeMobile ? 7.0 : isMobile ? 10.5 : 6.3;
      const camX = isLandscapeMobile ? -3.5 : isMobile ? 0 : -2.2;
      camera.position.set(camX, 0, camZ);

      const handleResize = () => {
        const w = cv.parentElement.offsetWidth;
        const h = cv.parentElement.offsetHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        const mob = w < 720;
        const land = h < 500 && w > h;
        camera.position.z = land ? 7.0 : mob ? 10.5 : 6.3;
        camera.position.x = land ? -3.5 : mob ? 0 : -2.2;
      };
      window.addEventListener('resize', handleResize);

      // Lighting
      scene.add(new THREE.AmbientLight(0xdfeaff, 0.85));
      const pl1 = new THREE.PointLight(0x7c63ff, 1.45, 20); pl1.position.set(-4, 3, 3); scene.add(pl1);
      const pl2 = new THREE.PointLight(0x20c7e8, 1.15, 20); pl2.position.set(4, -2, 2); scene.add(pl2);

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
      globeGroup.position.set(0, 0, 0);
      scene.add(globeGroup);

      // Lighting so Earth texture is visible
      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.05);
      sunLight.position.set(5, 3, 5); scene.add(sunLight);
      const fillLight = new THREE.DirectionalLight(0x9bd9ff, 0.42);
      fillLight.position.set(-5,-2,3); scene.add(fillLight);

      // Earth texture from Three.js CDN
      const earthTex = new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
        () => { globe.material.needsUpdate = true; }
      );
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_R, 64, 64),
        new THREE.MeshPhongMaterial({map:earthTex, shininess:18, specular:new THREE.Color(0x8fc5ff), emissive:new THREE.Color(0x12294c), emissiveIntensity:0.08})
      );
      globeGroup.add(globe);

      // Cell glow overlay — transparent, on top of Earth texture
      const MAX_HITS = 5;
      const globeHits = [];
      const globeGlowMat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, side:THREE.FrontSide,
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
            float cellEdge=smoothstep(0.0,0.22,min(min(eu,1.0-eu),min(ev,1.0-ev))*2.0);
            gl_FragColor=vec4(0.0,0.95,0.42,glow*cellEdge*1.8);
          }`
      });
      globe.add(new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R+0.003,64,64), globeGlowMat));

      // Grid lines
      const lm = new THREE.LineBasicMaterial({ color:0x6f8dff, transparent:true, opacity:0.16 });
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
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisPts), new THREE.LineBasicMaterial({color:0x90a6ff,transparent:true,opacity:0.34})));
      [GLOBE_R*1.08,-GLOBE_R*1.08].forEach(y => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8), new THREE.MeshBasicMaterial({color:0x8ea5ff,transparent:true,opacity:0.52}));
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
        baseColor:{value:new THREE.Color(0x6c5ce7)},
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
            float fr=pow(1.0-max(0.0,dot(n,viewDir)),1.6);
            float breathe=0.80+0.20*breath;\n            float lat=sin(vUv.y*6.0+time*0.7)*0.03;\n            vec3 col=baseColor*(fr*3.2+lat)*breathe;col+=baseColor*pow(fr,1.0)*1.8*breathe;col+=vec3(0.55,0.42,1.0)*pow(fr,2.5)*2.2;col+=vec3(0.2,0.6,1.0)*pow(fr,5.0)*1.4;\n\n            float alpha=(fr*1.8+lat*0.2)*breathe+pA*0.98;\n            if(pA>0.)col=mix(col,pC/pA,clamp(pA,0.,1.));gl_FragColor=vec4(col,clamp(alpha,0.,0.88));
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
          <div className="nav-divider"></div><ul className="nav-links">
            <li><a href="/capabilities" onClick={e => goPage(e, '/capabilities')}>Capabilities</a></li>
            <li><a href="/pricing" onClick={e => goPage(e, '/pricing')}>Pricing</a></li>
            <li><a href="/integrations" onClick={e => goPage(e, '/integrations')}>Integrations</a></li>
            <li><a href="/faq" onClick={e => goPage(e, '/faq')}>FAQ</a></li>
            <li><a href="/contact" onClick={e => goPage(e, '/contact')}>Contact</a></li>
          </ul>
          <div className="nav-cta">
            <a href="/auth" onClick={e => goAuth(e)} className="btn btn-ghost nav-btn">Sign In</a>
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
            <div className="eyebrow"><span className="eyebrow-dot"></span>AI Call Screening · Built for Business</div>
            <h1 className="h-display">
              Block the noise.<br />
              Forward what<br />
              <span className="accent">matters.</span>
            </h1>
            <p className="hero-lede">
              Gate AI answers every incoming call,<br />
              detects cold sales pitches in seconds,<br />
              and routes legitimate calls to the right person —<br />
              with a brief AI summary sent as the call is forwarded.
            </p>
            <div className="hero-ctas">
              <a href="/book-demo" onClick={goDemo} className="btn btn-primary">Book a Demo →</a>
              <a href="#capabilities" className="btn btn-ghost">See how it works</a>
            </div>
          </div>

          {/* Right — animated chat widget (desktop only, hidden on mobile) */}
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

      {/* PHONE WIDGET SECTION — mobile only, hidden on desktop */}
      <section className="phone-section">
        <div className="container">
          <div className="phone-shell" style={{maxWidth:480,margin:'0 auto'}}>
            <div className="phone-frame">
              <div className="pf-top">
                <div className="mac-dot mac-r"></div>
                <div className="mac-dot mac-y"></div>
                <div className="mac-dot mac-g"></div>
                <div className="pf-bar-right">
                  <ShieldLogo size={13} id="bar2" />
                  <span className="pf-label"><b>Gate AI</b> · screening call</span>
                </div>
              </div>
              <div className="pf-body">
                <div className="ph ph-ring" id="ph-ring2">
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
                <div className="ph ph-done" id="ph-done2">
                  <div className="done-circle" id="done-circle2">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="done-lbl" id="done-lbl2">Gate AI answered</span>
                </div>
                <div className="ph ph-chat" id="ph-chat2">
                  <div className="chat-tabs">
                    <button className="c-tab active" id="tab-b2" onClick={() => window.switchChatTab2('blocked')}>Blocked call</button>
                    <button className="c-tab" id="tab-f2" onClick={() => window.switchChatTab2('forwarded')}>Forwarded call</button>
                  </div>
                  <div className="chat-hdr">
                    <div className="hdr-pill"><ShieldLogo size={12} id="hdr2" /><span className="hdr-live"></span>Call started</div>
                  </div>
                  <div className="msgs-wrap">
                    <div className="msgs" id="chat-msgs2"></div>
                    <div className="result-takeover" id="result-takeover2">
                      <div className="shield-big" id="shield-big2"></div>
                      <div className="result-title" id="result-title2"></div>
                      <div className="result-sub" id="result-sub2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="industries" style={{backgroundImage:'url(/images/background/bg-industries.png)',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="container">
          <div className="industries-label">Built for the industries that pick up every call</div>
          <div className="industries-grid">
            {[
              { label: 'Manufacturing', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20"/><path d="M4 20V8l8-5 8 5v12"/><path d="M10 20v-6h4v6"/></svg> },
              { label: 'Warehousing', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg> },
              { label: 'Logistics & Freight', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
              { label: 'Construction', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
              { label: 'Fleet Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg> },
              { label: 'Distribution', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg> },
              { label: 'Industrial Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg> },
            ].map((item, i) => (
              <div key={i} className="industry-chip" onClick={() => setIndustryModal(item.label)} style={{cursor:'pointer'}}>{item.icon}{item.label}</div>
            ))}
          </div>
        </div>
      </section>
      <hr className="section-sep" />

      {/* STATS */}
      <section className="stats" style={{backgroundImage:'url(/images/background/bg-stats.png)',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="container">
          <div className="stats-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>The numbers after 30 days</div>
            <h2 className="h-section">Real results from real call logs.</h2>
          </div>
          <div className="stats-panel reveal">
            {/* Stat 1 */}
            <div className="stat-cell">
              <div className="stat-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 15.9 19.79 19.79 0 0 1 1.12 7.23 2 2 0 0 1 3.11 5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <svg className="stat-viz" viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                {[72,56,40,24,10].map((r,i) => <circle key={i} cx="100" cy="45" r={r} stroke="rgba(108,92,231,0.35)" strokeWidth="1.5" fill="none"/>)}
                <circle cx="100" cy="45" r="5" fill="rgba(108,92,231,0.8)"/>
                <line x1="100" y1="45" x2="156" y2="20" stroke="rgba(108,92,231,0.4)" strokeWidth="1" strokeDasharray="3 2"/>
                <circle cx="156" cy="20" r="3" fill="#a29bfe"/>
              </svg>
              <div className="stat-num" data-target="94">0%</div>
              <div className="stat-label">of cold calls<br/>blocked automatically</div>
            </div>
            {/* Stat 2 */}
            <div className="stat-cell">
              <div className="stat-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <svg className="stat-viz" viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                {[22,34,26,48,36,54,28,62,44,50,30,58].map((h,i) => <rect key={i} x={i*16+4} y={90-h} width="11" height={h} rx="3" fill={`rgba(108,92,231,${0.3+i*0.025})`}/>)}
              </svg>
              <div className="stat-num" data-target="12">0<span style={{fontSize:'0.5em',color:'var(--text-3)'}}>hrs/wk</span></div>
              <div className="stat-label">saved per team<br/>on unwanted calls</div>
            </div>
            {/* Stat 3 */}
            <div className="stat-cell">
              <div className="stat-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M16 5l2-2"/></svg>
              </div>
              <svg className="stat-viz" viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                {[0,1,2,3,4].map(i => <rect key={i} x="10" y={i*16+5} width={170-i*28} height="11" rx="5" fill={`rgba(108,92,231,${0.55-i*0.08})`}/>)}
              </svg>
              <div className="stat-num" data-target="24">24<span style={{fontSize:'0.5em',color:'var(--text-3)'}}>/7</span></div>
              <div className="stat-label">coverage,<br/>no shifts, no sick days</div>
            </div>
            {/* Stat 4 */}
            <div className="stat-cell">
              <div className="stat-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <svg className="stat-viz" viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <polyline points="10,80 36,68 62,72 88,48 114,55 140,28 166,38 190,18" stroke="rgba(108,92,231,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <polyline points="10,80 36,68 62,72 88,48 114,55 140,28 166,38 190,18 190,90 10,90" fill="rgba(108,92,231,0.08)"/>
                <circle cx="190" cy="18" r="5" fill="#a29bfe"/>
              </svg>
              <div className="stat-num">$0</div>
              <div className="stat-label">upfront cost —<br/>14 day free trial</div>
            </div>
          </div>
        </div>
      </section>
      <hr className="section-sep" />

      {/* PROBLEM */}
      <section className="problem" style={{backgroundImage:'url(/images/background/bg-problem.png)',backgroundSize:'cover',backgroundPosition:'right top'}}>
        <div className="container">
          <div className="problem-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>The Problem</div>
            <h2 className="h-section">Cold calls are eating your day.</h2>
            <p className="lede">The average SMB fields 15–40 cold sales calls every single day. Every one interrupts an operations manager, a finance team member, or a receptionist who should be focused on real work.</p>
          </div>
          <div className="problem-grid">
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 15.9 19.79 19.79 0 0 1 1.12 7.23 2 2 0 0 1 3.11 5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <svg className="problem-card-viz" viewBox="0 0 300 110" fill="none" preserveAspectRatio="xMidYMid meet">
                {[95,75,55,37,20].map((r,i) => <circle key={i} cx="130" cy="55" r={r} stroke={`rgba(108,92,231,${0.18+i*0.04})`} strokeWidth="1.5" fill="none"/>)}
                <circle cx="130" cy="55" r="7" fill="rgba(108,92,231,0.7)"/>
                <line x1="130" y1="55" x2="205" y2="18" stroke="rgba(108,92,231,0.35)" strokeWidth="1" strokeDasharray="4 3"/>
                <circle cx="205" cy="18" r="4" fill="#a29bfe"/>
              </svg>
              <div className="big">25<span className="unit">calls/day</span></div>
              <div className="head">Unwanted sales calls</div>
              <div className="sub">The median SMB logs 25 cold pitches per day — solar, insurance, SEO, warranties, the works.</div>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <svg className="problem-card-viz" viewBox="0 0 300 110" fill="none" preserveAspectRatio="xMidYMid meet">
                {[28,52,38,72,48,82,34,96,60,74,42,88,56,78,44].map((h,i) => <rect key={i} x={i*19+10} y={110-h} width="13" height={h} rx="4" fill={`rgba(108,92,231,${0.28+i*0.018})`}/>)}
              </svg>
              <div className="big">3<span className="unit">min each</span></div>
              <div className="head">Stolen from real work</div>
              <div className="sub">Every cold call costs 2–5 minutes between answering, declining, and refocusing. That's over an hour a day, per employee.</div>
            </div>
            <div className="problem-card reveal">
              <div className="problem-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <svg className="problem-card-viz" viewBox="0 0 300 110" fill="none" preserveAspectRatio="xMidYMid meet">
                <polyline points="10,95 50,82 90,87 130,62 170,70 210,38 255,52 285,22" stroke="rgba(108,92,231,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <polyline points="10,95 50,82 90,87 130,62 170,70 210,38 255,52 285,22 285,110 10,110" fill="rgba(108,92,231,0.07)"/>
                <circle cx="285" cy="22" r="6" fill="#a29bfe"/>
                <circle cx="285" cy="22" r="10" fill="rgba(162,155,254,0.2)"/>
              </svg>
              <div className="big">$14k<span className="unit">/year</span></div>
              <div className="head">Wasted payroll</div>
              <div className="sub">At $25/hour loaded cost, a 5-person ops team loses roughly $14,000 a year to calls that should never have been picked up.</div>
            </div>
          </div>
        </div>
      </section>

      <div style={{height:4,background:"linear-gradient(90deg,transparent,rgba(108,92,231,.25) 20%,rgba(45,140,255,.2) 50%,rgba(108,92,231,.25) 80%,transparent)",margin:0}} />

      {/* CAPABILITIES */}
      <section id="capabilities" style={{padding:'100px 0',backgroundImage:'url(/images/background/bg-capabilities.png)',backgroundSize:'cover',backgroundPosition:'right top'}}>
        <div className="container">
          <div className="caps-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Capabilities</div>
            <h2 className="h-section">Four things. All at once.<br/>Every single call.</h2>
            <p className="lede">Gate AI is not a voicemail menu. It's a real conversational agent that screens, classifies, routes, and summarizes in real time — powered by our Gate AI.</p>
          </div>
          <div className="caps-grid">
            {/* 01 DETECT */}
            <div className="cap reveal">
              <div className="cap-icon-row">
                <div className="cap-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 15.9 19.79 19.79 0 0 1 1.12 7.23 2 2 0 0 1 3.11 5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <span className="cap-num">01 · DETECT</span>
              </div>
              <h3>Cold-call detection in under 10 seconds</h3>
              <p>Our AI listens to the opening line and classifies intent before the caller finishes their pitch. Solar, SEO, warranties, robocalls — gone.</p>
              <div className="cap-visual">
                <svg style={{width:'100%',height:48,marginBottom:10}} viewBox="0 0 200 48" fill="none">
                  {Array.from({length:40},(_,i)=>{const h=5+Math.abs(Math.sin(i*0.7)*18+Math.sin(i*1.3)*8);return<rect key={i} x={i*5+2} y={24-h/2} width="3.5" height={h} rx="2" fill={i>25?"rgba(255,107,107,0.75)":"rgba(108,92,231,0.5)"}/>;})}
                </svg>
                <span className="prompt">intent:</span> commercial_solar<br/>
                <span className="prompt">confidence:</span> <span className="err">0.98</span><br/>
                <span className="prompt">risk:</span> <span style={{color:'var(--green)'}}>low</span>
              </div>
            </div>
            {/* 02 SCREEN */}
            <div className="cap reveal">
              <div className="cap-icon-row">
                <div className="cap-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <span className="cap-num">02 · SCREEN</span>
              </div>
              <h3>Polite rejection in your voice</h3>
              <p>Cold callers hear a professional, branded decline message — not dead air. Your brand stays intact, your team stays focused.</p>
              <div className="cap-visual">
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(108,92,231,0.15)',border:'1px solid rgba(108,92,231,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div style={{fontSize:11,color:'var(--text-2)'}}>Polite decline delivered<br/><span style={{color:'var(--text-3)',fontSize:10}}>Caller not convinced. No transfer needed.</span></div>
                </div>
                <div className="cap-visual-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Resolved
                </div>
              </div>
            </div>
            {/* 03 ROUTE */}
            <div className="cap reveal">
              <div className="cap-icon-row">
                <div className="cap-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </div>
                <span className="cap-num">03 · ROUTE</span>
              </div>
              <h3>Smart routing by intent</h3>
              <p>Legitimate callers get matched to the right person based on what they're calling about — ops, vendor, or finance.</p>
              <div className="cap-visual">
                <div className="cap-route-nodes">
                  <div className="cap-route-node"><div className="cap-route-dot"></div><div><span style={{color:'var(--text)',fontSize:10,fontWeight:600}}>OPS MANAGER</span><span style={{color:'var(--text-3)',fontSize:10}}> · Ext. 201</span></div></div>
                  <div className="cap-route-node"><div className="cap-route-dot" style={{background:'rgba(108,92,231,0.4)'}}></div><div><span style={{color:'var(--text)',fontSize:10,fontWeight:600}}>FINANCE TEAM</span><span style={{color:'var(--text-3)',fontSize:10}}> · Ext. 305</span></div></div>
                  <div className="cap-route-node"><div className="cap-route-dot" style={{background:'rgba(108,92,231,0.25)'}}></div><div><span style={{color:'var(--text)',fontSize:10,fontWeight:600}}>VENDOR RELATIONS</span><span style={{color:'var(--text-3)',fontSize:10}}> · Ext. 410</span></div></div>
                </div>
              </div>
            </div>
            {/* 04 SUMMARIZE */}
            <div className="cap reveal">
              <div className="cap-icon-row">
                <div className="cap-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <span className="cap-num">04 · SUMMARIZE</span>
              </div>
              <h3>Brief AI summary on every forward</h3>
              <p>The employee receives a concise AI summary — who's calling, which company, and exactly why.</p>
              <div className="cap-visual">
                <div style={{fontSize:11,fontWeight:600,color:'var(--text)',marginBottom:8}}>AI Summary</div>
                <div className="cap-summary-items">
                  <div className="cap-summary-item"><span className="cap-summary-check">✓</span>Caller: Daniel at AB Logistics</div>
                  <div className="cap-summary-item"><span className="cap-summary-check">✓</span>Need: Tuesday dock #3 confirmation</div>
                  <div className="cap-summary-item"><span className="cap-summary-check">✓</span>Reason: Reschedule pickup</div>
                  <div className="cap-summary-item"><span className="cap-summary-check">✓</span>Outcome: Routed to Ops Manager</div>
                </div>
                <div style={{marginTop:10,display:'inline-flex',alignItems:'center',padding:'3px 10px',background:'rgba(108,92,231,0.15)',border:'1px solid rgba(108,92,231,0.3)',borderRadius:6,fontSize:10,color:'#a29bfe'}}>Confidence: High</div>
              </div>
            </div>
          </div>
          <div className="caps-cta reveal">
            <a href="/capabilities" onClick={e => goPage(e, '/capabilities')} className="btn btn-ghost" style={{marginRight: 12}}>See all capabilities</a>
            <a href="/book-demo" onClick={goDemo} className="btn btn-primary">Book a Demo →</a>
          </div>
        </div>
      </section>
      <hr className="section-sep" />

      {/* INTEGRATIONS */}
      <section id="integrations" className="integrations" style={{backgroundImage:'url(/images/background/bg-integrations.png)',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="container">
          <div className="integrations-label">Works with the stack you already have</div>
          <div className="integrations-grid">
            {[
              { name: 'Twilio', file: 'twilio.png' },
              { name: 'Vapi', file: 'vapi.svg' },
              { name: 'OpenPhone', file: 'openphone.png' },
              { name: 'RingCentral', file: 'RingCentral.webp' },
              { name: 'Avaya', file: 'avaya.png' },
              { name: 'Talkroute', file: 'talkroute.png' },
              { name: 'Slack', file: 'slack.png' },
              { name: 'Microsoft Teams', file: 'microsoft-teams.png' },
              { name: 'Email / SMTP', file: 'email.webp' },
              { name: 'Zapier', file: 'zapier.webp' },
            ].map(({ name, file }) => (
              <a
                key={name}
                className="int-card"
                href="/integrations"
                onClick={e => goPage(e, '/integrations')}
              >
                <img src={`/images/integrations/${file}`} alt={name} className="int-logo" />
                {name}
              </a>
            ))}
          </div>
          <div className="integrations-more">
            <a href="/integrations" onClick={e => goPage(e, '/integrations')}>View all integrations →</a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:'100px 0',backgroundImage:'url(/images/background/bg-pricing.png)',backgroundSize:'cover',backgroundPosition:'right top'}}>
        <div className="container">
          <div className="pricing-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Pricing</div>
            <h2 className="h-section">One flat price.<br/>No per-minute surprises.</h2>
            <p className="lede" style={{margin:'0 auto'}}>Start with a 14-day free trial. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            <div className="tier reveal">
              <div className="tier-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 15.9 19.79 19.79 0 0 1 1.12 7.23 2 2 0 0 1 3.11 5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div className="tier-name">Starter</div>
              <div className="tier-price"><span className="num">$79</span><span className="per">/ month</span></div>
              <div className="tier-desc">For small teams getting 5–20 calls a day. Everything you need to silence cold callers.</div>
              <ul className="tier-features"><li>1 phone number</li><li>Up to 3 team members</li><li>AI cold-call blocking</li><li>Call summaries by email</li><li>Slack notifications</li></ul>
              <a href="/auth?plan=starter" onClick={e => goAuth(e, 'starter')} className="btn btn-ghost">Get started</a>
            </div>
            <div className="tier featured reveal">
              <div className="tier-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="tier-name">Pro</div>
              <div className="tier-price"><span className="num">$149</span><span className="per">/ month</span></div>
              <div className="tier-desc">Built for logistics and manufacturing SMBs with real inbound call volume.</div>
              <ul className="tier-features"><li>3 phone numbers</li><li>Unlimited team members</li><li>SMS + Slack + Email alerts</li><li>Custom AI screening scripts</li><li>Intent-based smart routing</li><li>Analytics dashboard</li></ul>
              <a href="/auth?plan=pro" onClick={e => goAuth(e, 'pro')} className="btn btn-primary">Get started</a>
            </div>
            <div className="tier reveal">
              <div className="tier-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className="tier-name">Business</div>
              <div className="tier-price"><span className="num">$249</span><span className="per">/ month</span></div>
              <div className="tier-desc">For multi-location operations that need custom integrations and priority support.</div>
              <ul className="tier-features"><li>Unlimited phone numbers</li><li>Priority support (4h SLA)</li><li>CRM integrations</li><li>Advanced analytics</li><li>Dedicated account manager</li><li>Custom voice cloning</li></ul>
              <a href="/contact" onClick={e => goPage(e, '/contact')} className="btn btn-ghost">Contact sales</a>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:36}}>
            <a href="/pricing" onClick={e => goPage(e, '/pricing')} className="btn btn-ghost" style={{padding:'12px 32px',fontSize:14,fontWeight:700,display:'inline-flex',alignItems:'center',gap:8}}>
              View full pricing details <span style={{color:'var(--accent)'}}>→</span>
            </a>
          </div>
        </div>
      </section>
      <hr className="section-sep" />

      {/* FAQ */}
      <section id="faq" style={{backgroundImage:'url(/images/background/bg-faq.png)',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="container">
          <div className="faq-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>FAQ</div>
            <h2 className="h-section">Questions? We've got answers.</h2>
          </div>
          <div className="faq-list">
            {[
              {q:'How long does setup take?',a:"Under 10 minutes. You sign up, we provision a phone number automatically, you configure your team and routing rules, and you're live. Most customers handle their first real call within an hour."},
              {q:'Will Gate AI replace my receptionist?',a:"Not at all — Gate AI works alongside your team, not instead of them. Think of it as a first filter: it handles the noise so your receptionist, office manager, or team only ever picks up calls that are actually worth their time. The 80% of calls that are cold pitches or misdials get handled automatically. The 20% that matter go straight through to the right person."},
              {q:'What happens if the AI misclassifies a call?',a:"You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and Gate AI learns from corrections. In practice, cold-call detection is 94%+ accurate out of the box."},
              {q:'Does it work with my existing phone system?',a:"Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer without replacing your main phone system."},
              {q:'What about VIP callers — clients who should never be screened?',a:"Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by number, company domain, or individual name."},
              {q:'How much does it actually cost per call?',a:"There's no per-call charge. Gate AI runs on a flat monthly subscription — Starter, Pro, or Business — and that covers your full call volume within your plan. You know exactly what you're paying each month with no surprises, no per-minute fees, and no usage spikes to worry about."},
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
      <hr className="section-sep" />

      {/* CTA */}
      <section className="cta" style={{backgroundImage:'url(/images/background/bg-cta.png)',backgroundSize:'cover',backgroundPosition:'center'}}>
        {/* Floating left panel — incoming calls */}
        <div className="cta-float-left">
          <div className="cta-float-label">Incoming Calls</div>
          {[{num:'+1 (205) 555-0143',t:'1 min ago'},{num:'+1 (702) 555-0187',t:'3 min ago'},{num:'+1 (312) 555-0192',t:'5 min ago'}].map((c,i) => (
            <div key={i} className="cta-float-call">
              <span className="cta-float-call-dot"></span>
              <span>{c.num}</span>
              <span className="cta-float-time">{c.t}</span>
            </div>
          ))}
        </div>
        {/* Center */}
        <div className="container cta-inner reveal">
          <h2>Stop answering<br/>calls that waste your time.</h2>
          <p>Gate AI takes 10 minutes to set up and starts saving your team time on day one.</p>
          <a href="/book-demo" onClick={goDemo} className="btn btn-primary" style={{padding:'16px 32px',fontSize:15}}>Book a Demo →</a>
        </div>
        {/* Floating right panel */}
        <div className="cta-float-right">
          <div className="cta-routed-badge">
            <div className="cta-routed-top">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Call Routed
            </div>
            <div className="cta-routed-detail">High priority<br/>Dispatched</div>
          </div>
          <div className="cta-headset">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          </div>
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
      {/* Industry modal */}
      {industryModal && (() => {
        const info = INDUSTRY_INFO[industryModal];
        return (
          <div className="ind-overlay" onClick={() => setIndustryModal(null)}>
            <div className="ind-modal" onClick={e => e.stopPropagation()}>
              <button className="ind-close" onClick={() => setIndustryModal(null)}>✕</button>
              <div className="ind-eyebrow">Gate AI for {industryModal}</div>
              <h2 className="ind-headline">{info.headline}</h2>
              <div className="ind-stats">
                {info.stats.map((s,i) => (
                  <div key={i} className="ind-stat">
                    <span className="ind-stat-val">{s.val}</span>
                    <span className="ind-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="ind-body">{info.body}</p>
              <a href="/book-demo" onClick={e => { e.preventDefault(); setIndustryModal(null); navigate('/book-demo'); }} className="btn btn-primary ind-cta">Book a Demo →</a>
            </div>
          </div>
        );
      })()}
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
    { r: 'gate',   d: 7600, t: "Appreciate the call, but we're not taking cold pitches on this line. I'll let you go — have a good one." },
    { r: 'result', d: 9600, type: 'blocked', title: '🚫 Call Blocked', sub: 'Cold call detected · 96% confidence · Logged' },
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

// Per-widget state so desktop ('') and mobile ('2') run independently
const _chatTimers = { '': [], '2': [] };
const _curTab = { '': 'blocked', '2': 'blocked' };

function clearChatTimers(suffix) {
  suffix = suffix || '';
  (_chatTimers[suffix] || []).forEach(t => clearTimeout(t));
  _chatTimers[suffix] = [];
}

function showChatResult(type, title, sub, suffix) {
  suffix = suffix || '';
  const msgs = document.getElementById('chat-msgs' + suffix);
  const rt = document.getElementById('result-takeover' + suffix);
  const sb = document.getElementById('shield-big' + suffix);
  const rtitle = document.getElementById('result-title' + suffix);
  const rsub = document.getElementById('result-sub' + suffix);
  if (!msgs || !rt) return;
  msgs.style.opacity = '0';
  const t1 = setTimeout(() => {
    sb.className = 'shield-big ' + (type === 'blocked' ? 'shield-blocked' : 'shield-forwarded');
    sb.innerHTML = SHIELD_SVG[type];
    rtitle.className = 'result-title ' + type;
    rtitle.textContent = title;
    rsub.textContent = sub;
    rt.style.pointerEvents = 'auto';
    rt.classList.add('show');
    const t2 = setTimeout(() => { sb.classList.add('pop'); rtitle.classList.add('show'); rsub.classList.add('show'); }, 100);
    _chatTimers[suffix].push(t2);
    const t3 = setTimeout(() => {
      _curTab[suffix] = _curTab[suffix] === 'blocked' ? 'forwarded' : 'blocked';
      const tb = document.getElementById('tab-b' + suffix);
      const tf = document.getElementById('tab-f' + suffix);
      if (tb) tb.className = 'c-tab' + (_curTab[suffix] === 'blocked' ? ' active' : '');
      if (tf) tf.className = 'c-tab' + (_curTab[suffix] === 'forwarded' ? ' active' : '');
      if (msgs) msgs.style.opacity = '1';
      rt.classList.remove('show'); rt.style.pointerEvents = 'none';
      sb.classList.remove('pop'); rtitle.classList.remove('show'); rsub.classList.remove('show');
      runChatScenario(suffix);
    }, 4000);
    _chatTimers[suffix].push(t3);
  }, 400);
  _chatTimers[suffix].push(t1);
}

function runChatScenario(suffix) {
  suffix = suffix || '';
  clearChatTimers(suffix);
  const el = document.getElementById('chat-msgs' + suffix);
  if (!el) return;
  el.innerHTML = '';
  el.style.opacity = '1';
  const sb = document.getElementById('shield-big' + suffix);
  const rtitle = document.getElementById('result-title' + suffix);
  const rsub = document.getElementById('result-sub' + suffix);
  const rt = document.getElementById('result-takeover' + suffix);
  if (sb) sb.classList.remove('pop');
  if (rtitle) rtitle.classList.remove('show');
  if (rsub) rsub.classList.remove('show');
  if (rt) { rt.classList.remove('show'); rt.style.pointerEvents = 'none'; }

  SCENARIOS[_curTab[suffix]].forEach((step, i) => {
    if (step.r === 'result') {
      _chatTimers[suffix].push(setTimeout(() => showChatResult(step.type, step.title, step.sub, suffix), step.d));
      return;
    }
    if (step.r === 'gate') {
      _chatTimers[suffix].push(setTimeout(() => {
        const t = document.createElement('div'); t.className = 'chat-typing'; t.id = 'ctyp' + suffix + i;
        t.innerHTML = '<span></span><span></span><span></span>';
        el.appendChild(t); requestAnimationFrame(() => t.classList.add('show')); el.scrollTop = el.scrollHeight;
      }, step.d - 650));
    }
    _chatTimers[suffix].push(setTimeout(() => {
      const old = document.getElementById('ctyp' + suffix + i); if (old) old.remove();
      const m = document.createElement('div'); m.className = 'chat-msg ' + step.r;
      const av = step.r === 'gate' ? GATE_AV : CALLER_AV;
      const who = step.r === 'gate' ? 'Gate AI' : 'Caller';
      m.innerHTML = `<div class="chat-msg-hdr">${av}<span class="chat-msg-who">${who}</span></div><div class="chat-bubble">${step.t}</div>`;
      el.appendChild(m); requestAnimationFrame(() => m.classList.add('show')); el.scrollTop = el.scrollHeight;
    }, step.d));
  });
}

function startChatSequence(timers) {
  // Animate both desktop (#ph-ring) and mobile (#ph-ring2) widgets
  ['', '2'].forEach(suffix => {
    const ring = document.getElementById('ph-ring' + suffix);
    const done = document.getElementById('ph-done' + suffix);
    const chat = document.getElementById('ph-chat' + suffix);
    const dc   = document.getElementById('done-circle' + suffix);
    const dl   = document.getElementById('done-lbl' + suffix);
    if (!ring) return;

    timers.push(setTimeout(() => {
      ring.style.opacity = '0'; ring.style.pointerEvents = 'none';
      if (done) { done.style.opacity = '1'; }
      if (dc) dc.style.transform = 'scale(1)';
      if (dl) dl.style.opacity = '1';
    }, 2600));
    timers.push(setTimeout(() => {
      if (done) { done.style.opacity = '0'; done.style.pointerEvents = 'none'; }
      if (chat) chat.style.opacity = '1';
      if (suffix === '') runChatScenario('');
      else runChatScenario('2');
    }, 3900));
  });
}

window.switchChatTab = (tab) => {
  ['', '2'].forEach(s => {
    _curTab[s] = tab;
    const tb = document.getElementById('tab-b' + s);
    const tf = document.getElementById('tab-f' + s);
    if (tb) tb.className = 'c-tab' + (tab === 'blocked' ? ' active' : '');
    if (tf) tf.className = 'c-tab' + (tab === 'forwarded' ? ' active' : '');
  });
  runChatScenario(''); runChatScenario('2');
};

window.switchChatTab2 = (tab) => window.switchChatTab(tab);

window.replayChatAnim = () => {
  ['', '2'].forEach(s => {
    const msgs = document.getElementById('chat-msgs' + s);
    if (msgs) msgs.style.opacity = '1';
    runChatScenario(s);
  });
};

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Inter:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root{
  --bg:#ffffff;
  --bg-soft:#f7f9ff;
  --panel:rgba(255,255,255,.84);
  --panel-strong:rgba(255,255,255,.96);
  --text:#070b24;
  --text-2:#23304f;
  --text-3:#71809e;
  --muted:#8b96b2;
  --border:#dfe6f6;
  --border-2:#cfd8f0;
  --accent:#6C5CE7;
  --accent-2:#7D6BFF;
  --accent-blue:#2D8CFF;
  --cyan:#25C7E8;
  --teal:#10BFA8;
  --coral:#ff6b57;
  --orange:#ff9f43;
  --green:#10c99b;
  --danger:#ff5c7a;
  --shadow:0 26px 70px rgba(23,34,88,.13);
  --shadow-strong:0 34px 90px rgba(62,75,150,.18);
  --font:'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;background:var(--bg);}
body{font-family:var(--font);background:#fff;color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}
a{text-decoration:none;color:inherit}button{font-family:inherit}img{max-width:100%;display:block}.section-sep{height:1px;background:linear-gradient(90deg,transparent,rgba(108,92,231,.18),rgba(45,140,255,.12),transparent);margin:0;border:none}.container{width:min(1450px,calc(100% - 56px));margin:0 auto;position:relative;z-index:3}
@media(max-width:720px){.container{width:min(100% - 30px,1450px)}}

.nav{position:fixed;top:16px;left:0;right:0;z-index:1000;pointer-events:none}.nav-inner{width:min(1640px,calc(100% - 80px));height:78px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:28px;padding:0 32px;border-radius:24px;background:rgba(255,255,255,.92);border:1.5px solid rgba(108,92,231,.18);box-shadow:0 8px 40px rgba(108,92,231,.12),0 2px 12px rgba(51,65,120,.08),inset 0 1px 0 rgba(255,255,255,.95);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);pointer-events:auto;transition:box-shadow .3s}.nav-inner:hover{box-shadow:0 12px 52px rgba(108,92,231,.18),0 2px 12px rgba(51,65,120,.1),inset 0 1px 0 rgba(255,255,255,.95)}.logo{display:flex;align-items:center;gap:12px;font-size:21px;font-weight:800;color:var(--text);white-space:nowrap}.logo svg{filter:drop-shadow(0 6px 14px rgba(108,92,231,.28))}.nav-links{display:flex;align-items:center;gap:30px;list-style:none}.nav-links a{font-size:15px;font-weight:700;color:#17213c;transition:color .18s,transform .18s;position:relative;padding-bottom:2px}.nav-links a::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent-blue));border-radius:2px;transform:scaleX(0);transition:transform .2s}.nav-links a:hover{color:var(--accent);transform:translateY(-1px)}.nav-links a:hover::after{transform:scaleX(1)}.nav-divider{width:1px;height:28px;background:linear-gradient(to bottom,transparent,rgba(108,92,231,.25),transparent);margin:0 4px}.nav-cta{display:flex;align-items:center;gap:10px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 26px;border-radius:999px;font-weight:800;font-size:15px;line-height:1;border:1px solid transparent;cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s,background .18s}.btn:hover{transform:translateY(-2px)}.btn-primary{color:#fff;background:linear-gradient(135deg,#7a5cff 0%,#6139e6 52%,#2d8cff 100%);box-shadow:0 20px 38px rgba(108,92,231,.26),inset 0 1px 0 rgba(255,255,255,.25)}.btn-primary:hover{box-shadow:0 25px 52px rgba(108,92,231,.34)}.btn-ghost{background:rgba(255,255,255,.72);border-color:#cfd8f0;color:#121a35;box-shadow:0 12px 34px rgba(27,44,90,.08)}.btn-ghost:hover{border-color:#8e80ff;color:var(--accent)}.nav-btn{height:52px;padding:0 26px}@media(max-width:980px){.nav-inner{width:min(100% - 24px,1640px);height:70px;padding:0 18px;border-radius:22px}.nav-links{display:none}.logo{font-size:18px}.nav-btn{height:44px;padding:0 18px;font-size:13px}}

section{position:relative;overflow:hidden}.eyebrow{display:inline-flex;align-items:center;gap:10px;padding:9px 16px;border:1px solid rgba(108,92,231,.34);background:rgba(255,255,255,.74);border-radius:999px;color:var(--accent);font-weight:800;font-size:12px;letter-spacing:2px;text-transform:uppercase;box-shadow:0 12px 35px rgba(108,92,231,.12);backdrop-filter:blur(10px)}.eyebrow-dot{width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--cyan));box-shadow:0 0 12px rgba(108,92,231,.7),0 0 24px rgba(37,199,232,.4);animation:dotpulse 2.4s ease infinite}@keyframes dotpulse{0%,100%{box-shadow:0 0 12px rgba(108,92,231,.7),0 0 24px rgba(37,199,232,.4)}50%{box-shadow:0 0 18px rgba(108,92,231,1),0 0 32px rgba(37,199,232,.6)}}.h-display{font-size:clamp(54px,6.2vw,112px);line-height:.96;letter-spacing:-.062em;font-weight:800;color:#070b24}.h-section{font-size:clamp(40px,4.4vw,74px);line-height:1.02;letter-spacing:-.055em;font-weight:800;color:#070b24}.lede{font-size:clamp(16px,1.3vw,21px);line-height:1.65;color:var(--text-2);max-width:700px}.accent{background:linear-gradient(125deg,#6C5CE7 0%,#2D8CFF 52%,#20c8df 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}

.hero{min-height:100svh;padding:150px 0 78px;background:url('/images/background/bg-hero.png') center center/cover no-repeat;display:flex;align-items:center;}.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.30) 0%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.18) 100%);pointer-events:none}.section-overlay{position:relative;z-index:2}.section-overlay::before{content:'';position:absolute;inset:-16px -20px;border-radius:16px;background:rgba(255,255,255,.72);backdrop-filter:blur(4px);z-index:-1;pointer-events:none}.hero-globe-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;opacity:.92;mix-blend-mode:normal}.hero-inner{display:grid;grid-template-columns:minmax(380px,500px) 1fr;gap:60px;align-items:center;min-height:calc(100svh - 220px);position:relative;z-index:4}.hero-left{position:relative;z-index:5;max-width:500px}.hero-left .eyebrow{margin-bottom:28px}.hero-left .h-display{margin-bottom:28px}.hero-left .accent{font-style:italic;font-weight:800}.hero-lede{font-size:clamp(18px,1.45vw,24px);line-height:1.55;color:#273254;max-width:710px;margin:0 0 36px}.hero-lede br+*{color:inherit}.hero-ctas{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.hero-right{position:relative;z-index:6;display:flex;justify-content:flex-end}.hero-globe-counter{position:absolute;left:51%;bottom:8.4%;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:16px;padding:14px 22px;border-radius:18px;background:rgba(255,255,255,.82);border:1px solid rgba(200,210,235,.7);box-shadow:0 18px 40px rgba(40,60,120,.12);backdrop-filter:blur(14px)}.hgc-item{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:800;color:#253052}.hgc-dot{width:9px;height:9px;border-radius:50%;display:inline-block;box-shadow:0 0 14px currentColor}.hgc-red{background:var(--danger);color:var(--danger)}.hgc-green{background:var(--green);color:var(--green)}.hgc-item + .hgc-item{border-left:1px solid #dce3f2;padding-left:16px}

.phone-shell{width:min(100%,470px);padding:0;border-radius:26px;background:transparent;box-shadow:0 30px 90px rgba(108,92,231,.18),0 8px 24px rgba(35,49,95,.12)}.phone-frame{background:rgba(255,255,255,.96);border:1.5px solid rgba(108,92,231,.22);border-radius:26px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 0 0 4px rgba(108,92,231,.06);backdrop-filter:blur(20px)}.pf-top{height:54px;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:1px solid rgba(108,92,231,.18);background:linear-gradient(90deg,rgba(248,246,255,.96),rgba(255,255,255,.98))}.mac-dot{width:12px;height:12px;border-radius:50%}.mac-r{background:#ff5f57;box-shadow:0 0 6px rgba(255,95,87,.4)}.mac-y{background:#febc2e;box-shadow:0 0 6px rgba(254,188,46,.4)}.mac-g{background:#28c840;box-shadow:0 0 6px rgba(40,200,64,.4)}.pf-bar-right{margin-left:auto;display:flex;gap:8px;align-items:center}.pf-label{font-family:var(--mono);font-size:12px;color:#8a95ad}.pf-label b{color:var(--accent)}.pf-body{height:450px;position:relative;overflow:hidden;background:linear-gradient(180deg,#f5f3ff 0%,#eceaff 50%,#f0f4ff 100%)}.ph{position:absolute;inset:0;transition:opacity .4s;display:flex;flex-direction:column}.ph-ring,.ph-done{align-items:center;justify-content:center}.ph-done,.ph-chat{opacity:0}.ring-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(108,92,231,.22) 0%,rgba(108,92,231,.08) 40%,transparent 68%)}.ring-content{position:relative;display:flex;align-items:center;flex-direction:column;gap:14px}.ring-wrap{width:82px;height:82px;position:relative;display:grid;place-items:center}.rp{position:absolute;inset:0;border-radius:50%;border:1.4px solid rgba(108,92,231,.26);animation:rout 2s ease infinite}.rp:nth-child(2){animation-delay:.65s}.rp:nth-child(3){animation-delay:1.3s}@keyframes rout{0%{transform:scale(.72);opacity:.9}100%{transform:scale(2.4);opacity:0}}.ring-icon{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#7d6bff,#2D8CFF);box-shadow:0 16px 40px rgba(108,92,231,.45),0 0 0 6px rgba(108,92,231,.12);animation:rbob .45s ease infinite alternate}.ring-icon svg{stroke:#fff!important}@keyframes rbob{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}.ring-lbl,.done-lbl{font-size:13px;color:#596482;font-weight:700}.done-circle{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#10c99b,#23d3e2);display:grid;place-items:center;transform:scale(0);transition:transform .45s cubic-bezier(.34,1.56,.64,1);box-shadow:0 18px 42px rgba(16,201,155,.24)}.done-lbl{opacity:0;margin-top:14px;transition:opacity .3s .2s}.chat-tabs{display:flex;gap:8px;padding:16px 16px 10px}.c-tab{flex:1;border:1px solid #dfe5f3;background:rgba(255,255,255,.62);color:#7b86a0;padding:12px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer}.c-tab.active{border-color:#8d7cff;background:linear-gradient(180deg,rgba(108,92,231,.12),rgba(255,255,255,.65));color:var(--accent)}.chat-hdr{padding:0 16px 12px;border-bottom:1px solid #e6ebf6}.hdr-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid #dde5f4;background:#fff;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:800;color:#2d3856}.hdr-live{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green);animation:livep 1.4s ease infinite}@keyframes livep{50%{opacity:.35;box-shadow:none}}.msgs-wrap{position:relative;flex:1;overflow:hidden}.msgs{position:absolute;inset:0;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px;transition:opacity .45s}.msgs::-webkit-scrollbar{display:none}.chat-msg{display:flex;flex-direction:column;gap:4px;opacity:0;transform:translateY(8px);transition:.35s}.chat-msg.show{opacity:1;transform:none}.chat-msg.gate{align-self:flex-start;max-width:88%}.chat-msg.caller{align-self:flex-end;max-width:88%}.chat-msg-hdr{display:flex;align-items:center;gap:6px}.chat-msg.caller .chat-msg-hdr{flex-direction:row-reverse}.chat-gate-av,.chat-caller-av{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}.chat-gate-av{background:linear-gradient(135deg,#6C5CE7,#2D8CFF)}.chat-caller-av{background:#fff;border:1px solid #dce4f5}.chat-msg-who{font-size:10px;letter-spacing:.8px;text-transform:uppercase;font-weight:900}.chat-msg.gate .chat-msg-who{color:var(--accent)}.chat-msg.caller .chat-msg-who{color:#8b96b2}.chat-bubble{padding:12px 15px;border-radius:16px;font-size:14px;line-height:1.45;color:#1c2745;background:#fff;border:1px solid #e1e7f5;box-shadow:0 10px 28px rgba(40,55,110,.08)}.chat-msg.gate .chat-bubble{background:linear-gradient(135deg,#f0ecff,#ebe6ff);border-color:#cdc4ff;border-bottom-left-radius:4px;box-shadow:0 4px 12px rgba(108,92,231,.1)}.chat-msg.caller .chat-bubble{background:#f7f9ff;border-bottom-right-radius:4px}.chat-typing{width:max-content;padding:12px 15px;background:#fff;border:1px solid #e0e7f5;border-radius:16px;display:flex;gap:4px;opacity:0}.chat-typing.show{opacity:1}.chat-typing span{width:5px;height:5px;border-radius:50%;background:#8a95ad;animation:td 1.2s ease infinite}.chat-typing span:nth-child(2){animation-delay:.15s}.chat-typing span:nth-child(3){animation-delay:.3s}@keyframes td{50%{transform:translateY(-4px);opacity:.5}}.result-takeover{position:absolute;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none;transition:opacity .35s;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(245,248,255,.96))}.result-takeover.show{opacity:1}.shield-big{transform:scale(.8);transition:.35s}.shield-big.pop{transform:scale(1)}.result-title{font-weight:900;font-size:22px;margin-top:-80px;opacity:0;transition:.3s}.result-title.show,.result-sub.show{opacity:1}.result-title.blocked{color:var(--danger)}.result-title.forwarded{color:var(--green)}.result-sub{font-size:13px;color:#65718f;opacity:0;margin-top:-110px}

.phone-section{display:none;background:#fff;padding:48px 0}.industries{padding:105px 0 100px;background-size:cover;background-position:center}.industries-label{text-align:center;text-transform:uppercase;letter-spacing:3px;color:#66718e;font-weight:800;font-size:13px;margin-bottom:34px}.industries-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 20px;max-width:1180px;margin:0 auto}.industry-chip{display:inline-flex;align-items:center;gap:12px;min-height:56px;padding:0 28px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid rgba(210,219,242,.9);box-shadow:0 14px 42px rgba(31,46,92,.09),inset 0 1px 0 rgba(255,255,255,.9);font-weight:800;color:#2a3454;backdrop-filter:blur(12px);transition:.2s}.industry-chip:hover{transform:translateY(-3px);border-color:#8e80ff;background:rgba(108,92,231,.06);box-shadow:0 18px 46px rgba(108,92,231,.18)}.industry-chip svg{width:19px;height:19px;color:var(--accent)}

.stats{padding:112px 0 100px;background-size:cover;background-position:center;border-top:1px solid rgba(108,92,231,.1);border-bottom:1px solid rgba(108,92,231,.08)}.stats-head{text-align:center;margin-bottom:66px}.stats-head .eyebrow{margin-bottom:28px}.stats-panel{max-width:1430px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);border-radius:30px;background:rgba(255,255,255,.97);border:1.5px solid rgba(108,92,231,.15);box-shadow:0 32px 80px rgba(41,61,120,.16),0 8px 24px rgba(108,92,231,.08),inset 0 1px 0 rgba(255,255,255,.95);backdrop-filter:blur(20px);overflow:hidden}.stat-cell{min-height:260px;padding:36px 42px 34px;position:relative;border-right:1px solid #dbe3f4;display:flex;flex-direction:column;justify-content:flex-end}.stat-cell:last-child{border-right:0}.stat-icon-circle{position:absolute;top:32px;left:38px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:#f1f4ff;border:1px solid #d6def4;color:var(--accent)}.stat-icon-circle svg{width:20px;height:20px}.stat-viz{position:absolute;top:48px;left:25%;width:58%;height:98px;opacity:.35}.stat-num{font-size:clamp(54px,4.9vw,88px);font-weight:900;letter-spacing:-.06em;line-height:.88;background:linear-gradient(135deg,#6C5CE7,#2D8CFF);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:18px}.stat-label{font-size:19px;line-height:1.28;color:#14203e;font-weight:800}.stat-label strong,.stat-label span.accent-teal{color:var(--teal)}.stat-label br + *{color:inherit}

.problem{padding:116px 0 104px;background-size:cover;background-position:center;background-color:#fafbff}.problem-head{max-width:760px;margin-bottom:58px;position:relative;z-index:2}.problem-head::before{content:'';position:absolute;inset:-20px -24px;border-radius:18px;background:rgba(255,255,255,.68);backdrop-filter:blur(6px);z-index:-1;pointer-events:none}.problem-head .eyebrow{margin-bottom:24px}.problem-head .h-section{max-width:620px;margin-bottom:24px}.problem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}.problem-card{min-height:300px;border-radius:28px;padding:34px 36px;background:rgba(255,255,255,.88);border:1px solid rgba(207,216,240,.86);box-shadow:0 26px 70px rgba(33,50,104,.12);backdrop-filter:blur(15px);position:relative;overflow:hidden}.problem-card::after{content:'';position:absolute;inset:auto 0 0 0;height:4px;background:linear-gradient(90deg,var(--accent),var(--cyan),var(--coral));opacity:.9}.problem-card-icon{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;background:#f2f5ff;border:1px solid #d7dff5;color:var(--accent);margin-bottom:18px}.problem-card-icon svg{width:21px;height:21px}.problem-card-viz{position:absolute;top:22px;right:18px;width:46%;height:120px;opacity:.3}.problem-card .big{font-size:clamp(54px,5vw,82px);font-weight:900;letter-spacing:-.06em;background:linear-gradient(135deg,#6C5CE7,#2D8CFF);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-top:28px;line-height:.9}.problem-card .unit{font-size:.32em;color:#737e99;letter-spacing:-.04em;margin-left:5px}.problem-card .head{font-size:18px;font-weight:900;color:#0b132d;margin:20px 0 10px}.problem-card .sub{font-size:15px;line-height:1.55;color:#53607f}

#capabilities{padding:112px 0 108px!important;background-size:auto 70%;background-position:right 0% center;background-repeat:no-repeat;background-color:#f9f8ff}#capabilities::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 15% 50%,rgba(108,92,231,.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 80%,rgba(37,199,232,.05) 0%,transparent 45%);pointer-events:none;z-index:0}.caps-head{max-width:740px;margin-bottom:60px;position:relative;z-index:2}.caps-head::before{content:'';position:absolute;inset:-20px -24px;border-radius:18px;background:rgba(255,255,255,.68);backdrop-filter:blur(6px);z-index:-1;pointer-events:none}.caps-head .eyebrow{margin-bottom:22px}.caps-head .h-section{margin-bottom:22px}.caps-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:26px}.cap{min-height:315px;border-radius:28px;padding:34px 36px;background:rgba(255,255,255,.88);border:1px solid rgba(207,216,240,.88);box-shadow:0 28px 80px rgba(33,50,104,.12);backdrop-filter:blur(15px);position:relative;overflow:hidden}.cap::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 86% 14%,rgba(108,92,231,.12),transparent 30%),radial-gradient(circle at 18% 92%,rgba(37,199,232,.10),transparent 32%);pointer-events:none}.cap-icon-row{display:flex;align-items:center;gap:16px;position:relative}.cap-icon-circle{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#f1f4ff;border:1px solid #d7dff5;color:var(--accent)}.cap-icon-circle svg{width:22px;height:22px}.cap-num{font-family:var(--mono);font-size:13px;font-weight:900;letter-spacing:.9px;color:var(--accent)}.cap h3{font-size:28px;line-height:1.1;letter-spacing:-.035em;color:#0c132d;margin:28px 0 14px;position:relative}.cap p{font-size:16px;line-height:1.55;color:#4b5876;max-width:760px;position:relative}.cap-visual{position:relative;margin-top:22px;padding:16px;border:1px solid #dfe6f6;border-radius:16px;background:rgba(247,249,255,.82);box-shadow:inset 0 1px 0 #fff;font-family:var(--mono);font-size:13px;line-height:1.6;color:#16203e}.cap-visual .prompt{color:var(--accent);font-weight:900}.cap-visual .err{color:var(--danger)}.cap-visual-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;background:#fff;border:1px solid #dce4f5;color:var(--accent);font-family:var(--font);font-weight:800}.cap-route-nodes,.cap-summary-items{display:flex;flex-direction:column;gap:10px}.cap-route-node{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid #e1e7f5;border-radius:13px;padding:10px 12px}.cap-route-dot{width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px rgba(108,92,231,.3)}.cap-summary-item{display:flex;gap:8px;align-items:flex-start;font-family:var(--font);font-size:14px;color:#303c5d}.cap-summary-check{color:var(--green);font-weight:900}.caps-cta{display:flex;gap:14px;align-items:center;margin-top:36px;flex-wrap:wrap}

.integrations{padding:96px 0 100px;background-size:cover;background-position:center;background-color:#f8f7ff;border-top:1px solid rgba(108,92,231,.12);border-bottom:1px solid rgba(108,92,231,.12)}.integrations-label{text-align:center;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#66718e;font-weight:800;margin-bottom:38px}.integrations-grid{display:flex;justify-content:center;flex-wrap:wrap;gap:18px;max-width:1300px;margin:0 auto}.int-card{height:72px;min-width:174px;display:flex;align-items:center;justify-content:center;gap:14px;padding:0 28px;background:rgba(255,255,255,.9);border:1px solid rgba(208,217,241,.88);border-radius:20px;box-shadow:0 18px 48px rgba(41,58,112,.12),inset 0 1px 0 rgba(255,255,255,.9);font-size:17px;font-weight:900;color:#17213b;transition:.2s;backdrop-filter:blur(12px)}.int-card:hover{transform:translateY(-4px);border-color:#8e80ff;box-shadow:0 25px 60px rgba(108,92,231,.18)}.int-logo{width:34px;height:34px;object-fit:contain;border-radius:8px}.integrations-more{text-align:center;margin-top:34px}.integrations-more a{font-size:15px;color:var(--accent);font-weight:900}

#pricing{padding:114px 0 106px!important;background-size:cover;background-position:center}.pricing-head{text-align:center;margin-bottom:54px}.pricing-head .eyebrow{margin-bottom:22px}.pricing-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;max-width:1140px;margin:0 auto}.tier{min-height:530px;display:flex;flex-direction:column;border-radius:28px;padding:34px 32px;background:rgba(255,255,255,.9);border:1px solid rgba(207,216,240,.9);box-shadow:0 26px 72px rgba(38,54,111,.12);backdrop-filter:blur(14px);position:relative;transition:.22s}.tier:hover{transform:translateY(-5px);box-shadow:0 34px 88px rgba(38,54,111,.16)}.tier.featured{border-color:#7f70ff;box-shadow:0 34px 94px rgba(108,92,231,.22);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(246,248,255,.92))}.tier.featured::before{content:'MOST POPULAR';position:absolute;top:-15px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7d6bff,#5c39df);color:#fff;border-radius:999px;padding:8px 18px;font-size:11px;letter-spacing:.8px;font-weight:900;box-shadow:0 14px 35px rgba(108,92,231,.26)}.tier-icon{width:46px;height:46px;border-radius:15px;background:#f1f4ff;border:1px solid #d6def4;color:var(--accent);display:grid;place-items:center;margin-bottom:18px}.tier-icon svg{width:21px;height:21px}.tier-name{text-transform:uppercase;letter-spacing:1.3px;font-size:13px;color:var(--accent);font-weight:900;margin-bottom:14px}.tier:nth-child(3) .tier-name,.tier:nth-child(3) .tier-icon{color:var(--coral)}.tier-price{display:flex;align-items:baseline;gap:8px;margin-bottom:16px}.tier-price .num{font-size:60px;line-height:.9;font-weight:900;letter-spacing:-.06em;color:#08102d}.tier-price .per{font-size:14px;color:#727e99;font-weight:800}.tier-desc{font-size:15px;line-height:1.5;color:#53617f;padding-bottom:24px;border-bottom:1px solid #e5ebf7;margin-bottom:24px}.tier-features{list-style:none;display:flex;flex-direction:column;gap:13px;margin-bottom:30px;flex:1}.tier-features li{display:flex;gap:11px;align-items:flex-start;font-size:15px;color:#26324f;font-weight:700;line-height:1.35}.tier-features li::before{content:'✓';width:18px;height:18px;border-radius:50%;background:rgba(16,201,155,.12);color:var(--green);font-weight:900;font-size:12px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:1px}.tier .btn{width:100%;justify-content:center}

#faq{padding:112px 0 100px;background-size:cover;background-position:center}.faq-head{text-align:center;margin-bottom:52px}.faq-head .eyebrow{margin-bottom:22px}.faq-list{max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:16px}.faq-item{border-radius:18px;background:rgba(255,255,255,.88);border:1px solid rgba(207,216,240,.9);box-shadow:0 16px 42px rgba(36,52,105,.09);backdrop-filter:blur(12px);overflow:hidden}.faq-item[open]{box-shadow:0 22px 56px rgba(108,92,231,.14);border-color:#a89cff}.faq-item summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:22px;padding:24px 30px;font-size:18px;font-weight:900;color:#0b1430}.faq-item summary::-webkit-details-marker{display:none}.faq-item summary::after{content:'+';font-size:24px;line-height:1;width:32px;height:32px;border-radius:50%;border:2px solid rgba(108,92,231,.3);color:var(--accent);font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.2s}.faq-item[open] summary::after{background:var(--accent);color:#fff;border-color:var(--accent)}.faq-item[open] summary::after{transform:rotate(45deg)}.faq-item p{padding:0 30px 26px;font-size:15.5px;line-height:1.65;color:#53617e}.faq-more{text-align:center;margin-top:30px}.faq-more a{font-weight:900;color:var(--accent)}

.cta{padding:128px 0 132px;background-size:cover;background-position:center;min-height:600px;display:flex;align-items:center}.cta-inner{text-align:center;max-width:780px}.cta h2{font-size:clamp(46px,6vw,86px);line-height:.98;letter-spacing:-.06em;color:#07102b;font-weight:900;margin-bottom:22px}.cta h2 span{background:linear-gradient(125deg,var(--accent),var(--cyan));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.cta p{font-size:21px;line-height:1.55;color:#2b3658;margin-bottom:34px}.cta-float-left,.cta-float-right{position:absolute;display:none}.footer-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.footer-links{display:flex;gap:24px;list-style:none;flex-wrap:wrap}.footer-links a,.footer-copy{font-size:13px;color:#73809b}footer{padding:54px 0;background:#fff;border-top:1px solid rgba(108,92,231,.12)}

.ind-overlay,.ind-modal-backdrop{position:fixed;inset:0;z-index:2000;background:rgba(13,20,40,.34);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:24px}.ind-modal{max-width:560px;width:100%;background:rgba(255,255,255,.96);border:1px solid #d9e1f4;border-radius:28px;padding:34px;box-shadow:0 36px 90px rgba(12,20,55,.24);position:relative}.ind-close{position:absolute;right:18px;top:18px;width:34px;height:34px;border-radius:50%;border:1px solid #dce4f5;background:#fff;color:#222;cursor:pointer;font-size:20px}.ind-eyebrow{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);font-weight:900;margin-bottom:12px}.ind-headline,.ind-modal h2,.ind-modal h3{font-size:34px;line-height:1.06;letter-spacing:-.04em;margin-bottom:16px;color:#09112d}.ind-body,.ind-modal p{font-size:16px;line-height:1.65;color:#465573;white-space:pre-line;margin-bottom:22px}.ind-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.ind-stat{background:#f6f8ff;border:1px solid #dfe6f6;border-radius:16px;padding:16px}.ind-stat-val{font-size:24px;font-weight:900;color:var(--accent)}.ind-stat-label{font-size:12px;color:#65718e;margin-top:4px}.ind-modal .btn{margin-top:20px;width:100%}

.reveal{opacity:0;transform:translateY(26px);transition:opacity .72s cubic-bezier(.2,.8,.2,1),transform .72s cubic-bezier(.2,.8,.2,1)}.reveal.in{opacity:1;transform:none}

@media(max-width:1100px){.hero-inner{grid-template-columns:1fr;gap:40px}.hero-right{justify-content:center;width:100%}.hero-globe-counter{left:50%;bottom:4%}.problem-grid,.pricing-grid{grid-template-columns:1fr}.caps-grid{grid-template-columns:1fr}.stats-panel{grid-template-columns:repeat(2,1fr)}.stat-cell:nth-child(2){border-right:0}.stat-cell:nth-child(-n+2){border-bottom:1px solid #dbe3f4}.cta-float-left,.cta-float-right{display:none!important}.phone-shell{width:min(100%,520px);margin:0 auto}}
@media(max-width:720px){.hero{padding:120px 0 56px}.hero-globe-canvas{opacity:.55}.hero-inner{display:block}.hero-left{max-width:100%}.h-display{font-size:clamp(44px,11vw,58px)}.h-section{font-size:clamp(32px,9vw,46px)}.hero-lede{font-size:16px;line-height:1.6}.hero-ctas{flex-direction:column;align-items:flex-start;gap:12px}.hero-right{display:none}.phone-section{display:block}.phone-shell{width:100%}.hero-globe-counter{position:relative;left:auto;bottom:auto;transform:none;margin:32px auto 0;width:max-content}.stats-panel{grid-template-columns:1fr}.stat-cell{border-right:0!important;border-bottom:1px solid #dbe3f4;min-height:auto;padding:28px 24px 24px}.stat-cell .stat-icon-circle{position:relative;top:auto;left:auto;margin-bottom:16px}.stat-cell .stat-viz{display:none}.stat-cell .stat-num{font-size:clamp(44px,12vw,64px);margin-bottom:10px}.stat-cell:last-child{border-bottom:0}.problem,.stats,#capabilities,#pricing,#faq,.industries,.integrations,.cta{padding:64px 0!important}.problem-grid{grid-template-columns:1fr;gap:18px}.problem-card{min-height:auto;padding:28px 28px 24px}.caps-grid{grid-template-columns:1fr;gap:18px}.cap{min-height:auto;padding:28px 28px 24px}.pricing-grid{grid-template-columns:1fr;gap:18px}.industry-chip{width:100%;justify-content:center}.integrations-grid{gap:12px}.int-card{min-width:140px;height:62px;font-size:14px;padding:0 18px}.int-logo{width:28px;height:28px}.ind-stats{grid-template-columns:1fr}.nav-cta .btn-ghost{display:none}.faq-item summary{font-size:15px;padding:18px 20px}.faq-item p{padding:0 20px 18px;font-size:14px}.hero-globe-counter{font-size:13px;padding:11px 16px;gap:10px}}

`;
