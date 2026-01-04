class TimetableApp {
    constructor() {
        this.subjects = [
            { id: '1', name: '语文', teacher: '', color: '#FF0000' },
            { id: '2', name: '数学', teacher: '', color: '#0000FF' },
            { id: '3', name: '英语', teacher: '', color: '#FF69B4' },
            { id: '4', name: '美术', teacher: '', color: '#FFA500' },
            { id: '5', name: '健康与体育', teacher: '', color: '#800080' },
            { id: '6', name: '道德与法制', teacher: '', color: '#B8860B' },
            { id: '7', name: '音乐', teacher: '', color: '#FF4500' },
            { id: '8', name: '劳动', teacher: '', color: '#808080' },
            { id: '9', name: '班队会', teacher: '', color: '#663399' },
            { id: '10', name: '值日', teacher: '', color: '#006400' },
            { id: '11', name: '历史', teacher: '', color: '#000080' },
            { id: '12', name: '地理', teacher: '', color: '#4B0082' },
            { id: '13', name: '政治', teacher: '', color: '#8B0000' },
            { id: '14', name: '物理', teacher: '', color: '#A0522D' },
            { id: '15', name: '化学', teacher: '', color: '#2F4F4F' },
            { id: '16', name: '生物', teacher: '', color: '#FF6B6B' }
        ];
        this.timetable = {};
        this.periods = {
            morning: [
                { name: '第1节', time: '08:00-08:40' },
                { name: '第2节', time: '08:50-09:30' },
                { name: '第3节', time: '10:00-10:40' },
                { name: '第4节', time: '10:50-11:30' }
            ],
            afternoon: [
                { name: '第1节', time: '14:00-14:40' },
                { name: '第2节', time: '14:50-15:30' },
                { name: '第3节', time: '15:40-16:20' }
            ]
        };
        this.editingSubject = null;
        this.editingCell = null;
        this.editingPeriod = null;
        this.draggedSubject = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderSubjects();
        this.renderTimetable();
        this.loadTimetableTitle();
        this.loadTableTitle();
    }

    bindEvents() {
        // 科目相关
        document.getElementById('addSubjectBtn').addEventListener('click', () => this.openSubjectModal());
        document.getElementById('subjectForm').addEventListener('submit', (e) => this.saveSubject(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeSubjectModal());
        document.getElementById('deleteSubjectBtn').addEventListener('click', () => this.deleteSubject());
        
        // 课程表标题
        document.getElementById('timetableTitle').addEventListener('input', (e) => this.saveTimetableTitle(e.target.value));
        document.getElementById('tableTitle').addEventListener('input', (e) => this.saveTableTitle(e.target.value));
        
        // 节数管理
        document.getElementById('addMorningBtn').addEventListener('click', () => this.addPeriod('morning'));
        document.getElementById('addAfternoonBtn').addEventListener('click', () => this.addPeriod('afternoon'));
        document.getElementById('removeMorningBtn').addEventListener('click', () => this.removePeriod('morning'));
        document.getElementById('removeAfternoonBtn').addEventListener('click', () => this.removePeriod('afternoon'));
        
        // 时间相关
        document.getElementById('timeForm').addEventListener('submit', (e) => this.savePeriodTime(e));
        document.getElementById('cancelTimeBtn').addEventListener('click', () => this.closeTimeModal());
        
        // 初始化时间选择器
        this.initTimeSelectors();
        
        // 教程事件
        document.getElementById('tutorialBtn').addEventListener('click', () => this.openTutorialModal());
        document.getElementById('closeTutorialBtn').addEventListener('click', () => this.closeTutorialModal());
        
        // 重置和打印
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimetable());
        document.getElementById('saveImageBtn').addEventListener('click', () => this.saveAsImage());
        document.getElementById('exportWordBtn').addEventListener('click', () => this.exportToWord());
        document.getElementById('exportExcelBtn').addEventListener('click', () => this.exportToExcel());
        

        
        // 颜色选择
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e));
        });
        document.getElementById('customColor').addEventListener('change', (e) => {
            document.getElementById('customColorText').value = e.target.value;
        });
        document.getElementById('customColorText').addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                document.getElementById('customColor').value = e.target.value;
            }
        });
        
        // 拖拽相关
        this.setupDragAndDrop();
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.editingCell) {
                this.removeSubjectFromCell(this.editingCell);
            }
            if (e.key === 'Escape') {
                // 关闭所有弹窗
                this.closeSubjectModal();
                this.closeTimeModal();
                this.closeTutorialModal();
            }
        });
    }

    setupDragAndDrop() {
        // 科目池拖拽
        document.getElementById('subjectPool').addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('subject-card')) {
                this.draggedSubject = e.target.dataset.subjectId;
                e.target.classList.add('dragging');
            }
        });
        
        document.getElementById('subjectPool').addEventListener('dragend', (e) => {
            if (e.target.classList.contains('subject-card')) {
                e.target.classList.remove('dragging');
            }
        });
        
        // 使用事件委托处理表格拖拽
        const timetable = document.getElementById('timetable');
        
        timetable.addEventListener('dragover', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && !cell.classList.contains('occupied')) {
                e.preventDefault();
                cell.classList.add('drag-over');
            }
        });
        
        timetable.addEventListener('dragleave', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                cell.classList.remove('drag-over');
            }
        });
        
        timetable.addEventListener('drop', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && !cell.classList.contains('occupied')) {
                e.preventDefault();
                cell.classList.remove('drag-over');
                
                if (this.draggedSubject) {
                    const day = cell.dataset.day;
                    const section = cell.dataset.section;
                    const period = cell.dataset.period;
                    this.addSubjectToCell(this.draggedSubject, day, section, period);
                }
            }
        });
        
        // 双击删除课程
        timetable.addEventListener('dblclick', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && cell.classList.contains('occupied')) {
                this.removeSubjectFromCell(cell);
            }
        });
    }

    openSubjectModal(subject = null) {
        this.editingSubject = subject;
        const modal = document.getElementById('subjectModal');
        const nameInput = document.getElementById('subjectName');
        const teacherInput = document.getElementById('teacherName');
        const deleteBtn = document.getElementById('deleteSubjectBtn');
        
        if (subject) {
            nameInput.value = subject.name;
            teacherInput.value = subject.teacher;
            this.selectColorByValue(subject.color);
            deleteBtn.style.display = 'block';
        } else {
            nameInput.value = '';
            teacherInput.value = '';
            this.selectColorByValue('#FF6B6B');
            deleteBtn.style.display = 'none';
        }
        
        modal.style.display = 'block';
    }

    closeSubjectModal() {
        document.getElementById('subjectModal').style.display = 'none';
        this.editingSubject = null;
    }

    saveSubject(e) {
        e.preventDefault();
        
        const name = document.getElementById('subjectName').value.trim();
        const teacher = document.getElementById('teacherName').value.trim();
        const color = document.getElementById('customColor').value;
        
        if (!name) return;
        
        if (this.editingSubject) {
            this.editingSubject.name = name;
            this.editingSubject.teacher = teacher;
            this.editingSubject.color = color;
        } else {
            const subject = {
                id: Date.now().toString(),
                name,
                teacher,
                color
            };
            this.subjects.push(subject);
        }
        
        this.saveData();
        this.renderSubjects();
        this.renderTimetable();
        this.closeSubjectModal();
    }

    deleteSubject() {
        if (this.editingSubject) {
            this.deleteSubjectFromPool(this.editingSubject.id);
            this.closeSubjectModal();
        }
    }

    deleteSubjectFromPool(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (subject) {
            // 从科目列表中删除
            this.subjects = this.subjects.filter(s => s.id !== subjectId);
            
            // 从课程表中移除该科目的所有实例
            Object.keys(this.timetable).forEach(key => {
                if (this.timetable[key] === subjectId) {
                    delete this.timetable[key];
                }
            });
            
            this.saveData();
            this.renderSubjects();
            this.renderTimetable();
        }
    }

    selectColor(e) {
        const color = e.target.dataset.color;
        document.getElementById('customColor').value = color;
        document.getElementById('customColorText').value = color;
        
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        e.target.classList.add('selected');
    }

    selectColorByValue(color) {
        document.getElementById('customColor').value = color;
        document.getElementById('customColorText').value = color;
        
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === color);
        });
    }

    openTimeModal(e) {
        const timeText = e.target;
        const period = timeText.dataset.period;
        const modal = document.getElementById('timeModal');
        const timeInput = document.getElementById('timeRange');
        
        timeInput.value = timeText.textContent;
        timeInput.dataset.period = period;
        modal.style.display = 'block';
    }

    closeTimeModal() {
        document.getElementById('timeModal').style.display = 'none';
    }

    openTutorialModal() {
        document.getElementById('tutorialModal').style.display = 'flex';
    }

    closeTutorialModal() {
        document.getElementById('tutorialModal').style.display = 'none';
    }

    saveTime(e) {
        e.preventDefault();
        
        const timeInput = document.getElementById('timeRange');
        const period = timeInput.dataset.period;
        const newTime = timeInput.value.trim();
        
        if (!newTime) return;
        
        document.querySelector(`[data-period="${period}"]`).textContent = newTime;
        this.saveData();
        this.closeTimeModal();
    }

    addSubjectToCell(subjectId, day, section, period) {
        const key = `${day}-${section}-${period}`;
        this.timetable[key] = subjectId;
        this.saveData();
        this.renderTimetable();
    }

    removeSubjectFromCell(cell) {
        if (cell.classList.contains('occupied')) {
            const day = cell.dataset.day;
            const section = cell.dataset.section;
            const period = cell.dataset.period;
            const key = `${day}-${section}-${period}`;
            delete this.timetable[key];
            this.saveData();
            this.renderTimetable();
        }
    }

    renderSubjects() {
        const pool = document.getElementById('subjectPool');
        pool.innerHTML = '';
        
        this.subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.draggable = true;
            card.dataset.subjectId = subject.id;
            card.style.borderLeft = `4px solid ${subject.color}`;
            
            const teacherHtml = subject.teacher ? `<div class="teacher-name">${subject.teacher}</div>` : '';
            const subjectStyle = !subject.teacher ? 'style="line-height: 40px;"' : '';
            
            card.innerHTML = `
                <div class="subject-info">
                    <div class="subject-name" ${subjectStyle}>${subject.name}</div>
                    ${teacherHtml}
                </div>
                <div class="subject-actions">
                    <button class="btn-icon edit-btn" title="编辑" data-action="edit">✏️</button>
                    <button class="btn-icon delete-btn" title="删除" data-action="delete">🗑️</button>
                </div>
            `;
            
            // 编辑按钮事件
            card.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSubjectModal(subject);
            });
            
            // 删除按钮事件
            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSubjectFromPool(subject.id);
            });
            
            pool.appendChild(card);
        });
    }

    addPeriod(section) {
        const periods = this.periods[section];
        const newPeriod = {
            name: `第${periods.length + 1}节`,
            time: section === 'morning' ? '09:00-09:40' : '15:00-15:40'
        };
        periods.push(newPeriod);
        this.saveData();
        this.renderTimetable();
    }

    removePeriod(section) {
        if (this.periods[section].length <= 1) {
            alert('至少需要保留一节课！');
            return;
        }
        
        if (confirm(`确定要删除${section === 'morning' ? '上午' : '下午'}的最后一节课吗？`)) {
            this.periods[section].pop();
            
            // 清理对应的课程表数据
            const keysToDelete = [];
            for (let key in this.timetable) {
                if (key.includes(`-${section}-`)) {
                    const parts = key.split('-');
                    const periodIndex = parseInt(parts[2]);
                    if (periodIndex >= this.periods[section].length) {
                        keysToDelete.push(key);
                    }
                }
            }
            
            keysToDelete.forEach(key => {
                delete this.timetable[key];
            });
            
            this.saveData();
            this.renderTimetable();
        }
    }

    renderTimetable() {
        const tbody = document.getElementById('timetableBody');
        tbody.innerHTML = '';
        
        // 渲染上午
        if (this.periods.morning.length > 0) {
            this.periods.morning.forEach((period, index) => {
                const row = this.createPeriodRow('morning', index, period);
                tbody.appendChild(row);
            });
        }
        
        // 渲染下午
        if (this.periods.afternoon.length > 0) {
            this.periods.afternoon.forEach((period, index) => {
                const row = this.createPeriodRow('afternoon', index, period);
                tbody.appendChild(row);
            });
        }
    }

    createPeriodRow(section, periodIndex, period) {
        const row = document.createElement('tr');
        
        // 时间列 - 只在第一节创建，使用rowSpan合并单元格
        if (periodIndex === 0) {
            const timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            timeCell.innerHTML = section === 'morning' ? 
                '<div class="vertical-text">上午</div>' : 
                '<div class="vertical-text">下午</div>';
            timeCell.rowSpan = this.periods[section].length;
            row.appendChild(timeCell);
        }
        
        // 节数列
        const periodCell = document.createElement('td');
        periodCell.className = 'period-cell';
        periodCell.innerHTML = `
                        <div class="period-name" data-section="${section}" data-period="${periodIndex}" style="cursor: pointer; font-weight: bold; color: #000;">
                            ${period.name}
                        </div>
                        <div class="time-display" data-section="${section}" data-period="${periodIndex}" style="cursor: pointer; font-size: 12px; color: #666;">
                            ${period.time}
                        </div>
                    `;
        
        // 添加节数名称和时间段点击事件
        periodCell.querySelector('.period-name').addEventListener('click', (e) => {
            this.openTimeModal(e, section, periodIndex);
        });
        periodCell.querySelector('.time-display').addEventListener('click', (e) => {
            this.openTimeModal(e, section, periodIndex);
        });
        
        row.appendChild(periodCell);
        
        // 周一到周五的格子
        for (let day = 1; day <= 5; day++) {
            const cell = document.createElement('td');
            cell.className = 'cell';
            cell.dataset.day = day;
            cell.dataset.section = section;
            cell.dataset.period = periodIndex;
            
            const key = `${day}-${section}-${periodIndex}`;
            const subjectId = this.timetable[key];
            
            if (subjectId) {
                const subject = this.subjects.find(s => s.id === subjectId);
                if (subject) {
                    cell.classList.add('occupied');
                    const content = document.createElement('div');
                    content.className = 'cell-content';
                    content.style.backgroundColor = subject.color;
                    const teacherHtml = subject.teacher ? `<div class="teacher-name">${subject.teacher}</div>` : '';
                    const subjectStyle = !subject.teacher ? 'style="margin-bottom: 0;"' : '';
                    content.innerHTML = `
                        <div class="subject-name" ${subjectStyle}>${subject.name}</div>
                        ${teacherHtml}
                        <button class="delete-cell-btn" title="删除课程">×</button>
                    `;
                    cell.appendChild(content);
                    
                    // 添加删除按钮事件
                    content.querySelector('.delete-cell-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeSubjectFromCell(cell);
                    });
                }
            }
            
            // 添加双击删除课程事件
            cell.addEventListener('dblclick', () => {
                if (cell.classList.contains('occupied')) {
                    this.removeSubjectFromCell(cell);
                }
            });
            
            // 添加点击选择
            cell.addEventListener('click', () => {
                this.editingCell = cell;
                document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
            });
            
            row.appendChild(cell);
        }
        
        return row;
    }

    openTimeModal(e, section, periodIndex) {
        this.editingPeriod = { section, periodIndex };
        const modal = document.getElementById('timeModal');
        const nameInput = document.getElementById('periodName');
        const startHourSelect = document.getElementById('startHour');
        const startMinuteSelect = document.getElementById('startMinute');
        const endHourSelect = document.getElementById('endHour');
        const endMinuteSelect = document.getElementById('endMinute');
        
        const period = this.periods[section][periodIndex];
        nameInput.value = period.name;
        
        // 解析现有时间
        const [startTime, endTime] = period.time.split('-');
        const [startH, startM] = startTime.split(':');
        const [endH, endM] = endTime.split(':');
        
        startHourSelect.value = startH;
        startMinuteSelect.value = startM;
        endHourSelect.value = endH;
        endMinuteSelect.value = endM;
        
        modal.style.display = 'block';
    }

    savePeriodTime(e) {
        e.preventDefault();
        
        if (!this.editingPeriod) return;
        
        const { section, periodIndex } = this.editingPeriod;
        const nameInput = document.getElementById('periodName');
        const startHourSelect = document.getElementById('startHour');
        const startMinuteSelect = document.getElementById('startMinute');
        const endHourSelect = document.getElementById('endHour');
        const endMinuteSelect = document.getElementById('endMinute');
        
        const newName = nameInput.value.trim();
        const startHour = startHourSelect.value;
        const startMinute = startMinuteSelect.value;
        const endHour = endHourSelect.value;
        const endMinute = endMinuteSelect.value;
        
        if (!newName || !startHour || !startMinute || !endHour || !endMinute) return;
        
        const newTime = `${startHour}:${startMinute}-${endHour}:${endMinute}`;
        this.periods[section][periodIndex].time = newTime;
        this.periods[section][periodIndex].name = newName;
        this.saveData();
        this.renderTimetable();
        this.closeTimeModal();
    }

    resetTimetable() {
        if (confirm('确定要重置整个课程表吗？这将清空课程表内容但保留科目')) {
            // 只重置课程表内容，保留科目池
            this.timetable = {};
            this.periods = {
                morning: [
                { name: '第1节', time: '08:00-08:40' },
                { name: '第2节', time: '08:50-09:30' },
                { name: '第3节', time: '10:00-10:40' },
                { name: '第4节', time: '10:50-11:30' }
            ],
            afternoon: [
                { name: '第1节', time: '14:00-14:40' },
                { name: '第2节', time: '14:50-15:30' },
                { name: '第3节', time: '15:40-16:20' }
            ]
            };
            
            // 重置课程表标题
            const defaultTitle = '我的课程表';
            document.getElementById('timetableTitle').value = defaultTitle;
            localStorage.setItem('timetableTitle', defaultTitle);
            
            this.saveData();
            this.renderTimetable();
        }
    }

    saveAsImage() {
        try {
            // 创建一个干净的容器用于截图
            const cleanContainer = document.createElement('div');
            cleanContainer.style.cssText = 'position: absolute; top: -9999px; left: -9999px; width: 1000px; padding: 20px; background: white;';

            // 克隆表格内容
            const originalTable = document.querySelector('.timetable-container');
            const tableClone = originalTable.cloneNode(true);

            // 移除不需要的元素（上午/下午控制按钮）
            const controls = tableClone.querySelectorAll('.section-controls');
            controls.forEach(control => control.remove());
            
            // 移除原有标题和标题输入区域
            const existingTitles = tableClone.querySelectorAll('h1, h2, h3, .title, .timetable-title-section, .table-title-input');
            existingTitles.forEach(title => title.remove());

            // 使用表格标题作为图片标题
            const titleInput = document.getElementById('tableTitle');
            
            // 创建标题
            const titleDiv = document.createElement('div');
            titleDiv.style.cssText = 'text-align: center; margin-bottom: 8px; padding: 0;';
            
            const mainTitle = document.createElement('h1');
            mainTitle.textContent = titleInput.value || '课程表';
            mainTitle.style.cssText = 'margin: 0; font-size: 24px; font-weight: bold; color: #333;';
            
            titleDiv.appendChild(mainTitle);
            cleanContainer.appendChild(titleDiv);
            cleanContainer.appendChild(tableClone);
            
            document.body.appendChild(cleanContainer);
            
            html2canvas(cleanContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                width: 1000,
                height: cleanContainer.scrollHeight
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${titleInput.value || '课程表'}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
                
                // 清理临时容器
                document.body.removeChild(cleanContainer);
            }).catch(error => {
                console.error('生成图片失败:', error);
                alert('生成图片失败，请重试');
                document.body.removeChild(cleanContainer);
            });
        } catch (error) {
            console.error('保存图片出错:', error);
            alert('保存图片出错，请重试');
        }
    }



    saveData() {
        const data = {
            subjects: this.subjects,
            timetable: this.timetable,
            periods: this.periods
        };
        localStorage.setItem('timetableData', JSON.stringify(data));
    }

    loadData() {
        const data = localStorage.getItem('timetableData');
        let hasValidSubjects = false;
        
        if (data) {
            const parsed = JSON.parse(data);
            this.timetable = parsed.timetable || {};
            this.periods = parsed.periods || {
                morning: [
                    { name: '第1节', time: '08:00-08:40' },
                    { name: '第2节', time: '08:50-09:30' },
                    { name: '第3节', time: '10:00-10:40' },
                    { name: '第4节', time: '10:50-11:30' }
                ],
                afternoon: [
                    { name: '第1节', time: '14:00-14:40' },
                    { name: '第2节', time: '14:50-15:30' },
                    { name: '第3节', time: '15:40-16:20' }
                ]
            };
            
            // 检查是否有有效的科目数据
            if (parsed.subjects && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
                this.subjects = parsed.subjects;
                hasValidSubjects = true;
            }
        }
        
        // 如果没有有效科目数据，使用默认科目
        if (!hasValidSubjects) {
            this.subjects = [
                { id: '1', name: '语文', teacher: '', color: '#FF0000' },
                { id: '2', name: '数学', teacher: '', color: '#0000FF' },
                { id: '3', name: '英语', teacher: '', color: '#FF69B4' },
                { id: '4', name: '美术', teacher: '', color: '#FFA500' },
                { id: '5', name: '健康与体育', teacher: '', color: '#800080' },
                { id: '6', name: '道德与法制', teacher: '', color: '#B8860B' },
                { id: '7', name: '音乐', teacher: '', color: '#FF4500' },
                { id: '8', name: '劳动', teacher: '', color: '#808080' },
                { id: '9', name: '班队会', teacher: '', color: '#663399' },
                { id: '10', name: '值日', teacher: '', color: '#006400' },
                { id: '11', name: '历史', teacher: '', color: '#000080' },
                { id: '12', name: '地理', teacher: '', color: '#4B0082' },
                { id: '13', name: '政治', teacher: '', color: '#8B0000' },
                { id: '14', name: '物理', teacher: '', color: '#A0522D' },
                { id: '15', name: '化学', teacher: '', color: '#2F4F4F' },
                { id: '16', name: '生物', teacher: '', color: '#FF6B6B' }
            ];
            // 立即保存默认科目到本地存储
            this.saveData();
        }
    }

    loadTimetableTitle() {
        const savedTitle = localStorage.getItem('timetableTitle');
        const titleInput = document.getElementById('timetableTitle');
        if (savedTitle) {
            titleInput.value = savedTitle;
        }
    }

    saveTimetableTitle(title) {
        localStorage.setItem('timetableTitle', title);
    }

    saveTableTitle(title) {
        localStorage.setItem('tableTitle', title);
    }

    loadTableTitle() {
        const savedTitle = localStorage.getItem('tableTitle');
        const titleInput = document.getElementById('tableTitle');
        if (savedTitle) {
            titleInput.value = savedTitle;
        }
    }

    initTimeSelectors() {
        // 生成小时选项 (6-22)
        const startHourSelect = document.getElementById('startHour');
        const endHourSelect = document.getElementById('endHour');
        
        for (let i = 6; i <= 22; i++) {
            const hour = i.toString().padStart(2, '0');
            startHourSelect.appendChild(new Option(hour, hour));
            endHourSelect.appendChild(new Option(hour, hour));
        }
        
        // 生成分钟选项 (00-55，间隔5分钟)
        const startMinuteSelect = document.getElementById('startMinute');
        const endMinuteSelect = document.getElementById('endMinute');
        
        for (let i = 0; i < 60; i += 5) {
            const minute = i.toString().padStart(2, '0');
            startMinuteSelect.appendChild(new Option(minute, minute));
            endMinuteSelect.appendChild(new Option(minute, minute));
        }
    }

    // Word导出功能
    exportToWord() {
        const title = document.getElementById('tableTitle').value || '周一到周五课程表';
        
        // 创建Word文档内容
        let wordContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; }
                .main-title { text-align: center; color: #333; margin-bottom: 20px; font-size: 24px; }
                table { border-collapse: collapse; width: 100%; margin: 0 auto; table-layout: fixed; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; vertical-align: middle; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .time-header { background-color: #e6f3ff; font-weight: bold; width: 80px; }
                .period-header { background-color: #f0f0f0; font-weight: bold; width: 100px; }
                .weekday-header { background-color: #fff2e6; font-weight: bold; width: 100px; }
                .subject { font-weight: bold; margin-bottom: 2px; font-size: 13px; }
                .teacher { font-size: 11px; color: #333; }
                .section-header { background-color: #f8f9fa; font-weight: bold; font-size: 16px; }
                .time-cell { font-size: 12px; }
                .period-cell { font-size: 12px; }
            </style>
        </head>
        <body>
            <h1 class="main-title">${title}</h1>
            <table>
                <thead>
                    <tr>
                        <th class="time-header">时间</th>
                        <th class="period-header">节数</th>
                        <th class="weekday-header">周一</th>
                        <th class="weekday-header">周二</th>
                        <th class="weekday-header">周三</th>
                        <th class="weekday-header">周四</th>
                        <th class="weekday-header">周五</th>
                    </tr>
                </thead>
                <tbody>`;

        // 构建表格内容 - 无背景色版本
        
        // 添加上午部分
        if (this.periods.morning && this.periods.morning.length > 0) {
            this.periods.morning.forEach((period, periodIndex) => {
                wordContent += `<tr>`;
                
                // 时间列（只在第一节显示）
                if (periodIndex === 0) {
                    wordContent += `<td class="time-header" rowspan="${this.periods.morning.length}">上午</td>`;
                }
                
                // 节数和时间
                wordContent += `<td class="period-header">${period.name}<br><small>${period.time}</small></td>`;
                
                // 周一到周五的课程（无背景色）
                for (let day = 1; day <= 5; day++) {
                    const key = `${day}-morning-${periodIndex}`;
                    const subjectId = this.timetable[key];
                    
                    if (subjectId) {
                        const subject = this.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            wordContent += `<td>
                                <div class="subject">${subject.name}</div>
                                <div class="teacher">${subject.teacher}</div>
                            </td>`;
                        } else {
                            wordContent += `<td></td>`;
                        }
                    } else {
                        wordContent += `<td></td>`;
                    }
                }
                
                wordContent += `</tr>`;
            });
        }
        
        // 添加下午部分
        if (this.periods.afternoon && this.periods.afternoon.length > 0) {
            this.periods.afternoon.forEach((period, periodIndex) => {
                wordContent += `<tr>`;
                
                // 时间列（只在第一节显示）
                if (periodIndex === 0) {
                    wordContent += `<td class="time-header" rowspan="${this.periods.afternoon.length}">下午</td>`;
                }
                
                // 节数和时间
                wordContent += `<td class="period-header">${period.name}<br><small>${period.time}</small></td>`;
                
                // 周一到周五的课程（无背景色）
                for (let day = 1; day <= 5; day++) {
                    const key = `${day}-afternoon-${periodIndex}`;
                    const subjectId = this.timetable[key];
                    
                    if (subjectId) {
                        const subject = this.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            wordContent += `<td>
                                <div class="subject">${subject.name}</div>
                                <div class="teacher">${subject.teacher}</div>
                            </td>`;
                        } else {
                            wordContent += `<td></td>`;
                        }
                    } else {
                        wordContent += `<td></td>`;
                    }
                }
                
                wordContent += `</tr>`;
            });
        }

        // 创建Blob并下载
        const blob = new Blob([wordContent], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Excel导出功能
    exportToExcel() {
        try {
            const title = document.getElementById('tableTitle').value || '课程表';
            
            // 创建Excel内容，设置合适的表格宽度和字体
            let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            excelContent += '<head><meta charset="utf-8"><title>' + title + '</title></head><body>';
            excelContent += '<table border="1" style="border-collapse: collapse; width: 100%; font-family: "Microsoft YaHei", Arial, sans-serif;">';
            
            // 标题行
            excelContent += '<tr><td colspan="7" style="text-align: center; font-size: 20px; font-weight: bold; padding: 15px; border: none;">' + title + '</td></tr>';
            
            // 表头
            excelContent += '<tr>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 80px;">时间段</th>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 100px;">节次</th>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 120px;">周一</th>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 120px;">周二</th>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 120px;">周三</th>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 120px;">周四</th>';
            excelContent += '<th style="background-color: #f2f2f2; font-weight: bold; padding: 12px; text-align: center; width: 120px;">周五</th>';
            excelContent += '</tr>';
            
            // 上午课程
            for (let i = 0; i < this.periods.morning.length; i++) {
                const period = this.periods.morning[i];
                excelContent += '<tr>';
                
                if (i === 0) {
                    excelContent += `<td rowspan="${this.periods.morning.length}" style="background-color: #e6f3ff; font-weight: bold; padding: 12px; text-align: center; vertical-align: middle; width: 80px;">上午</td>`;
                }
                
                excelContent += `<td style="padding: 12px; text-align: center; background-color: #f0f0f0; width: 100px; height: 60px;">${period.name}<br><small>${period.time}</small></td>`;
                
                // 每天的课程
                for (let day = 1; day <= 5; day++) {
                    const key = `${day}-morning-${i}`;
                    const subjectId = this.timetable[key];
                    
                    if (subjectId) {
                        const subject = this.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            excelContent += `<td style="padding: 12px; text-align: center; width: 120px; height: 60px;">`;
                            excelContent += `<div style="font-weight: bold; font-size: 14px;">${subject.name}</div>`;
                            if (subject.teacher) {
                                excelContent += `<div style="font-size: 12px; color: #666; margin-top: 4px;">${subject.teacher}</div>`;
                            }
                            excelContent += `</td>`;
                        } else {
                            excelContent += '<td style="padding: 12px; text-align: center; width: 120px; height: 60px;"></td>';
                        }
                    } else {
                        excelContent += '<td style="padding: 12px; text-align: center; width: 120px; height: 60px;"></td>';
                    }
                }
                
                excelContent += '</tr>';
            }
            
            // 下午课程
            for (let i = 0; i < this.periods.afternoon.length; i++) {
                const period = this.periods.afternoon[i];
                excelContent += '<tr>';
                
                if (i === 0) {
                    excelContent += `<td rowspan="${this.periods.afternoon.length}" style="background-color: #fff2e6; font-weight: bold; padding: 12px; text-align: center; vertical-align: middle; width: 80px;">下午</td>`;
                }
                
                excelContent += `<td style="padding: 12px; text-align: center; background-color: #f0f0f0; width: 100px; height: 60px;">${period.name}<br><small>${period.time}</small></td>`;
                
                // 每天的课程
                for (let day = 1; day <= 5; day++) {
                    const key = `${day}-afternoon-${i}`;
                    const subjectId = this.timetable[key];
                    
                    if (subjectId) {
                        const subject = this.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            excelContent += `<td style="padding: 12px; text-align: center; width: 120px; height: 60px;">`;
                            excelContent += `<div style="font-weight: bold; font-size: 14px;">${subject.name}</div>`;
                            if (subject.teacher) {
                                excelContent += `<div style="font-size: 12px; color: #666; margin-top: 4px;">${subject.teacher}</div>`;
                            }
                            excelContent += `</td>`;
                        } else {
                            excelContent += '<td style="padding: 12px; text-align: center; width: 120px; height: 60px;"></td>';
                        }
                    } else {
                        excelContent += '<td style="padding: 12px; text-align: center; width: 120px; height: 60px;"></td>';
                    }
                }
                
                excelContent += '</tr>';
            }
            
            excelContent += '</table></body></html>';
            
            // 创建Excel文件
            const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const link = document.createElement('a');
            link.download = `${title}.xls`;
            link.href = URL.createObjectURL(blob);
            link.click();
            
        } catch (error) {
            console.error('导出Excel出错:', error);
            alert('导出Excel出错，请重试');
        }
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TimetableApp();
});