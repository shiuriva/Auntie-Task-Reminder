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

                // 【解決問題 1：隔天重置 Checkbox】
                // 這裡的邏輯是正確的：如果上次完成日期不是今天，任務應該是未勾選狀態
                if (taskProgress.lastCompletedDate !== today) {
                    // 如果不是今天，則不需要 special flag，在 renderTasks 中會處理
                }

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
    const pendingTasks = tasks.filter(task => 
        task.totalSessions === null || task.completed < task.totalSessions
    ).sort((a, b) => a.name.localeCompare(b.name)); // 篩選出未達目標的任務

    // 任務分類
    const completedToday = pendingTasks.filter(task => task.lastCompletedDate === today); // 今日已完成
    const pendingToday = pendingTasks.filter(task => task.lastCompletedDate !== today); // 今日待辦
    
    // 【解決問題 2：排序問題】
    // 調整順序：讓待辦任務先渲染，已完成任務後渲染，標題才能插在中間
    const allTasksToRender = [...pendingToday, ...completedToday]; 
    
    let isTodayCompletedSection = false;
    let completedSectionHeaderRendered = false;

    allTasksToRender.forEach((task) => {
        const row = TABLE_BODY.insertRow();
        // 用原始任務列表的索引來確保 handleCompletion 能正確找到任務
        const taskIndex = tasks.findIndex(t => t.name === task.name); 

        const isCompletedGoal = task.totalSessions !== null && task.completed >= task.totalSessions;
        const isCompletedToday = task.lastCompletedDate === today && !isCompletedGoal;
        
        // 判斷是否要開始渲染「今日已完成」部分
        if (isCompletedToday && !isTodayCompletedSection && completedToday.length > 0) {
            isTodayCompletedSection = true;
        }

        // 渲染「今日已完成」的標題 (只渲染一次)
        // 確保標題只出現在第一個今日完成任務之前
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
        checkbox.dataset.index = taskIndex; // 使用原始索引
        
        // 設置 Checkbox 狀態
        if (isCompletedGoal) {
            checkbox.checked = true;
            checkbox.disabled = true; // 達成目標，永久鎖定
        } else if (isCompletedToday) {
            checkbox.checked = true;
            checkbox.disabled = false; // 【解決問題 3：允許取消勾選】
        } else {
            checkbox.checked = false;
            checkbox.disabled = false;
        }
        
        checkbox.addEventListener('change', handleCompletion);
        checkboxCell.appendChild(checkbox);
    });
}

// 4. 處理完成打勾的邏輯 (核心功能)
function handleCompletion(event) {
    const checkbox = event.target;
    const index = parseInt(checkbox.dataset.index);
    const task = tasks[index];
    const today = new Date().toDateString(); // 取得今天的日期字串

    // 【解決問題 3：新增取消勾選 (Unchecked) 邏輯】
    if (checkbox.checked) {
        // --- 處理「勾選」 ---
        // 只有當今天尚未完成時才計數
        if (task.lastCompletedDate !== today) {
            task.completed += 1; // 完成次數 + 1
            task.lastCompletedDate = today; // 紀錄完成日期
            
            saveProgress(); // 儲存進度
            
            // 這次不鎖定 Checkbox，讓用戶可以取消
            
            showEncouragement(task); // 顯示鼓勵話語
            
            // 延遲幾秒後重新渲染表格，將已完成任務移至下方
            setTimeout(() => {
                renderTasks(); 
                // 重置頂部訊息，顯示今日日期
                PROGRESS_MESSAGE.textContent = `任務提醒 | ${today} 的學習計畫`; 
            }, 3000); 
        } else {
            // 如果今天已經完成（代表是透過 renderTasks 渲染出來的已完成狀態），
            // 且它在完成區被點擊，我們確保它保持勾選狀態
            checkbox.checked = true; 
        }
    } else {
        // --- 處理「取消勾選」 (Unchecked) ---
        // 只有在上次完成日期是今天，且任務次數大於 0 時，才執行回溯
        if (task.lastCompletedDate === today && task.completed > 0) {
            task.completed -= 1; // 完成次數 - 1
            task.lastCompletedDate = null; // 清除完成日期，表示今天尚未完成
            
            saveProgress(); // 儲存進度
            
            // 清除頂部訊息
            PROGRESS_MESSAGE.textContent = `任務提醒 | ${today} 的學習計畫`; 
            
            // 立即重新渲染表格，將任務移回待辦區塊
            renderTasks();
        } 
        // 否則，如果不滿足回溯條件（例如任務次數已為 0 或非今天完成），則不做任何事
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