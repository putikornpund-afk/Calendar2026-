/**
 * Advanced Calendar Logic with Multi-Year Support, API Integration, and Loading States
 */

let currentYear = new Date().getFullYear();
if (currentYear < 2026) currentYear = 2026;
let currentMonth = new Date().getMonth();
let summaryYearDisplay = currentYear;

const calendarGrid = document.getElementById('calendarGrid');
const monthDisplay = document.getElementById('monthDisplay');
const yearDisplay = document.getElementById('yearDisplay');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');
const resetBtn = document.getElementById('resetBtn');
const holidayList = document.getElementById('holidayList');
const modal = document.getElementById('eventModal');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDescription = document.getElementById('modalDescription');
const viewMode = document.getElementById('viewMode');
const editMode = document.getElementById('editMode');
const eventForm = document.getElementById('eventForm');
const cancelEdit = document.getElementById('cancelEdit');
const adminBtn = document.getElementById('loginBtn');
const summaryBtn = document.getElementById('summaryBtn');
const summarySection = document.getElementById('summarySection');
const closeSummary = document.getElementById('closeSummary');

// Auth DOM
const authModal = document.getElementById('authModal');
const closeAuth = document.getElementById('closeAuth');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

let customHolidays = JSON.parse(localStorage.getItem('customHolidays')) || [];
let users = JSON.parse(localStorage.getItem('calendarUsers')) || [
    { user: 'admin', pass: 'admin', name: 'ผู้ดูแลระบบหลัก' }
];

const INVITE_CODE = "MekongDhamma2026";

const monthNamesTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

function init() {
    // Check session
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        setAdminMode(true, currentUser.name);
    }

    // Version Control
    if (localStorage.getItem('dataVersion') !== '2026-v12') {
        const baseHolidays = holidaysData[2026] || [];
        customHolidays = [...baseHolidays];
        localStorage.setItem('dataVersion', '2026-v12');
        saveHolidays();
    }

    renderCalendar();

    // Navigation
    prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        renderCalendar();
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
    cancelEdit.addEventListener('click', () => {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
    });

    // AUTH ACTIONS
    adminBtn.addEventListener('click', () => {
        if (document.body.classList.contains('admin-mode')) {
            if (confirm('ต้องการออกจากระบบหรือไม่?')) {
                setAdminMode(false);
            }
        } else {
            authModal.classList.remove('hidden');
        }
    });

    closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.getElementById('authTitle').textContent = "เข้าสู่ระบบเจ้าหน้าที่";
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        document.getElementById('authTitle').textContent = "ลงทะเบียนสำนักงาน";
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;
        const found = users.find(x => x.user === u && x.pass === p);
        if (found) {
            setAdminMode(true, found.name);
            sessionStorage.setItem('currentUser', JSON.stringify(found));
            authModal.classList.add('hidden');
            loginForm.reset();
        } else {
            alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inv = document.getElementById('regInvite').value;
        if (inv !== INVITE_CODE) {
            alert('รหัสลับเชิญไม่ถูกต้อง ไม่สามารถลงทะเบียนได้');
            return;
        }

        const u = document.getElementById('regUser').value;
        if (users.find(x => x.user === u)) {
            alert('ชื่อผู้ใช้นี้มีในระบบแล้ว');
            return;
        }

        const newUser = {
            user: u,
            pass: document.getElementById('regPass').value,
            name: document.getElementById('regName').value
        };

        users.push(newUser);
        localStorage.setItem('calendarUsers', JSON.stringify(users));
        alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
        loginTab.click();
        registerForm.reset();
    });

    // Form
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('eventDate').value;
        const name = document.getElementById('eventName').value;
        const type = document.getElementById('eventType').value;
        const description = document.getElementById('eventDescription').value;

        const newEvent = { date, name, type, description };
        if (currentEditingId !== null) {
            customHolidays[currentEditingId] = newEvent;
        } else {
            customHolidays.push(newEvent);
        }
        saveHolidays();
        modal.classList.add('hidden');
        renderCalendar();
    });

    // Summary tabs
    document.querySelectorAll('.s-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.s-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.summary-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    summaryBtn.addEventListener('click', () => {
        summaryYearDisplay = currentYear;
        showYearlySummary();
    });

    closeSummary.addEventListener('click', () => summarySection.classList.add('hidden'));

    // Summary Year Nav
    document.getElementById('summaryPrevYear').addEventListener('click', () => {
        summaryYearDisplay--;
        showYearlySummary();
    });
    document.getElementById('summaryNextYear').addEventListener('click', () => {
        summaryYearDisplay++;
        showYearlySummary();
    });

    // Open add modal
    document.getElementById('addEventBtn').addEventListener('click', () => {
        openEditModal(null);
    });

    // CSV Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('คืนค่าเริ่มต้นข้อมูลปฏิทินทั้งหมด?')) {
                localStorage.removeItem('customHolidays');
                localStorage.removeItem('calendarUsers');
                localStorage.removeItem('dataVersion');
                location.reload();
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
        if (e.target === summarySection) summarySection.classList.add('hidden');
        if (e.target === authModal) authModal.classList.add('hidden');
    });
}

function setAdminMode(isAdmin, userName = "") {
    if (isAdmin) {
        document.body.classList.add('admin-mode');
        adminBtn.textContent = `ออกจากระบบ (${userName})`;
        adminBtn.classList.add('highlight');
    } else {
        document.body.classList.remove('admin-mode');
        adminBtn.textContent = 'เข้าสู่ระบบเจ้าหน้าที่';
        adminBtn.classList.remove('highlight');
        sessionStorage.removeItem('currentUser');
    }
    renderCalendar();
}

async function exportToCSV() {
    const events = await prepareEvents(currentYear);
    const eventArray = Object.values(events);

    // กรองเฉพาะวันหยุดและวันชดเชยที่ส่งผลต่อการทำงาน
    const filteredEvents = eventArray.filter(ev =>
        ev.type === 'public' || ev.type === 'compensation'
    );

    if (filteredEvents.length === 0) {
        alert('ไม่มีข้อมูลวันหยุดเพื่อส่งออกในปีนี้');
        return;
    }

    // เรียงลำดับตามวันที่
    filteredEvents.sort((a, b) => a.date.localeCompare(b.date));

    // สร้างเนื้อหา CSV (รองรับภาษาไทยสำหรับ Excel)
    let csvContent = "\ufeff"; // BOM สำหรับ UTF-8
    csvContent += "Date,Event Name,Type\n";

    filteredEvents.forEach(ev => {
        const cleanName = ev.name.replace(/,/g, ' ');
        csvContent += `${ev.date},${cleanName},${ev.type}\n`;
    });

    // ดาวน์โหลดไฟล์
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Holidays_${currentYear}_MekongDhamma.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function saveHolidays() {
    localStorage.setItem('customHolidays', JSON.stringify(customHolidays));
}

let currentEditingId = null;

const FIXED_HOLIDAYS = [
    { m: 0, d: 1, name: "วันขึ้นปีใหม่" },
    { m: 3, d: 6, name: "วันจักรี" },
    { m: 3, d: 13, name: "วันสงกรานต์" },
    { m: 3, d: 14, name: "วันสงกรานต์" },
    { m: 3, d: 15, name: "วันสงกรานต์" },
    { m: 4, d: 1, name: "วันแรงงานแห่งชาติ" },
    { m: 4, d: 4, name: "วันฉัตรมงคล" },
    { m: 5, d: 3, name: "วันเฉลิมฯ พระราชินีสุทิดา" },
    { m: 6, d: 28, name: "วันเฉลิมฯ รัชกาลที่ 10" },
    { m: 7, d: 12, name: "วันแม่แห่งชาติ" },
    { m: 9, d: 13, name: "วันนวมินทรมหาราช" },
    { m: 9, d: 23, name: "วันปิยมหาราช" },
    { m: 11, d: 5, name: "วันพ่อแห่งชาติ" },
    { m: 11, d: 10, name: "วันรัฐธรรมนูญ" },
    { m: 11, d: 31, name: "วันสิ้นปี" }
];

function getStandardHolidays(year) {
    const holidays = [];
    FIXED_HOLIDAYS.forEach(fh => {
        const date = new Date(year, fh.m, fh.d);
        holidays.push({ date: date.toISOString().split('T')[0], name: fh.name, type: 'public' });

        // Auto Substitution
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sat or Sun
            const subDate = new Date(date);
            subDate.setDate(date.getDate() + (dayOfWeek === 0 ? 1 : 2));
            holidays.push({
                date: subDate.toISOString().split('T')[0],
                name: `ชดเชย${fh.name}`,
                type: 'public'
            });
        }
    });
    return holidays;
}

async function fetchHolidaysFromAPI(year) {
    try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TH`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.map(h => ({
            date: h.date,
            name: h.localName || h.name,
            type: 'public'
        }));
    } catch (e) {
        return null;
    }
}

async function prepareEvents(year = currentYear) {
    const allEvents = {};

    // 1. Check Hardcoded Data
    let yearBaseHolidays = holidaysData[year];

    // 2. If not in hardcoded, try to fetch from API
    if (!yearBaseHolidays) {
        setLoading(true);
        const apiHolidays = await fetchHolidaysFromAPI(year);
        setLoading(false);
        if (apiHolidays) {
            yearBaseHolidays = apiHolidays;
        } else {
            // Fallback to locally calculated standard ones
            yearBaseHolidays = getStandardHolidays(year);
        }
    }

    // Process all base holidays
    yearBaseHolidays.forEach(h => {
        allEvents[h.date] = { ...h };
    });

    // 3. Process custom holidays (from local storage)
    customHolidays.forEach(h => {
        if (h.date.startsWith(year.toString())) {
            allEvents[h.date] = { ...h };
        }
    });

    // 4. Wan Phra Logic for hardcoded years
    const yearWanPhra = wanPhraData[year] || [];
    const yearPatimokkha = patimokkhaData[year] || [];
    const yearPrakat = (typeof prakatData !== 'undefined' && prakatData[year]) ? prakatData[year] : [];

    yearWanPhra.forEach(dateStr => {
        let suffix = "";
        if (yearPatimokkha.includes(dateStr)) suffix = " (ปถ)";
        else if (yearPrakat.includes(dateStr)) suffix = " (ปข)";

        if (allEvents[dateStr]) {
            if (!allEvents[dateStr].name.includes("วันพระ")) {
                allEvents[dateStr].name += " / วันพระ" + suffix;
            }
        } else {
            allEvents[dateStr] = { date: dateStr, name: "วันพระ" + suffix, type: 'buddhist', description: "วันธรรมสวนะ" };
        }

        // Logic for Saturday Compensation
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay();
        const ev = allEvents[dateStr];
        const isPublicHoliday = ev && ev.type === 'public';

        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isPublicHoliday) {
            const sat = new Date(d);
            sat.setDate(d.getDate() + (6 - dayOfWeek));
            const satStr = sat.toISOString().split('T')[0];

            if (!allEvents[satStr] || allEvents[satStr].type !== 'public') {
                const dayLabel = d.getDate();
                const monthFull = monthNamesTH[d.getMonth()];
                const compName = `ชดเชยวันพระ (${dayLabel} ${monthFull})`;

                if (allEvents[satStr]) {
                    if (!allEvents[satStr].name.includes(compName)) {
                        allEvents[satStr].name += ` / ${compName}`;
                    }
                } else {
                    allEvents[satStr] = {
                        date: satStr,
                        name: compName,
                        type: 'compensation',
                        description: `ทำงานชดเชยเนื่องจากวันพระ (วันที่ ${dayLabel} ${monthFull}) ตรงกับวันทำงานปกติ`
                    };
                }
            }
        }
    });

    return allEvents;
}

async function renderCalendar() {
    const events = await prepareEvents(currentYear);
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    monthDisplay.textContent = monthNamesTH[currentMonth];
    yearDisplay.textContent = currentYear + 543;

    calendarGrid.innerHTML = '';
    const currentMonthEvents = [];

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'day';

        const dateObj = new Date(currentYear, currentMonth, day);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0) dayEl.classList.add('sunday');
        if (dayOfWeek === 6) dayEl.classList.add('saturday');

        const dayNumSpan = document.createElement('span');
        dayNumSpan.className = 'day-number';
        dayNumSpan.textContent = day;
        dayEl.appendChild(dayNumSpan);

        if (dateStr === todayStr) dayEl.classList.add('today');

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            const event = events[dateStr];
            if (!event || event.type !== 'compensation') {
                dayEl.classList.add('holiday');
            }
        }

        const event = events[dateStr];
        if (event) {
            const classType = (event.type === 'public') ? 'holiday' : event.type;
            dayEl.classList.add(classType);
            const nameEl = document.createElement('div');
            nameEl.className = 'event-name';
            nameEl.textContent = event.name;
            dayEl.appendChild(nameEl);

            dayEl.addEventListener('click', () => openViewModal(dateStr, event));
            currentMonthEvents.push({ day, ...event });
        } else {
            dayEl.addEventListener('click', () => {
                if (document.body.classList.contains('admin-mode')) {
                    openEditModal({ date: dateStr, name: '', type: 'public', description: '' });
                }
            });
        }
        calendarGrid.appendChild(dayEl);
    }
    renderHolidayList(currentMonthEvents);
}

function renderHolidayList(events) {
    holidayList.innerHTML = '';
    events.sort((a, b) => a.day - b.day);
    if (events.length === 0) {
        holidayList.innerHTML = '<p style="text-align:center; padding:10px; color:#64748b;">ไม่มีกิจกรรมพิเศษในเดือนนี้</p>';
        return;
    }
    events.forEach(ev => {
        const item = document.createElement('div');
        const typeCls = (ev.type === 'public') ? 'holiday' : ev.type;
        item.className = `holiday-item border-${typeCls}`;
        item.innerHTML = `
            <div class="holiday-date-badge date-${typeCls}">${ev.day}</div>
            <div class="holiday-info"><strong>${ev.name}</strong></div>
        `;
        item.addEventListener('click', () => openViewModal(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(ev.day).padStart(2, '0')}`, ev));
        holidayList.appendChild(item);
    });
}

function openViewModal(dateStr, event) {
    modalTitle.textContent = event.name;
    const [y, m, d] = dateStr.split('-');
    modalDate.textContent = `${parseInt(d)} ${monthNamesTH[parseInt(m) - 1]} ${parseInt(y) + 543}`;
    modalDescription.textContent = event.description || "";
    viewMode.classList.remove('hidden');
    editMode.classList.add('hidden');
    modal.classList.remove('hidden');

    document.getElementById('editBtn').onclick = () => openEditModal(event);
    document.getElementById('deleteBtn').onclick = () => {
        if (confirm('ลบกิจกรรมนี้?')) {
            customHolidays = customHolidays.filter(h => !(h.date === event.date && h.name === event.name));
            saveHolidays();
            modal.classList.add('hidden');
            renderCalendar();
        }
    };
}

function openEditModal(event) {
    currentEditingId = null;
    if (event) {
        currentEditingId = customHolidays.findIndex(h => h.date === event.date && h.name === event.name);
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventDescription').value = event.description || "";
    } else {
        eventForm.reset();
        document.getElementById('eventDate').value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    }
    viewMode.classList.add('hidden');
    editMode.classList.remove('hidden');
    modal.classList.remove('hidden');
}

async function showYearlySummary() {
    document.getElementById('summaryYear').textContent = summaryYearDisplay + 543;
    const events = await prepareEvents(summaryYearDisplay);
    const lists = {
        public: document.getElementById('publicHolidaySummary'),
        compensation: document.getElementById('compHolidaySummary'),
        other: document.getElementById('otherHolidaySummary')
    };

    Object.values(lists).forEach(l => l.innerHTML = '');

    const sortedDates = Object.keys(events).sort((a, b) => new Date(a) - new Date(b));
    const lastMonth = { public: -1, compensation: -1, other: -1 };

    sortedDates.forEach(dateStr => {
        const ev = events[dateStr];
        const [y, m, d] = dateStr.split('-').map(Number);
        const monthIdx = m - 1;

        let typeKey = 'other';
        if (ev.type === 'public') typeKey = 'public';
        else if (ev.type === 'compensation') typeKey = 'compensation';

        if (lastMonth[typeKey] !== monthIdx) {
            lists[typeKey].innerHTML += `<li class="summary-month-header">${monthNamesTH[monthIdx]}</li>`;
            lastMonth[typeKey] = monthIdx;
        }

        const displayDate = `${d} ${monthNamesTH[monthIdx]}`;
        const item = document.createElement('li');
        item.innerHTML = `<strong>${ev.name}</strong><span>${displayDate}</span>`;
        item.addEventListener('click', () => {
            summarySection.classList.add('hidden');
            currentYear = y;
            currentMonth = monthIdx;
            renderCalendar();
            openViewModal(dateStr, ev);
        });
        lists[typeKey].appendChild(item);
    });

    Object.keys(lists).forEach(key => {
        if (lists[key].children.length === 0) {
            lists[key].innerHTML = '<p class="empty-msg">ไม่มีข้อมูลสำหรับปีนี้</p>';
        }
    });

    summarySection.classList.remove('hidden');
}

function setLoading(isLoading) {
    if (isLoading) {
        calendarGrid.classList.add('loading');
        calendarGrid.style.opacity = '0.5';
        calendarGrid.style.pointerEvents = 'none';
    } else {
        calendarGrid.classList.remove('loading');
        calendarGrid.style.opacity = '1';
        calendarGrid.style.pointerEvents = 'auto';
    }
}

init();
