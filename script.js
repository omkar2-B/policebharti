const DEFAULT_DATA = {
    logs: {},
    syllabus: { marathi: [], maths: [], reasoning: [], gk: [] },
    height: '',
    weight: 65,
    chest: '',
    mockScores: [],
    streak: 0,
    maxStreak: 0,
    lastUpdate: null,
    angerCount: 0,
    bonds: { family: [], love: [] }
};

let appData = JSON.parse(localStorage.getItem('antiGravityData')) || DEFAULT_DATA;
// Ensure structural integrity for legacy data
appData = { ...DEFAULT_DATA, ...appData };
appData.syllabus = { ...DEFAULT_DATA.syllabus, ...appData.syllabus };
appData.bonds = { ...DEFAULT_DATA.bonds, ...appData.bonds };
let currentDateObj = new Date();
const TOTAL_DAILY_TASKS = 9; 

// Future Self Quotes
const futureQuotes = [
    '"Your future self is watching your decisions today. Choose discipline."',
    '"The pain of discipline is less than the pain of regret. Keep pushing."',
    '"A calm mind builds a strong empire. Do not let temporary emotions ruin your life."',
    '"Uniforms are not bought, they are earned through sweat, patience, and silent battles."',
    '"Respect your parents, love your partner, but never lose focus on your mission."'
];

const affirmations = [
    "मी वर्दी मिळवण्यासाठीच जन्माला आलो आहे.",
    "माझ्या कष्टाला कष्टाची आणि रक्ताला रक्ताची जाण आहे.",
    "मी प्रत्येक संकटावर मात करण्यास सक्षम आहे.",
    "माझं मन शांत आणि बुद्धी तल्लख आहे.",
    "आजचा दिवस माझ्या ध्येयाच्या दिशेने एक मोठे पाऊल आहे.",
    "आई-वडिलांच्या स्वप्नांसाठी मी काहीही करू शकतो.",
    "माझ्यात एक यशस्वी पोलीस अधिकारी दडलेला आहे.",
    "शांतता हीच माझी सर्वात मोठी ताकद आहे."
];
let affIndex = 0;

function hapticFeedback(pattern = 50) {
    try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    } catch (e) {
        console.warn("Haptic feedback failed:", e);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Splash screen logic
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hidden');
        hapticFeedback();
    }, 1500);

    initParticles();
    typeWriter();
    updateMonkMode(); // Proactive streak check
    loadDailyLog();
    updateAnalytics();
    
    // Future Self Setup
    const randomQuote = futureQuotes[Math.floor(Math.random() * futureQuotes.length)];
    document.getElementById('futureQuote').textContent = randomQuote;

    // Load Bonds
    loadBonds();
    
    // Auto-calculate Balance
    calcLifeBalance();

    updateHarmonyStatus();
    updateCareerPower();
    
    // Load Eligibility Inputs
    document.getElementById('heightInput').value = appData.height || '';
    document.getElementById('chestInput').value = appData.chest || '';
    updateEligibility();

    // Load Syllabus
    loadSyllabus();

    // Load Mock Scores
    renderMockScores();
    updateBadges();
});

// ---------------------------------
// BACKGROUND PARTICLES & TYPEWRITER
// ---------------------------------
function initParticles() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    for(let i=0; i<30; i++) {
        particlesArray.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * -1 - 0.5,
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => {
            ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speedY;
            if (p.y < 0) p.y = canvas.height;
        });
        requestAnimationFrame(animate);
    }
    animate();
}

const quote = `"रणांगणावर घाम गाळला तर युद्धात रक्त सांडावे लागत नाही."`;
let iText = 0;
function typeWriter() {
    if (iText < quote.length) {
        document.getElementById("typewriterQuote").innerHTML += quote.charAt(iText);
        iText++;
        setTimeout(typeWriter, 50);
    }
}

// ---------------------------------
// RANK SYSTEM
// ---------------------------------
function updateRank(consistencyScore) {
    const badge = document.getElementById('rankBadge');
    const title = document.getElementById('rankTitle');
    const streak = appData.streak || 0;
    
    badge.className = 'rank-badge'; // reset
    
    // Rank based on both consistency AND streak
    if(streak >= 90 && consistencyScore >= 80) {
        title.textContent = "IPS (ELITE)";
        badge.innerHTML = '<i class="fa-solid fa-crown"></i>';
        badge.classList.add('gold');
    } else if(streak >= 30 || consistencyScore >= 60) {
        title.textContent = "SUB-INSPECTOR (PSI)";
        badge.innerHTML = '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>';
        badge.classList.add('silver');
    } else if(streak >= 7 || consistencyScore >= 30) {
        title.textContent = "CONSTABLE (शिपाई)";
        badge.innerHTML = '<i class="fa-solid fa-shield"></i>';
        badge.classList.add('bronze');
    } else {
        title.textContent = "RECRUIT (रंगरूट)";
        badge.innerHTML = '<i class="fa-solid fa-user"></i>';
    }
}

function saveState() {
    try {
        localStorage.setItem('antiGravityData', JSON.stringify(appData));
    } catch (e) {
        console.error("Storage Error:", e);
        if (e.name === 'QuotaExceededError') {
            alert("Storage full! Please clear old logs.");
        }
    }
}

// Format Date Utility
function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ---------------------------------
// ELIGIBILITY (PST) LOGIC
// ---------------------------------
function updateEligibility() {
    const h = parseFloat(document.getElementById('heightInput').value);
    const c = parseFloat(document.getElementById('chestInput').value);
    const w = appData.weight || 65;
    
    appData.height = h || '';
    appData.chest = c || '';
    saveState();

    let statusEl = document.getElementById('pstStatus');
    let bmiEl = document.getElementById('bmiValue');

    if (h) {
        const h_m = h / 100;
        const bmi = (w / (h_m * h_m)).toFixed(1);
        bmiEl.textContent = bmi;
    }

    if (h && c) {
        // Maharashtra Police Req: Male Height 165cm, Chest 79cm (+5cm expansion ignored for simplicity)
        if (h >= 165 && c >= 79) {
            statusEl.textContent = "ELIGIBLE (PASS)";
            statusEl.className = "bmi-status normal";
        } else {
            statusEl.textContent = "NOT ELIGIBLE";
            statusEl.className = "bmi-status danger";
        }
    } else {
        statusEl.textContent = "WAITING...";
        statusEl.className = "bmi-status";
    }
}

// ---------------------------------
// LIFE BALANCE (AUTO-CALCULATED)
// ---------------------------------
function calcLifeBalance() {
    const todayStr = getDateString(new Date());
    const todayLog = appData.logs[todayStr] || { ground: [], study: [], diet: [] };
    
    // 1. Career (Study + Syllabus)
    const studyScore = (todayLog.study.length / 3) * 50; // max 50
    
    // Dynamically calculate syllabus score based on total checkboxes
    const syllabusCheckboxes = document.querySelectorAll('div[id^="syllabus-"] input[type="checkbox"]');
    const totalSyllabusTasks = syllabusCheckboxes.length || 1;
    
    let completedSyllabusTasks = 0;
    Object.keys(appData.syllabus).forEach(cat => {
        if (appData.syllabus[cat]) {
            completedSyllabusTasks += appData.syllabus[cat].length;
        }
    });
    const syllabusScore = (completedSyllabusTasks / totalSyllabusTasks) * 50; // max 50
    const c = Math.round(studyScore + syllabusScore);

    // 2. Health (Ground + Diet)
    const groundScore = (todayLog.ground.length / 3) * 50;
    const dietScore = (todayLog.diet.length / 3) * 50;
    const h = Math.round(groundScore + dietScore);

    // 3. Family (Bonds Checklist)
    const f = Math.round((appData.bonds.family.length / 3) * 100);

    // 4. Love / Relationship (Bonds Checklist)
    const l = Math.round((appData.bonds.love.length / 3) * 100);

    // 5. Mental Peace (100 - Penalties)
    // For simplicity, we check anger count for today only if possible, but let's just use global anger as a slight penalty, mostly rely on completion.
    // Let's reset angerCount daily. If angerCount > 0, minus 25% each.
    let p = 100 - ((appData.angerCount || 0) * 25);
    if (p < 0) p = 0;

    // Update UI (Progress Bars)
    document.getElementById('valCareer').textContent = c + '%';
    document.getElementById('barCareer').style.width = c + '%';
    
    document.getElementById('valFamily').textContent = f + '%';
    document.getElementById('barFamily').style.width = f + '%';
    
    document.getElementById('valLove').textContent = l + '%';
    document.getElementById('barLove').style.width = l + '%';
    
    document.getElementById('valPeace').textContent = p + '%';
    document.getElementById('barPeace').style.width = p + '%';
    
    document.getElementById('valHealth').textContent = h + '%';
    document.getElementById('barHealth').style.width = h + '%';

    // Advice Engine
    let advice = "";
    const lowest = Math.min(c, f, l, p, h);

    if (lowest === p) {
        advice = "Mental peace is critically low. Use the Cooldown system immediately.";
    } else if (lowest === f) {
        advice = "Family criteria failed. Spend 15 minutes with them without mobile.";
    } else if (lowest === l) {
        advice = "Relationship criteria failed. Listen without ego today.";
    } else if (lowest === c) {
        advice = "Career focus is dropping. Complete your study log.";
    } else if (lowest === h) {
        advice = "Health is declining. Focus on ground tasks and diet.";
    } else if (lowest === 0) {
        advice = "Complete your daily logs to see assessment.";
    } else {
        advice = "Excellent balance. Maintain this state, Officer.";
    }

    document.getElementById('balanceAdvice').textContent = advice;
}

// BONDS LOGIC
function loadBonds() {
    // Reset bonds if it's a new day
    const todayStr = getDateString(new Date());
    if (appData.lastUpdate !== todayStr) {
        appData.bonds = { family: [], love: [] };
        appData.angerCount = 0; // Reset anger daily
        saveState();
    }
    
    ['family', 'love'].forEach(cat => {
        document.querySelectorAll(`#${cat}Bonds input`).forEach(input => {
            const taskName = input.parentElement.innerText.trim();
            input.checked = appData.bonds[cat].includes(taskName);
        });
    });
}

function toggleBond(cat, elementId) {
    hapticFeedback();
    const input = document.querySelector(`input[onchange="toggleBond('${cat}', '${elementId}')"]`);
    const taskName = input.parentElement.innerText.trim();
    
    const index = appData.bonds[cat].indexOf(taskName);
    if (index === -1) {
        appData.bonds[cat].push(taskName);
    } else {
        appData.bonds[cat].splice(index, 1);
    }
    saveState();
    calcLifeBalance();
}

// EMOTIONAL COOLDOWN
function checkEmotionalState() {
    hapticFeedback();
    switchView('meditation');
    document.getElementById('zenTitle').style.display = 'none';
    document.getElementById('angerVent').style.display = 'none';
    document.getElementById('emotionalPopup').style.display = 'block';
}

function closeEmotionalPopup() {
    hapticFeedback();
    document.getElementById('emotionalPopup').style.display = 'none';
    document.getElementById('zenTitle').style.display = 'block';
    document.getElementById('angerVent').style.display = 'block';
}

let cooldownInterval;
let cooldownTime = 300;

function triggerCooldown() {
    hapticFeedback();
    appData.angerCount = (appData.angerCount || 0) + 1;
    saveState();
    
    document.getElementById('emotionalPopup').style.display = 'none';
    document.getElementById('cooldownLock').style.display = 'block';
    document.getElementById('exitZenBtn').style.display = 'none'; // Lock them in
    
    cooldownTime = 300;
    cooldownInterval = setInterval(() => {
        cooldownTime--;
        const m = Math.floor(cooldownTime / 60);
        const s = cooldownTime % 60;
        document.getElementById('cooldownTimer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        
        if(cooldownTime <= 0) {
            clearInterval(cooldownInterval);
            document.getElementById('cooldownLock').style.display = 'none';
            document.getElementById('exitZenBtn').style.display = 'block';
            document.getElementById('angerVent').style.display = 'block';
            document.getElementById('zenTitle').style.display = 'block';
            alert("Cooldown Complete. You may now think clearly.");
        }
    }, 1000);
}

// BURN ANGER OVERRIDE REMOVED

// WEEKLY AUDIT
function generateAudit() {
    hapticFeedback();
    const report = document.getElementById('auditReport');
    
    const anger = appData.angerCount || 0;
    const streak = appData.streak || 0;
    const mock = appData.mockScores.length > 0 ? appData.mockScores[0].score : 0;
    
    let html = `<strong><i class="fa-solid fa-clipboard-check"></i> Sunday Life Audit</strong><br><br>`;
    html += `Monk Mode Streak: <span style="color:var(--neon-blue)">${streak} Days</span><br>`;
    html += `Emotional Breakdowns: <span style="color:#ff3366">${anger} Times</span><br>`;
    html += `Latest Mock Score: <span style="color:var(--neon-orange)">${mock}%</span><br><br>`;
    
    if(anger > 3) {
        html += `<span style="color:#ff3366">Audit Result: You are letting emotions control you. Stop overthinking. Isolate and refocus.</span>`;
    } else if (streak > 5) {
        html += `<span style="color:#00ff00">Audit Result: Elite discipline. Your future self is proud. Keep grinding.</span>`;
    } else {
        html += `Audit Result: Average week. You need more focus to earn the uniform.`;
    }
    
    report.innerHTML = html;
    report.style.display = "block";
}

// ---------------------------------
// ACCOUNTABILITY: POWER & HARMONY
// ---------------------------------
function updateCareerPower() {
    // Career Power = 70% Daily Log + 30% Syllabus Progress
    const logScore = parseInt(document.getElementById('dashboardScore').textContent) || 0;
    
    // Calculate Syllabus Score dynamically
    const syllabusCheckboxes = document.querySelectorAll('div[id^="syllabus-"] input[type="checkbox"]');
    const totalSyllabusTasks = syllabusCheckboxes.length || 1;
    
    let completedSyllabusTasks = 0;
    Object.keys(appData.syllabus).forEach(cat => {
        if (appData.syllabus[cat]) {
            completedSyllabusTasks += appData.syllabus[cat].length;
        }
    });
    const syllabusScore = Math.round((completedSyllabusTasks / totalSyllabusTasks) * 100);
    
    const power = Math.round((logScore * 0.7) + (syllabusScore * 0.3));
    
    const oldPower = parseInt(document.getElementById('careerPowerVal').textContent) || 0;
    animateValue('careerPowerVal', oldPower, power, 1000);
    
    const msg = document.getElementById('priorityMessage');
    if (power >= 80) {
        msg.innerHTML = "ELITE FOCUS DETECTED. YOU ARE READY.";
        msg.className = "priority-message text-neon-blue";
    } else if (power >= 50) {
        msg.innerHTML = "MID-LEVEL PERFORMANCE. STEP UP.";
        msg.className = "priority-message text-neon-orange";
    } else {
        msg.innerHTML = "CRITICAL FAILURE. FOCUS OR QUIT.";
        msg.className = "priority-message warning-text";
    }
}
let pledgeTimer;
let pledgeStartTime;
const PLEDGE_DURATION = 10000; // 10 seconds

function startPledgeHold() {
    hapticFeedback();
    pledgeStartTime = Date.now();
    document.getElementById('pledgeText').textContent = "BREATHE IN SYNC...";
    
    pledgeTimer = setInterval(() => {
        const elapsed = Date.now() - pledgeStartTime;
        const progress = Math.min((elapsed / PLEDGE_DURATION) * 100, 100);
        document.getElementById('pledgeProgress').style.width = progress + "%";
        
        if (elapsed >= PLEDGE_DURATION) {
            completePledge();
        }
    }, 50);
}

function endPledgeHold() {
    clearInterval(pledgeTimer);
    const elapsed = Date.now() - pledgeStartTime;
    if (elapsed < PLEDGE_DURATION) {
        document.getElementById('pledgeProgress').style.width = "0%";
        document.getElementById('pledgeText').textContent = "HOLD TO PLEDGE";
    }
}

function completePledge() {
    clearInterval(pledgeTimer);
    hapticFeedback();
    const todayStr = getDateString(new Date());
    if (!appData.logs[todayStr]) appData.logs[todayStr] = { ground: [], study: [], diet: [] };
    
    appData.logs[todayStr].peacePledge = true;
    saveState();
    
    document.getElementById('pledgeText').textContent = "PLEDGE ACCEPTED";
    document.getElementById('pledgeBtn').disabled = true;
    updateHarmonyStatus();
}

// DEEP WORK LOCK
let deepWorkInterval;
let deepWorkTime = 1500; // 25 mins
let isDeepWorkActive = false;

function toggleDeepWork() {
    hapticFeedback();
    const btn = document.getElementById('deepWorkBtn');
    const container = document.getElementById('deepWorkContainer');
    
    if (!isDeepWorkActive) {
        isDeepWorkActive = true;
        btn.textContent = "CANCEL SESSION";
        btn.classList.replace('primary', 'danger');
        container.classList.add('active');
        
        deepWorkInterval = setInterval(() => {
            deepWorkTime--;
            updateDeepWorkDisplay();
            if (deepWorkTime <= 0) finishDeepWork();
        }, 1000);
    } else {
        resetDeepWork();
    }
}

function updateDeepWorkDisplay() {
    const m = Math.floor(deepWorkTime / 60);
    const s = deepWorkTime % 60;
    document.getElementById('deepWorkDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function resetDeepWork() {
    clearInterval(deepWorkInterval);
    isDeepWorkActive = false;
    deepWorkTime = 1500;
    updateDeepWorkDisplay();
    
    const btn = document.getElementById('deepWorkBtn');
    btn.textContent = "START FOCUS SESSION";
    btn.classList.replace('danger', 'primary');
    document.getElementById('deepWorkContainer').classList.remove('active');
}

function finishDeepWork() {
    resetDeepWork();
    alert("Deep Work Session Complete! Focus Points Earned.");
    hapticFeedback();
}

// TAB VISIBILITY DETECTION (ANTI-CHEAT)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isDeepWorkActive) {
        resetDeepWork();
        const warning = document.getElementById('deepWorkWarning');
        warning.style.display = 'block';
        setTimeout(() => { warning.style.display = 'none'; }, 5000);
    }
});

function updateHarmonyStatus() {
    const todayStr = getDateString(new Date());
    const isChecked = appData.logs[todayStr]?.peacePledge || false;
    const status = document.getElementById('harmonyStatus');
    const check = document.getElementById('peacePledge');
    
    check.checked = isChecked;
    if (isChecked) {
        status.innerHTML = 'STATUS: <span class="harmony-status-text positive">HARMONIOUS</span>';
    } else {
        status.innerHTML = 'STATUS: <span class="harmony-status-text waiting">WAITING...</span>';
    }
}

// ---------------------------------
// ANGER BURN LOGIC
// ---------------------------------
function burnAnger() {
    hapticFeedback();
    const text = document.getElementById('angerText').value.trim();
    if(text.length === 0) {
        alert("Write down what's making you angry first.");
        return;
    }
    
    // Track emotional breakdown
    appData.angerCount = (appData.angerCount || 0) + 1;
    saveState();
    
    const ventContainer = document.getElementById('angerVent');
    ventContainer.classList.add('burn-animation');
    
    setTimeout(() => {
        ventContainer.style.display = 'none';
        document.getElementById('victoryJournal').style.display = 'block'; // Shift to positive focus
    }, 2000);
}

function saveVictory() {
    hapticFeedback();
    const vic = document.getElementById('victoryInput').value.trim();
    if(vic.length === 0) return;
    
    const todayStr = getDateString(new Date());
    if(!appData.logs[todayStr]) appData.logs[todayStr] = { ground: [], study: [], diet: [] };
    appData.logs[todayStr].victory = vic;
    saveState();
    
    document.getElementById('victoryJournal').style.display = 'none';
    document.getElementById('zenOptions').style.display = 'block';
}

function nextAffirmation() {
    hapticFeedback();
    affIndex = (affIndex + 1) % affirmations.length;
    document.getElementById('affirmationText').textContent = `"${affirmations[affIndex]}"`;
}

// ---------------------------------
// DAILY LOG / HISTORY LOGIC
// ---------------------------------
function changeDate(offset) {
    hapticFeedback();
    currentDateObj.setDate(currentDateObj.getDate() + offset);
    
    // Disable future dates
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = new Date(currentDateObj);
    checkDate.setHours(0,0,0,0);
    
    document.getElementById('nextDateBtn').disabled = (checkDate >= today);
    
    if (checkDate.getTime() === today.getTime()) {
        document.getElementById('currentDateDisplay').textContent = "Today";
    } else {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        document.getElementById('currentDateDisplay').textContent = currentDateObj.toLocaleDateString('en-US', options);
    }
    
    loadDailyLog();
    updateHarmonyStatus();
}

function loadDailyLog() {
    const dateStr = getDateString(currentDateObj);
    if (!appData.logs[dateStr]) {
        appData.logs[dateStr] = { ground: [], study: [], diet: [] };
    }
    
    const dayData = appData.logs[dateStr];
    
    // Reset and check ground
    document.querySelectorAll('#checklist-ground input').forEach(input => {
        const taskName = input.parentElement.innerText.trim();
        input.checked = dayData.ground.some(t => taskName.includes(t));
    });
    // Reset and check study
    document.querySelectorAll('#checklist-study input').forEach(input => {
        const taskName = input.parentElement.innerText.trim();
        input.checked = dayData.study.some(t => taskName.includes(t));
    });
    // Reset and check diet
    document.querySelectorAll('#checklist-diet input').forEach(input => {
        const taskName = input.parentElement.innerText.trim();
        input.checked = dayData.diet.some(t => taskName.includes(t));
    });

    updateDailyScore(dateStr);
}

function toggleTask(category, taskName) {
    hapticFeedback();
    playClickSound();
    const dateStr = getDateString(currentDateObj);
    if (!appData.logs[dateStr]) {
        appData.logs[dateStr] = { ground: [], study: [], diet: [] };
    }
    
    let list = appData.logs[dateStr][category];
    const index = list.indexOf(taskName);
    
    if (index === -1) {
        list.push(taskName);
    } else {
        list.splice(index, 1);
    }
    
    saveState();
    updateDailyScore(dateStr);
    updateAnalytics();
    updateCareerPower();
    calcLifeBalance();
}

function playClickSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

function toggleSyllabus(cat, taskName) {
    hapticFeedback();
    if (!appData.syllabus[cat]) { appData.syllabus[cat] = []; }
    const index = appData.syllabus[cat].indexOf(taskName);
    if (index === -1) {
        appData.syllabus[cat].push(taskName);
    } else {
        appData.syllabus[cat].splice(index, 1);
    }
    saveState();
    calcLifeBalance();
}

function loadSyllabus() {
    ['marathi', 'maths', 'reasoning', 'gk'].forEach(cat => {
        if (!appData.syllabus[cat]) return;
        document.querySelectorAll(`#syllabus-${cat} input`).forEach(input => {
            const onchangeStr = input.getAttribute('onchange');
            if(onchangeStr) {
                const match = onchangeStr.match(/'([^']+)'/g);
                if(match && match.length >= 2) {
                    const taskName = match[1].replace(/'/g, "");
                    input.checked = appData.syllabus[cat].includes(taskName);
                }
            }
        });
    });
}

function updateDailyScore(dateStr) {
    if (!appData.logs[dateStr]) return;
    
    const dayData = appData.logs[dateStr];
    const completedTasks = dayData.ground.length + dayData.study.length + dayData.diet.length;
    const percentage = Math.round((completedTasks / TOTAL_DAILY_TASKS) * 100);
    
    const oldVal = parseInt(document.getElementById('dailyScore').textContent) || 0;
    animateValue('dailyScore', oldVal, percentage, 1000);
    
    // if today, also update dashboard
    const todayStr = getDateString(new Date());
    if (dateStr === todayStr) {
        const oldDashVal = parseInt(document.getElementById('dashboardScore').textContent) || 0;
        animateValue('dashboardScore', oldDashVal, percentage, 1000);
        document.getElementById('dashboardScoreBar').style.width = percentage + "%";
    }
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function clearAllData() {
    hapticFeedback();
    if(confirm("Are you sure you want to delete all your progress? This cannot be undone.")) {
        localStorage.removeItem('antiGravityData');
        location.reload();
    }
}

// ---------------------------------
// MOCK TEST LOGIC
// ---------------------------------
function addMockScore() {
    hapticFeedback();
    const input = document.getElementById('mockScoreInput');
    const val = parseInt(input.value);
    if(!isNaN(val) && val >= 0 && val <= 100) {
        appData.mockScores.unshift({
            date: getDateString(new Date()),
            score: val
        });
        saveState();
        input.value = '';
        renderMockScores();
    } else {
        alert("Please enter a valid score between 0 and 100");
    }
}

function renderMockScores() {
    const container = document.getElementById('mockScoreHistory');
    container.innerHTML = '';
    
    if(!appData.mockScores || appData.mockScores.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem;">No scores added yet.</p>';
        return;
    }

    appData.mockScores.forEach(entry => {
        let div = document.createElement('div');
        div.className = 'score-item';
        div.innerHTML = `
            <span class="score-item-date"><i class="fa-regular fa-calendar"></i> ${entry.date}</span>
            <span class="score-item-val">${entry.score} / 100</span>
        `;
        container.appendChild(div);
    });
    renderMockTrendChart();
}

// ---------------------------------
// ANALYTICS LOGIC
// ---------------------------------
function updateAnalytics() {
    let totalScore = 0;
    let daysTracked = 0;
    
    for(let i=6; i>=0; i--) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dStr = getDateString(d);
        
        if (appData.logs[dStr]) {
            let dayData = appData.logs[dStr];
            let comp = dayData.ground.length + dayData.study.length + dayData.diet.length;
            totalScore += (comp / TOTAL_DAILY_TASKS);
            
            if (i === 0) {
                let p = Math.round((comp / TOTAL_DAILY_TASKS) * 100);
                let bar = document.getElementById('todayAnalyticsBar');
                if(bar) bar.style.height = p + '%';
            }
        }
        daysTracked++;
    }
    
    let avg = Math.round((totalScore / 7) * 100);
    const scoreElement = document.getElementById('consistencyScore');
    if(scoreElement) scoreElement.textContent = avg;
    
    const scoreDash = document.getElementById('consistencyScoreDash');
    if(scoreDash) scoreDash.textContent = avg + "%";
    
    const scoreBar = document.getElementById('consistencyScoreBar');
    if(scoreBar) scoreBar.style.width = avg + "%";
    
    // Update Rank based on consistency
    updateRank(avg);
    updateBadges();
}

// ---------------------------------
// BADGE & ACHIEVEMENT SYSTEM
// ---------------------------------
function updateBadges() {
    const streak = appData.streak || 0;
    const consistency = parseInt(document.getElementById('consistencyScore').textContent) || 0;
    const items = document.querySelectorAll('.badge-item');
    
    // 7-DAY FIRE
    if (streak >= 7) items[0].classList.remove('locked');
    // MAX-D (100% Discipline)
    if (consistency >= 95) items[1].classList.remove('locked');
    // IPS Rank
    if (streak >= 90) items[2].classList.remove('locked');
    // ZEN (Mental Giant - low anger count)
    if (appData.angerCount < 3 && streak >= 3) items[3].classList.remove('locked');
}

// ---------------------------------
// MOCK TEST TREND CHART (SVG)
// ---------------------------------
function renderMockTrendChart() {
    const container = document.getElementById('mockTrendChart');
    if (!container || !appData.mockScores || appData.mockScores.length < 2) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.7rem; text-align:center;">Need at least 2 scores for trend.</p>';
        return;
    }

    const scores = appData.mockScores.slice(0, 5).reverse(); // Last 5 scores
    const width = container.clientWidth;
    const height = 120;
    const padding = 20;
    
    const xStep = (width - padding * 2) / (scores.length - 1);
    let points = "";
    
    scores.forEach((s, idx) => {
        const x = padding + (idx * xStep);
        const y = height - padding - ((s.score / 100) * (height - padding * 2));
        points += `${x},${y} `;
    });

    container.innerHTML = `
        <svg width="100%" height="${height}" style="overflow:visible">
            <polyline points="${points}" fill="none" stroke="var(--neon-orange)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            ${scores.map((s, idx) => {
                const x = padding + (idx * xStep);
                const y = height - padding - ((s.score / 100) * (height - padding * 2));
                return `<circle cx="${x}" cy="${y}" r="4" fill="#fff" />`;
            }).join('')}
        </svg>
    `;
}

// ---------------------------------
// NAVIGATION LOGIC
// ---------------------------------
function switchView(viewId, navElement = null) {
    hapticFeedback();
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    document.getElementById('view-' + viewId).classList.add('active');

    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        navElement.classList.add('active');
    } else {
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
            let onclickAttr = nav.getAttribute('onclick');
            if(onclickAttr && onclickAttr.includes(viewId)) {
                nav.classList.add('active');
            }
        });
        
        if(viewId === 'dashboard' || viewId === 'analytics') {
            document.querySelectorAll('.nav-item')[0].classList.add('active'); // HQ
        }
    }

    if (viewId === 'meditation') {
        startMeditation();
    } else {
        stopMeditation();
    }
}

// ---------------------------------
// SYLLABUS LOGIC
// ---------------------------------
function loadSyllabus() {
    Object.keys(appData.syllabus).forEach(cat => {
        const catData = appData.syllabus[cat];
        document.querySelectorAll(`#syllabus-${cat} input`).forEach(input => {
            const taskName = input.parentElement.innerText.trim();
            input.checked = catData.includes(taskName);
        });
    });
}

function toggleSyllabus(cat, taskName) {
    hapticFeedback();
    playClickSound();
    const index = appData.syllabus[cat].indexOf(taskName);
    if (index === -1) {
        appData.syllabus[cat].push(taskName);
    } else {
        appData.syllabus[cat].splice(index, 1);
    }
    saveState();
    updateCareerPower();
    calcLifeBalance();
}

// ---------------------------------
// MONK MODE STREAK LOGIC
// ---------------------------------
function updateMonkMode() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = getDateString(today);
    
    const lastUpdateDate = appData.lastUpdate ? new Date(appData.lastUpdate) : null;
    if (lastUpdateDate) lastUpdateDate.setHours(0,0,0,0);

    let streak = appData.streak || 0;
    
    if (appData.lastUpdate !== todayStr) {
        const diffDays = lastUpdateDate ? Math.floor((today - lastUpdateDate) / (1000 * 60 * 60 * 24)) : null;
        
        if (diffDays === 1) {
            // Check if yesterday was successful (>= 80% completion)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getDateString(yesterday);
            const yData = appData.logs[yesterdayStr];
            if (yData) {
                const completed = yData.ground.length + yData.study.length + yData.diet.length;
                if ((completed / TOTAL_DAILY_TASKS) < 0.8) streak = 0;
                else streak++;
            } else {
                streak = 0;
            }
        } else if (diffDays > 1) {
            streak = 0; // Missed more than 1 day
        }
        
        appData.streak = streak;
        appData.maxStreak = Math.max(appData.maxStreak || 0, streak);
        appData.lastUpdate = todayStr;
        saveState();
    }
    
    const streakEl = document.getElementById('streakCount');
    if(streakEl) streakEl.textContent = streak;
    updateAnalytics();
    updateMissionOfDay();
}

const dailyMissions = [
    "आज १०० ज्यादा पुश-अप्स करा. (100 Extra Pushups)",
    "आज ५ पाने मराठी व्याकरण वाचा. (Read 5 Pages Marathi)",
    "आज मोबाईलचा वापर २ तास कमी करा. (Reduce Mobile Usage)",
    "आज १६०० मी धावताना १ सेकंद कमी करा. (Improve 1600m Run)",
    "आज रात्री झोपण्यापूर्वी उद्याचे नियोजन करा. (Plan Tomorrow)",
    "आज कोणाशीही उद्धटपणे बोलू नका. (Zero Ego Day)"
];

function updateMissionOfDay() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const mission = dailyMissions[dayOfYear % dailyMissions.length];
    document.getElementById('dailyMissionText').textContent = mission;
}

// ---------------------------------
// TIMER LOGIC
// ---------------------------------
let timerInterval;
let startTime;
let elapsedTime = 0;
let isRunning = false;
let lapCount = 0;

function startTimer() {
    hapticFeedback();
    playWhistle();
    if (!isRunning) {
        isRunning = true;
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTimer, 10);
    }
}

function stopTimer() {
    hapticFeedback();
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
    }
}

function resetTimer() {
    hapticFeedback();
    stopTimer();
    elapsedTime = 0;
    lapCount = 0;
    updateDisplay();
    document.getElementById('lapsContainer').innerHTML = '';
}

function lapTimer() {
    hapticFeedback();
    if (!isRunning && elapsedTime === 0) return;
    
    lapCount++;
    const lapsContainer = document.getElementById('lapsContainer');
    const timeString = formatTime(elapsedTime);
    
    const lapDiv = document.createElement('div');
    lapDiv.className = 'list-item glass-panel';
    lapDiv.style.marginBottom = '5px';
    lapDiv.style.padding = '10px';
    lapDiv.style.display = 'flex';
    lapDiv.style.justifyContent = 'space-between';
    lapDiv.innerHTML = `<span style="color:var(--neon-orange); font-weight:bold;">LAP ${lapCount}</span><span style="font-family:'Orbitron',sans-serif;">${timeString}</span>`;
    
    lapsContainer.prepend(lapDiv); // Add to top
}

function updateTimer() {
    elapsedTime = Date.now() - startTime;
    updateDisplay();
}

function formatTime(ms) {
    const d = new Date(ms);
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    const msStr = String(Math.floor(d.getUTCMilliseconds() / 10)).padStart(2, '0');
    return `${m}:${s}:${msStr}`;
}

function updateDisplay() {
    const timeString = formatTime(elapsedTime);
    document.getElementById('stopwatch').textContent = timeString;
    
    // Update Floating Timer
    const mini = document.getElementById('miniTimer');
    if (isRunning) {
        mini.style.display = 'flex';
        document.getElementById('miniTimerText').textContent = timeString;
    } else {
        mini.style.display = 'none';
    }
}

function playWhistle() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
}

// ---------------------------------
// MEDITATION / ZEN LOGIC
// ---------------------------------
let zenTimerInt;
let zenBreathInt;
let audioContext;
let oscillator;
let gainNode;

function startZenMode(type) {
    hapticFeedback();
    
    // UI Changes
    document.body.classList.add('zen-active');
    document.getElementById('zenTitle').style.display = 'none';
    document.getElementById('angerVent').style.display = 'none';
    document.getElementById('zenOptions').style.display = 'none';
    document.getElementById('exitZenBtn').style.display = 'block';
    document.getElementById('zenCircleWrapper').style.display = 'flex';
    
    const circle = document.getElementById('zenCircle');
    const bText = document.getElementById('breatheText');
    const tDisplay = document.getElementById('zenTimerDisplay');
    
    // Start Audio
    playCalmingSound();
    
    if (type === '478') {
        circle.className = 'breathing-circle breathe-478';
        tDisplay.style.display = 'none';
        run478Cycle(bText);
        zenBreathInt = setInterval(() => run478Cycle(bText), 19000);
    } else if (type === 'timer') {
        circle.className = 'breathing-circle breathe-normal';
        tDisplay.style.display = 'block';
        runNormalCycle(bText);
        zenBreathInt = setInterval(() => runNormalCycle(bText), 10000);
        
        let timeLeft = 300; // 5 mins
        tDisplay.textContent = "05:00";
        zenTimerInt = setInterval(() => {
            timeLeft--;
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            tDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if(timeLeft <= 0) {
                stopZenMode();
                alert("Meditation Complete. Jai Hind!");
            }
        }, 1000);
    }
}

function run478Cycle(bText) {
    bText.textContent = "Inhale (4s)";
    bText.style.color = "var(--neon-blue)";
    
    setTimeout(() => {
        bText.textContent = "Hold (7s)";
        bText.style.color = "#fff";
    }, 4000);
    
    setTimeout(() => {
        bText.textContent = "Exhale (8s)";
        bText.style.color = "var(--neon-orange)";
    }, 11000);
}

function runNormalCycle(bText) {
    bText.textContent = "Breathe In";
    bText.style.color = "var(--neon-blue)";
    setTimeout(() => {
        bText.textContent = "Breathe Out";
        bText.style.color = "var(--neon-orange)";
    }, 5000);
}

function stopZenMode() {
    hapticFeedback();
    document.body.classList.remove('zen-active');
    document.getElementById('zenTitle').style.display = 'block';
    document.getElementById('exitZenBtn').style.display = 'none';
    document.getElementById('zenCircleWrapper').style.display = 'none';
    
    // Reset anger vent UI
    document.getElementById('angerText').value = '';
    const vent = document.getElementById('angerVent');
    vent.style.display = 'block';
    vent.classList.remove('burn-animation');
    document.getElementById('zenOptions').style.display = 'none';
    
    clearInterval(zenTimerInt);
    clearInterval(zenBreathInt);
    
    const circle = document.getElementById('zenCircle');
    circle.className = 'breathing-circle'; // reset
    
    stopCalmingSound();
}

// ---------------------------------
// CALMING AUDIO GENERATOR (432Hz)
// ---------------------------------
function playCalmingSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if(!audioContext) audioContext = new AudioContext();
        
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(432, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 2); // Soft volume
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
    } catch(e) {
        console.log("Audio not supported");
    }
}

function stopCalmingSound() {
    if(gainNode && oscillator) {
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
        setTimeout(() => {
            try { oscillator.stop(); } catch(e){}
        }, 1000);
    }
}

function startMeditation() {
    // Override old startMeditation called by nav
    // Now meditation view just shows the Anger vent
}

function stopMeditation() {
    stopZenMode();
}

// ---------------------------------
// REP COUNTER LOGIC
// ---------------------------------
let repCount = 0;

function addRep() {
    hapticFeedback();
    repCount++;
    document.getElementById('repCountDisplay').textContent = repCount;
}

function resetReps() {
    hapticFeedback();
    repCount = 0;
    document.getElementById('repCountDisplay').textContent = repCount;
}

// ---------------------------------
// FOCUS SOUNDS & VOICE MOTIVATION
// ---------------------------------
let activeSoundType = null;
let soundNodes = [];

function toggleSound(type) {
    hapticFeedback();
    const btns = ['binaural', 'rain', 'white'];
    
    if (activeSoundType === type) {
        stopAllSounds();
        activeSoundType = null;
        btns.forEach(b => document.getElementById(`btn-${b}`).classList.remove('active'));
    } else {
        stopAllSounds();
        activeSoundType = type;
        btns.forEach(b => document.getElementById(`btn-${b}`).classList.remove('active'));
        document.getElementById(`btn-${type}`).classList.add('active');
        startSound(type);
    }
}

function startSound(type) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 1);
    gain.connect(audioContext.destination);
    soundNodes.push(gain);

    if (type === 'white') {
        const bufferSize = 2 * audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
        soundNodes.push(source);
    } else if (type === 'binaural') {
        const oscL = audioContext.createOscillator();
        const oscR = audioContext.createOscillator();
        const pannerL = audioContext.createPanner();
        const pannerR = audioContext.createPanner();
        
        oscL.type = 'sine'; oscL.frequency.value = 200;
        oscR.type = 'sine'; oscR.frequency.value = 210; // 10Hz Alpha diff
        
        pannerL.setPosition(-1, 0, 0);
        pannerR.setPosition(1, 0, 0);
        
        oscL.connect(pannerL); pannerL.connect(gain);
        oscR.connect(pannerR); pannerR.connect(gain);
        
        oscL.start(); oscR.start();
        soundNodes.push(oscL, oscR);
    } else if (type === 'rain') {
        // Simple rain simulation with filtered noise
        const bufferSize = 2 * audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        source.connect(filter);
        filter.connect(gain);
        source.start();
        soundNodes.push(source, filter);
    }
}

function stopAllSounds() {
    soundNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
        try { node.disconnect(); } catch(e) {}
    });
    soundNodes = [];
}

function speakMotivation() {
    hapticFeedback();
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop any current speech
    
    const quote = affirmations[Math.floor(Math.random() * affirmations.length)];
    const msg = new SpeechSynthesisUtterance();
    msg.text = quote;
    msg.lang = 'mr-IN'; // Marathi
    msg.rate = 0.9;
    msg.pitch = 1;
    
    // Fallback if Marathi not found
    const voices = window.speechSynthesis.getVoices();
    const marathiVoice = voices.find(v => v.lang.includes('mr'));
    if (marathiVoice) msg.voice = marathiVoice;

    window.speechSynthesis.speak(msg);
}

// ---------------------------------
// SYSTEM LOCKDOWN (OUT OF CONTROL)
// ---------------------------------
let currentGroundingStep = 5;

function triggerLockdown() {
    hapticFeedback(200);
    document.getElementById('systemLockdown').style.display = 'flex';
    currentGroundingStep = 5;
    resetGroundingUI();
}

function resetGroundingUI() {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`step-${i}`).style.display = 'none';
        document.getElementById(`step-${i}`).classList.remove('active');
    }
    document.getElementById(`step-5`).style.display = 'block';
    document.getElementById(`step-5`).classList.add('active');
    document.getElementById('groundingNextBtn').style.display = 'block';
    document.getElementById('parentAnchor').style.display = 'none';
}

function nextGroundingStep() {
    hapticFeedback(50);
    document.getElementById(`step-${currentGroundingStep}`).style.display = 'none';
    currentGroundingStep--;
    
    if (currentGroundingStep >= 1) {
        const next = document.getElementById(`step-${currentGroundingStep}`);
        next.style.display = 'block';
        next.classList.add('active');
    } else {
        document.getElementById('groundingNextBtn').style.display = 'none';
        document.getElementById('parentAnchor').style.display = 'block';
        hapticFeedback([50, 100, 50]); // Satisfaction pattern
    }
}

function exitLockdown() {
    hapticFeedback();
    document.getElementById('systemLockdown').style.display = 'none';
    alert("System Restored. Welcome back, Officer. Stay in control.");
}

// ---------------------------------
// EMERGENCY MODES
// ---------------------------------
let rageReps = 20;
const hardTruths = [
    "तू आज रडत बसला आहेस, पण तुझे स्पर्धक सध्या ग्राउंडवर घाम गाळत आहेत.",
    "परिस्थिती गरीब आहे म्हणून रडू नकोस, ती बदलण्यासाठी पोलीस व्हायचं आहे.",
    "आई-वडिलांच्या चेहऱ्यावरचा आनंद तुला नकोय का? मग उठा आणि अभ्यासाला लागा.",
    "ओव्हरथिंकिंगने वर्दी मिळत नाही, ती फक्त मेहनतीने मिळते.",
    "आजची तुझी आळस उद्याचं तुझं दुःख असेल.",
    "तू पोलीस भरतीची तयारी करतोयस की स्वतःला फसवतोयस?",
    "फक्त स्वप्न बघून वर्दी मिळत नाही, त्यासाठी रक्ताचं पाणी करावं लागतं."
];
let truthIndex = 0;

function triggerEmergencyMode(mode) {
    hapticFeedback(100);
    // Hide all
    document.getElementById('rageBurner').style.display = 'none';
    document.getElementById('realityCheckCard').style.display = 'none';
    document.getElementById('coldShock').style.display = 'none';
    document.getElementById('angerVent').style.display = 'none';
    document.getElementById('zenOptions').style.display = 'none';

    if (mode === 'rage') {
        rageReps = 20;
        document.getElementById('rageRepCount').textContent = rageReps;
        document.getElementById('rageBurner').style.display = 'block';
    } else if (mode === 'reality') {
        document.getElementById('realityCheckCard').style.display = 'block';
    } else if (mode === 'cold') {
        document.getElementById('coldShock').style.display = 'block';
    }
}

function burnRageRep() {
    hapticFeedback(30);
    rageReps--;
    document.getElementById('rageRepCount').textContent = Math.max(0, rageReps);
    if (rageReps <= 0) {
        alert("Rage Burned. Adrenaline Neutralized. Now get back to mission.");
        document.getElementById('rageBurner').style.display = 'none';
        document.getElementById('zenOptions').style.display = 'block';
    }
}

function nextRealityCheck() {
    hapticFeedback(50);
    truthIndex = (truthIndex + 1) % hardTruths.length;
    document.getElementById('realityText').textContent = `"${hardTruths[truthIndex]}"`;
}

function closeColdShock() {
    hapticFeedback();
    document.getElementById('coldShock').style.display = 'none';
    document.getElementById('zenOptions').style.display = 'block';
}

// ---------------------------------
// RESEARCH-BASED PSYCHOLOGICAL TOOLS
// ---------------------------------
function setMood(mood) {
    hapticFeedback();
    const adviceEl = document.getElementById('moodAdvice');
    adviceEl.style.display = 'block';
    
    const advices = {
        rage: "COMMANDANT says: रागाच्या भरात घेतलेला निर्णय नेहेमी चुकीचा असतो. ५ मिनिटे शांत बसा आणि पाणी प्या.",
        sad: "COMMANDANT says: अपयश म्हणजे शेवट नाही, ती एक शिकवण आहे. आई-वडिलांच्या स्वप्नासाठी परत उठा.",
        focus: "COMMANDANT says: तुमची एकाग्रता हीच तुमची ताकद आहे. पुढचे २ तास मोबाईल बाजूला ठेवा.",
        tired: "COMMANDANT says: थकवा जाणवत असेल तर २० मिनिटे झोपा, पण मैदान सोडू नका."
    };
    adviceEl.textContent = advices[mood] || "";
}

function nextTransformStep(step) {
    hapticFeedback();
    document.getElementById('transformStep1').style.display = 'none';
    document.getElementById('transformStep2').style.display = 'none';
    document.getElementById('transformStep3').style.display = 'none';
    
    document.getElementById(`transformStep${step}`).style.display = 'block';
    
    if (step === 3) {
        const neg = document.getElementById('negativeThought').value.trim();
        const reframed = neg.replace(/fail/gi, "learning").replace(/can't/gi, "will eventually").replace(/impossible/gi, "hard but possible");
        document.getElementById('powerThoughtDisplay').textContent = `"${reframed || "मी प्रयत्न करत राहीन आणि यशस्वी होईन."}"`;
    }
}

function finishTransformation() {
    hapticFeedback();
    document.getElementById('transformStep3').style.display = 'none';
    document.getElementById('transformStep1').style.display = 'block';
    document.getElementById('negativeThought').value = '';
    document.getElementById('thoughtEvidence').value = '';
    alert("Thought Transformed. Stay Resilient!");
}

function solveProblem() {
    hapticFeedback();
    const prob = document.getElementById('overwhelmedBy').value.trim();
    if (prob === "") return;
    
    const advice = [
        "फक्त ५ मिनिटे या विषयाचा अभ्यास करा.",
        "या कामाचे ३ छोटे भाग करा आणि पहिला भाग आत्ताच पूर्ण करा.",
        "एक खोल श्वास घ्या आणि फक्त १ पान वाचा.",
        "मोबाईल स्विच ऑफ करा आणि १० गणितं सोडवा."
    ];
    
    document.getElementById('oneSmallAction').textContent = advice[Math.floor(Math.random() * advice.length)];
    document.getElementById('smallStepAdvice').style.display = 'block';
}

function signOath() {
    hapticFeedback([100, 50, 100]);
    document.getElementById('oathContainer').style.borderColor = 'var(--neon-green)';
    document.getElementById('oathContainer').style.background = 'rgba(34, 197, 94, 0.1)';
    alert(" शपथ स्वीकारली! आता मैदानावर आणि अभ्यासात स्वतःला सिद्ध करा.");
}

function toggleColdDiscipline() {
    hapticFeedback();
    const checked = document.getElementById('coldShowerCheck').checked;
    if (checked) {
        alert("Excellent. Cold Exposure builds a Warrior's Dopamine Baseline. Mental Control +10.");
    }
}

function saveParentalRitual() {
    hapticFeedback();
    const gift = document.getElementById('parentGift').value.trim();
    if (gift === "") return;
    
    // Save to logs
    const todayStr = getDateString(new Date());
    if(!appData.logs[todayStr]) appData.logs[todayStr] = { ground: [], study: [], diet: [] };
    appData.logs[todayStr].parentPledge = gift;
    saveState();
    
    alert(`नोंद झाली! तुमची ही जिद्द "पोलीस" झाल्यावर नक्की पूर्ण होईल.`);
    document.getElementById('parentGift').value = '';
}

// ---------------------------------
// PWA SERVICE WORKER REGISTRATION
// ---------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

