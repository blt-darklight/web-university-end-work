/**
 * AI助手全局配置
 * 使用硅基流动DeepSeek API
 */

// ========== 配置区 ==========
// 硅基流动API密钥 - 替换为实际的密钥
const SILICONFLOW_API_KEY = 'sk-obkttdlsjwedkbyzaniqepjoutndvfzgigbjqagsqmbipdbi';
const API_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL_NAME = 'deepseek-ai/DeepSeek-V3';

// ========== DOM元素引用 ==========
let aiButton, chatWindow, closeButton, chatMessages;
let userInput, sendButton, loadingIndicator;
let aiBroadcastChannel = null; // 复用频道，避免多次创建

// 持久化键与频道
const AI_STORAGE_KEY = 'deepseek_ai_chat_v1';
const AI_BC_CHANNEL = 'deepseek_ai_channel_v1';

// 全局时间格式化：YYYY-MM-DD HH:MM:SS
function formatTimestamp(ts){
    try{
        const d = new Date(ts);
        const Y = d.getFullYear();
        const M = String(d.getMonth() + 1).padStart(2, '0');
        const D = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    }catch(e){ return ''; }
}
// 回复清理：去除括号说明并控制长度不超过200字
function sanitizeReply(text){
    try{
        let t = text || '';
        const patterns = [/（[^）]*）/g, /\([^)]*\)/g, /\[[^\]]*\]/g];
        let prev;
        do{
            prev = t;
            patterns.forEach(p => { t = t.replace(p, ''); });
        }while(t !== prev);
        t = t.replace(/\s{2,}/g, ' ').trim();
        if(t.length > 200) t = t.slice(0, 200);
        return t;
    }catch(e){
        return (text || '').slice(0,200);
    }
}
// ========== 初始化函数 ==========
function initAIAssistant() {
    // 获取DOM元素
    aiButton = document.getElementById('aiAssistantButton');
    chatWindow = document.getElementById('aiChatWindow');
    closeButton = document.getElementById('closeChat');
    chatMessages = document.getElementById('chatMessages');
    userInput = document.getElementById('userInput');
    sendButton = document.getElementById('sendButton');
    loadingIndicator = document.getElementById('loadingIndicator');
    
    // 检查必要的DOM元素
    if (!aiButton || !chatWindow) {
        console.error('无法找到AI助手所需的DOM元素');
        return;
    }
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化对话历史
    initChatHistory();
    
    console.log('AI助手初始化完成');
}

// ========== 事件绑定 ==========
function bindEventListeners() {
    // 按钮点击打开聊天窗口
    aiButton.addEventListener('click', openChatWindow);
    
    // 关闭按钮
    closeButton.addEventListener('click', closeChatWindow);
    
    // 发送消息按钮
    sendButton.addEventListener('click', sendMessage);
    
    // 输入框键盘事件
    userInput.addEventListener('keydown', handleInputKeydown);
    
    // 点击页面其他地方关闭聊天窗口
    document.addEventListener('click', handleOutsideClick);
    
    // 防止聊天窗口内的点击事件冒泡
    chatWindow.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// ========== 聊天窗口控制 ==========
function openChatWindow() {
    chatWindow.style.display = 'flex';
    userInput.focus();
    
    // 添加打开动画
    chatWindow.style.opacity = '0';
    chatWindow.style.transform = 'translateY(20px) scale(0.95)';
    
    setTimeout(() => {
        chatWindow.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'translateY(0) scale(1)';
        // 打开时确保消息区域滚动到最新
        try{ if(chatMessages) { chatMessages.scrollTop = chatMessages.scrollHeight; setTimeout(()=>{ chatMessages.scrollTop = chatMessages.scrollHeight; }, 60); } }catch(e){}
    }, 10);
}

function closeChatWindow() {
    chatWindow.style.opacity = '0';
    chatWindow.style.transform = 'translateY(20px) scale(0.95)';
    
    setTimeout(() => {
        chatWindow.style.display = 'none';
        chatWindow.style.transition = '';
        chatWindow.style.opacity = '';
        chatWindow.style.transform = '';
    }, 300);
}

function handleOutsideClick(event) {
    // 如果点击的不是AI助手按钮或聊天窗口，则关闭聊天窗口
    if (!aiButton.contains(event.target) && 
        !chatWindow.contains(event.target) && 
        chatWindow.style.display === 'flex') {
        closeChatWindow();
    }
}

// ========== 消息处理 ==========
function addMessage(content, isUser) {
    // 渲染到 DOM（可接受时间戳）
    function renderMessage(content, isUser, ts){
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        const textNode = document.createElement('div');
        textNode.className = 'msg-text';
        textNode.textContent = content;
        const timeNode = document.createElement('div');
        timeNode.className = 'msg-time';
        timeNode.textContent = ts ? formatTimestamp(ts) : '';
        messageDiv.appendChild(textNode);
        messageDiv.appendChild(timeNode);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    // 先写入到 DOM
    const dom = renderMessage(content, isUser);

    const nowTs = Date.now();
    // 再持久化（去重：如果最后一条相同则跳过）
    try{
        const raw = localStorage.getItem(AI_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const last = arr.length ? arr[arr.length - 1] : null;
        if(!(last && last.text === content && !!last.isUser === !!isUser)){
            arr.push({ text: content, isUser: !!isUser, ts: nowTs });
            if(arr.length > 200) arr.splice(0, arr.length - 200);
            localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(arr));
            // 广播更新
            const bc = getBroadcastChannel();
            if(bc){ try{ bc.postMessage({ type: 'sync' }); }catch(e){} }
        }
    }catch(e){
        // 历史损坏则清空，避免后续解析失败
        try{ localStorage.removeItem(AI_STORAGE_KEY); }catch(err){}
    }

    // 如果 DOM was rendered without timestamp, update timestamp node
    try{ if(dom){ const tn = dom.querySelector && dom.querySelector('.msg-time'); if(tn) tn.textContent = formatTimestamp(nowTs); } }catch(e){}
    return dom;
}

function getBroadcastChannel(){
    if(!window.BroadcastChannel) return null;
    if(aiBroadcastChannel) return aiBroadcastChannel;
    try{
        aiBroadcastChannel = new BroadcastChannel(AI_BC_CHANNEL);
        aiBroadcastChannel.onmessage = (ev) => {
            if(ev.data && ev.data.type === 'sync'){
                try{
                    const raw = localStorage.getItem(AI_STORAGE_KEY);
                    const arr = raw ? JSON.parse(raw) : [];
                    if(chatMessages){
                        chatMessages.innerHTML = '';
                        arr.forEach(m => {
                            const d = document.createElement('div');
                            d.className = `message ${m.isUser ? 'user-message' : 'bot-message'}`;
                            const textNode = document.createElement('div');
                            textNode.className = 'msg-text';
                            textNode.textContent = m.text;
                            const timeNode = document.createElement('div');
                            timeNode.className = 'msg-time';
                            timeNode.textContent = m.ts ? formatTimestamp(m.ts) : '';
                            d.appendChild(textNode);
                            d.appendChild(timeNode);
                            chatMessages.appendChild(d);
                        });
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }catch(e){
                    try{ localStorage.removeItem(AI_STORAGE_KEY); }catch(err){}
                }
            }
        };
    }catch(e){ aiBroadcastChannel = null; }
    return aiBroadcastChannel;
}

// 初始化频道
getBroadcastChannel();

// ========== API调用 ==========
async function callDeepSeekAPI(userMessage) {
    // 显示用户消息
    addMessage(userMessage, true);
    
    // 在输入框上方显示加载状态
    if (!loadingIndicator) {
        console.error('loadingIndicator 元素不存在！');
        return;
    }
    
    let elapsed = 0;
    const updateLoadingText = () => {
        loadingIndicator.textContent = `✨ 长征小助手正在思考中... (${elapsed}秒)`;
    };
    
    updateLoadingText(); // 初始显示
    loadingIndicator.style.display = 'block';
    
    // 计时器相关
    const timerInterval = setInterval(() => {
        elapsed++;
        updateLoadingText();
    }, 1000);
    
    // 禁用输入
    userInput.disabled = true;
    sendButton.disabled = true;
    userInput.value = '';
    
    // 获取最近3轮对话作为上下文
    const getRecentContext = () => {
        try {
            const raw = localStorage.getItem(AI_STORAGE_KEY);
            if (!raw) return [];
            const msgs = JSON.parse(raw);
            // 获取最后6条消息（3轮对话 = 3个用户消息 + 3个AI回复）
            const recent = msgs.slice(-6);
            return recent.map(m => ({
                role: m.isUser ? 'user' : 'assistant',
                content: m.text
            }));
        } catch(e) {
            return [];
        }
    };
    
    const contextMessages = getRecentContext();
    
    const MAX_RETRY = 3;
    const BASE_DELAY = 500; // ms
    let attempt = 0;
    let lastError = null;

    const shouldRetry = (errMsg) => /429|500|502|503|504|NetworkError|Failed to fetch|abort/i.test(errMsg || '');

    while(attempt < MAX_RETRY){
        attempt++;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            if(attempt > 1){
                loadingIndicator.textContent = `✨ 第 ${attempt} 次重试中... (${elapsed}秒)`;
            }

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        { 
                            role: 'system', 
                                content: '你是"长征小助手"。默认用 1-2 句回答，必要时可展开但请控制在 200 字内，先给核心再补一句解释。语气自然、口语化，不要列点，也不要用任何括号或中括号做说明，不要闲聊跑题。\n\n主要擅长长征/中国近代史；其他日常科普也可以简短回答，只要不涉及敏感/违规内容。遇到不清楚的就直接说不知道，不要编造。\n\n不要自称AI，不要输出无关的寒暄或背景。' 
                        },
                        ...contextMessages,
                        { role: 'user', content: userMessage }
                    ],
                    max_tokens: 300,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                    const aiReply = sanitizeReply(data.choices[0].message.content);
                clearInterval(timerInterval);
                addMessage(aiReply, false);
                lastError = null;
                break;
            } else {
                throw new Error('API返回格式异常: ' + JSON.stringify(data));
            }
        } catch (error) {
            lastError = error;
            const msg = error && error.message ? error.message : '';
            if(attempt >= MAX_RETRY || !shouldRetry(msg)){
                break;
            }
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            await new Promise(res => setTimeout(res, delay));
        }
    }

    if(lastError){
        console.error('调用API时出错:', lastError);
        clearInterval(timerInterval);
        const thinkingMsg = document.getElementById('thinkingMessage');
        if (thinkingMsg) thinkingMsg.remove();
        let errorMsg = `抱歉，我这边出了点问题，稍等一会儿再试试吧。`;
        const msg = lastError.message || '';
        if (msg.includes('401') || msg.includes('认证')) {
            errorMsg = '系统验证出了点问题，可能需要管理员检查一下配置。';
        } else if (msg.includes('403')) {
            errorMsg = '看起来权限不太够，可能需要联系管理员看看。';
        } else if (msg.includes('429')) {
            errorMsg = '问得有点快了，让我缓一缓，等一小会儿再问我吧。';
        } else if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
            errorMsg = '🔧 API服务器错误，请稍后再试。';
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('abort')) {
            errorMsg = '🌐 网络连接失败或超时，请检查网络。';
        } else if (msg.includes('CORS')) {
            errorMsg = '🔒 跨域请求被阻止，这是服务器配置问题。';
        }
        addMessage(errorMsg, false);
        console.log('详细错误信息:', msg);
    }
    // 重置界面状态
    loadingIndicator.style.display = 'none';
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
}

// ========== 输入处理 ==========
function sendMessage() {
    const message = userInput.value.trim();
    if(!message) return;
    if(message.length > 2000){
        addMessage('内容有点长，先简化一下再问我吧（建议少于2000字）。', false);
        return;
    }
    callDeepSeekAPI(message);
}

// 载入并渲染历史聊天记录（在初始化时调用）
function initChatHistory(){
    try{
        const raw = localStorage.getItem(AI_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if(chatMessages){
            chatMessages.innerHTML = '';
            arr.forEach(m => {
                const d = document.createElement('div');
                d.className = `message ${m.isUser ? 'user-message' : 'bot-message'}`;
                const textNode = document.createElement('div');
                textNode.className = 'msg-text';
                textNode.textContent = m.text;
                const timeNode = document.createElement('div');
                timeNode.className = 'msg-time';
                timeNode.textContent = m.ts ? formatTimestamp(m.ts) : '';
                d.appendChild(textNode);
                d.appendChild(timeNode);
                chatMessages.appendChild(d);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }catch(e){
        try{ localStorage.removeItem(AI_STORAGE_KEY); }catch(err){}
    }
}

function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
    
    // 动态调整输入框高度
    if (e.key === 'Enter' && e.shiftKey) {
        // 允许换行，不发送消息
        setTimeout(() => {
            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight) + 'px';
        }, 0);
    }
}

// ========== 页面加载后初始化 ==========
// 确保DOM完全加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIAssistant);
} else {
    initAIAssistant();
}

// ========== 导出函数（如果需要） ==========
// 如果你需要在其他脚本中控制AI助手，可以导出这些函数
window.AIAssistant = {
    open: openChatWindow,
    close: closeChatWindow,
    sendMessage: sendMessage,
    addMessage: addMessage
};