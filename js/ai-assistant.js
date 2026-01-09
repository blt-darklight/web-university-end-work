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

// 持久化键与频道
const AI_STORAGE_KEY = 'deepseek_ai_chat_v1';
const AI_BC_CHANNEL = 'deepseek_ai_channel_v1';

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
    // 时间格式化
    function formatTimestamp(ts){
        try{
            const d = new Date(ts);
            const now = new Date();
            const sameDay = d.toDateString() === now.toDateString();
            if(sameDay){
                return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            }
            return d.toLocaleString([], {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
        }catch(e){ return '' }
    }

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
            if(window.BroadcastChannel){ try{ (new BroadcastChannel(AI_BC_CHANNEL)).postMessage({ type: 'sync' }); }catch(e){} }
        }
    }catch(e){}

    // 如果 DOM was rendered without timestamp, update timestamp node
    try{ if(dom){ const tn = dom.querySelector && dom.querySelector('.msg-time'); if(tn) tn.textContent = formatTimestamp(nowTs); } }catch(e){}

    return dom;
}

function initChatHistory() {
    // 尝试从 localStorage 恢复历史（渲染而不重复保存）
    try{
        const raw = localStorage.getItem(AI_STORAGE_KEY);
        if(raw){
            const msgs = JSON.parse(raw);
            msgs.forEach(m => {
                const d = document.createElement('div');
                d.className = `message ${m.isUser ? 'user-message' : 'bot-message'}`;
                const textNode = document.createElement('div');
                textNode.className = 'msg-text';
                textNode.textContent = m.text;
                const timeNode = document.createElement('div');
                timeNode.className = 'msg-time';
                timeNode.textContent = m.ts ? (new Date(m.ts)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
                d.appendChild(textNode);
                d.appendChild(timeNode);
                chatMessages.appendChild(d);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return;
        }
    }catch(e){ }

    // 默认欢迎语（当历史为空时写入）
    addMessage("你好！我是你的长征问答小助手，有什么可以帮你的吗？", false);
}

// BroadcastChannel 监听，接收到 sync 时重载消息显示
if(window.BroadcastChannel){
    try{
        const bc = new BroadcastChannel(AI_BC_CHANNEL);
        bc.onmessage = (ev) => {
            if(ev.data && ev.data.type === 'sync'){
                // 重新渲染历史到 chatMessages
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
                            timeNode.textContent = m.ts ? (new Date(m.ts)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
                            d.appendChild(textNode);
                            d.appendChild(timeNode);
                            chatMessages.appendChild(d);
                        });
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }catch(e){}
            }
        };
    }catch(e){}
}

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
    
    try {
        // 创建超时信号
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
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
                        content: '你是"长征小助手"，一个喜欢讲历史故事的朋友。用聊天的方式给大家讲长征的事。\n\n说话风格：自然、亲切、口语化。不要用列点（1.2.3. 或 -），用自然的段落把内容串起来。可以用"其实"、"说起来"这样的词，但不要太多，保持自然就好。\n\n回答内容：主要讲长征历史、长征人物、长征战役，以及相关的中国历史。如果问题跟长征无关，就委婉地说"这个我不太了解，不过我可以给你讲讲长征的事"。\n\n记住：你是"长征小助手"，不要提"AI"、"人工智能"。回答简短（2-3句话），像聊天不像背书。' 
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
            const aiReply = data.choices[0].message.content;
            // 停止计时器
            clearInterval(timerInterval);
            addMessage(aiReply, false);
        } else {
            throw new Error('API返回格式异常: ' + JSON.stringify(data));
        }
        
    } catch (error) {
        console.error('调用API时出错:', error);
        
        // 停止计时器
        clearInterval(timerInterval);
        // 移除"正在思考..."的提示消息
        const thinkingMsg = document.getElementById('thinkingMessage');
        if (thinkingMsg) {
            thinkingMsg.remove();
        }
        
        // 根据不同的错误类型显示不同的提示
        let errorMsg = `抱歉，我这边出了点问题，稍等一会儿再试试吧。`;
        
        if (error.message.includes('401') || error.message.includes('认证')) {
            errorMsg = '系统验证出了点问题，可能需要管理员检查一下配置。';
        } else if (error.message.includes('403')) {
            errorMsg = '看起来权限不太够，可能需要联系管理员看看。';
        } else if (error.message.includes('429')) {
            errorMsg = '问得有点快了，让我缓一缓，等一小会儿再问我吧。';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
            errorMsg = '🔧 API服务器错误，请稍后再试。';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg = '🌐 网络连接失败，请检查网络。';
        } else if (error.message.includes('CORS')) {
            errorMsg = '🔒 跨域请求被阻止，这是服务器配置问题。';
        }
        
        addMessage(errorMsg, false);
        
        // 在控制台显示详细错误，方便调试
        console.log('详细错误信息:', error.message);
    } finally {
        // 重置界面状态
        loadingIndicator.style.display = 'none';
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// ========== 输入处理 ==========
function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        callDeepSeekAPI(message);
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