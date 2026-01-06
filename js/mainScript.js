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
    
    // 开始按钮点击事件 - 滚动到探索区域
    startBtn.addEventListener('click', function() {
        document.getElementById('explore').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    });
    
    // 线性引导按钮点击事件
    linearBtn.addEventListener('click', function() {
        startEnterAnimation('linear');
    });
    
    // 自由探索按钮点击事件
    freeBtn.addEventListener('click', function() {
        startEnterAnimation('free');
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
        });
    });
    
    // 更新导航指示器位置
    function updateNavIndicator() {
        const activeLink = document.querySelector('.side-nav-list a.active');
        if (activeLink && navIndicator) {
            const linkRect = activeLink.getBoundingClientRect();
            const navRect = document.querySelector('.side-nav').getBoundingClientRect();
            
            navIndicator.style.top = `${linkRect.top - navRect.top}px`;
            navIndicator.style.height = `${linkRect.height}px`;
        }
    }
    
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
});