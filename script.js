const classesToday = [
  { name: 'Data Structures', time: '09:00 - 10:30', room: 'ENG 203' },
  { name: 'Microeconomics', time: '11:00 - 12:15', room: 'BUS 111' },
  { name: 'Software Lab', time: '14:00 - 16:00', room: 'CS 018' }
];

const assignments = [
  { title: 'Algorithms Midterm', course: 'CS301', due: '2026-06-12', weight: 30 },
  { title: 'Lab Reflection', course: 'BIO110', due: '2026-06-11', weight: 8 },
  { title: 'Economics Quiz 4', course: 'ECO201', due: '2026-06-13', weight: 2 },
  { title: 'Group Product Pitch', course: 'ENT220', due: '2026-06-14', weight: 20 }
];

function daysUntil(dateStr) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(`${dateStr}T00:00:00`);
  return Math.max(0, Math.round((due - todayStart) / (1000 * 60 * 60 * 24)));
}

function assignmentScore(assignment) {
  const urgencyBoost = Math.max(0, 10 - daysUntil(assignment.due));
  return assignment.weight * 2 + urgencyBoost;
}

function assignmentLevel(score) {
  if (score >= 45) return 'high';
  if (score >= 22) return 'medium';
  return 'low';
}

function renderDashboard() {
  const classList = document.getElementById('today-classes');
  const scheduleList = document.getElementById('today-schedule');
  const upcomingList = document.getElementById('upcoming-assignments');

  classList.innerHTML = classesToday
    .map((entry) => `<li><strong>${entry.time}</strong> · ${entry.name} (${entry.room})</li>`)
    .join('');

  scheduleList.innerHTML = classesToday
    .map((entry) => `<li>${entry.name} at ${entry.time}</li>`)
    .join('');

  const upcoming = [...assignments]
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 3);

  upcomingList.innerHTML = upcoming
    .map((a) => `<li>${a.title} (${a.course}) · due ${a.due}</li>`)
    .join('');
}

function renderAssignments() {
  const host = document.getElementById('assignment-list');
  const ranked = [...assignments]
    .map((assignment) => ({
      ...assignment,
      score: assignmentScore(assignment)
    }))
    .sort((a, b) => b.score - a.score);

  host.innerHTML = ranked
    .map((item) => {
      const level = assignmentLevel(item.score);
      return `
        <article class="assignment-item ${level}">
          <h4>${item.title} <span>(${item.course})</span></h4>
          <p>Due: <strong>${item.due}</strong> · Grade weight: <strong>${item.weight}%</strong></p>
          <p>Priority score: <strong>${item.score}</strong> (${level.toUpperCase()})</p>
        </article>
      `;
    })
    .join('');
}

let timerId;
let isFocus = true;
let remaining = 25 * 60;
let total = 25 * 60;
let completedFocusSessions = 0;

const timeEl = document.getElementById('timer-time');
const modeEl = document.getElementById('timer-mode');
const progressEl = document.getElementById('timer-progress');
const sessionProgressEl = document.getElementById('session-progress');

function inputMinutes(id, fallback) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function minutesForMode(focusMode) {
  return focusMode ? inputMinutes('focus-minutes', 25) : inputMinutes('break-minutes', 5);
}

function syncTimerDisplay() {
  const min = String(Math.floor(remaining / 60)).padStart(2, '0');
  const sec = String(remaining % 60).padStart(2, '0');
  timeEl.textContent = `${min}:${sec}`;
  modeEl.textContent = isFocus ? 'Focus Session' : 'Break Session';
  progressEl.style.width = `${Math.min(100, Math.max(0, ((total - remaining) / total) * 100))}%`;
  sessionProgressEl.textContent = `Completed focus sessions today: ${completedFocusSessions}`;
}

function setupTimerForMode(focusMode) {
  isFocus = focusMode;
  total = minutesForMode(focusMode) * 60;
  remaining = total;
  syncTimerDisplay();
}

function tick() {
  remaining -= 1;
  if (remaining <= 0) {
    clearInterval(timerId);
    timerId = undefined;
    if (isFocus) {
      completedFocusSessions += 1;
    }
    setupTimerForMode(!isFocus);
    return;
  }
  syncTimerDisplay();
}

document.getElementById('start-btn').addEventListener('click', () => {
  if (timerId) return;
  timerId = setInterval(tick, 1000);
});

document.getElementById('pause-btn').addEventListener('click', () => {
  clearInterval(timerId);
  timerId = undefined;
});

document.getElementById('reset-btn').addEventListener('click', () => {
  clearInterval(timerId);
  timerId = undefined;
  setupTimerForMode(true);
});

document.getElementById('skip-btn').addEventListener('click', () => {
  clearInterval(timerId);
  timerId = undefined;
  setupTimerForMode(!isFocus);
});

document.getElementById('focus-minutes').addEventListener('change', () => {
  if (isFocus && !timerId) {
    setupTimerForMode(true);
  }
});

document.getElementById('break-minutes').addEventListener('change', () => {
  if (!isFocus && !timerId) {
    setupTimerForMode(false);
  }
});

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const times = ['08:00', '10:00', '12:00', '14:00', '16:00'];
const lectureBlocks = {
  'Mon-10:00': 'Lecture: Data Structures',
  'Tue-12:00': 'Lecture: Economics',
  'Wed-14:00': 'Lecture: Software Lab',
  'Thu-10:00': 'Lecture: Statistics',
  'Fri-08:00': 'Lecture: Communication'
};

let draggedBlock = '';

function renderCalendar() {
  const calendar = document.getElementById('weekly-calendar');
  calendar.innerHTML = `<div class="time-cell">Time</div>${days
    .map((day) => `<div class="slot-head">${day}</div>`)
    .join('')}`;

  times.forEach((time) => {
    calendar.innerHTML += `<div class="time-cell">${time}</div>`;
    days.forEach((day) => {
      const key = `${day}-${time}`;
      const content = lectureBlocks[key] || '';
      const lecture = Boolean(content);
      calendar.innerHTML += `<div class="slot ${lecture ? 'lecture' : ''}" data-slot="${key}">${content}</div>`;
    });
  });

  document.querySelectorAll('.slot').forEach((slot) => {
    if (slot.classList.contains('lecture')) {
      return;
    }
    slot.addEventListener('dragover', (event) => {
      event.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', () => {
      slot.classList.remove('drag-over');
      if (draggedBlock) {
        slot.textContent = draggedBlock;
      }
    });
  });

  document.querySelectorAll('.draggable-block').forEach((block) => {
    block.addEventListener('dragstart', () => {
      draggedBlock = block.dataset.block || block.textContent || '';
    });
  });
}

renderDashboard();
renderAssignments();
setupTimerForMode(true);
renderCalendar();
