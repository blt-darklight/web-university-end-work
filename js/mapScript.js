/* mapScript.js
   实现：两种模式（linear / free），localStorage 持久化，标记渲染与跳转
*/
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
                        window.location.href = `/html/event.html?id=${idx}&mode=${mode}`;
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
            btn.addEventListener('click', ()=>{ window.location.href = `/html/event.html?id=${idx}&mode=${mode}`; });
            li.appendChild(title); li.appendChild(btn); list.appendChild(li);
        });

        document.getElementById('resetProgress').addEventListener('click', ()=>{
            if(confirm('确认重置学习进度？')){ localStorage.removeItem(KEY); location.reload(); }
        });
    }

    // 初始化渲染
    render();
})();
