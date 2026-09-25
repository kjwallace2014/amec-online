//#region GLOBALS
let app = null;
const LMS_URL = 'https://kjwallace2014.onrender.com/';
//#endregion

//#region HELPERS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

function showToast(message, type = "success", duration = 3000) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => {
        toast.className = "toast";
    }, duration);
}
//#endregion

//#region INIT & NAV
async function init() {
    app = document.getElementById("app");

    if (!app) {
        console.error("Element #app not found.");
        return;
    }

    if (window.location.hash === '#admin') {
        await loadAdminEntry();
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const levelTestLevel = parseInt(params.get('level_test'), 10);

    if (levelTestLevel >= 1 && levelTestLevel <= 5) {
        LevelTestState.name = 'Test User';
        LevelTestState.email = 'test@example.com';

        await loadLevelTestLevel(levelTestLevel);
        return;
    }

    loadHome();
}
function renderNav(activePage = '') {
    const navItems = [
        { label: 'Home',        action: 'loadHome()' },
        { label: 'About Us',    action: 'loadAbout()' },
        { label: 'Services',    action: 'loadServices()' },
        { label: 'Contact',     action: 'loadContact()' },
        { label: 'Level Test',  action: 'loadLevelTestIntro()' }
    ];

    const buttons = navItems.map(item => {
        const isActive = item.label.toLowerCase() === activePage.toLowerCase();
        return `<button onclick="${item.action}" class="${isActive ? 'active' : ''}">${item.label}</button>`;
    }).join('');

    const externalButtons = `
        <div class="nav-external-group">
            <button onclick="loadAdmin()" class="nav-admin">Admin</button>
            <a href="${LMS_URL}" target="_blank" rel="noopener" class="nav-external nav-student">Student Portal ↗</a>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return `<ul class="menu-bar">${buttons}${externalButtons}</ul>`;
}
//#endregion

//#region STATIC PAGES (public marketing content, ported from the old index.php sections)
function loadAdmin() {
    window.open('index.php#admin', '_blank');
}

function loadHome() {
    app.innerHTML = `
        ${renderNav('home')}
        <div class="column">
            <h1>Welcome to the American English Center</h1>
            <div class="column">
                <span><img src="assets/images/image04.png" alt="Online" style="height:300px"></span>
                <span><img src="assets/images/image05.png" alt="Toefl" style="height:300px"></span>
            </div>
        </div>
    `;
}

function loadAbout() {
    app.innerHTML = `
        ${renderNav('about us')}
        <div class="column">
            <h1 style="text-align:center;">Sobre Nós</h1>
            <h3>Estabelecido em 1991 pelos professores Kerry e Neila Wallace, com o intuito de revolucionar o
            ensino da língua inglesa com uma metodologia eficiente e moderna, proporcionando fluência e
            segurança para cada aluno, através de uma imersão cultural, raciocínio individual e uso de
            técnicas linguísticas inovadoras. Já antes da pandemia o Amec iniciou programas de ensino online
            e com os problemas causados pela pandemia, o Amec ampliou e expandiu o modelo 100% online que
            continua por motivos de segurança e comodidade.</h3>
        </div>
    `;
}

function loadServices() {
    app.innerHTML = `
        ${renderNav('services')}
        <div class="column">
            <img src="assets/images/image03.png" alt="Services" height="200px">
            <h1>Our Services</h1>
            <h3 style="text-align:center;">No American English Center, providenciamos assistência para pessoas
            tentando viajar aos EUA, tentando melhorar seu inglês, ou apenas aprender inglês pelo prazer de
            aprender. Somos especializados em ajudar pessoas com o processo de solicitação do visto americano
            e com provas de inglês tais como o TOEFL e IELTS.</h3>
			<a href="https://amec-toefl.onrender.com/" target="_blank" rel="noopener" class="banner">
				<img src="assets/images/image02.png" alt="TOEFL">
			</a>
			<a href="https://amec-ielts.onrender.com/" target="_blank" rel="noopener" class="banner">
				<img src="assets/images/image01.png" alt="IELTS">
			</a>
            <p>Already enrolled? Head to the <a href="${LMS_URL}" target="_blank" rel="noopener">student portal</a>
            for classes, grades, and assignments.</p>
        </div>
    `;
}

function loadContact() {
    app.innerHTML = `
        ${renderNav('contact')}
        <div class="column">
            <h1>Contato</h1>
            <h3>
                Endereço: Rua Visconde de Cairú, 90<br>
                Campo Grande<br>
                Recife, PE – Brazil<br>
                Telefone: +55 81 99757-3909
            </h3>
            <iframe
                style="border:4px solid navy;"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3950.661975363482!2d-34.880152300000006!3d-8.0337436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7ab1866b4fff4a5%3A0xfea8937a8e012d83!2sR.%20Visc.%20de%20Cair%C3%BA%2C%2090%20-%20Campo%20Grande%2C%20Recife%20-%20PE%2C%2052031-140!5e0!3m2!1sen!2sbr!4v1694117683366!5m2!1sen!2sbr"
                width="600" height="450" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
            </iframe>
        </div>
    `;
}
//#endregion

//#region LEVEL TEST — api/level_test.php
const LevelTestState = {
    name: '',
    email: '',
    level: 1,
    questions: []
};

function loadLevelTestIntro() {
    app.innerHTML = `
        ${renderNav('level test')}
        <div class="column">
            <h1>English Level Test</h1>
            <p>This short test places you at the right starting level. It gets a bit harder as you go —
            answer as best you can, and we'll email you your result.</p>
            <form class="narrow-form" onsubmit="startLevelTest(event)">
                <label>Name:</label><br>
                <input type="text" id="lt_name" required><br><br>
                <label>Email:</label><br>
                <input type="email" id="lt_email" required><br><br>
                <button type="submit">Start Test</button>
            </form>
        </div>
    `;
}

function startLevelTest(event) {
    event.preventDefault();
    LevelTestState.name = document.getElementById('lt_name').value.trim();
    LevelTestState.email = document.getElementById('lt_email').value.trim();
    LevelTestState.level = 1;
    loadLevelTestLevel(1);
}

async function loadLevelTestLevel(level) {
    const result = await api(`level_test.php?action=get_questions&level=${level}`);

    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }

    LevelTestState.level = level;
    LevelTestState.questions = result.questions;

    const questionsHtml = result.questions.map((q, i) => renderQuestionInput(q, i + 1)).join('');

    app.innerHTML = `
        ${renderNav('level test')}
        <div class="column">
            <h1>Level ${level}</h1>
            <form class="narrow-form" onsubmit="submitLevelTest(event)">
                ${questionsHtml}
                <button type="submit">Submit</button>
            </form>
        </div>
    `;
}

function shuffleArray(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function renderQuestionInput(q, number) {
    const header = `
        <h3>${number}. ${q.prompt.replace(/\n/g, '<br>')}</h3>
        ${q.image_path ? `<img src="${escapeHtml(q.image_path)}" class="question-illustration">` : ''}
    `;

    try {
        return renderQuestionBody(q, header, number);
    } catch (err) {
        console.error(`Question ${q.id} (${q.question_type}) has bad data:`, q, err);
        return `
            <div class="question" style="border-color:#c0392b;">
                ${header}
                <p style="color:#c0392b;">
                    ⚠ This question (id ${q.id}, type "${q.question_type}") has invalid data —
                    check its "options" column in the DB. See browser console for details.
                </p>
            </div>
        `;
    }
}

function renderQuestionBody(q, header, number) {
    switch (q.question_type) {

        case 'single_choice': {
            const options = shuffleArray(q.options || []).map(opt => `
                <label style="display:block; text-align:left;">
                    <input type="radio" name="q_${q.id}" value="${escapeHtml(opt.value)}">
                    ${opt.text}
                </label>
            `).join('');

            return `<div class="question">${header}${options}</div>`;
        }

        case 'multiple_choice': {
            const options = shuffleArray(q.options || []).map(opt => `
                <label style="display:block; text-align:left;">
                    <input type="checkbox" name="q_${q.id}" value="${escapeHtml(opt.value)}">
                    ${opt.text}
                </label>
            `).join('');

            return `<div class="question">${header}${options}</div>`;
        }

		case 'fill_blank_ordered':
		case 'fill_blank_unordered':
		case 'fill_blank_alternatives': {
			const questionDiv = document.createElement('div');
			questionDiv.className = 'question';

			const title = document.createElement('h3');
			title.textContent = `${number}. Fill in the blank(s).`;
			questionDiv.appendChild(title);

			if (q.image_path) {
				const image = document.createElement('img');
				image.src = q.image_path;
				image.className = 'question-illustration';
				questionDiv.appendChild(image);
			}

			const prompt = document.createElement('div');
			prompt.className = 'question-prompt fill-blank-prompt';

			const marker = '___BLANK___';
			const html = q.prompt.replace(/___/g, marker);

			prompt.innerHTML = html;

			const walker = document.createTreeWalker(
				prompt,
				NodeFilter.SHOW_TEXT
			);

			const textNodes = [];
			let node;

			while (node = walker.nextNode()) {
				if (node.nodeValue.includes(marker)) {
					textNodes.push(node);
				}
			}

			let blankIndex = 0;

			textNodes.forEach(textNode => {
				const parts = textNode.nodeValue.split(marker);
				const fragment = document.createDocumentFragment();

				parts.forEach((part, index) => {
					if (part) {
						fragment.appendChild(document.createTextNode(part));
					}

					if (index < parts.length - 1) {
						const input = document.createElement('input');

						input.type = 'text';
						input.id = `q_${q.id}_${blankIndex}`;
						input.className = 'inline-blank';
						input.autocomplete = 'off';

						fragment.appendChild(input);

						blankIndex++;
					}
				});

				textNode.parentNode.replaceChild(fragment, textNode);
			});

			questionDiv.appendChild(prompt);

			return questionDiv.outerHTML;
		}

        case 'drag_drop': {
            const zones = q.options?.zones || {};
            const items = shuffleArray(q.options?.items || []);

            const itemBank = items.map((item, index) => `
                <div
                    class="drag-item"
                    draggable="true"
                    data-question-id="${q.id}"
                    data-item-index="${index}"
                    data-item="${escapeHtml(item)}"
                    ondragstart="dragDropStart(event)"
                >
                    ${item}
                </div>
            `).join('');

            const zoneHtml = Object.entries(zones).map(([zoneId, label]) => `
                <div
                    class="drag-zone"
                    data-question-id="${q.id}"
                    data-zone-id="${escapeHtml(zoneId)}"
                    ondragover="dragDropOver(event)"
                    ondragleave="dragDropLeave(event)"
                    ondrop="dragDropDrop(event)"
                >
                    <div class="drag-zone-title">${label}</div>
                    <div class="drag-zone-items"></div>
                </div>
            `).join('');

            return `
                <div class="question">
                    ${header}

                    <p class="hint">
                        Drag each item into the correct category.
                    </p>

                    <div class="drag-drop-container">

                        <div
                            class="drag-item-bank"
                            data-question-id="${q.id}"
                            ondragover="dragDropOver(event)"
                            ondragleave="dragDropLeave(event)"
                            ondrop="dragDropDropToBank(event)"
                        >

                            <div class="drag-bank-title">Items</div>

                            <div class="drag-bank-items">
                                ${itemBank}
                            </div>

                        </div>

                        <div class="drag-zones">
                            ${zoneHtml}
                        </div>

                    </div>
                </div>
            `;
        }

        case 'hotspot':
        case 'hotspot_multi': {
            const numClicks = q.question_type === 'hotspot_multi' ? 2 : 1;

            return `
                <div class="question">
                    ${header}
                    <p class="hint">Click ${numClicks > 1 ? `${numClicks} spots` : 'the correct spot'} on the image.</p>
                    <div class="hotspot-wrap" id="q_${q.id}_wrap">
                        <img src="${escapeHtml(q.options.image)}" class="hotspot-image"
                             id="q_${q.id}_img"
                             onclick="registerHotspotClick(${q.id}, ${numClicks}, event)">
                    </div>
                    <input type="hidden" id="q_${q.id}_clicks" value="[]">
                </div>
            `;
        }

        default:
            return `<div class="question">${header}<p>Unsupported question type.</p></div>`;
    }
}

function registerHotspotClick(questionId, numClicks, event) {
    const img = event.target;
    const hidden = document.getElementById(`q_${questionId}_clicks`);
    const wrap = document.getElementById(`q_${questionId}_wrap`);
    let clicks = JSON.parse(hidden.value);

    if (clicks.length >= numClicks) {
        clicks = [];
        wrap.querySelectorAll('.hotspot-marker').forEach(el => el.remove());
    }

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const x = Math.round(event.offsetX * scaleX);
    const y = Math.round(event.offsetY * scaleY);

    clicks.push({ x, y });
    hidden.value = JSON.stringify(clicks);

    const marker = document.createElement('div');
    marker.className = 'hotspot-marker';
    marker.style.left = `${event.offsetX - 8}px`;
    marker.style.top = `${event.offsetY - 8}px`;
    wrap.appendChild(marker);
}

function collectAnswer(q) {
    switch (q.question_type) {

        case 'single_choice': {
            const checked = document.querySelector(`input[name="q_${q.id}"]:checked`);
            return checked ? checked.value : null;
        }

        case 'multiple_choice': {
            const checked = document.querySelectorAll(`input[name="q_${q.id}"]:checked`);
            return Array.from(checked).map(el => el.value);
        }

		case 'fill_blank_ordered':
		case 'fill_blank_unordered':
		case 'fill_blank_alternatives': {
			const blankCount = q.blank_count;
			return Array.from({ length: blankCount }, (_, i) =>
				document.getElementById(`q_${q.id}_${i}`).value.trim()
			);
		}

		case 'drag_drop': {
			const result = {};

			const zones = document.querySelectorAll(
				`.drag-zone[data-question-id="${q.id}"]`
			);

			zones.forEach(zone => {
				const zoneId = zone.dataset.zoneId;
				const items = zone.querySelectorAll('.drag-item');

				result[zoneId] = Array.from(items).map(item =>
					item.dataset.item
				);
			});

			return result;
		}

        case 'hotspot':
        case 'hotspot_multi': {
            const hidden = document.getElementById(`q_${q.id}_clicks`);
            return JSON.parse(hidden.value);
        }

        default:
            return null;
    }
}

async function submitLevelTest(event) {
    event.preventDefault();

    const answers = {};

    LevelTestState.questions.forEach(q => {
        answers[q.id] = collectAnswer(q);
    });

    const result = await api('level_test.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'submit_level',
            name: LevelTestState.name,
            email: LevelTestState.email,
            level: LevelTestState.level,
            answers
        })
    });

    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }

    renderLevelTestResult(result);
}

function renderLevelTestResult(result) {
    const pct = Math.round((result.score / result.max_score) * 100);

    let body;
    if (result.next_level) {
        body = `
            <p>You passed Level ${result.level} (${result.score}/${result.max_score}, ${pct}%).</p>
            <button onclick="loadLevelTestLevel(${result.next_level})">Continue to Level ${result.next_level}</button>
        `;
    } else if (result.passed) {
        body = `
            <p>You passed Level ${result.level} (${result.score}/${result.max_score}, ${pct}%) — that's the
            highest level of this test. Nice work!</p>
            <p>Thanks, ${escapeHtml(LevelTestState.name)} — we'll be in touch at ${escapeHtml(LevelTestState.email)}
            about the class that fits you best. In the meantime you can also check out our
            <a href="${LMS_URL}" target="_blank" rel="noopener">student portal</a>.</p>
        `;
    } else {
        body = `
            <p>Your result for Level ${result.level}: ${result.score}/${result.max_score} (${pct}%).</p>
            <p>Thanks, ${escapeHtml(LevelTestState.name)} — this places you around Level ${result.level}.
            We'll reach out at ${escapeHtml(LevelTestState.email)} with class options.</p>
        `;
    }

    app.innerHTML = `
        ${renderNav('level test')}
        <div class="column">
            <h1>Level Test Result</h1>
            ${body}
        </div>
    `;
}

function formatScoringValue(value) {
    if (value === null || value === undefined) {
        return '(no answer)';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}
//#endregion

//#region ADMIN — question editor (api/admin/*.php)
const AdminState = {
    questions: [],
    regions: [],
    editingId: null
};

async function loadAdminEntry() {
    const session = await api('admin/session.php');
    if (session.logged_in) {
        loadAdminDashboard();
    } else {
        loadAdminLogin();
    }
}

function loadAdminLogin() {
    app.innerHTML = `
        <div class="column">
            <h1>Admin Login</h1>
            <form class="narrow-form" onsubmit="submitAdminLogin(event)">
                <label>Username:</label><br>
                <input type="text" id="admin_username" required><br><br>
                <label>Password:</label><br>
                <input type="password" id="admin_password" required><br><br>
                <button type="submit">Log In</button>
            </form>
        </div>
    `;
}

async function submitAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('admin_username').value.trim();
    const password = document.getElementById('admin_password').value;

    const result = await api('admin/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }
    loadAdminDashboard();
}

async function logoutAdmin() {
    await api('admin/logout.php', { method: 'POST' });
    window.close();
}

function adminTabBar(active) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="menu-bar" style="background:transparent; padding:0;">
                <button class="${active === 'questions' ? 'active' : ''}" onclick="loadAdminDashboard()">Questions</button>
                <button class="${active === 'results' ? 'active' : ''}" onclick="loadAdminResults()">Results</button>
            </div>
            <button onclick="logoutAdmin()">Log Out</button>
        </div>
    `;
}

async function loadAdminDashboard() {
    const result = await api('questions.php?action=list');
    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }
    AdminState.questions = result.questions;

    const byLevel = {};
    result.questions.forEach(q => {
        (byLevel[q.level] ||= []).push(q);
    });

    const levelBlocks = Object.keys(byLevel).sort().map(level => `
        <h3>Level ${level}</h3>
        <table>
            <thead><tr><th>#</th><th>Type</th><th>Prompt</th><th>Points</th><th>Actions</th></tr></thead>
            <tbody>
                ${byLevel[level].map(q => `
                    <tr>
                        <td>${q.sort_order}</td>
                        <td>${escapeHtml(q.question_type)}</td>
                        <td style="text-align:left; max-width:400px;">${escapeHtml(q.prompt).slice(0, 80)}${q.prompt.length > 80 ? '…' : ''}</td>
                        <td>${q.points}</td>
                        <td>
                            <button onclick="openQuestionEditor(${q.id})">Edit</button>
                            <button onclick="deleteQuestionConfirm(${q.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `).join('');

    app.innerHTML = `
        <div class="column">
            ${adminTabBar('questions')}
            <h1>Level Test — Question Editor</h1>
            <button onclick="openQuestionEditor(null)">+ Add Question</button>
            ${levelBlocks}
        </div>
    `;
}

async function loadAdminResults(filters = {}) {
    const params = new URLSearchParams({ action: 'list', ...filters }).toString();
    const result = await api(`results.php?${params}`);
    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }

    const rows = result.results.map(a => `
        <tr>
            <td>${escapeHtml(a.name)}</td>
            <td>${escapeHtml(a.email)}</td>
            <td>${a.level}</td>
            <td>${a.score}/${a.max_score}</td>
            <td>${a.passed ? '✅ Passed' : '❌ Failed'}</td>
            <td>${new Date(a.created_at).toLocaleString()}</td>
            <td>
                <button onclick="viewAttemptDetail(${a.id})">View</button>
                <button onclick="deleteAttemptConfirm(${a.id})">Delete</button>
            </td>
        </tr>
    `).join('');

    app.innerHTML = `
        <div class="column">
            ${adminTabBar('results')}
            <h1>Level Test Results</h1>
            <form onsubmit="submitResultsFilter(event)" style="display:flex; gap:8px; align-items:end; max-width:none;">
                <div>
                    <label>Level:</label><br>
                    <select id="rf_level">
                        <option value="">All</option>
                        ${[1,2,3,4,5].map(l => `<option value="${l}" ${filters.level == l ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Status:</label><br>
                    <select id="rf_passed">
                        <option value="">All</option>
                        <option value="1" ${filters.passed === '1' ? 'selected' : ''}>Passed</option>
                        <option value="0" ${filters.passed === '0' ? 'selected' : ''}>Failed</option>
                    </select>
                </div>
                <div>
                    <label>Search name/email:</label><br>
                    <input type="text" id="rf_search" value="${escapeHtml(filters.search || '')}">
                </div>
                <button type="submit">Filter</button>
            </form>
            <table>
                <thead><tr><th>Name</th><th>Email</th><th>Level</th><th>Score</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="7">No attempts yet.</td></tr>'}</tbody>
            </table>
            <div id="attemptDetailArea"></div>
        </div>
    `;
}

function submitResultsFilter(event) {
    event.preventDefault();
    loadAdminResults({
        level: document.getElementById('rf_level').value,
        passed: document.getElementById('rf_passed').value,
        search: document.getElementById('rf_search').value.trim()
    });
}

async function viewAttemptDetail(id) {
    const result = await api('results.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id })
    });
    if (!result.success) { showToast(result.message, 'error'); return; }

    const a = result.attempt;
    const rows = a.question_breakdown.map(q => `
        <tr>
            <td>${q.sort_order}</td>
            <td>${escapeHtml(q.question_type)}</td>
            <td style="text-align:left;">${escapeHtml(q.prompt).slice(0, 60)}</td>
            <td style="text-align:left;"><pre>${escapeHtml(JSON.stringify(q.your_answer))}</pre></td>
            <td style="text-align:left;"><pre>${escapeHtml(JSON.stringify(q.correct_answer))}</pre></td>
        </tr>
    `).join('');

    document.getElementById('attemptDetailArea').innerHTML = `
        <div class="column" style="border:2px solid navy;">
            <h2>${escapeHtml(a.name)} — Level ${a.level} (${a.score}/${a.max_score})</h2>
            <p>${escapeHtml(a.email)} — ${new Date(a.created_at).toLocaleString()}</p>
            <table>
                <thead><tr><th>#</th><th>Type</th><th>Prompt</th><th>Their Answer</th><th>Correct Answer</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <button onclick="document.getElementById('attemptDetailArea').innerHTML=''">Close</button>
        </div>
    `;
}

async function deleteAttemptConfirm(id) {
    if (!confirm('Are you sure you want to delete this result?')) {
        return;
    }

    const result = await api(`results.php?action=delete&id=${id}`);

    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }

    showToast('Result deleted successfully.');

    loadAdminResults();
}

async function deleteQuestionConfirm(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    const result = await api('questions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
    });
    if (!result.success) { showToast(result.message, 'error'); return; }
    loadAdminDashboard();
}

function closeQuestionEditor() {
    document.getElementById('questionEditorOverlay')?.remove();
}

async function openQuestionEditor(id) {
    AdminState.editingId = id;
    AdminState.regions = [];

    let q = {
        level: 1, sort_order: 1, question_type: 'single_choice',
        prompt: '', points: 1, options: null, correct_answer: null
    };

    if (id) {
        const result = await api('questions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', id })
        });
        if (!result.success) { showToast(result.message, 'error'); return; }
        q = result.question;
    }

    const overlay = document.createElement('div');
    overlay.className = 'image-picker-overlay';
    overlay.id = 'questionEditorOverlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeQuestionEditor(); };

    overlay.innerHTML = `
        <div class="image-picker-panel" style="max-width:800px; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2>${id ? 'Edit' : 'New'} Question</h2>
                <button type="button" onclick="closeQuestionEditor()">Close</button>
            </div>
            <form onsubmit="saveQuestionFromForm(event)">
                <label>Level:</label><br>
                <input type="number" id="ed_level" min="1" max="5" value="${q.level}" required><br><br>

                <label>Sort Order:</label><br>
                <input type="number" id="ed_sort_order" value="${q.sort_order}" required><br><br>

                <label>Points:</label><br>
                <input type="number" id="ed_points" value="${q.points}" required><br><br>

                <label>Question Type:</label><br>
                <select id="ed_type" onchange="renderTypeFields()">
                    ${['single_choice', 'multiple_choice', 'fill_blank_ordered', 'fill_blank_unordered', 'fill_blank_alternatives', 'drag_drop', 'hotspot', 'hotspot_multi']
                        .map(t => `<option value="${t}" ${q.question_type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select><br><br>

                <label>Prompt (use ___ for each blank if it's a fill-blank type):</label><br>
                <textarea id="ed_prompt" rows="3" style="width:100%;" required>${escapeHtml(q.prompt)}</textarea><br><br>

                <label>Illustration Image (optional — shown above the question for any type):</label><br>
                <div style="display:flex; gap:6px; align-items:center;">
                    <input type="text" id="ed_image_path" value="${escapeHtml(q.image_path || '')}" style="flex:1;">
                    <button type="button" onclick="openImagePicker('ed_image_path')">Browse…</button>
                    <button type="button" onclick="document.getElementById('ed_image_path').value=''">Clear</button>
                </div><br>

                <div id="typeFieldsArea"></div>

                <button type="submit">Save</button>
                <button type="button" onclick="closeQuestionEditor()">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);

    AdminState.loadedQuestion = q;
    renderTypeFields();
}

function renderTypeFields() {
    const type = document.getElementById('ed_type').value;
    const q = AdminState.loadedQuestion && AdminState.loadedQuestion.question_type === type
        ? AdminState.loadedQuestion
        : { options: null, correct_answer: null };
    const area = document.getElementById('typeFieldsArea');

    switch (type) {

        case 'single_choice':
        case 'multiple_choice': {
            const options = q.options || [{ text: '', value: 'A' }];
            const correctSet = new Set(type === 'single_choice'
                ? [q.correct_answer].filter(Boolean)
                : (q.correct_answer || []));

            area.innerHTML = `
                <label>Options (check the correct one${type === 'multiple_choice' ? 's' : ''}):</label>
                <div id="choiceRows">
                    ${options.map((opt, i) => choiceRowHtml(opt, i, correctSet.has(opt.value), type)).join('')}
                </div>
                <button type="button" onclick="addChoiceRow('${type}')">+ Add Option</button>
            `;
            break;
        }

        case 'fill_blank_ordered':
        case 'fill_blank_unordered': {
            const words = q.correct_answer || [''];
            area.innerHTML = `
                <label>Accepted answer(s), one per blank${type === 'fill_blank_unordered' ? ' (any order)' : ' (in order)'}:</label>
                <div id="blankRows">
                    ${words.map((w, i) => blankRowHtml(w, i)).join('')}
                </div>
                <button type="button" onclick="addBlankRow()">+ Add Blank</button>
            `;
            break;
        }

        case 'fill_blank_alternatives': {
            const alternatives = q.correct_answer && q.correct_answer.length ? q.correct_answer : [['']];
            area.innerHTML = `
                <label>Acceptable answer combinations — each row below is one full accepted combo:</label>
                <div id="altGroups">
                    ${alternatives.map((alt, i) => altGroupHtml(alt, i)).join('')}
                </div>
                <button type="button" onclick="addAltGroup()">+ Add Alternative Combo</button>
            `;
            break;
        }

        case 'drag_drop': {
            const zones = q.options && q.options.zones ? q.options.zones : { droppable1: 'Zone 1' };
            const correct = q.correct_answer || {};
            area.innerHTML = `
                <label>Zones (drag targets) and their correct items:</label>
                <div id="zoneRows">
                    ${Object.entries(zones).map(([zid, label], i) =>
                        zoneRowHtml(zid, label, (correct[zid] || []).join(', '), i)
                    ).join('')}
                </div>
                <button type="button" onclick="addZoneRow()">+ Add Zone</button>
                <p class="hint">List each zone's correct items as comma-separated words. The full draggable item bank is built automatically from all zones combined.</p>
            `;
            break;
        }

        case 'hotspot':
        case 'hotspot_multi': {
            const image = q.options && q.options.image ? q.options.image : 'assets/images/level_test/1.png';
            AdminState.regions = q.correct_answer
                ? (type === 'hotspot' ? [q.correct_answer] : q.correct_answer)
                : [];
            const maxRegions = type === 'hotspot' ? 1 : 2;

            area.innerHTML = `
                <label>Image:</label><br>
                <div style="display:flex; gap:6px; align-items:center;">
                    <input type="text" id="ed_image" value="${escapeHtml(image)}" onchange="reloadRegionEditorImage()" style="flex:1;">
                    <button type="button" onclick="openImagePicker()">Browse…</button>
                </div><br>
                <p class="hint">Click and drag on the image to draw ${maxRegions > 1 ? `up to ${maxRegions} regions` : 'the region'}. Click a drawn region's × to remove it.</p>
                <div class="hotspot-wrap" id="regionEditorWrap">
                    <img src="${escapeHtml(image)}" id="regionEditorImg" class="hotspot-image">
                </div>
                <input type="hidden" id="ed_max_regions" value="${maxRegions}">
            `;
            requestAnimationFrame(() => initRegionEditor());
            break;
        }

        default:
            area.innerHTML = '';
    }
}

function choiceRowHtml(opt, i, isCorrect, type) {
    const inputType = type === 'single_choice' ? 'radio' : 'checkbox';
    return `
        <div style="margin:4px 0;" id="choiceRow_${i}">
            <input type="${inputType}" name="ed_correct" value="${i}" ${isCorrect ? 'checked' : ''}>
            <input type="text" placeholder="Value (A, B, ...)" value="${escapeHtml(opt.value || '')}" style="width:60px;" class="choice-value">
            <input type="text" placeholder="Option text" value="${escapeHtml(opt.text || '')}" style="width:300px;" class="choice-text">
            <button type="button" onclick="document.getElementById('choiceRow_${i}').remove()">×</button>
        </div>
    `;
}

function addChoiceRow(type) {
    const rows = document.getElementById('choiceRows');
    const i = rows.children.length;
    rows.insertAdjacentHTML('beforeend', choiceRowHtml({ text: '', value: '' }, i, false, type));
}

function blankRowHtml(word, i) {
    return `
        <div style="margin:4px 0;" id="blankRow_${i}">
            <input type="text" value="${escapeHtml(word)}" class="blank-word" placeholder="Answer ${i + 1}">
            <button type="button" onclick="document.getElementById('blankRow_${i}').remove()">×</button>
        </div>
    `;
}

function addBlankRow() {
    const rows = document.getElementById('blankRows');
    const i = rows.children.length;
    rows.insertAdjacentHTML('beforeend', blankRowHtml('', i));
}

function altGroupHtml(words, i) {
    return `
        <div style="margin:8px 0; padding:8px; border:1px solid #ccc;" id="altGroup_${i}">
            <div class="alt-words" id="altWords_${i}">
                ${words.map((w, j) => `
                    <input type="text" value="${escapeHtml(w)}" class="alt-word" placeholder="Word ${j + 1}" style="margin:2px;">
                `).join('')}
            </div>
            <button type="button" onclick="addAltWord(${i})">+ Word</button>
            <button type="button" onclick="document.getElementById('altGroup_${i}').remove()">Remove Combo</button>
        </div>
    `;
}

function addAltGroup() {
    const groups = document.getElementById('altGroups');
    const i = groups.children.length;
    groups.insertAdjacentHTML('beforeend', altGroupHtml([''], i));
}

function addAltWord(groupIndex) {
    const words = document.getElementById(`altWords_${groupIndex}`);
    words.insertAdjacentHTML('beforeend', `<input type="text" value="" class="alt-word" placeholder="Word" style="margin:2px;">`);
}

function zoneRowHtml(zoneId, label, itemsCsv, i) {
    return `
        <div style="margin:4px 0;" id="zoneRow_${i}">
            <input type="text" value="${escapeHtml(zoneId)}" placeholder="zone id" style="width:100px;" class="zone-id">
            <input type="text" value="${escapeHtml(label)}" placeholder="Zone label" style="width:150px;" class="zone-label">
            <input type="text" value="${escapeHtml(itemsCsv)}" placeholder="item1, item2, ..." style="width:300px;" class="zone-items">
            <button type="button" onclick="document.getElementById('zoneRow_${i}').remove()">×</button>
        </div>
    `;
}

function addZoneRow() {
    const rows = document.getElementById('zoneRows');
    const i = rows.children.length;
    rows.insertAdjacentHTML('beforeend', zoneRowHtml('', '', '', i));
}

async function openImagePicker(targetInputId = 'ed_image') {
    const result = await api('list_images.php');
    if (!result.success) { showToast(result.message, 'error'); return; }

    AdminState.pickerTarget = targetInputId;

    const overlay = document.createElement('div');
    overlay.className = 'image-picker-overlay';
    overlay.id = 'imagePickerOverlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="image-picker-panel">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>Select an Image</h3>
                <button type="button" onclick="document.getElementById('imagePickerOverlay').remove()">Close</button>
            </div>
            <div class="image-picker-grid">
                ${result.images.map(path => `
                    <div class="image-picker-thumb" onclick="selectPickedImage('${path.replace(/'/g, "\\'")}')">
                        <img src="${escapeHtml(path)}" loading="lazy">
                        <span>${escapeHtml(path.split('/').pop())}</span>
                    </div>
                `).join('') || '<p>No images found in assets/images/.</p>'}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function selectPickedImage(path) {
    const targetId = AdminState.pickerTarget || 'ed_image';
    document.getElementById(targetId).value = path;
    if (targetId === 'ed_image') {
        reloadRegionEditorImage();
    }
    document.getElementById('imagePickerOverlay')?.remove();
}

function reloadRegionEditorImage() {
    const path = document.getElementById('ed_image').value.trim();
    document.getElementById('regionEditorImg').src = path;
}

function initRegionEditor() {
    const img = document.getElementById('regionEditorImg');
    const wrap = document.getElementById('regionEditorWrap');
    if (!img || !wrap) return;

    renderRegionOverlays();

    let drawing = false;
    let startX, startY;
    let previewEl = null;

    img.onmousedown = (event) => {
        const maxRegions = parseInt(document.getElementById('ed_max_regions').value, 10);
        if (AdminState.regions.length >= maxRegions) {
            showToast(`Max ${maxRegions} region(s) — remove one first`, 'error');
            return;
        }
        drawing = true;
        startX = event.offsetX;
        startY = event.offsetY;
        previewEl = document.createElement('div');
        previewEl.className = 'region-box region-preview';
        wrap.appendChild(previewEl);
    };

    img.onmousemove = (event) => {
        if (!drawing) return;
        const x = Math.min(startX, event.offsetX);
        const y = Math.min(startY, event.offsetY);
        const w = Math.abs(event.offsetX - startX);
        const h = Math.abs(event.offsetY - startY);
        previewEl.style.left = `${x}px`;
        previewEl.style.top = `${y}px`;
        previewEl.style.width = `${w}px`;
        previewEl.style.height = `${h}px`;
    };

    img.onmouseup = (event) => {
        if (!drawing) return;
        drawing = false;

        const scaleX = img.naturalWidth / img.clientWidth;
        const scaleY = img.naturalHeight / img.clientHeight;
        const x1 = Math.min(startX, event.offsetX);
        const y1 = Math.min(startY, event.offsetY);
        const x2 = Math.max(startX, event.offsetX);
        const y2 = Math.max(startY, event.offsetY);

        if (previewEl) previewEl.remove();

        const region = {
            x: Math.round(x1 * scaleX),
            y: Math.round(y1 * scaleY),
            width: Math.round((x2 - x1) * scaleX),
            height: Math.round((y2 - y1) * scaleY)
        };

        if (region.width < 3 || region.height < 3) return;

        AdminState.regions.push(region);
        renderRegionOverlays();
    };
}

function renderRegionOverlays() {
    const img = document.getElementById('regionEditorImg');
    const wrap = document.getElementById('regionEditorWrap');
    if (!img || !wrap) return;

    wrap.querySelectorAll('.region-box:not(.region-preview)').forEach(el => el.remove());

    const draw = () => {
        const scaleX = img.clientWidth / img.naturalWidth;
        const scaleY = img.clientHeight / img.naturalHeight;

        AdminState.regions.forEach((r, i) => {
            const box = document.createElement('div');
            box.className = 'region-box';
            box.style.left = `${r.x * scaleX}px`;
            box.style.top = `${r.y * scaleY}px`;
            box.style.width = `${r.width * scaleX}px`;
            box.style.height = `${r.height * scaleY}px`;
            box.innerHTML = `<span class="region-remove" onclick="removeRegion(${i})">×</span>`;
            wrap.appendChild(box);
        });
    };

    if (img.complete && img.naturalWidth) {
        draw();
    } else {
        img.onload = draw;
    }
}

function removeRegion(i) {
    AdminState.regions.splice(i, 1);
    renderRegionOverlays();
}

function dragDropStart(event) {
    const item = event.currentTarget;

    event.dataTransfer.setData('text/plain', JSON.stringify({
        questionId: item.dataset.questionId,
        itemIndex: item.dataset.itemIndex
    }));

    event.dataTransfer.effectAllowed = 'move';

    item.classList.add('dragging');
}

function dragDropOver(event) {
    event.preventDefault();

    event.dataTransfer.dropEffect = 'move';

    const zone = event.currentTarget;
    zone.classList.add('drag-over');
}

function dragDropDrop(event) {
    event.preventDefault();

    const zone = event.currentTarget;
    zone.classList.remove('drag-over');

    const data = event.dataTransfer.getData('text/plain');

    if (!data) return;

    let dragData;

    try {
        dragData = JSON.parse(data);
    } catch {
        return;
    }

    const questionId = dragData.questionId;
    const itemIndex = dragData.itemIndex;

    if (!questionId || itemIndex === undefined) return;

    const item = document.querySelector(
        `.drag-item[data-question-id="${questionId}"][data-item-index="${itemIndex}"]`
    );

    if (!item) return;

    const zoneItems = zone.querySelector('.drag-zone-items');

    zoneItems.appendChild(item);

    item.classList.remove('dragging');
}

function dragDropDropToBank(event) {
    event.preventDefault();

    const bank = event.currentTarget;

    const data = event.dataTransfer.getData('text/plain');

    if (!data) return;

    let dragData;

    try {
        dragData = JSON.parse(data);
    } catch {
        return;
    }

    const questionId = dragData.questionId;
    const itemIndex = dragData.itemIndex;

    if (!questionId || itemIndex === undefined) return;

    const item = document.querySelector(
        `.drag-item[data-question-id="${questionId}"][data-item-index="${itemIndex}"]`
    );

    if (!item) return;

    const bankItems = bank.querySelector('.drag-bank-items');

    bankItems.appendChild(item);

    item.classList.remove('dragging');
}

function dragDropLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

async function saveQuestionFromForm(event) {
    event.preventDefault();

    const type = document.getElementById('ed_type').value;
    let options = null;
    let correctAnswer = null;

    if (type === 'single_choice' || type === 'multiple_choice') {
        const rows = Array.from(document.getElementById('choiceRows').children);
        options = rows.map(row => ({
            value: row.querySelector('.choice-value').value.trim(),
            text: row.querySelector('.choice-text').value.trim()
        }));
        const checked = Array.from(document.querySelectorAll('input[name="ed_correct"]:checked'))
            .map(el => options[parseInt(el.value, 10)].value);
        correctAnswer = type === 'single_choice' ? (checked[0] || null) : checked;
    }

    if (type === 'fill_blank_ordered' || type === 'fill_blank_unordered') {
        const rows = Array.from(document.querySelectorAll('#blankRows .blank-word'));
        correctAnswer = rows.map(el => el.value.trim()).filter(v => v !== '');
    }

    if (type === 'fill_blank_alternatives') {
        const groups = Array.from(document.querySelectorAll('#altGroups > div'));
        correctAnswer = groups.map(group =>
            Array.from(group.querySelectorAll('.alt-word')).map(el => el.value.trim()).filter(v => v !== '')
        ).filter(alt => alt.length > 0);
    }

    if (type === 'drag_drop') {
        const rows = Array.from(document.getElementById('zoneRows').children);
        const zones = {};
        const correct = {};
        const items = [];
        rows.forEach(row => {
            const zid = row.querySelector('.zone-id').value.trim();
            const label = row.querySelector('.zone-label').value.trim();
            const zoneItems = row.querySelector('.zone-items').value.split(',').map(s => s.trim()).filter(Boolean);
            if (!zid) return;
            zones[zid] = label;
            correct[zid] = zoneItems;
            items.push(...zoneItems);
        });
        options = { zones, items };
        correctAnswer = correct;
    }

    if (type === 'hotspot' || type === 'hotspot_multi') {
        const image = document.getElementById('ed_image').value.trim();
        options = { image };
        correctAnswer = type === 'hotspot' ? (AdminState.regions[0] || null) : AdminState.regions;
        if (!correctAnswer || (Array.isArray(correctAnswer) && correctAnswer.length === 0)) {
            showToast('Draw at least one region on the image first', 'error');
            return;
        }
    }

    const payload = {
        action: AdminState.editingId ? 'update' : 'create',
        id: AdminState.editingId,
        level: parseInt(document.getElementById('ed_level').value, 10),
        sort_order: parseInt(document.getElementById('ed_sort_order').value, 10),
        question_type: type,
        prompt: document.getElementById('ed_prompt').value,
        image_path: document.getElementById('ed_image_path').value.trim() || null,
        points: parseInt(document.getElementById('ed_points').value, 10),
        options,
        correct_answer: correctAnswer
    };

    const result = await api('questions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!result.success) { showToast(result.message, 'error'); return; }
    showToast(result.message);
    closeQuestionEditor();
    loadAdminDashboard();
}
//#endregion

document.addEventListener('DOMContentLoaded', init);