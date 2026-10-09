/* Decorative WebGPU enhancement. The portrait remains the static fallback.
   API reference: https://www.w3.org/TR/webgpu/ */
(async () => {
  const canvas = document.querySelector('.gpu');
  const toggle = document.querySelector('[data-motion]');
  if (!canvas) return;
  toggle.hidden = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, frameId = 0, device;
  function fallback() {
    canvas.hidden = true;
    if (toggle) toggle.hidden = true;
    canvas.dataset.renderer = 'static';
    cancelAnimationFrame(frameId);
  }
  if (!navigator.gpu) { fallback(); return; }
  try {
    const adapter = await Promise.race([
      navigator.gpu.requestAdapter({powerPreference:'low-power'}),
      new Promise(resolve => setTimeout(() => resolve(null), 2000))
    ]);
    if (!adapter) { fallback(); return; }
    device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    if (!context) { fallback(); return; }
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({device,format,alphaMode:'premultiplied'});
    const shader = device.createShaderModule({code:`
      struct Settings { time: f32, x: f32, y: f32, stars: f32, r: f32, g: f32, b: f32, aspect: f32 };
      @group(0) @binding(0) var<uniform> settings: Settings;
      struct Output { @builtin(position) position: vec4f, @location(0) uv: vec2f };
      @vertex fn vs(@builtin(vertex_index) i: u32) -> Output {
        var positions = array<vec2f,3>(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));
        var out: Output; out.position = vec4f(positions[i],0.,1.); out.uv = positions[i]*.5+.5; return out;
      }
      @fragment fn fs(in: Output) -> @location(0) vec4f {
        let uv = in.uv;
        let center = vec2f(.5+settings.x*.035,.5+settings.y*.035);
        let p = (uv-center)*vec2f(settings.aspect,1.);
        let radius = .39 + sin(settings.time*.65)*.012;
        let ring = exp(-abs(length(p)-radius)*70.);
        var alpha = ring*.48;
        if (settings.stars > .5) {
          let grid = uv*vec2f(19.,23.);
          let cell = floor(grid);
          let seed = fract(sin(dot(cell,vec2f(12.9898,78.233)))*43758.5453);
          let point = length(fract(grid)-vec2f(.5));
          let twinkle = .55+.45*sin(settings.time+seed*20.);
          alpha = select(0., exp(-point*45.)*twinkle*.8, seed>.78);
        }
        return vec4f(vec3f(settings.r,settings.g,settings.b)*alpha,alpha);
      }
    `});
    const info = await shader.getCompilationInfo();
    if (info.messages.some(message => message.type === 'error')) throw new Error('Decorative shader did not compile');
    const pipeline = await device.createRenderPipelineAsync({layout:'auto',vertex:{module:shader,entryPoint:'vs'},fragment:{module:shader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}});
    const uniform = device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const bind = device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
    let pointer = [0,0], time = 0, previous = 0;
    const art = canvas.closest('.hero-art');
    art.addEventListener('pointermove', event => {
      const box = art.getBoundingClientRect();
      pointer = [(event.clientX-box.left)/box.width-.5,(event.clientY-box.top)/box.height-.5];
    });
    function draw(now) {
      if (paused || document.hidden) { previous = 0; return; }
      if (previous) time += Math.min((now-previous)/1000,.05);
      previous = now;
      render();
      frameId = requestAnimationFrame(draw);
    }
    function render() {
      const width = Math.max(1,Math.round(canvas.clientWidth*Math.min(devicePixelRatio,1.5)));
      const height = Math.max(1,Math.round(canvas.clientHeight*Math.min(devicePixelRatio,1.5)));
      if (canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; }
      const style = getComputedStyle(document.documentElement);
      device.queue.writeBuffer(uniform,0,new Float32Array([time,...pointer,document.documentElement.dataset.concept==='constellation'?1:0,...['--gpu-r','--gpu-g','--gpu-b'].map(key=>Number(style.getPropertyValue(key))),width/height]));
      const encoder=device.createCommandEncoder();
      const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});
      pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.draw(3);pass.end();device.queue.submit([encoder.finish()]);
    }
    function sync() {
      cancelAnimationFrame(frameId);
      toggle.hidden = false;
      toggle.textContent=paused?'Play glow':'Pause glow';
      toggle.setAttribute('aria-pressed',String(paused));
      if (!paused && !document.hidden) frameId=requestAnimationFrame(draw);
      else render();
    }
    toggle.addEventListener('click',()=>{paused=!paused;sync();});
    reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
    document.addEventListener('visibilitychange',sync);
    device.lost.then(fallback);
    device.addEventListener('uncapturederror',fallback);
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);device.destroy();},{once:true});
    canvas.dataset.renderer='webgpu';sync();
  } catch { fallback(); if (device) device.destroy(); }
})();
