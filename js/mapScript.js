/* mapScript.js
   实现：两种模式（linear / free），localStorage 持久化，标记渲染与跳转
*/
/* 地图数据说明：
    - 节点数据定义在本文件顶部的 `nodes` 数组（每个节点包含 id/title/onMap/top/left）。
    - 学习进度与解锁状态保存在 `localStorage` 的键：`lm_unlocks_v1`，格式为 JSON：{ mode, unlocked: [bool...], unlockedIndex }
    - 测试时重置进度方法：在地图页点击"重置进度"按钮，或在浏览器控制台执行 `localStorage.removeItem('lm_unlocks_v1')` 然后刷新页面。
*/
(function(){
    // 尝试加载工程目录下的更精确 SVG：../img/china.svg
    async function loadExternalSVG(){
        // 优先使用 <object id="chinaObject"> 的内容（如果可用）
        const obj = document.getElementById('chinaObject');
        if(obj){
            try{
                // 给 object.data 加时间戳，强制浏览器重新加载最新文件（使用相对路径以支持 file://）
                obj.data = '...img/china.svg?ts=' + Date.now();
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
            const res = await fetch('.../img/china.svg?ts=' + Date.now());
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
    const KEY = 'lm_unlocks_v1';

    const nodes = [
        // svgX/svgY 使用当前页面内 svg 的 viewBox 坐标系（map.html 内置 SVG viewBox="0 0 1000 700"）
        // 我已为每个节点估算了一个 svg 坐标（可根据真实地图微调）
        { id:0, title:'战略转移开始', onMap:true, svgX:482.5, svgY:196.3, top:'70%', left:'43%', _size:21 },
        { id:1, title:'湘江战役与转折前夜', onMap:true, svgX:435.1, svgY:226.8, top:'66%', left:'40%', _size:24 },
        { id:2, title:'伟大转折——遵义会议', onMap:true, svgX:420.9, svgY:201, top:'58%', left:'44%', _size:21 },
        { id:3, title:'灵活机动的战略战术（1935年1月—6月）', onMap:true, svgX:387.7, svgY:203.4, top:'62%', left:'35%', _size:27 },
        { id:4, title:'红一、红四方面军会师与北上南下之争（1935年6月—9月）', onMap:true, svgX:397, svgY:168.8, top:'52%', left:'33%', _size:24 },
        { id:5, title:'红一方面军胜利到达陕北（1935年10月）', onMap:true, svgX:435.1, svgY:137.8, top:'32%', left:'36%', _size:24 },
        { id:6, title:'红二、红四方面军北上与三大主力会师（1936年7月—10月）', onMap:true, svgX:417.2, svgY:113.8, top:'24%', left:'44%', _size:23 },
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
        map.innerHTML = '';
        if(chinaObject) map.appendChild(chinaObject);
        else if(existingSVG) map.appendChild(existingSVG);
        if(existingRoute) map.appendChild(existingRoute);

        // 获取 svg 元素（如果存在），用于将 svg 坐标转换为页面像素位置
        let svgEl = map.querySelector('svg.china-svg');
        if(!svgEl){
            const obj = document.getElementById('chinaObject');
            if(obj && obj.contentDocument){
                svgEl = obj.contentDocument.querySelector('svg');
                if(svgEl) svgEl.classList.add('china-svg');
            }
        }
        const mapRect = map.getBoundingClientRect();

        nodes.forEach((n, idx)=>{
            if(n.onMap){
                const el = document.createElement('div');
                el.className = 'marker ' + (st.unlocked[idx] ? 'unlocked' : 'locked');
                el.dataset.id = idx;
                el.innerHTML = `<div class="dot">${idx+1}</div><div class="label">${n.title}</div>`;

                // 计算定位：优先使用 svgX/svgY（SVG 坐标系），回退到百分比定位
                if(typeof n.svgX === 'number' && typeof n.svgY === 'number'){
                    try{
                        const mapSvgPoint = (svg, x, y)=>{
                            if(!svg) return null;
                            // 优先用 getScreenCTM + createSVGPoint
                            try{
                                if(typeof svg.createSVGPoint === 'function' && svg.getScreenCTM){
                                    const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
                                    const ctm = svg.getScreenCTM();
                                    if(ctm) return pt.matrixTransform(ctm);
                                }
                            }catch(e){}
                            // 回退：使用 viewBox 映射
                            try{
                                const rect = svg.getBoundingClientRect();
                                let vb = null;
                                if(svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width){ vb = svg.viewBox.baseVal; }
                                else if(svg.getAttribute('viewBox')){
                                    const parts = svg.getAttribute('viewBox').split(/\s+/).map(Number);
                                    vb = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
                                }
                                if(vb){
                                    const scaleX = rect.width / vb.width;
                                    const scaleY = rect.height / vb.height;
                                    const left = rect.left + (x - vb.x) * scaleX;
                                    const top = rect.top + (y - vb.y) * scaleY;
                                    return { x: left, y: top };
                                }
                            }catch(e){}
                            return null;
                        };

                        const loc = mapSvgPoint(svgEl, n.svgX, n.svgY);
                        if(loc){
                            const leftPx = loc.x - mapRect.left;
                            const topPx = loc.y - mapRect.top;
                            el.style.left = leftPx + 'px';
                            el.style.top = topPx + 'px';
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
                map.appendChild(el);
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
    }

    // 初始化渲染
    render();
})();
