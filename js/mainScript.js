document.addEventListener('DOMContentLoaded', function() {
    // 低配设备自动启用轻量渲染：减少模糊/阴影等高成本效果
    try {
        const deviceMemory = Number(navigator.deviceMemory || 0);
        const cores = Number(navigator.hardwareConcurrency || 0);
        const isLowEnd = (deviceMemory && deviceMemory <= 4) || (cores && cores <= 4);
        if (isLowEnd) {
            document.body.classList.add('perf-lite');
        }
    } catch (e) {}

    // 页面元素
    const linearBtn = document.getElementById('linearBtn');
    const freeBtn = document.getElementById('freeBtn');
    const startBtn = document.getElementById('startBtn');
    const enterAnimation = document.getElementById('enterAnimation');
    const statsNumbers = document.querySelectorAll('.stat-number');
    const sideNavLinks = document.querySelectorAll('.side-nav-list a');
    const navIndicator = document.getElementById('navIndicator');
    
    // 开始按钮点击事件 - 先轻微放大当前Banner再滚动到“前情提要”
    if (startBtn) startBtn.addEventListener('click', function() {
        // 添加加载动画
        startBtn.classList.add('loading');
        
        const activeCard = document.querySelector('.home-swiper .swiper-slide.swiper-slide-active .banner-card');
        if (activeCard) {
            // 添加轻微放大效果
            activeCard.classList.add('boost');
            // 小延迟后开始滚动，并在滚动开始后移除放大
            setTimeout(() => {
                const context = document.getElementById('context');
                if (context) {
                    context.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    activeCard.classList.remove('boost');
                    startBtn.classList.remove('loading');
                }, 500);
            }, 300);
        } else {
            // 无活动卡片时直接滚动
            setTimeout(() => {
                const context = document.getElementById('context');
                if (context) {
                    context.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    startBtn.classList.remove('loading');
                }, 400);
            }, 300);
        }
    });
    
    // 显示加载转场页面并模拟进度
    function showLoadingTransition(targetUrl) {
        const loadingTransition = document.getElementById('loadingTransition');
        const progressBar = document.getElementById('progressBar');
        const loadingTips = document.getElementById('loadingTips');
        
        const tips = [
            '准备进入长征之旅...',
            '加载历史地图数据...',
            '初始化长征路线...',
            '准备好了，即将启程！'
        ];
        
        loadingTransition.classList.add('active');
        
        // 创建隐藏的iframe预加载目标页面
        const preloadFrame = document.createElement('iframe');
        preloadFrame.style.display = 'none';
        preloadFrame.src = targetUrl;
        document.body.appendChild(preloadFrame);
        
        let progress = 0;
        let tipIndex = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 10;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = progress + '%';
            
            // 更新提示文字
            if (progress > 25 * (tipIndex + 1) && tipIndex < tips.length - 1) {
                tipIndex++;
                loadingTips.textContent = tips[tipIndex];
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
            }
        }, 200);
    }
    
    // 线性引导按钮点击事件
    linearBtn.addEventListener('click', function() {
        linearBtn.classList.add('loading');
        setTimeout(() => {
            showLoadingTransition('../html/map.html?mode=linear');
        }, 400);
    });
    
    // 自由探索按钮点击事件
    freeBtn.addEventListener('click', function() {
        freeBtn.classList.add('loading');
        setTimeout(() => {
            showLoadingTransition('../html/map.html?mode=free');
        }, 400);
    });
    
    // 启动进入动画
    function startEnterAnimation(mode) {
        // 显示进入动画
        enterAnimation.classList.add('active');
        
        // 根据模式设置不同的提示文本
        const subtitle = document.querySelector('.animation-subtitle');
        if (mode === 'linear') {
            subtitle.textContent = '正在进入线性引导模式...';
        } else {
            subtitle.textContent = '正在进入自由探索模式...';
        }
        
        // 模拟加载过程
        setTimeout(function() {
            // 这里在实际项目中应该跳转到相应的页面
            // window.location.href = mode === 'linear' ? 'linear-guide.html' : 'free-explore.html';
            
            // 由于是示例，我们只显示提示并重新加载页面
            alert(`即将进入${mode === 'linear' ? '线性引导' : '自由探索'}模式\n（在实际项目中，这里会跳转到相应页面）`);
            
            // 3秒后隐藏动画
            setTimeout(function() {
                enterAnimation.classList.remove('active');
            }, 3000);
        }, 2000);
    }
    
    // 侧边导航平滑滚动
    sideNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // 如果是首页，滚动到顶部
            if (targetId === '#home') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
            
            // 更新活动链接
            sideNavLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            // 立即更新指示器位置，使动画与点击同步
            updateNavIndicator();
        });
    });
    
    // 更新导航指示器位置
    function updateNavIndicator() {
        const activeLink = document.querySelector('.side-nav-list a.active');
        if (activeLink && navIndicator) {
            const linkRect = activeLink.getBoundingClientRect();
            const navRect = document.querySelector('.side-nav').getBoundingClientRect();
            
            // 计算相对位置并约束在侧边栏内部范围
            const topPos = Math.max(0, linkRect.top - navRect.top);
            const maxHeight = navRect.height - 8; // 留一点内边距
            const desiredHeight = Math.min(linkRect.height, maxHeight);

            navIndicator.style.top = `${topPos}px`;
            navIndicator.style.height = `${desiredHeight}px`;
        }
    }

    // 在窗口尺寸变化时重新计算指示器位置
    window.addEventListener('resize', function() {
        // 小延迟确保布局稳定
        setTimeout(updateNavIndicator, 80);
    });
    
    // 滚动时更新活动导航链接
    window.addEventListener('scroll', function() {
        const scrollPos = window.scrollY + 100;
        
        // 获取所有部分
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                sideNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
                
                // 更新导航指示器
                updateNavIndicator();
            }
        });
        
        // 处理首页的特殊情况
        if (scrollPos < 100) {
            sideNavLinks.forEach(link => link.classList.remove('active'));
            document.querySelector('.side-nav-list a[href="#home"]').classList.add('active');
            updateNavIndicator();
        }
    });
    
    // 初始化导航指示器
    updateNavIndicator();
    
    // 统计数字动画
    function animateStats() {
        statsNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const duration = 2000; // 动画持续时间
            const increment = target / (duration / 16); // 每16ms增加的值
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                stat.textContent = Math.floor(current);
            }, 16);
        });
    }
    
    // 当统计区域进入视口时触发动画
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
    
    // 选项卡片悬停效果增强
    const optionCards = document.querySelectorAll('.nav-option');
    optionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.option-icon i');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(10deg)';
                icon.style.transition = 'transform 0.4s';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.option-icon i');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
    
    // 添加页面加载完成后的动画
    setTimeout(() => {
        document.body.style.overflow = 'auto';
    }, 500);

    // 首页背景图延迟加载：先快出首屏，再在空闲时加载大图
    if (document.body && document.body.classList.contains('home-page')) {
        const markReady = () => document.body.classList.add('bg-ready');
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(markReady, { timeout: 1200 });
        } else {
            setTimeout(markReady, 300);
        }
    }

    // -------- 首页缩放 Banner 轮播初始化 --------
    try {
        const bannerEl = document.querySelector('.home-swiper');
        if (bannerEl && window.Swiper) {
            // 懒加载 slide 背景图：避免首屏把所有大图一次性下载
            const ensureSlideBg = (slideEl) => {
                if (!slideEl) return;
                const card = slideEl.querySelector('.banner-card');
                if (!card) return;
                if (card.dataset && card.dataset.bg && !card.dataset.bgLoaded) {
                    const url = card.dataset.bg;
                    card.style.backgroundImage = `url('${url}')`;
                    card.dataset.bgLoaded = '1';
                }
            };

            const ensureAround = (swiper) => {
                if (!swiper || !swiper.slides) return;
                const i = swiper.activeIndex;
                ensureSlideBg(swiper.slides[i]);
                ensureSlideBg(swiper.slides[i + 1]);
                ensureSlideBg(swiper.slides[i - 1]);
            };

            const bannerSwiper = new Swiper('.home-swiper', {
                loop: false,
                slidesPerView: 1,
                spaceBetween: 0,
                effect: 'fade',
                fadeEffect: { crossFade: true },
                grabCursor: true,
                speed: 800,
                preloadImages: false,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false
                },
                pagination: { el: '.home-swiper .swiper-pagination', clickable: true },
            });

            // 初始化先加载当前/相邻
            ensureAround(bannerSwiper);
            bannerSwiper.on('slideChangeTransitionStart', () => ensureAround(bannerSwiper));

            // 点击轮播图：向右切换（自动轮播不变）
            bannerEl.addEventListener('click', (e) => {
                // 不抢占标题区/按钮点击
                if (e.target && e.target.closest && e.target.closest('.banner-hero-inner')) return;
                // 不抢占分页圆点点击
                if (e.target && e.target.closest && e.target.closest('.swiper-pagination')) return;
                // 只要点在轮播区域，就切到下一张
                bannerSwiper.slideNext(800);
            });

            // 进入视口时才启动自动播放，避免后台标签无意义轮播
            const bannerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        bannerSwiper.autoplay.start();
                    } else {
                        bannerSwiper.autoplay.stop();
                    }
                });
            }, { threshold: 0.25 });
            bannerObserver.observe(bannerEl);
        }
    } catch (e) {
        // ignore
    }
});