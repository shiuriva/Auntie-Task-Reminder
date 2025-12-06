// === 任務資料設定 ===
const initialTasks = [
    { name: "學習vibe ocding", time: "1小時", totalSessions: 30, completed: 0 },
    { name: "學習英文", time: "10-30分鐘", totalSessions: null, completed: 0 }, // null 代表無上限
    { name: "Duolingo學習韓文", time: "10-15分鐘", totalSessions: null, completed: 0 },
    { name: "學習framer", time: "10-30分鐘", totalSessions: 60, completed: 0 },
    { name: "學習UIUX知識", time: "30分-1小時", totalSessions: 30, completed: 0 },
    { name: "學習平面設計知識", time: "30分-1小時", totalSessions: 30, completed: 0 }
];

// 【新增】阿姨的每日完成鼓勵話語
const dailyCompletionMessages = [
    "👵 哇！今天所有的任務都完成了，真是太棒了！阿姨幫你蓋章認證，可以去休息囉！",
    "👵 優秀！你今天效率超高，把所有的學習計畫都打勾了。別忘了，適度的休息才能走得更遠喔！",
    "👵 看看這個成果！所有的格子都填滿了！你真是個自律的好孩子，今晚可以給自己一個小獎勵！",
    "👵 太給力了！阿姨很少看到有人能把所有任務都完成，快去享受你的悠閒時光吧，實至名歸！",
    "👵 讚啦！看到你這麼認真，阿姨都替你高興。今天的工作圓滿結束，明天也要繼續加油喔！"
];

const TABLE_BODY = document.querySelector('#task-table tbody');
const PROGRESS_MESSAGE = document.querySelector('#progress-message');
const AUNTIE_MESSAGE_DIV = document.querySelector('#auntie-message'); // 【新增】取得阿姨訊息的 Div
const STORAGE_KEY = 'auntieTaskProgress';
let tasks = []; // 將用於儲存和更新任務狀態

// === 核心功能：讀取/儲存/渲染 ===

// 1. 從 LocalStorage 載入進度
function loadProgress() {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();
    
    if (savedProgress) {
        const savedTasks = JSON.parse(savedProgress);
        tasks = initialTasks.map(initialTask => {
            const savedTask = savedTasks.find(t => t.name === initialTask.name);
            
            if (savedTask) {
                // 確保我們只使用 lastCompletedDate 和 completed 的數值
                const taskProgress = {
                    completed: savedTask.completed,
                    lastCompletedDate: savedTask.lastCompletedDate
                };

                // 合併初始設定與儲存的進度
                return { ...initialTask, ...taskProgress };
            } else {
                return initialTask;
            }
        });
    } else {
        tasks = initialTasks;
    }
}

// 2. 儲存進度到 LocalStorage
function saveProgress() {
    // 只儲存下次載入需要的資料 (name, completed, lastCompletedDate)
    const dataToSave = tasks.map(t => ({
        name: t.name,
        completed: t.completed,
        lastCompletedDate: t.lastCompletedDate
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

// 3. 渲染表格
function renderTasks() {
    TABLE_BODY.innerHTML = ''; 
    const today = new Date().toDateString();

    // 1. 過濾任務：分成今日待辦 (Pending) 和 今日已完成 (Completed)
    const activeTasks = tasks.filter(task => 
        task.totalSessions === null || task.completed < task.totalSessions
    ).sort((a, b) => a.name.localeCompare(b.name)); 

    // 任務分類
    const completedToday = activeTasks.filter(task => task.lastCompletedDate === today); // 今日已完成
    const pendingToday = activeTasks.filter(task => task.lastCompletedDate !== today); // 今日待辦
    
    // 調整順序：讓待辦任務先渲染，已完成任務後渲染
    const allTasksToRender = [...pendingToday, ...completedToday]; 
    
    let isTodayCompletedSection = false;
    let completedSectionHeaderRendered = false;

    allTasksToRender.forEach((task) => {
        const row = TABLE_BODY.insertRow();
        const taskIndex = tasks.findIndex(t => t.name === task.name); 

        const isCompletedGoal = task.totalSessions !== null && task.completed >= task.totalSessions;
        const isCompletedToday = task.lastCompletedDate === today && !isCompletedGoal;
        
        // 判斷是否要開始渲染「今日已完成」部分
        if (isCompletedToday && !isTodayCompletedSection && completedToday.length > 0) {
            isTodayCompletedSection = true;
        }

        // 渲染「今日已完成」的標題 (只渲染一次)
        if (isTodayCompletedSection && !completedSectionHeaderRendered && pendingToday.length > 0) {
             const headerRow = TABLE_BODY.insertRow();
             const headerCell = headerRow.insertCell();
             headerCell.colSpan = 4;
             headerCell.innerHTML = '<h2>✨ 今日已完成任務 (完成任務的提醒阿姨蓋章!)</h2>';
             headerCell.style.textAlign = 'center';
             headerCell.style.backgroundColor = '#d3f9d3';
             completedSectionHeaderRendered = true;
        }

        // 設置列的樣式
        if (isCompletedGoal || isCompletedToday) {
            row.classList.add('task-completed');
        }

        // 任務名稱
        row.insertCell().textContent = task.name;
        
        // 所需時間
        row.insertCell().textContent = task.time;
        
        // 預計需要幾次才能完成 (加上進度)
        const totalText = task.totalSessions === null 
                              ? '無上限' 
                              : `${task.completed} / ${task.totalSessions} 次`;
        row.insertCell().textContent = totalText;
        
        // 完成的打勾欄位
        const checkboxCell = row.insertCell();
        checkboxCell.classList.add('checkbox-cell');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.index = taskIndex; 
        
        // 設置 Checkbox 狀態
        if (isCompletedGoal) {
            checkbox.checked = true;
            checkbox.disabled = true; // 達成目標，永久鎖定
        } else if (isCompletedToday) {
            checkbox.checked = true;
            checkbox.disabled = false; // 今日已完成，但允許取消勾選
        } else {
            checkbox.checked = false;
            checkbox.disabled = false;
        }
        
        checkbox.addEventListener('change', handleCompletion);
        checkboxCell.appendChild(checkbox);
    });

    // 【核心修改】檢查所有任務是否都已完成
    checkAllTasksCompleted(pendingToday);
}

// 4. 處理完成打勾的邏輯 (核心功能)
function handleCompletion(event) {
    const checkbox = event.target;
    const index = parseInt(checkbox.dataset.index);
    const task = tasks[index];
    const today = new Date().toDateString(); 

    if (checkbox.checked) {
        // --- 處理「勾選」 ---
        if (task.lastCompletedDate !== today) {
            task.completed += 1; 
            task.lastCompletedDate = today; 
            
            saveProgress(); 
            
            showEncouragement(task); 
            
            // 延遲幾秒後重新渲染表格，將已完成任務移至下方
            setTimeout(() => {
                renderTasks(); 
                PROGRESS_MESSAGE.textContent = `任務提醒 | ${today} 的學習計畫`; 
            }, 3000); 
        } else {
            checkbox.checked = true; 
        }
    } else {
        // --- 處理「取消勾選」 (Unchecked) ---
        if (task.lastCompletedDate === today && task.completed > 0) {
            task.completed -= 1; 
            task.lastCompletedDate = null; 
            
            saveProgress(); 
            
            PROGRESS_MESSAGE.textContent = `任務提醒 | ${today} 的學習計畫`; 
            
            // 立即重新渲染表格，將任務移回待辦區塊
            renderTasks();
        } 
    }
}


// 5. 鼓勵話語邏輯
function showEncouragement(task) {
    let message; 
    
    if (task.totalSessions === null) {
        // 無上限任務的鼓勵
        message = `你今天又進步一點點了！「${task.name}」已持續執行 ${task.completed} 次，持續下去，優秀！`;
    } else {
        const remaining = task.totalSessions - task.completed;
        
        if (remaining <= 0) {
            // 目標達成的鼓勵
            message = `🎉 **恭喜！**「${task.name}」目標達成！你已完成 ${task.completed} 次。是時候為自己設定一個新目標了，太棒了！`;
        } else {
            // 還有進度時的鼓勵
            message = `今天又進步一點點了！「${task.name}」還差 **${remaining}** 次就能完成這個任務了，加油！`;
        }
    }
    
    // 將鼓勵訊息顯示在 header 的位置
    PROGRESS_MESSAGE.innerHTML = message;
}

// 【新增】檢查所有每日任務是否完成並顯示阿姨訊息
function checkAllTasksCompleted(pendingToday) {
    // 檢查今日待辦任務清單是否為空
    if (pendingToday.length === 0 && tasks.length > 0) {
        // 隨機選擇一個鼓勵訊息
        const randomIndex = Math.floor(Math.random() * dailyCompletionMessages.length);
        const message = dailyCompletionMessages[randomIndex];

        AUNTIE_MESSAGE_DIV.innerHTML = `
            <div class="auntie-complete-box">
                <p>${message}</p>
            </div>
        `;
        // 清空頂部進度訊息
        PROGRESS_MESSAGE.textContent = '';
    } else {
        // 如果還有未完成的，就清空阿姨的訊息
        AUNTIE_MESSAGE_DIV.innerHTML = '';
    }
}


// === 程式碼啟動點 (在 script.js 的最底部) ===
loadProgress();

// 新增這行：在載入後立即更新頂部訊息為今日日期
PROGRESS_MESSAGE.textContent = `任務提醒 | ${new Date().toDateString()} 的學習計畫`; 

renderTasks();