// grabbing all the elements we need
const taskInput      = document.getElementById("task-input");
const deadlineInput  = document.getElementById("deadline-input");
const addBtn         = document.getElementById("add-btn");
const searchBar      = document.getElementById("search-bar");
const taskList       = document.getElementById("task-list");
const filterButtons  = document.querySelectorAll(".filter-btn");
const taskCountSpan  = document.getElementById("task-count");
const progressBar    = document.getElementById("progress-bar");

const ribbon         = document.getElementById("diagonal-ribbon");
const ribbonText     = document.getElementById("ribbon-text");


let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

renderTasks();
updateTaskCount();
updateProgressBar();
updateRibbon();

function getTimeLeft(ms) {
    let minutes = Math.floor(ms / 60000);
    let hours   = Math.floor(minutes / 60);
    minutes     = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}


function getUrgentTasks() {
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    return tasks.filter(t => {
        if (!t.deadline || t.completed) return false;

        const diff = t.deadline - now;

        if (t.priority === "high" && diff > 0) {
            return true;
        }
        if (diff > 0 && diff <= twoHoursMs) {
            return true;
        }

        return false;
    });
}
function updateRibbon() {
    const urgentList = getUrgentTasks();

    if (urgentList.length === 0) {
        ribbon.style.display = "none";
        ribbon.classList.remove("high-scroll");
        return;
    }
    ribbon.style.display = "block";
    const hasHigh = urgentList.some(t => t.priority === "high");
    if (hasHigh) {
        ribbon.classList.add("high-scroll");
    } else {
        ribbon.classList.remove("high-scroll");
    }

    // build a line like: "🔥 Task A — 20m left • 🔥 Task B — 1h 10m left"
    let oneLine = urgentList.map(item => {
        const diff = item.deadline - Date.now();
        const left = diff > 0 ? getTimeLeft(diff) : "Overdue!";
        return `🔥 ${item.text} — ${left}`;
    }).join(" • ");
    ribbonText.innerHTML = Array(10).fill(oneLine).join(" • ");
}

addBtn.addEventListener("click", () => {
    const textValue = taskInput.value.trim();
    const checkedPriorityRadio = document.querySelector("input[name='priority']:checked");
    const priorityValue = checkedPriorityRadio ? checkedPriorityRadio.value : "low";

    const deadlineValue = deadlineInput.value
        ? new Date(deadlineInput.value).getTime()
        : null;

    if (!textValue) {
        alert("Please enter a task first.");
        return;
    }

    const newTask = {
        id       : Date.now(),
        text     : textValue,
        priority : priorityValue,
        deadline : deadlineValue,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();


    taskInput.value = "";
    deadlineInput.value = "";

    renderTasks();
    updateTaskCount();
    updateProgressBar();
    updateRibbon();
});
function renderTasks() {
    taskList.innerHTML = "";

    let visibleTasks = filterByStatus(tasks);
    visibleTasks = filterBySearch(visibleTasks);

    visibleTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task-item";

        // checkbox
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = task.completed;
        check.addEventListener("change", () => toggleComplete(task.id));

        const textWrap = document.createElement("div");
        textWrap.className = "task-text-container";

        const mainText = document.createElement("span");
        mainText.className = "task-text";
        mainText.textContent = task.text;
        if (task.completed) {
            mainText.classList.add("completed");
        }

        const prioritySpan = document.createElement("span");
        if (task.priority === "high") {
            prioritySpan.textContent = "🔴 High";
        } else if (task.priority === "medium") {
            prioritySpan.textContent = "🟡 Medium";
        } else {
            prioritySpan.textContent = "🟢 Low";
        }

        const deadlineSpan = document.createElement("span");
        if (task.deadline) {
            const diff = task.deadline - Date.now();
            if (diff > 0) {
                deadlineSpan.textContent = `Due in ${getTimeLeft(diff)}`;
            } else {
                deadlineSpan.textContent = "⚠ Overdue";
            }
        } else {
            deadlineSpan.textContent = "No deadline";
        }

        textWrap.appendChild(mainText);
        textWrap.appendChild(prioritySpan);
        textWrap.appendChild(deadlineSpan);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.addEventListener("click", () => editTask(task.id));

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.addEventListener("click", () => deleteTask(task.id));

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(check);
        li.appendChild(textWrap);
        li.appendChild(actions);

        taskList.appendChild(li);
    });


    updateRibbon();
}


searchBar.addEventListener("input", () => {
    renderTasks();
});


function filterBySearch(list) {
    const query = searchBar.value.toLowerCase();
    if (!query) return list;
    return list.filter(t => t.text.toLowerCase().includes(query));
}


filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".filter-btn.active")?.classList.remove("active");
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

function filterByStatus(list) {
    if (currentFilter === "active") {
        return list.filter(t => !t.completed);
    }
    if (currentFilter === "completed") {
        return list.filter(t => t.completed);
    }
    return list;
}


function toggleComplete(id) {
    tasks = tasks.map(t => {
        if (t.id === id) {
            return { ...t, completed: !t.completed };
        }
        return t;
    });
    saveTasks();
    renderTasks();
    updateTaskCount();
    updateProgressBar();
    updateRibbon();
}


function editTask(id) {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const newText = prompt("Edit your task:", target.text);
    if (newText && newText.trim()) {
        target.text = newText.trim();
        saveTasks();
        renderTasks();
        updateRibbon();
    }
}


function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateTaskCount();
    updateProgressBar();
    updateRibbon();
}


function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


function updateTaskCount() {
    const done = tasks.filter(t => t.completed).length;
    taskCountSpan.textContent = `${done} / ${tasks.length} tasks`;
}

function updateProgressBar() {
    const done = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percent = total ? (done / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
}
setInterval(updateRibbon, 60 * 1000);
