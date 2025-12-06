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
    if (savedProgress) {
        // 合併儲存的進度到初始任務列表中
        const savedTasks = JSON.parse(savedProgress);
        tasks = initialTasks.map(initialTask => {
            const savedTask = savedTasks.find(t => t.name === initialTask.name);
            return savedTask ? savedTask : initialTask;
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
function renderTasks() {
    TABLE_BODY.innerHTML = ''; // 清空舊內容
    tasks.forEach((task, index) => {
        const row = TABLE_BODY.insertRow();
        // 檢查是否已達成目標 (如果目標為 null 則不檢查)
        const isGoalAchieved = task.totalSessions !== null && task.completed >= task.totalSessions;
        
        // 如果已達成目標，就將該列標記為完成樣式
        if (isGoalAchieved) {
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
        checkbox.checked = false; // 每天重置為未打勾
        checkbox.dataset.index = index; // 記錄任務的索引
        checkbox.disabled = isGoalAchieved; // 達成目標後不能再打勾
        
        checkbox.addEventListener('change', handleCompletion);
        checkboxCell.appendChild(checkbox);
    });
}

// 4. 處理完成打勾的邏輯 (核心功能)
function handleCompletion(event) {
    const checkbox = event.target;
    const index = parseInt(checkbox.dataset.index);
    const task = tasks[index];

    // 只有在打勾時才執行鼓勵和計數
    if (checkbox.checked) {
        task.completed += 1; // 完成次數 + 1
        saveProgress();
        
        // 顯示鼓勵話語
        showEncouragement(task);
        
        // 重新渲染表格，讓進度更新
        // 因為鼓勵訊息會覆蓋，這裡不需要立即重新渲染表格，但可以確保狀態更新
        setTimeout(() => {
             renderTasks(); // 延遲一下再重新渲染，讓鼓勵話語停留
             PROGRESS_MESSAGE.textContent = '任務提醒 | 完成任務的提醒阿姨 👵'; // 重置頂部訊息
        }, 3000); 
    }
    
    // 每次點擊後都將 checkbox 重置為未勾選，模擬每天重新開始
    // 讓使用者知道這次的進度已經被紀錄了
    checkbox.checked = false; 
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

// === 程式碼啟動點 ===
loadProgress();
renderTasks();