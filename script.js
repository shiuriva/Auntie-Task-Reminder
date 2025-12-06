// === 任務資料設定 ===
const initialTasks = [
    { name: "學習vibe ocding", time: "1小時", totalSessions: 30, completed: 0 },
    { name: "學習英文", time: "10-30分鐘", totalSessions: null, completed: 0 }, // null 代表無上限
    { name: "Duolingo學習韓文", time: "10-15分鐘", totalSessions: null, completed: 0 },
    { name: "學習framer", time: "10-30分鐘", totalSessions: 60, completed: 0 },
    { name: "學習UIUX知識", time: "30分-1小時", totalSessions: 30, completed: 0 },
    { name: "學習平面設計知識", time: "30分-1小時", totalSessions: 30, completed: 0 }
];

const TABLE_BODY = document.querySelector('#task-table tbody');
const PROGRESS_MESSAGE = document.querySelector('#progress-message');
const STORAGE_KEY = 'auntieTaskProgress';
let tasks = []; // 將用於儲存和更新任務狀態

// === 核心功能：讀取/儲存/渲染 ===

// 1. 從 LocalStorage 載入進度
// 在 script.js 檔案中找到 loadProgress 函數
function loadProgress() {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();
    
    if (savedProgress) {
        const savedTasks = JSON.parse(savedProgress);
        tasks = initialTasks.map(initialTask => {
            const savedTask = savedTasks.find(t => t.name === initialTask.name);
            
            // 如果有儲存的任務，則使用儲存的資料，但確保 lastCompletedDate 存在
            if (savedTask) {
                // 如果上次完成日期不是今天，則解鎖 Checkbox
                if (savedTask.lastCompletedDate !== today) {
                    savedTask.checkedToday = false;
                } else {
                    savedTask.checkedToday = true;
                }
                return { ...initialTask, ...savedTask };
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 3. 渲染表格
// 在 script.js 檔案中找到 renderTasks 函數
function renderTasks() {
    TABLE_BODY.innerHTML = ''; 
    const today = new Date().toDateString();

    // 1. 過濾任務：分成今日待辦 (Pending) 和 今日已完成 (Completed)
    const pendingTasks = tasks.filter(task => 
        task.totalSessions === null || task.completed < task.totalSessions
    ).sort((a, b) => a.name.localeCompare(b.name));

    const completedToday = pendingTasks.filter(task => task.lastCompletedDate === today);
    const pendingToday = pendingTasks.filter(task => task.lastCompletedDate !== today);
    
    // 【⭐⭐⭐ 核心修改處：將 completedToday 放在 pendingToday 的後面 ⭐⭐⭐】
    // 這樣所有待辦任務（pendingToday）會先被渲染，接著才渲染今日已完成任務（completedToday）。
    // 這樣「今日已完成任務」的標題就能正確出現在今日已完成的任務清單上方。
    const allTasksToRender = [...pendingToday, ...completedToday]; 
    // 【⭐⭐⭐ 修改結束 ⭐⭐⭐】
    
    let isTodayCompletedSection = false;
    let completedSectionHeaderRendered = false;

    allTasksToRender.forEach((task, index) => {
        // ... (後續程式碼不變)
        const row = TABLE_BODY.insertRow();
        const isCompletedGoal = task.totalSessions !== null && task.completed >= task.totalSessions;
        const isCompletedToday = task.lastCompletedDate === today && !isCompletedGoal;
        
        // 判斷是否要開始渲染「今日已完成」部分
        if (isCompletedToday && !isTodayCompletedSection) {
            isTodayCompletedSection = true;
        }

        // 渲染「今日已完成」的標題 (只渲染一次)
        if (isTodayCompletedSection && !completedSectionHeaderRendered) {
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
        checkbox.dataset.index = tasks.findIndex(t => t.name === task.name); // 用原始索引
        
        // 設置 Checkbox 狀態：是否已達成目標或今日已完成
        if (isCompletedGoal) {
            checkbox.checked = true;
            checkbox.disabled = true;
        } else if (isCompletedToday) {
            checkbox.checked = true;
            checkbox.disabled = true;
        } else {
            checkbox.checked = false;
            checkbox.disabled = false;
        }
        
        checkbox.addEventListener('change', handleCompletion);
        checkboxCell.appendChild(checkbox);
    });
}

// 4. 處理完成打勾的邏輯 (核心功能)
// 在 script.js 檔案中找到 handleCompletion 函數
function handleCompletion(event) {
    const checkbox = event.target;
    const index = parseInt(checkbox.dataset.index);
    const task = tasks[index];
    const today = new Date().toDateString(); // 取得今天的日期字串

    // 檢查任務是否已在今天完成過
    if (task.lastCompletedDate === today) {
        // 如果今天已經完成，但有人試圖再次點擊（理論上應該被 disabled），則阻止計數
        checkbox.checked = true; // 確保它保持勾選狀態
        checkbox.disabled = true; // 鎖定
        return;
    }
    
    // 只有在從未勾選變成勾選時才執行計數
    if (checkbox.checked) {
        task.completed += 1; // 完成次數 + 1
        task.lastCompletedDate = today; // 紀錄完成日期
        
        saveProgress(); // 儲存進度
        
        // 鎖定 Checkbox，表示今日已完成此項
        checkbox.disabled = true; 
        
        showEncouragement(task); // 顯示鼓勵話語
        
        // 延遲幾秒後重新渲染表格，將已完成任務移至下方
        setTimeout(() => {
             renderTasks(); 
             // 重置頂部訊息，顯示今日日期
             PROGRESS_MESSAGE.textContent = `任務提醒 | ${today} 的學習計畫`; 
        }, 3000); 
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


// === 程式碼啟動點 (在 script.js 的最底部) ===
loadProgress();

// 新增這行：在載入後立即更新頂部訊息為今日日期
PROGRESS_MESSAGE.textContent = `任務提醒 | ${new Date().toDateString()} 的學習計畫`; 

renderTasks();