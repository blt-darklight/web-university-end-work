/* mapScript.js
   实现：两种模式（linear / free），localStorage 持久化，标记渲染与跳转
*/
(/* 地图数据说明：
    - 节点数据定义在本文件顶部的 `nodes` 数组（每个节点包含 id/title/onMap/top/left）。
    - 学习进度与解锁状态保存在 `localStorage` 的键：`lm_unlocks_v1`，格式为 JSON：{ mode, unlocked: [bool...], unlockedIndex }
    - 测试时重置进度方法：在地图页点击“重置进度”按钮，或在浏览器控制台执行 `localStorage.removeItem('lm_unlocks_v1')` 然后刷新页面。
*/)
(function(){
    const param = (name)=>{ const u = new URL(window.location.href); return u.searchParams.get(name); };
    const mode = param('mode') || 'linear';
    const KEY = 'lm_unlocks_v1';

    const nodes = [
        { id:0, title:'战略转移开始', onMap:true, top:'70%', left:'43%' },
        { id:1, title:'湘江战役与转折前夜', onMap:true, top:'66%', left:'40%' },
        { id:2, title:'伟大转折——遵义会议', onMap:true, top:'58%', left:'44%' },
        { id:3, title:'灵活机动的战略战术（1935年1月—6月）', onMap:true, top:'62%', left:'35%' },
        { id:4, title:'红一、红四方面军会师与北上南下之争（1935年6月—9月）', onMap:true, top:'52%', left:'33%' },
        { id:5, title:'红一方面军胜利到达陕北（1935年10月）', onMap:true, top:'32%', left:'36%' },
        { id:6, title:'红二、红四方面军北上与三大主力会师（1936年7月—10月）', onMap:true, top:'24%', left:'44%' },
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

    function render(){
        const st = loadState();
        document.getElementById('modeIndicator').textContent = mode === 'free' ? '自由探索（全部解锁）' : '线性引导（逐步解锁）';

        const map = document.getElementById('chinaMap');
        map.innerHTML = '';

        nodes.forEach((n, idx)=>{
            if(n.onMap){
                const el = document.createElement('div');
                el.className = 'marker ' + (st.unlocked[idx] ? 'unlocked' : 'locked');
                el.style.top = n.top; el.style.left = n.left;
                el.dataset.id = idx;
                el.innerHTML = `<div class="dot">${idx+1}</div><div class="label">${n.title}</div>`;
                el.addEventListener('click', ()=>{
                    if(mode === 'free' || st.unlocked[idx]){
                        const target = eventPages[idx] || 'event.html';
                        window.location.href = `/html/${target}?mode=${mode}&id=${idx}`;
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
            btn.addEventListener('click', ()=>{ const target = eventPages[idx] || 'event.html'; window.location.href = `/html/${target}?mode=${mode}&id=${idx}`; });
            li.appendChild(title); li.appendChild(btn); list.appendChild(li);
        });

        document.getElementById('resetProgress').addEventListener('click', ()=>{
            if(confirm('确认重置学习进度？')){ localStorage.removeItem(KEY); location.reload(); }
        });
    }

    // 初始化渲染
    render();
})();
