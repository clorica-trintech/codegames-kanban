(function (global) {
    const searcher = {
        match(rawPattern, corpus, prefix = '', postfix = '') {
            const result = [];
            const { length } = corpus;
            const pattern = rawPattern.toLocaleLowerCase();
            let totalScore = 0;
            let currentScore = 0;
            let character;
            let patternIdx = 0;
            for (let i = 0; i < length; i++) {
                character = corpus[i];
                if (corpus[i].toLocaleLowerCase() === pattern[patternIdx]) {
                    // If this is a non-consequtive match ignore non-word boundaries
                    const isConsecutiveOrWordBoundary = 
                    // Consequtive
                    currentScore !== 0 ||
                        // Word boundary
                        i === 0 ||
                        // Word boundary
                        corpus[i - 1].match(/\s/);
                    if (isConsecutiveOrWordBoundary) {
                        character = prefix + character + postfix;
                        currentScore += 1 + currentScore;
                        patternIdx += 1;
                    }
                }
                else {
                    currentScore = 0;
                }
                totalScore += currentScore;
                if (totalScore >= Number.MAX_SAFE_INTEGER) {
                    throw new Error('Score Exceeded Safe Values, Corpus Too Big');
                }
                result.push(character);
            }
            if (patternIdx === pattern.length) {
                // On exact match set score to max value
                totalScore = corpus === pattern ? Number.MAX_SAFE_INTEGER : totalScore;
                return {
                    value: result.join(''),
                    score: totalScore
                };
            }
            return {
                value: corpus,
                score: 0
            };
        },
        score(pattern, tuples, prefix = '', postfix = '') {
            return tuples
                .reduce((acc, tuple) => {
                const [corpus] = tuple;
                const result = searcher.match(pattern, corpus, prefix, postfix);
                acc.push({
                    value: result.value,
                    score: result.score,
                    tuple,
                });
                return acc;
            }, [])
                .sort((a, b) => {
                const result = b.score - a.score;
                return result ? result : b.value.localeCompare(a.value);
            });
        }
    };
    global.searcher = searcher;
}(this));
;
;
(function (global) {
    const make = document.createElement.bind(document);
    function pick(source, ...keys) {
        const picked = {};
        for (const key of keys) {
            picked[key] = source[key];
        }
        return picked;
    }
    function debounce(toDebounce, delayMs) {
        let timeout;
        return function (...args) {
            const callback = () => {
                timeout = null;
                return toDebounce.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(callback, delayMs);
        };
    }
    function once(toDoOnce) {
        const doNothing = () => { };
        let toDo = toDoOnce;
        return function (...args) {
            const toReturn = toDo.apply(this, args);
            toDo = doNothing;
            return toReturn;
        };
    }
    const workFlowTags = new Set([
        'To Do',
        'In Progress',
        'Done'
    ]);
    const searchableFields = new Set([
        'id',
        'assignee',
        'name',
        'actionPlan',
        'action',
        'status',
        'entity',
        'priority',
        'toDoRole',
        'inProgressStatus',
        'doneStatus',
        'canReopen'
    ]);
    function makeCardRows(fields, isSummary) {
        const rows = [];
        const keys = Object.keys(fields);
        for (const key of keys) {
            const value = fields[key];
            const row = make('div');
            row.classList.add('row');
            if (isSummary) {
                row.classList.add('summary');
            }
            const label = make('span');
            label.classList.add('label');
            label.textContent = getFieldDisplayName(key);
            const rowVal = make('span');
            rowVal.classList.add('row-value');
            rowVal.textContent = value;
            row.appendChild(label);
            row.appendChild(rowVal);
            rows.push(row);
        }
        return rows;
    }
    //Ok this is real stupid, but I needed something fast
    function getFieldDisplayName(key) {
        switch (key) {
            case "id": return "ID";
            case "owner": return "Owner";
            case "assignee": return "Assignee";
            case "workFlowTag": return "WorkFlowT ag";
            case "name": return "Name";
            case "actionPlan": return "Action Plan";
            case "action": return "Action";
            case "startDate": return "Start Date";
            case "dueDate": return "Due Date";
            case "status": return "Status";
            case "entity": return "Entity";
            case "closePeriod": return "Close Period";
            case "priority": return "Priority";
            case "toDoRole": return "To Do Role";
            case "inProgressStatus": return "In Progress Status";
            case "doneStatus": return "Done Status";
            case "canReopen": return "Can Re-open";
        }
        return "";
    }
    const searchableText = new Map();
    function makeTitleBar(root, searcher) {
        const titleBar = make('div');
        titleBar.classList.add('kanban-titlebar');
        const title = make('span');
        title.classList.add('title');
        title.textContent = 'Kanban Board';
        titleBar.appendChild(title);
        const search = make('span');
        search.classList.add('search');
        titleBar.appendChild(search);
        const select = make('select');
        search.appendChild(select);
        const defaultOption = make('option');
        defaultOption.setAttribute('selected', 'selected');
        defaultOption.setAttribute('disabled', 'disabled');
        defaultOption.textContent = 'Search by Field';
        select.appendChild(defaultOption);
        for (const searchableField of searchableFields) {
            const option = make('option');
            option.value = searchableField;
            option.textContent = searchableField;
            select.appendChild(option);
        }
        const caret = make('div');
        caret.classList.add('caret');
        search.appendChild(caret);
        const caretFa = make('i');
        caretFa.classList.add('fa', 'fa-caret-down');
        caretFa.setAttribute('aria-hidden', 'true');
        caret.appendChild(caretFa);
        const input = make('input');
        input.setAttribute('type', 'text');
        input.disabled = true;
        search.appendChild(input);
        select.onchange = once(() => input.disabled = false);
        const typeAhead = make('ul');
        typeAhead.classList.add('type-ahead', 'hidden');
        search.appendChild(typeAhead);
        input.addEventListener('input', debounce(() => {
            const searchTerm = input.value;
            typeAhead.innerHTML = '';
            if (!searchTerm) {
                const cards = root.querySelectorAll('.card');
                cards.forEach((card) => card.classList.remove('hidden'));
                return;
            }
            const selectedOption = select.selectedOptions[0];
            const issueField = selectedOption.value;
            if (issueField === 'Search by Field') {
                return;
            }
            const searchTuples = searchableText.get(issueField);
            const results = searcher.score(searchTerm, searchTuples, '<strong>', '</strong>');
            let count = 0;
            if (results.length) {
                typeAhead.classList.remove('hidden');
            }
            else {
                typeAhead.classList.add('hidden');
            }
            for (const result of results) {
                const card = result.tuple[1];
                // For exact match only `result.score === Number.MAX_SAFE_INTEGER`
                if (result.score !== 0) {
                    count++;
                    if (count < 10) {
                        const li = make('li');
                        li.innerHTML = result.value;
                        typeAhead.appendChild(li);
                    }
                    card.classList.remove('hidden');
                }
                else {
                    card.classList.add('hidden');
                }
            }
        }, 500));
        input.addEventListener('blur', () => typeAhead.innerHTML = '');
        return titleBar;
    }
    function kanban(root, data, searcher) {
        const titlebar = makeTitleBar(root, searcher);
        root.appendChild(titlebar);
        const container = make('div');
        // Mark the container with a class to namespace styling
        container.classList.add('trintech-kanban');
        root.appendChild(container);
        // Click Shield
        const clickShield = make('div');
        clickShield.classList.add('trintech-kanban-shield');
        clickShield.addEventListener('click', (event) => {
            event.stopPropagation();
            modal.classList.remove('active');
            clickShield.classList.remove('active');
            const frame = modal.querySelectorAll('iframe')[0];
            frame.classList.remove('ready');
            frame.src = '';
        });
        document.body.appendChild(clickShield);
        // Modal
        const modal = make('div');
        modal.classList.add('trintech-kanban-modal');
        const iframe = make('iframe');
        modal.appendChild(iframe);
        document.body.appendChild(modal);
        function makeCard(issue) {
            const card = make('div');
            card.classList.add('card', 'compact', issue.priority.toLocaleLowerCase());
            card.addEventListener('click', (event) => {
                iframe.src = `http://localhost:8080/console/OC?&_oc_pid=RetrieveFormInFrame&_oc_tid=RetrieveFormInFrame&_orig_oc_tid=MyForms&_orig_oc_pid=MyForms&selected_id=&formlistversion=All&_view=Inbox&_button_clicked=&pageHit=true&_form_list_sid=_all&freq_lov_id=0&_cancel_orig_tid=MyForms&_cancel_orig_pid=MyForms&isBulkTransfer=&isBulkSubmit=&_cancelform_formlistsid=&_cancelform_reference=&action=&customPerPage=10&log_sid=14904&_oc_pid=RetrieveFormInFrame&_oc_tid=RetrieveFormInFrame&14904_acting_as_cm=art,U,-1&_firstpass=true&_ispopup=true&_nohelp=true#`;
                iframe.onload = () => iframe.classList.add('ready');
                modal.classList.add('active');
                clickShield.classList.add('active');
            });
            // card header
            const header = make('header');
            const idContainer = make('div');
            const assigneeContainer = make('div');
            assigneeContainer.classList.add('assignee');
            const assigneeBox = make('div');
            assigneeBox.textContent = getInitials(issue.assignee);
            assigneeContainer.appendChild(assigneeBox);
            assigneeContainer.style.backgroundColor = getBackgroundColor(issue.assignee);
            header.appendChild(assigneeContainer);
            card.appendChild(header);
            const name = make('div');
            name.classList.add('name');
            name.textContent = issue.name;
            idContainer.appendChild(name);
            const id = make('div');
            id.classList.add('issue-id');
            id.textContent = `${issue.id}`;
            idContainer.appendChild(id);
            header.appendChild(idContainer);
            // card rows
            const summaryFields = pick(issue, 'actionPlan', 
            //'priority', This needs to be a color
            'startDate', 'dueDate');
            const detailsFields = pick(issue, 'status', //we dont need this value
            //'action', we dont have this value
            'entity', 'closePeriod', 'toDoRole', //need this in the filter
            'inProgressStatus', //need this in the filter
            'doneStatus', //need this in the filter
            'canReopen'); //need this in the filter
            const rows = make('div');
            rows.classList.add('rows');
            const summaryRows = makeCardRows(summaryFields, true);
            const detailsRows = makeCardRows(detailsFields, false);
            summaryRows.forEach(row => rows.appendChild(row));
            detailsRows.forEach(row => rows.appendChild(row));
            card.appendChild(rows);
            const keys = Object.keys(issue);
            for (const key of keys) {
                if (searchableFields.has(key)) {
                    const corpus = issue[key].toString();
                    // The searchTuples are a structure necessary to maintain the mapping 
                    // between text searched and dom card, so that when a search is done,
                    // a reference to the dom card always corresponds with the text searched
                    const searchTuples = searchableText.get(key) || [];
                    searchTuples.push([corpus, card]);
                    searchableText.set(key, searchTuples);
                }
            }
            return card;
        }
        function getBackgroundColor(name) {
            var hash = 0;
            for (var i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            var color = '#';
            for (var i = 0; i < 3; i++) {
                var value = (hash >> (i * 8)) & 0xFF;
                color += ('00' + value.toString(16)).substr(-2);
            }
            return color;
        }
        function getInitials(name) {
            var names = name.split(' ');
            var initials = names[0].substring(0, 1).toUpperCase();
            if (names.length > 1) {
                initials += names[names.length - 1].substring(0, 1).toUpperCase();
            }
            return initials;
        }
        function makeColumn(workFlowTag, issues) {
            const column = make('div');
            column.classList.add('column');
            // Column header
            const header = make('header');
            const title = make('div');
            title.classList.add('title');
            title.textContent = workFlowTag;
            header.appendChild(title);
            const minMax = make('div');
            minMax.classList.add('min-max');
            header.appendChild(minMax);
            const COLLAPSE = 'collapse';
            function checkOrDoCollapseAll() {
                const columns = [...root.querySelectorAll('.column')];
                let isCollapseAll = true;
                for (const aColumn of columns) {
                    // If the column is already collapsed
                    if (aColumn === column) {
                        if (column.classList.contains(COLLAPSE)) {
                            isCollapseAll = false;
                        }
                    }
                    else if (!aColumn.classList.contains(COLLAPSE)) {
                        isCollapseAll = false;
                    }
                }
                // If collapsing this column would have collapsed all, instead expand all
                if (isCollapseAll) {
                    columns.forEach(col => col.classList.remove(COLLAPSE));
                }
                return isCollapseAll;
            }
            // Toggle collapse
            minMax.addEventListener('click', (event) => {
                event.stopPropagation();
                const classes = column.classList;
                const isCollapsed = classes.contains(COLLAPSE);
                const isCollapseAll = checkOrDoCollapseAll();
                // Simply toggle the collapse state
                if (!isCollapseAll) {
                    isCollapsed ? classes.remove(COLLAPSE) : classes.add(COLLAPSE);
                }
            });
            // When the header is clicked collapse all the others
            header.addEventListener('click', () => {
                const classes = column.classList;
                const isCollapsed = classes.contains(COLLAPSE);
                const isCollapseAll = checkOrDoCollapseAll();
                if (!isCollapseAll) {
                    if (isCollapsed) {
                        classes.remove(COLLAPSE);
                    }
                    else {
                        const columns = [...root.querySelectorAll('.column')];
                        for (const aColumn of columns) {
                            if (aColumn !== column) {
                                aColumn.classList.add(COLLAPSE);
                            }
                        }
                        column.classList.remove(COLLAPSE);
                    }
                }
            });
            column.appendChild(header);
            // Issue container
            const container = make('div');
            container.classList.add('issue-column');
            column.appendChild(container);
            for (const issue of issues) {
                const card = makeCard(issue);
                container.appendChild(card);
            }
            return column;
        }
        // Create all the layout elements 
        for (const workFlowTag of workFlowTags) {
            // Filter the data down to those specific to this tag
            const dataForTag = data.filter(issue => {
                return issue.workFlowTag === workFlowTag;
            });
            const column = makeColumn(workFlowTag, dataForTag);
            container.appendChild(column);
        }
    }
    global.kanban = kanban;
}(this));
