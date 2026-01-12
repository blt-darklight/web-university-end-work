/* mapScript.js
   实现：两种模式（linear / free），localStorage 持久化，标记渲染与跳转
*/
/* 地图数据说明：
    - 节点数据定义在本文件顶部的 `nodes` 数组（每个节点包含 id/title/onMap/top/left）。
    - 学习进度与解锁状态保存在 `localStorage` 的键：`lm_unlocks_v1`，格式为 JSON：{ mode, unlocked: [bool...], unlockedIndex }
    - 测试时重置进度方法：在地图页点击“重置进度”按钮，或在浏览器控制台执行 `localStorage.removeItem('lm_unlocks_v1')` 然后刷新页面。
*/
(function(){
    // 尝试加载工程目录下的更精确 SVG：/img/china.svg
    async function loadExternalSVG(){
        // 优先使用 <object id="chinaObject"> 的内容（如果可用）
        const obj = document.getElementById('chinaObject');
        if(obj){
            try{
                // 给 object.data 加时间戳，强制浏览器重新加载最新文件（使用相对路径以支持 file://）
                obj.data = '../img/china.svg?ts=' + Date.now();
                // 等待 object 的 load 事件（短超时后继续）
                await new Promise((resolve)=>{
                    let resolved = false;
                    const onload = ()=>{ if(!resolved){ resolved = true; resolve(true); } };
                    obj.addEventListener('load', onload, { once: true });
                    setTimeout(()=>{ if(!resolved){ resolved = true; resolve(false); } }, 500);
                });

                const doc = obj.contentDocument;
                if(doc){
                    const svg = doc.querySelector('svg');
                    if(svg) svg.classList.add('china-svg');
                    return true;
                }
            }catch(e){
                // 访问 contentDocument 在某些环境可能被阻止，继续尝试 fetch（非 file://）
            }
        }

        // 在 file:// 下通常无法 fetch 外部资源；只有非 file 协议时尝试 fetch 并注入
        if(window.location.protocol === 'file:') return false;

        try{
            const res = await fetch('../img/china.svg?ts=' + Date.now());
            if(!res.ok) throw new Error('no svg');
            const text = await res.text();
            const container = document.querySelector('.china-map');
            if(container){
                const inline = container.querySelector('.china-svg');
                if(inline){
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'image/svg+xml');
                    const svg = doc.querySelector('svg');
                    if(svg){
                        svg.classList.add('china-svg');
                        inline.replaceWith(svg);
                    }
                }else{
                    container.insertAdjacentHTML('afterbegin', text);
                }
            }
            return true;
        }catch(e){
            return false;
        }
    }
    const param = (name)=>{ const u = new URL(window.location.href); return u.searchParams.get(name); };
    const mode = param('mode') || 'linear';
    const debugMode = param('debug') === '1' || param('debug') === 'true';
    const KEY = 'lm_unlocks_v1';

    // SVG 初始变换参数（来自最新调试导出）
    let svgZoom = 1.79;
    let svgPanX = -24;
    let svgPanY = 221;

    // 为了与之前的布局一致，优先使用百分比定位而不是 svg 坐标映射
    const preferPercentPositions = false;

    const nodes = [
        // svgX/svgY 使用当前页面内 svg 的 viewBox 坐标系（map.html 内置 SVG viewBox="0 0 1000 700"）
        // 已根据您提供的数据更新节点坐标与大小
        { id:0, title:'战略转移开始', onMap:true, svgX:592.6, svgY:305.3, top:'70%', left:'43%', _size:21 },
        { id:1, title:'湘江战役与转折前夜', onMap:true, svgX:576.5, svgY:343.1, top:'66%', left:'40%', _size:24 },
        { id:2, title:'伟大转折——遵义会议', onMap:true, svgX:538.7, svgY:339.3, top:'58%', left:'44%', _size:21 },
        { id:3, title:'灵活机动的战略战术（1935年1月—6月）', onMap:true, svgX:495.6, svgY:316.7, top:'62%', left:'35%', _size:27 },
        { id:4, title:'红一、红四方面军会师与北上南下之争（1935年6月—9月）', onMap:true, svgX:498.2, svgY:268.2, top:'52%', left:'33%', _size:24 },
        { id:5, title:'红一方面军胜利到达陕北（1935年10月）', onMap:true, svgX:538.7, svgY:229.8, top:'32%', left:'36%', _size:24 },
        { id:6, title:'红二、红四方面军北上与三大主力会师（1936年7月—10月）', onMap:true, svgX:515.4, svgY:207.7, top:'24%', left:'44%', _size:23 },
        { id:7, title:'长征的总结与意义（总结页，不在地图内）', onMap:false }
    ];

    // 对应 event 目录下的页面（按顺序映射）
    const eventPages = [
        'event/start.html',
        'event/XiangjiangCampaign.html',
        'event/Zunyi.html',
        'event/4.html',
        'event/5.html',
        'event/hongyifangmianjun.html',
        'event/honger.html',
        'event/summary.html'
    ];

    function loadState(){
        const raw = localStorage.getItem(KEY);
        if(raw){ try{ const st = JSON.parse(raw); return st; }catch(e){} }
        const unlocked = nodes.map(()=>false);
        if(mode === 'free'){ for(let i=0;i<unlocked.length;i++) unlocked[i]=true; }
        else unlocked[0]=true;
        const st = { mode, unlocked, unlockedIndex: unlocked.indexOf(true) };
        localStorage.setItem(KEY, JSON.stringify(st));
        return st;
    }

    function saveState(st){ localStorage.setItem(KEY, JSON.stringify(st)); }

    async function render(){
        // 如果不是 file 协议，尝试加载外部 SVG（浏览器 file:// 下通常无法 fetch）
        if(window.location.protocol !== 'file:'){
            await loadExternalSVG();
        }
        const st = loadState();
        document.getElementById('modeIndicator').textContent = mode === 'free' ? '自由探索（全部解锁）' : '线性引导（逐步解锁）';

        const map = document.getElementById('chinaMap');
        // 保留已有的 svg 与 route-layer 节点，避免在 file:// 下把内联 svg 清掉
        const existingSVG = map.querySelector('svg.china-svg');
        const existingRoute = map.querySelector('.route-layer');
        const chinaObject = map.querySelector('#chinaObject');
        // ensure inner wrapper exists so we can scale svg+markers together
        let inner = map.querySelector('.china-inner');
        if(!inner){
            inner = document.createElement('div'); inner.className = 'china-inner';
            // move current children into inner
            while(map.firstChild) inner.appendChild(map.firstChild);
            map.appendChild(inner);
        }
        // ensure object and route-layer are inside inner
        if(chinaObject && chinaObject.parentNode !== inner) inner.insertBefore(chinaObject, inner.firstChild);
        if(existingRoute && existingRoute.parentNode !== inner) inner.appendChild(existingRoute);
        // remove old markers inside inner
        Array.from(inner.querySelectorAll('.marker')).forEach(m=>m.remove());

        // 应用初始 SVG 变换（zoom 和 pan）
        inner.style.transform = `translate(${svgPanX}px, ${svgPanY}px) scale(${svgZoom})`;

        // 获取 svg 元素（如果存在），用于将 svg 坐标转换为页面像素位置
        let svgEl = inner.querySelector('svg.china-svg');
        if(!svgEl){
            const obj = document.getElementById('chinaObject');
            if(obj && obj.contentDocument){
                svgEl = obj.contentDocument.querySelector('svg');
                if(svgEl) svgEl.classList.add('china-svg');
            }
        }
        const mapRect = inner.getBoundingClientRect();

        nodes.forEach((n, idx)=>{
            if(n.onMap){
                const el = document.createElement('div');
                el.className = 'marker ' + (st.unlocked[idx] ? 'unlocked' : 'locked');
                el.dataset.id = idx;
                el.innerHTML = `<div class="dot">${idx+1}</div><div class="label">${n.title}</div>`;
                if(n._size){ el.style.width = el.style.height = (n._size)+'px'; }

                // 计算定位：根据开关优先选择百分比定位，避免布局突变
                if(!preferPercentPositions && typeof n.svgX === 'number' && typeof n.svgY === 'number'){
                    try{
                        const mapSvgPoint = (svg, x, y)=>{
                            if(!svg) return null;
                            // 统一使用 viewBox -> 内层容器尺寸映射，避免 CTM 差异导致的坐标颠倒或偏移
                            try{
                                const rect = svg.getBoundingClientRect();
                                let vb = null;
                                if(svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width){ vb = svg.viewBox.baseVal; }
                                else if(svg.getAttribute('viewBox')){
                                    const parts = svg.getAttribute('viewBox').split(/\s+/).map(Number);
                                    vb = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
                                }
                                if(vb){
                                    const inner = document.querySelector('.china-inner');
                                    const w = inner ? inner.clientWidth : rect.width;
                                    const h = inner ? inner.clientHeight : rect.height;
                                    const scaleX = w / vb.width;
                                    const scaleY = h / vb.height;
                                    const left = (x - vb.x) * scaleX;
                                    const top = (y - vb.y) * scaleY;
                                    return { x: left, y: top };
                                }
                            }catch(e){}
                            return null;
                        };

                        const loc = mapSvgPoint(svgEl, n.svgX, n.svgY);
                        if(loc){
                            // 使用相对于内层容器的本地坐标
                            el.style.left = loc.x + 'px';
                            el.style.top = loc.y + 'px';
                        }else{
                            el.style.left = n.left || '50%';
                            el.style.top = n.top || '50%';
                        }
                    }catch(e){
                        el.style.left = n.left || '50%';
                        el.style.top = n.top || '50%';
                    }
                }else{
                    el.style.left = n.left || '50%';
                    el.style.top = n.top || '50%';
                }

                el.addEventListener('click', ()=>{
                    if(mode === 'free' || st.unlocked[idx]){
                            const target = eventPages[idx] || 'event.html';
                        window.location.href = `${target}?mode=${mode}&id=${idx}`;
                    }else{
                        alert('该节点尚未解锁，请先完成前置学习。');
                    }
                });
                // debug: allow opening edit form on double-click (no dragging)
                if(debugMode){
                    el.style.outline = '2px dashed rgba(0,0,0,0.12)';
                    el.dataset.idx = idx;
                    el.addEventListener('dblclick', ()=> openEditForm(n, idx));
                }
                inner.appendChild(el);
            }
        });

        // sidebar
        const list = document.getElementById('nodeList'); list.innerHTML = '';
        nodes.forEach((n, idx)=>{
            const li = document.createElement('li');
            li.className = st.unlocked[idx] ? 'unlocked' : 'locked';
            const title = document.createElement('span'); title.textContent = `${idx+1}. ${n.title}`;
            const btn = document.createElement('button'); btn.textContent = st.unlocked[idx] || mode==='free' ? '进入学习' : '锁定';
            btn.disabled = !(st.unlocked[idx] || mode==='free');
            btn.addEventListener('click', ()=>{ const target = eventPages[idx] || 'event.html'; window.location.href = `${target}?mode=${mode}&id=${idx}`; });
            li.appendChild(title); li.appendChild(btn); list.appendChild(li);
        });

        document.getElementById('resetProgress').addEventListener('click', ()=>{
            if(confirm('确认重置学习进度？')){ localStorage.removeItem(KEY); location.reload(); }
        });
        if(debugMode) setupDebugPanel();
    }

    /* ----------------- Debug helpers ----------------- */
    function enableDragAndEdit(el, node, idx){
        let dragging = false; let offset = {x:0,y:0};
        const obj = document.getElementById('chinaObject');
        const getSvgForMapping = ()=>{
            const map = document.getElementById('chinaMap');
            let svg = map.querySelector('svg.china-svg');
            if(!svg && obj && obj.contentDocument) svg = obj.contentDocument.querySelector('svg');
            return svg;
        };

        el.addEventListener('mousedown', (e)=>{
            if(!debugMode) return;
            e.preventDefault(); dragging = true; el.classList.add('dragging');
        });
        window.addEventListener('mousemove', (e)=>{
            if(!dragging) return;
            const svg = getSvgForMapping();
            if(!svg || !svg.getScreenCTM) return;
            try{
                const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
                const inv = svg.getScreenCTM().inverse();
                const svgP = pt.matrixTransform(inv);
                node.svgX = svgP.x; node.svgY = svgP.y;
                // update marker position immediately
                const mapRect = document.getElementById('chinaMap').getBoundingClientRect();
                const screenPt = pt.matrixTransform(svg.getScreenCTM());
                el.style.left = (screenPt.x - mapRect.left) + 'px';
                el.style.top = (screenPt.y - mapRect.top) + 'px';
                // update debug form if open
                const form = document.getElementById('debug-node-form');
                if(form && Number(form.dataset.idx) === idx){
                    form.querySelector('[name="svgX"]').value = node.svgX.toFixed(2);
                    form.querySelector('[name="svgY"]').value = node.svgY.toFixed(2);
                }
            }catch(e){}
        });
        window.addEventListener('mouseup', ()=>{ if(dragging){ dragging = false; el.classList.remove('dragging'); } });

        // double click to open edit form
        el.addEventListener('dblclick', ()=>{ openEditForm(node, idx); });
    }

    function setupDebugPanel(){
        if(document.getElementById('debugPanel')) return;
        const panel = document.createElement('div'); panel.id = 'debugPanel';
        panel.style.position = 'fixed'; panel.style.right = '12px'; panel.style.top = '80px'; panel.style.width = '320px'; panel.style.maxHeight = '70vh';
        panel.style.overflow = 'auto'; panel.style.background = '#fff'; panel.style.border = '1px solid #ddd'; panel.style.padding = '8px'; panel.style.zIndex = 9999; panel.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';
        panel.innerHTML = `<h4 style="margin:6px 0 8px 0">调试模式</h4>
            <div style="font-size:13px;color:#444;margin-bottom:8px">双击标记或在下方选择节点以编辑坐标与大小。使用下列滑条来缩放与平移地图（不使用拖动）。</div>
            <div style="margin-bottom:8px">放大: <input id="debugZoom" type="range" min="0.5" max="2" step="0.01" value="${svgZoom}" style="width:140px;vertical-align:middle"> <span id="debugZoomVal">${Math.round(svgZoom*100)}%</span></div>
            <div style="margin-bottom:8px">水平偏移: <input id="debugPanX" type="range" min="-500" max="500" step="1" value="${svgPanX}" style="width:140px;vertical-align:middle"> <span id="debugPanXVal">${svgPanX}px</span></div>
            <div style="margin-bottom:8px">垂直偏移: <input id="debugPanY" type="range" min="-500" max="500" step="1" value="${svgPanY}" style="width:140px;vertical-align:middle"> <span id="debugPanYVal">${svgPanY}px</span></div>
            <div id="debugNodeList" style="margin-bottom:8px"></div>
            <div id="debugFormWrap"></div>
            <div style="margin-top:8px"><button id="debugExport">导出 nodes JSON</button>
            <button id="debugReload" style="margin-left:6px">刷新渲染</button></div>`;
        document.body.appendChild(panel);

        const list = panel.querySelector('#debugNodeList');
        nodes.forEach((n, i)=>{
            const btn = document.createElement('button'); btn.style.display='block'; btn.style.width='100%'; btn.style.margin='4px 0'; btn.textContent = `${i+1}. ${n.title}`;
            btn.addEventListener('click', ()=> openEditForm(n, i));
            list.appendChild(btn);
        });

        panel.querySelector('#debugExport').addEventListener('click', ()=>{
            const zoomVal = parseFloat(zoomEl.value);
            const panXVal = parseInt(panXEl.value, 10);
            const panYVal = parseInt(panYEl.value, 10);
            const exportData = {
                zoom: zoomVal,
                panX: panXVal,
                panY: panYVal,
                nodes: nodes
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nodes-debug.json'; a.click();
        });
        panel.querySelector('#debugReload').addEventListener('click', ()=>{ render(); });
        const zoomEl = panel.querySelector('#debugZoom');
        const zoomVal = panel.querySelector('#debugZoomVal');
        const panXEl = panel.querySelector('#debugPanX');
        const panYEl = panel.querySelector('#debugPanY');
        const panXVal = panel.querySelector('#debugPanXVal');
        const panYVal = panel.querySelector('#debugPanYVal');
        function applyTransform(){
            const z = parseFloat(zoomEl.value);
            const px = parseInt(panXEl.value,10);
            const py = parseInt(panYEl.value,10);
            zoomVal.textContent = Math.round(z*100) + '%';
            panXVal.textContent = px + 'px';
            panYVal.textContent = py + 'px';
            svgZoom = z; svgPanX = px; svgPanY = py;
            const inner = document.querySelector('.china-inner');
            if(inner) inner.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
            // re-render markers positions after transform
            setTimeout(()=>{ render(); }, 60);
        }
        zoomEl.addEventListener('input', applyTransform);
        panXEl.addEventListener('input', applyTransform);
        panYEl.addEventListener('input', applyTransform);
    }

    function openEditForm(node, idx){
        const wrap = document.getElementById('debugFormWrap'); wrap.innerHTML = '';
        const form = document.createElement('div'); form.id='debug-node-form'; form.dataset.idx = idx;
        form.style.padding = '6px';
        form.innerHTML = `
            <div style="font-size:13px;margin-bottom:6px"><strong>${idx+1}. ${node.title}</strong></div>
            <div style="margin-bottom:8px">svgX: <span id="val-x">${(node.svgX||0).toFixed(2)}</span></div>
            <input id="range-x" type="range" step="0.1" style="width:100%">
            <div style="margin:8px 0">svgY: <span id="val-y">${(node.svgY||0).toFixed(2)}</span></div>
            <input id="range-y" type="range" step="0.1" style="width:100%">
            <div style="margin:8px 0">大小(px): <span id="val-size">${node._size||46}</span></div>
            <input id="range-size" type="range" min="16" max="160" step="1" style="width:100%">
            <div style="margin-top:8px"><button type="button" id="applyNode">应用并关闭</button> <button type="button" id="discardNode">取消</button></div>`;
        wrap.appendChild(form);

        // determine reasonable slider ranges from SVG viewBox if possible
        const obj = document.getElementById('chinaObject');
        let svg = document.querySelector('.china-inner')?.querySelector('svg.china-svg');
        if(!svg && obj && obj.contentDocument) svg = obj.contentDocument.querySelector('svg');
        let vb = {x:0,y:0,width:1000,height:700};
        if(svg){
            if(svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width){ vb = svg.viewBox.baseVal; }
            else if(svg.getAttribute && svg.getAttribute('viewBox')){
                const parts = svg.getAttribute('viewBox').split(/\s+/).map(Number);
                if(parts.length===4) vb = {x:parts[0],y:parts[1],width:parts[2],height:parts[3]};
            }
        }

        // set slider ranges
        const rx = form.querySelector('#range-x');
        const ry = form.querySelector('#range-y');
        const rs = form.querySelector('#range-size');
        rx.min = vb.x - vb.width*0.5; rx.max = vb.x + vb.width*1.5; rx.value = node.svgX || (vb.x + vb.width/2);
        ry.min = vb.y - vb.height*0.5; ry.max = vb.y + vb.height*1.5; ry.value = node.svgY || (vb.y + vb.height/2);
        rs.value = node._size || 46;

        const valx = form.querySelector('#val-x');
        const valy = form.querySelector('#val-y');
        const vals = form.querySelector('#val-size');

        function updateFromSliders(){
            const sx = parseFloat(rx.value);
            const sy = parseFloat(ry.value);
            const sz = parseInt(rs.value,10);
            valx.textContent = sx.toFixed(2);
            valy.textContent = sy.toFixed(2);
            vals.textContent = sz;
            node.svgX = sx; node.svgY = sy; node._size = sz;
            // live update by re-rendering markers
            render();
        }

        rx.addEventListener('input', updateFromSliders);
        ry.addEventListener('input', updateFromSliders);
        rs.addEventListener('input', updateFromSliders);

        form.querySelector('#applyNode').addEventListener('click', ()=>{ wrap.innerHTML=''; render(); });
        form.querySelector('#discardNode').addEventListener('click', ()=>{ wrap.innerHTML=''; render(); });
    }

    // 初始化渲染
    render();
})();
