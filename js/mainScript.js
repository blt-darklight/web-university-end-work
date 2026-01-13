document.addEventListener('DOMContentLoaded', function() {
    // 页面元素
    const linearBtn = document.getElementById('linearBtn');
    const freeBtn = document.getElementById('freeBtn');
    const startBtn = document.getElementById('startBtn');
    const enterAnimation = document.getElementById('enterAnimation');
    const statsNumbers = document.querySelectorAll('.stat-number');
    const sideNavLinks = document.querySelectorAll('.side-nav-list a');
    const navIndicator = document.getElementById('navIndicator');
    const parallaxImage = document.getElementById('parallaxImage');
    
    // 视差滚动效果
    if (parallaxImage) {
        document.addEventListener('mousemove', function(e) {
            const x = (window.innerWidth - e.pageX * 2) / 100;
            const y = (window.innerHeight - e.pageY * 2) / 100;
            
            parallaxImage.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
    }
    
    // 开始按钮点击事件 - 先轻微放大当前Banner再滚动到探索区域
    startBtn.addEventListener('click', function() {
        // 添加加载动画
        startBtn.classList.add('loading');
        
        const activeCard = document.querySelector('.home-swiper .swiper-slide.swiper-slide-active .banner-card');
        if (activeCard) {
            // 添加轻微放大效果
            activeCard.classList.add('boost');
            // 小延迟后开始滚动，并在滚动开始后移除放大
            setTimeout(() => {
                const explore = document.getElementById('explore');
                if (explore) {
                    explore.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    activeCard.classList.remove('boost');
                    startBtn.classList.remove('loading');
                }, 500);
            }, 300);
        } else {
            // 无活动卡片时直接滚动
            setTimeout(() => {
                document.getElementById('explore').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // -------- 首页缩放 Banner 轮播初始化 --------
    try {
        const bannerEl = document.querySelector('.home-swiper');
        if (bannerEl && window.Swiper) {
            const bannerSwiper = new Swiper('.home-swiper', {
                loop: false,
                slidesPerView: 1,
                spaceBetween: 0,
                effect: 'fade',
                fadeEffect: { crossFade: true },
                grabCursor: true,
                speed: 800,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false
                },
                pagination: { el: '.home-swiper .swiper-pagination', clickable: true },
                navigation: { nextEl: '.home-swiper .swiper-button-next', prevEl: '.home-swiper .swiper-button-prev' }
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