/**
 * 特殊归档文章进场动画
 * 当页面加载时，播放 "Special DeepWhite" 粒子动画，然后显示页面内容
 */
(function() {
    // 检查是否应该播放动画（通过检查 body 是否有 is-loading 类）
    if (!document.body.classList.contains('is-loading')) {
        return;
    }

    const canvas = document.getElementById('particle-layer');
    const mainWrapper = document.getElementById('main-wrapper');

    if (!canvas || !mainWrapper) {
        // 如果元素不存在，移除 loading 状态
        document.body.classList.remove('is-loading');
        return;
    }

    const ctx = canvas.getContext('2d');

    // 设置画布尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let animationId;
    let phase = 'gathering'; // 状态：gathering(汇聚) -> holding(展示) -> exploding(消失)

    // 配置字体大小
    let fontSize = Math.min(window.innerWidth / 10, 100);
    
    // 检测页面背景色，决定粒子颜色
    // 获取 body 的计算样式
    const bodyStyles = window.getComputedStyle(document.body);
    const bgColor = bodyStyles.backgroundColor;
    
    // 解析 RGB 值并计算亮度
    const rgbMatch = bgColor.match(/\d+/g);
    let isDarkBackground = false;
    if (rgbMatch && rgbMatch.length >= 3) {
        const r = parseInt(rgbMatch[0]);
        const g = parseInt(rgbMatch[1]);
        const b = parseInt(rgbMatch[2]);
        // 计算相对亮度 (0-255)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        // 如果亮度小于 128，认为是深色背景
        isDarkBackground = brightness < 128;
    }
    
    // 根据背景色选择粒子颜色：深色背景用白色，浅色背景用黑色
    const particleColor = isDarkBackground ? '#ffffff' : '#1a1a1a';
    
    // 样式配置
    ctx.fillStyle = particleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;

    // 粒子类定义
    class Particle {
        constructor(targetX, targetY) {
            this.targetX = targetX;
            this.targetY = targetY;
            
            // 初始位置：从屏幕外随机飞入
            const side = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
            if(side === 0) { this.x = Math.random() * canvas.width; this.y = -100; }
            else if(side === 1) { this.x = canvas.width + 100; this.y = Math.random() * canvas.height; }
            else if(side === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 100; }
            else { this.x = -100; this.y = Math.random() * canvas.height; }

            this.size = 1.5;
            this.ease = 0.05 + Math.random() * 0.05; // 汇聚速度系数
            
            // 爆炸时的随机速度
            this.vx = (Math.random() - 0.5) * 15;
            this.vy = (Math.random() - 0.5) * 15;
            
            this.alpha = 1;
        }

        update() {
            if (phase === 'gathering' || phase === 'holding') {
                // 飞向目标文字位置
                this.x += (this.targetX - this.x) * this.ease;
                this.y += (this.targetY - this.y) * this.ease;
            } else if (phase === 'exploding') {
                // 炸开
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= 0.03; // 逐渐消失
            }
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // 初始化：扫描 "Special DeepWhite"
    function init() {
        // 1. 画字
        ctx.fillText('Special DeepWhite', canvas.width/2, canvas.height/2);
        
        // 2. 扫描像素
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let gap = 4; // 桌面端间隔
        if (canvas.width < 768) gap = 3; // 移动端间隔更密，因为字小

        particles = [];
        for (let y = 0; y < data.height; y += gap) {
            for (let x = 0; x < data.width; x += gap) {
                // 扫描非透明像素
                if (data.data[(y * 4 * data.width) + (x * 4) + 3] > 128) {
                    particles.push(new Particle(x, y));
                }
            }
        }
    }

    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let active = false;
        particles.forEach(p => {
            p.update();
            p.draw();
            if (p.alpha > 0) active = true;
        });

        // 如果爆炸结束且所有粒子不可见，停止循环并隐藏 canvas
        if (phase === 'exploding' && !active) {
            cancelAnimationFrame(animationId);
            canvas.style.display = 'none';
            return;
        }
        
        animationId = requestAnimationFrame(animate);
    }

    // --- 执行时间轴 ---
    init();
    animate();

    // 1.2秒后：进入停顿展示期
    setTimeout(() => {
        phase = 'holding';
    }, 1200);

    // 2.5秒后：粒子炸开，网页内容浮现
    setTimeout(() => {
        phase = 'exploding';
        
        // 移除 body 的 overflow: hidden
        document.body.classList.remove('is-loading');
        
        // 显示主内容
        mainWrapper.classList.add('visible');
    }, 2500);

    // 窗口大小改变时重置
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // 重新初始化（可选，如果窗口改变时动画还在进行）
        if (phase === 'gathering' || phase === 'holding') {
            init();
        }
    });
})();

