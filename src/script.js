// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 页面元素引用
    const loadingScreen = document.getElementById('loadingScreen');
    const homePage = document.getElementById('homePage');
    const prologuePage = document.getElementById('prologuePage');
    const mapPage = document.getElementById('mapPage');
    const startJourneyBtn = document.getElementById('startJourney');
    const backFromPrologueBtn = document.getElementById('backFromPrologue');
    const backFromMapBtn = document.getElementById('backFromMap');
    const startLongMarchBtn = document.getElementById('startLongMarch');
    const strategyOptions = document.querySelectorAll('.strategy-option');
    const strategyFeedback = document.getElementById('strategyFeedback');
    const progressDots = document.querySelectorAll('.progress-dot');
    const currentSectionSpan = document.getElementById('currentSection');
    const mapSearch = document.getElementById('mapSearch');
    const searchButton = document.getElementById('searchButton');
    const eventItems = document.querySelectorAll('.event-item');
    const mapMarkers = document.querySelectorAll('.map-marker');
    const closeDetailsBtn = document.getElementById('closeDetails');
    const detailTitle = document.getElementById('detailTitle');
    const detailsContent = document.getElementById('detailsContent');
    const prevEventBtn = document.getElementById('prevEvent');
    const nextEventBtn = document.getElementById('nextEvent');
    const explorationProgress = document.getElementById('explorationProgress');
    const progressPercent = document.getElementById('progressPercent');
    const viewAchievementsBtn = document.getElementById('viewAchievements');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetViewBtn = document.getElementById('resetView');
    
    // 模拟加载过程
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            homePage.classList.add('active');
        }, 500);
    }, 2000);
    
    // 页面切换功能
    startJourneyBtn.addEventListener('click', () => {
        homePage.classList.remove('active');
        prologuePage.classList.add('active');
        // 触发第一个部分的动画
        setTimeout(() => {
            document.querySelector('.prologue-section').style.animation = 'fadeInUp 0.8s forwards';
        }, 100);
    });
    
    backFromPrologueBtn.addEventListener('click', () => {
        prologuePage.classList.remove('active');
        homePage.classList.add('active');
    });
    
    backFromMapBtn.addEventListener('click', () => {
        mapPage.classList.remove('active');
        prologuePage.classList.add('active');
    });
    
    startLongMarchBtn.addEventListener('click', () => {
        prologuePage.classList.remove('active');
        mapPage.classList.add('active');
    });
    
    // 策略选择交互
    strategyOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有选项的选中状态
            strategyOptions.forEach(opt => {
                opt.style.borderColor = 'var(--light-gray)';
                opt.style.transform = 'translateY(0)';
            });
            
            // 设置当前选项为选中状态
            this.style.borderColor = 'var(--primary-red)';
            this.style.transform = 'translateY(-5px)';
            
            // 显示反馈
            let feedbackText = '';
            if (this.id === 'optionA') {
                feedbackText = '<strong>这是毛泽东同志之前的成功战术，但当时未被采纳……</strong><br>毛泽东主张集中优势兵力，在运动战中歼灭敌人有生力量，这一战术在之前反"围剿"中取得过辉煌胜利。';
            } else {
                feedbackText = '<strong>很遗憾，这就是当时"左"倾错误领导下的实际选择，红军遭受重大损失……</strong><br>博古、李德等人坚持"御敌于国门之外"的阵地战策略，命令红军与装备精良的国民党军打正规战、堡垒战，导致红军损失惨重。';
            }
            
            strategyFeedback.innerHTML = feedbackText;
            strategyFeedback.style.display = 'block';
        });
    });
    
    // 前情提要进度点点击
    progressDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(`section${sectionId}`);
            
            // 更新进度点
            progressDots.forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            
            // 更新当前章节显示
            currentSectionSpan.textContent = sectionId;
            
            // 滚动到目标部分
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // 滚动时更新进度点
    const prologueSections = document.querySelectorAll('.prologue-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id.replace('section', '');
                progressDots.forEach(d => d.classList.remove('active'));
                document.querySelector(`.progress-dot[data-section="${sectionId}"]`).classList.add('active');
                currentSectionSpan.textContent = sectionId;
            }
        });
    }, observerOptions);
    
    prologueSections.forEach(section => {
        observer.observe(section);
    });
    
    // 地图探索数据
    const eventsData = {
        ruijin: {
            title: "瑞金出发 · 长征起点",
            date: "1934年10月",
            content: `
                <div class="event-detail">
                    <div class="detail-image" style="background-color: #ffebee; height: 180px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                        <i class="fas fa-map-pin" style="font-size: 4rem; color: #c62828;"></i>
                    </div>
                    <h4>长征的起点</h4>
                    <p>1934年10月10日，中共中央、中革军委率领中央红军主力5个军团及2个纵队，共8.6万余人，从江西瑞金等地出发，开始战略转移。最初计划是到湘西与红二、六军团会合。</p>
                    <p>出发前，红军战士们并不知道这是一次万里长征，许多人以为只是短期的战略转移。他们告别了战斗多年的根据地，告别了送行的乡亲，踏上了未知的征程。</p>
                    <div class="detail-stats">
                        <div class="stat">
                            <h5>出发人数</h5>
                            <p>约8.6万人</p>
                        </div>
                        <div class="stat">
                            <h5>出发时间</h5>
                            <p>1934年10月10日</p>
                        </div>
                        <div class="stat">
                            <h5>携带物资</h5>
                            <p>有限的粮食、弹药和补给</p>
                        </div>
                    </div>
                    <div class="detail-quiz">
                        <h5><i class="fas fa-question-circle"></i> 知识小测验</h5>
                        <p>中央红军长征出发时大约有多少人？</p>
                        <div class="quiz-options">
                            <button class="quiz-option">A. 约5万人</button>
                            <button class="quiz-option">B. 约8.6万人</button>
                            <button class="quiz-option">C. 约10万人</button>
                        </div>
                    </div>
                </div>
            `,
            explored: true
        },
        xiangjiang: {
            title: "湘江战役 · 最惨烈的一战",
            date: "1934年11月27日-12月1日",
            content: `
                <div class="event-detail">
                    <div class="detail-image" style="background-color: #fce4ec; height: 180px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                        <i class="fas fa-crosshairs" style="font-size: 4rem; color: #c62828;"></i>
                    </div>
                    <h4>血染湘江</h4>
                    <p>湘江战役是中央红军长征以来最惨烈的一战。红军在广西全州、兴安一带的湘江沿岸，与国民党军展开激烈战斗，试图突破敌人的第四道封锁线。</p>
                    <p>由于辎重过多，行军缓慢，红军付出了惨重代价。红五军团第三十四师为掩护主力渡江，几乎全军覆没。师长陈树湘受伤被俘后，掏腹断肠，壮烈牺牲。</p>
                    <div class="detail-stats">
                        <div class="stat">
                            <h5>战役时间</h5>
                            <p>5天5夜</p>
                        </div>
                        <div class="stat">
                            <h5>红军损失</h5>
                            <p>从8.6万锐减至3万余人</p>
                        </div>
                        <div class="stat">
                            <h5>历史意义</h5>
                            <p>促成了遵义会议的召开</p>
                        </div>
                    </div>
                    <div class="detail-quote">
                        <i class="fas fa-quote-left"></i>
                        <p>三年不饮湘江水，十年不食湘江鱼。</p>
                        <p class="quote-source">—— 当地民谣</p>
                    </div>
                </div>
            `,
            explored: false
        },
        zunyi: {
            title: "遵义会议 · 伟大转折",
            date: "1935年1月15日-17日",
            content: `
                <div class="event-detail">
                    <div class="detail-image" style="background-color: #fff3e0; height: 180px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                        <i class="fas fa-users" style="font-size: 4rem; color: #f9a825;"></i>
                    </div>
                    <h4>历史的转折点</h4>
                    <p>遵义会议是中国共产党历史上一个生死攸关的转折点。会议集中解决了当时具有决定意义的军事和组织问题，结束了"左"倾教条主义错误在中央的统治，确立了毛泽东在中共中央和红军的领导地位。</p>
                    <p>这次会议在极端危急的历史关头，挽救了党，挽救了红军，挽救了中国革命，标志着中国共产党在政治上开始走向成熟。</p>
                    <div class="detail-stats">
                        <div class="stat">
                            <h5>会议时长</h5>
                            <p>3天</p>
                        </div>
                        <div class="stat">
                            <h5>关键决议</h5>
                            <p>确立毛泽东的领导地位</p>
                        </div>
                        <div class="stat">
                            <h5>历史意义</h5>
                            <p>中国共产党走向成熟的标志</p>
                        </div>
                    </div>
                    <div class="detail-quote">
                        <i class="fas fa-quote-left"></i>
                        <p>遵义会议以后，我们党在毛泽东同志领导下，建立了一支完全新型的人民军队，制定了一整套适合中国情况的战略战术。</p>
                        <p class="quote-source">—— 邓小平</p>
                    </div>
                </div>
            `,
            explored: false
        },
        chishui: {
            title: "四渡赤水 · 毛泽东的得意之笔",
            date: "1935年1月19日-3月22日",
            content: `
                <div class="event-detail">
                    <div class="detail-image" style="background-color: #e3f2fd; height: 180px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                        <i class="fas fa-route" style="font-size: 4rem; color: #0277bd;"></i>
                    </div>
                    <h4>运动战的典范</h4>
                    <p>四渡赤水是毛泽东军事指挥艺术的得意之笔。在国民党军40万重兵围追堵截的严峻形势下，毛泽东指挥中央红军采取高度机动的运动战方针，纵横驰骋于川黔滇边境广大地区，巧妙地穿插于国民党军重兵集团之间，最终摆脱了敌人的围堵。</p>
                    <p>四渡赤水之战，中央红军在毛泽东等指挥下，彻底粉碎了蒋介石企图围歼红军于川黔滇边境的狂妄计划，取得了战略转移中具有决定意义的胜利。</p>
                    <div class="detail-stats">
                        <div class="stat">
                            <h5>战役时长</h5>
                            <p>2个多月</p>
                        </div>
                        <div class="stat">
                            <h5>行军里程</h5>
                            <p>约1000公里</p>
                        </div>
                        <div class="stat">
                            <h5>战术特点</h5>
                            <p>声东击西，出奇制胜</p>
                        </div>
                    </div>
                    <div class="detail-quiz">
                        <h5><i class="fas fa-question-circle"></i> 知识小测验</h5>
                        <p>毛泽东称哪次战役是他的"得意之笔"？</p>
                        <div class="quiz-options">
                            <button class="quiz-option">A. 湘江战役</button>
                            <button class="quiz-option">B. 四渡赤水</button>
                            <button class="quiz-option">C. 飞夺泸定桥</button>
                        </div>
                    </div>
                </div>
            `,
            explored: false
        }
    };
    
    // 当前探索的事件索引
    let currentEventIndex = 0;
    const eventIds = ['ruijin', 'xiangjiang', 'zunyi', 'chishui', 'luding', 'snowMountain'];
    let exploredEvents = ['ruijin']; // 初始只有瑞金已探索
    
    // 更新探索进度
    function updateExplorationProgress() {
        const progress = (exploredEvents.length / eventIds.length) * 100;
        explorationProgress.style.width = `${progress}%`;
        progressPercent.textContent = `${Math.round(progress)}%`;
    }
    
    // 显示事件详情
    function showEventDetails(eventId) {
        const event = eventsData[eventId];
        if (!event) return;
        
        detailTitle.textContent = event.title;
        detailsContent.innerHTML = event.content;
        
        // 添加到已探索事件
        if (!exploredEvents.includes(eventId)) {
            exploredEvents.push(eventId);
            updateExplorationProgress();
            
            // 更新侧边栏中的事件状态
            const eventItem = document.querySelector(`.event-item[data-event="${eventId}"]`);
            if (eventItem) {
                eventItem.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                eventItem.style.borderLeftColor = '#4caf50';
            }
            
            // 更新地图标记状态
            const mapMarker = document.querySelector(`.map-marker[data-event="${eventId}"]`);
            if (mapMarker) {
                mapMarker.style.opacity = '1';
            }
        }
        
        // 更新当前事件索引
        currentEventIndex = eventIds.indexOf(eventId);
        
        // 设置测验按钮交互
        const quizOptions = document.querySelectorAll('.quiz-option');
        quizOptions.forEach(option => {
            option.addEventListener('click', function() {
                const allOptions = document.querySelectorAll('.quiz-option');
                allOptions.forEach(opt => {
                    opt.style.backgroundColor = '';
                    opt.style.color = '';
                });
                
                // 检查答案 (简单示例)
                if (eventId === 'ruijin' && this.textContent.includes('8.6万人')) {
                    this.style.backgroundColor = '#4caf50';
                    this.style.color = 'white';
                } else if (eventId === 'chishui' && this.textContent.includes('四渡赤水')) {
                    this.style.backgroundColor = '#4caf50';
                    this.style.color = 'white';
                } else {
                    this.style.backgroundColor = '#f44336';
                    this.style.color = 'white';
                }
            });
        });
    }
    
    // 搜索功能
    searchButton.addEventListener('click', performSearch);
    mapSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        const searchTerm = mapSearch.value.trim().toLowerCase();
        if (!searchTerm) return;
        
        // 简单搜索逻辑
        let foundEvent = null;
        
        if (searchTerm.includes('瑞金') || searchTerm.includes('起点') || searchTerm.includes('出发')) {
            foundEvent = 'ruijin';
        } else if (searchTerm.includes('湘江') || searchTerm.includes('血战')) {
            foundEvent = 'xiangjiang';
        } else if (searchTerm.includes('遵义') || searchTerm.includes('会议')) {
            foundEvent = 'zunyi';
        } else if (searchTerm.includes('赤水') || searchTerm.includes('四渡')) {
            foundEvent = 'chishui';
        } else if (searchTerm.includes('泸定') || searchTerm.includes('铁索')) {
            foundEvent = 'luding';
        } else if (searchTerm.includes('雪山') || searchTerm.includes('草地')) {
            foundEvent = 'snowMountain';
        }
        
        if (foundEvent) {
            showEventDetails(foundEvent);
            mapSearch.value = '';
        } else {
            alert('未找到相关事件，请尝试其他关键词。');
        }
    }
    
    // 事件列表点击
    eventItems.forEach(item => {
        item.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event');
            showEventDetails(eventId);
        });
    });
    
    // 地图标记点击
    mapMarkers.forEach(marker => {
        marker.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event');
            showEventDetails(eventId);
        });
    });
    
    // 关闭详情面板
    closeDetailsBtn.addEventListener('click', function() {
        detailsContent.innerHTML = `
            <div class="default-detail">
                <div class="detail-icon">
                    <i class="fas fa-map-marked-alt"></i>
                </div>
                <h4>欢迎探索长征地图</h4>
                <p>请点击地图上的标记点，或从左侧事件列表中选择一个事件，查看详细的历史介绍和互动内容。</p>
                <div class="detail-tip">
                    <i class="fas fa-info-circle"></i>
                    <span>尝试点击"瑞金出发"标记，了解长征的起点故事</span>
                </div>
            </div>
        `;
        detailTitle.textContent = "选择事件以查看详情";
    });
    
    // 上一个/下一个事件导航
    prevEventBtn.addEventListener('click', function() {
        if (currentEventIndex > 0) {
            currentEventIndex--;
            showEventDetails(eventIds[currentEventIndex]);
        }
    });
    
    nextEventBtn.addEventListener('click', function() {
        if (currentEventIndex < eventIds.length - 1) {
            currentEventIndex++;
            showEventDetails(eventIds[currentEventIndex]);
        }
    });
    
    // 查看成就按钮
    viewAchievementsBtn.addEventListener('click', function() {
        alert(`您已探索 ${exploredEvents.length} 个长征事件，继续努力！\n\n已解锁：${exploredEvents.map(id => {
            if (id === 'ruijin') return '瑞金出发';
            if (id === 'xiangjiang') return '湘江战役';
            if (id === 'zunyi') return '遵义会议';
            if (id === 'chishui') return '四渡赤水';
            return id;
        }).join(', ')}`);
    });
    
    // 地图控制功能
    zoomInBtn.addEventListener('click', function() {
        const mapBase = document.querySelector('.map-base');
        const currentScale = mapBase.style.transform ? parseFloat(mapBase.style.transform.replace('scale(', '').replace(')', '')) : 1;
        mapBase.style.transform = `scale(${currentScale * 1.2})`;
    });
    
    zoomOutBtn.addEventListener('click', function() {
        const mapBase = document.querySelector('.map-base');
        const currentScale = mapBase.style.transform ? parseFloat(mapBase.style.transform.replace('scale(', '').replace(')', '')) : 1;
        mapBase.style.transform = `scale(${currentScale * 0.8})`;
    });
    
    resetViewBtn.addEventListener('click', function() {
        const mapBase = document.querySelector('.map-base');
        mapBase.style.transform = 'scale(1)';
    });
    
    // 初始化探索进度
    updateExplorationProgress();
});