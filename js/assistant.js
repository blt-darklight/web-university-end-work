(function(){
    const KEY = 'ai_assistant_messages_v1';
    const CHANNEL = 'ai-assistant-channel-v1';

    // 插入样式
    const css = `
    .ai-assistant {position:fixed;right:20px;bottom:20px;width:320px;max-width:90vw;background:linear-gradient(180deg,#0b1220,#0f1a2a);color:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(2,6,23,0.6);z-index:99999;font-family:Inter,Segoe UI, Microsoft YaHei, Arial;}
    .ai-assistant .ai-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.03)}
    .ai-assistant .ai-title{font-weight:700;color:#ffd26b}
    .ai-assistant .ai-body{padding:10px;max-height:340px;overflow:auto}
    .ai-assistant .ai-msg{margin-bottom:10px;padding:8px 10px;border-radius:8px;line-height:1.4}
    .ai-assistant .ai-msg.user{background:linear-gradient(90deg,#1e293b,#142032);color:#fff;text-align:right}
    .ai-assistant .ai-msg.ai{background:linear-gradient(90deg,#123046,#0b2430);color:#dbeafe;text-align:left}
    .ai-assistant .ai-input{display:flex;border-top:1px solid rgba(255,255,255,0.03)}
    .ai-assistant textarea{flex:1;resize:none;border:0;padding:10px;background:transparent;color:#fff;min-height:44px;outline:none}
    .ai-assistant .ai-send{background:var(--accent,#ffd26b);border:0;padding:0 14px;margin:8px;border-radius:8px;color:#111;font-weight:700;cursor:pointer}
    .ai-assistant .ai-controls{display:flex;gap:8px;align-items:center}
    .ai-assistant .ai-min{background:transparent;border:1px solid rgba(255,255,255,0.04);padding:4px 8px;border-radius:6px;color:var(--muted,#b0bec5);cursor:pointer}
    `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    // 创建容器（若页面已有则复用）
    if (document.getElementById('aiAssistantRoot')) return; // already injected

    const root = document.createElement('div'); root.id = 'aiAssistantRoot'; root.className = 'ai-assistant';
    root.innerHTML = `
        <div class="ai-header">
            <div class="ai-title">AI 小助手</div>
            <div class="ai-controls">
                <button class="ai-min" id="aiToggle">最小化</button>
            </div>
        </div>
        <div class="ai-body" id="aiBody"></div>
        <div class="ai-input">
            <textarea id="aiInput" placeholder="输入问题并回车或点击发送..."></textarea>
            <button class="ai-send" id="aiSend">发送</button>
        </div>
    `;
    document.body.appendChild(root);

    const aiBody = document.getElementById('aiBody');
    const aiInput = document.getElementById('aiInput');
    const aiSend = document.getElementById('aiSend');
    const aiToggle = document.getElementById('aiToggle');

    // 持久化 API
    function loadMessages(){
        try{
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        }catch(e){return []}
    }
    function saveMessages(arr){
        try{ localStorage.setItem(KEY, JSON.stringify(arr)); }catch(e){}
    }

    // 渲染
    function render(){
        const msgs = loadMessages();
        aiBody.innerHTML = '';
        msgs.forEach(m => {
            const d = document.createElement('div'); d.className = 'ai-msg ' + (m.role === 'user' ? 'user' : 'ai');
            d.textContent = m.text;
            aiBody.appendChild(d);
        });
        aiBody.scrollTop = aiBody.scrollHeight;
    }

    // BroadcastChannel 同步（如果支持）
    let bc = null;
    try{ bc = new BroadcastChannel(CHANNEL); bc.onmessage = (ev)=>{ if(ev.data && ev.data.type === 'sync'){ render(); } } }catch(e){ bc = null }

    // 添加消息并同步
    function addMessage(role, text, options){
        const msgs = loadMessages();
        msgs.push({role: role, text: text, ts: Date.now()});
        saveMessages(msgs);
        if(bc) bc.postMessage({type:'sync'});
        render();
    }

    // 暴露 API 以便现有助手调用（不覆盖已有对象）
    window.AIAssistantPersistence = window.AIAssistantPersistence || {};
    window.AIAssistantPersistence.addMessage = addMessage;
    window.AIAssistantPersistence.loadMessages = loadMessages;

    // 按钮与回车处理
    aiSend.addEventListener('click', ()=>{
        const v = aiInput.value.trim(); if(!v) return; addMessage('user', v); aiInput.value = '';
        // 如果页面上存在全局函数 sendToAi 则使用它来获取回复（允许用户原有助手仍然工作）
        if(window.sendToAi && typeof window.sendToAi === 'function'){
            try{
                const p = window.sendToAi(v);
                if(p && typeof p.then === 'function'){
                    p.then(reply => { if(reply) addMessage('ai', reply) }).catch(()=>{});
                }else if(typeof p === 'string'){
                    addMessage('ai', p);
                }
            }catch(e){}
        }
    });
    aiInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); aiSend.click(); } });

    // 最小化切换（状态保存在 sessionStorage）
    const MIN_KEY = 'ai_assistant_min_v1';
    function setMin(v){
        if(v){ aiBody.style.display='none'; aiInput.style.display='none'; aiSend.style.display='none'; aiToggle.textContent='展开'; root.style.width='140px'; }
        else{ aiBody.style.display='block'; aiInput.style.display='block'; aiSend.style.display='inline-block'; aiToggle.textContent='最小化'; root.style.width='320px'; }
        try{ sessionStorage.setItem(MIN_KEY, v ? '1' : '0'); }catch(e){}
    }
    aiToggle.addEventListener('click', ()=>{ const cur = sessionStorage.getItem(MIN_KEY) === '1'; setMin(!cur); });
    // 初始化最小化状态
    try{ setMin(sessionStorage.getItem(MIN_KEY) === '1'); }catch(e){ setMin(false); }

    // 初次渲染
    render();

    // 在页面卸载前确保已保存（尽管我们每次添加时已保存）
    window.addEventListener('beforeunload', ()=>{ try{ saveMessages(loadMessages()); }catch(e){} });

    // 公开一个简单方法让外部清理或替换消息
    window.AIAssistantPersistence.clear = function(){ localStorage.removeItem(KEY); if(bc) bc.postMessage({type:'sync'}); render(); };

})();
