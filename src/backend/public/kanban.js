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
    function getSiblings(element) {
        return Array
            .from(element.parentNode.childNodes)
            .filter(el => el !== element);
    }
    const workFlowTags = new Set([
        'To Do',
        'In Progress',
        'Done'
    ]);
    const workFlowTagStatuses = new Map([
        ['To Do',
            ['Preparer', 'Reviewer', 'Approver', 'Proxy']],
        ['In Progress',
            ['In Review', 'In Approval', 'In Proxy']],
        ['Done',
            ['Completed', 'Cancelled']]
    ]);
    const searchableFields = new Set([
        'id',
        'assignee',
        'name',
        'actionPlan',
        'status',
        'entity',
        'closePeriod',
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
            if (key == 'dueDate') {
                var x = new Date(value);
                var y = new Date();
                if (x < y)
                    rowVal.classList.add('past-due');
            }
            row.appendChild(label);
            row.appendChild(rowVal);
            rows.push(row);
        }
        return rows;
    }
    function getFieldDisplayName(key) {
        switch (key) {
            case "id": return "ID";
            case "owner": return "Owner";
            case "assignee": return "Assignee";
            case "workFlowTag": return "WorkFlow Tag";
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
            default: return key;
        }
    }
    const searchableText = new Map();
    const suggestionMap = new Map();
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
            option.textContent = getFieldDisplayName(searchableField);
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
        function onInput() {
            const selectedOption = select.selectedOptions[0];
            const issueField = selectedOption.value;
            const searchTerm = input.value;
            if (!searchTerm) {
                const cards = root.querySelectorAll('.card');
                for (const card of cards) {
                    card.classList.remove('hidden');
                }
                const suggestions = Array
                    .from(suggestionMap.get(issueField))
                    .map(suggestion => {
                    return {
                        text: suggestion,
                        html: suggestion,
                        count: -1
                    };
                });
                if (suggestions.length) {
                    openTypeAhead(suggestions);
                }
                return;
            }
            if (issueField === 'Search by Field') {
                return;
            }
            const searchTuples = searchableText.get(issueField);
            const results = searcher.score(searchTerm, searchTuples, '<strong>', '</strong>');
            const typeAheadItemMap = new Map();
            // Process results
            for (const { score, rendered, tuple } of results) {
                const [text, card] = tuple;
                if (score !== 0) {
                    if (typeAheadItemMap.size < 100) {
                        const typeAheadItem = typeAheadItemMap.get(text) || {
                            text, html: rendered, count: 0
                        };
                        typeAheadItem.count += 1;
                        typeAheadItemMap.set(text, typeAheadItem);
                    }
                    // Filter the cards
                    card.classList.remove('hidden');
                }
                else {
                    card.classList.add('hidden');
                }
            }
            const items = Array.from(typeAheadItemMap.values());
            if (items.length) {
                openTypeAhead(items);
            }
        }
        function openTypeAhead(items) {
            if (!items.length) {
                return;
            }
            typeAhead.innerHTML = '';
            for (const { text, html, count } of items) {
                const li = make('li');
                li.onclick = () => {
                    input.value = text;
                    onInput();
                };
                const match = make('span');
                match.innerHTML = html;
                li.appendChild(match);
                const counter = make('span');
                counter.classList.add('count');
                counter.textContent = count === -1 ? '' : '' + count;
                li.appendChild(counter);
                typeAhead.appendChild(li);
            }
            typeAhead.classList.remove('hidden');
        }
        function closeTypeAhead() {
            typeAhead.innerHTML = '';
            typeAhead.classList.add('hidden');
        }
        input.addEventListener('input', debounce(() => onInput(), 500));
        input.addEventListener('focus', () => onInput());
        input.addEventListener('blur', () => setTimeout(closeTypeAhead, 200));
        return titleBar;
    }
    function setSuggestions(data) {
        const keySet = new Set();
        for (const summary of data) {
            const keys = Object.keys(summary);
            for (const key of keys) {
                const set = suggestionMap.get(key) || new Set();
                if (set.size === 100) {
                    keySet.add(key);
                }
                else {
                    set.add(summary[key]);
                    suggestionMap.set(key, set);
                }
            }
        }
    }
    function kanban(root, data, searcher) {
        setSuggestions(data);
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
        iframe.src = 'http://localhost:8002/public/modal/default.png';
        document.body.appendChild(modal);
        const userIcon = new Map();
        function getUserIcon(name) {
            if (!userIcon.has(name)) {
                userIcon.set(name, "public/images/icons/" + (userIcon.size + 1) + ".png");
            }
            var iconImg = userIcon.get(name);
            return iconImg == undefined ? "" : iconImg;
        }
        function makeCard(issue) {
            const card = make('div');
            const classes = ['card', 'compact'];
            const { toDoRole, inProgressStatus, doneStatus } = issue;
            const status = [toDoRole, inProgressStatus, doneStatus].filter(i => !!i);
            for (const item of status) {
                classes.push(item.toLocaleLowerCase().replace(/\s+/, '-'));
            }
            card.classList.add(...classes);
            card.addEventListener('click', (event) => {
                iframe.src = 'http://localhost:8002/public/modal/' + issue.id + '.png';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.align = 'center';
                iframe.onload = () => iframe.classList.add('ready');
                modal.classList.add('active');
                clickShield.classList.add('active');
            });
            const aside = make('aside');
            if (issue.priority === 'Y') {
                aside.classList.add('critical');
            }
            card.appendChild(aside);
            const main = make('main');
            card.appendChild(main);
            // card header
            const header = make('header');
            main.appendChild(header);
            const assigneeContainer = make('div');
            assigneeContainer.classList.add('assignee');
            //assigneeContainer.textContent = getInitials(issue.assignee);
            //assigneeContainer.style.backgroundColor = getBackgroundColor(issue.assignee);
            const img = make('img');
            img.src = getUserIcon(issue.assignee);
            img.width = 35;
            img.height = 35;
            img.title = issue.assignee;
            assigneeContainer.appendChild(img);
            header.appendChild(assigneeContainer);
            const idContainer = make('div');
            idContainer.classList.add('idcontainer');
            const name = make('div');
            name.classList.add('name');
            name.textContent = issue.name;
            idContainer.appendChild(name);
            const tagDiv = make('div');
            if (issue.workFlowTag == 'To Do') {
                //show toDoRole
                const toDoRole = make('div');
                toDoRole.classList.add('tag');
                toDoRole.textContent = issue.toDoRole;
                switch (issue.toDoRole) {
                    case "Preparer":
                        toDoRole.classList.add('preparer');
                        break;
                    case "Reviewer":
                        toDoRole.classList.add('reviewer');
                        break;
                    case "Approver":
                        toDoRole.classList.add('approver');
                        break;
                    case "Proxy":
                        toDoRole.classList.add('proxy');
                        break;
                }
                tagDiv.appendChild(toDoRole);
            }
            else if (issue.workFlowTag == 'In Progress') {
                //show inProgressStatus
                const inProgressStatus = make('div');
                inProgressStatus.classList.add('tag');
                inProgressStatus.textContent = issue.inProgressStatus;
                switch (issue.inProgressStatus) {
                    case "In Review":
                        inProgressStatus.classList.add('in-review');
                        break;
                    case "In Approval":
                        inProgressStatus.classList.add('in-approval');
                        break;
                    case "In Proxy":
                        inProgressStatus.classList.add('in-proxy');
                        break;
                }
                tagDiv.appendChild(inProgressStatus);
            }
            else if (issue.workFlowTag == 'Done') {
                //show Completed/Cancelled and Can Reopen
                const doneStatus = make('div');
                doneStatus.classList.add('tag');
                doneStatus.title = issue.doneStatus;
                switch (issue.doneStatus) {
                    case "Completed":
                        doneStatus.innerHTML = "&#10004;";
                        doneStatus.classList.add('completed');
                        break;
                    case "Cancelled":
                        doneStatus.innerHTML = "&#10008;";
                        doneStatus.classList.add('cancelled');
                        break;
                }
                tagDiv.appendChild(doneStatus);
                if (issue.canReopen) {
                    const canReopen = make('div');
                    canReopen.innerHTML = "&#8635;"; //9851
                    canReopen.classList.add('tag');
                    canReopen.classList.add('can-reopen');
                    canReopen.title = "Can Re-open";
                    tagDiv.appendChild(canReopen);
                }
            }
            idContainer.appendChild(tagDiv);
            const id = make('div');
            id.classList.add('issue-id');
            id.textContent = `${issue.id}`;
            idContainer.appendChild(id);
            header.appendChild(idContainer);
            // card rows
            const summaryFields = pick(issue, 
            //'startDate',
            'dueDate');
            const detailsFields = pick(issue, 'startDate', 
            //'dueDate',
            'actionPlan', 'entity', 'closePeriod'
            //'status', //we dont need this value
            //'action', we dont have this value
            //'entity',
            //'closePeriod'
            //'toDoRole', //need this in the filter
            //'inProgressStatus', //need this in the filter
            //'doneStatus', //need this in the filter
            //'canReopen', //need this in the filter
            );
            const rows = make('div');
            rows.classList.add('rows');
            const summaryRows = makeCardRows(summaryFields, true);
            const detailsRows = makeCardRows(detailsFields, false);
            summaryRows.forEach(row => rows.appendChild(row));
            detailsRows.forEach(row => rows.appendChild(row));
            main.appendChild(rows);
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
        function filterColumn(column, keys) {
            const cards = column.querySelectorAll('.card');
            if (keys.length) {
                outer: for (const card of cards) {
                    for (const key of keys) {
                        if (card.classList.contains(key)) {
                            card.classList.remove('filter-hidden');
                            continue outer;
                        }
                    }
                    card.classList.add('filter-hidden');
                }
            }
            else {
                for (const card of cards) {
                    card.classList.remove('filter-hidden');
                }
            }
        }
        function makeColumn(workFlowTag, issues) {
            const column = make('div');
            column.classList.add('column');
            // Column header
            const header = make('header');
            const title = make('div');
            title.classList.add('title');
            title.textContent = "  " + workFlowTag;
            header.appendChild(title);
            const minMax = make('div');
            minMax.classList.add('min-max');
            header.appendChild(minMax);
            function checkOrDoCollapseAll() {
                const columns = [...root.querySelectorAll('.column')];
                let isCollapseAll = true;
                for (const aColumn of columns) {
                    // If the column is already collapsed
                    if (aColumn === column) {
                        if (column.classList.contains('collapse')) {
                            isCollapseAll = false;
                        }
                    }
                    else if (!aColumn.classList.contains('collapse')) {
                        isCollapseAll = false;
                    }
                }
                // If collapsing this column would have collapsed all, instead expand all
                if (isCollapseAll) {
                    columns.forEach(col => col.classList.remove('collapse'));
                }
                return isCollapseAll;
            }
            // Toggle collapse
            minMax.addEventListener('click', (event) => {
                event.stopPropagation();
                const classes = column.classList;
                const isCollapsed = classes.contains('collapse');
                const isCollapseAll = checkOrDoCollapseAll();
                // Simply toggle the collapse state
                if (!isCollapseAll) {
                    if (isCollapsed) {
                        classes.remove('collapse');
                    }
                    else {
                        // Check to see if a sibling is promoted to hero
                        const [left, right] = getSiblings(column);
                        const leftCollapsed = left.classList.contains('collapse');
                        const rightCollapsed = right.classList.contains('collapse');
                        if (leftCollapsed !== rightCollapsed) {
                            (leftCollapsed ? right : left).classList.add('hero');
                        }
                        classes.add('collapse');
                    }
                }
                else {
                    classes.remove('hero');
                }
            });
            // When the header is clicked collapse all the others
            header.addEventListener('click', () => {
                const classes = column.classList;
                const isCollapsed = classes.contains('collapse');
                const isCollapseAll = checkOrDoCollapseAll();
                if (!isCollapseAll) {
                    if (isCollapsed) {
                        classes.remove('collapse');
                        getSiblings(column).forEach(sib => sib.classList.remove('hero'));
                    }
                    else {
                        classes.add('hero');
                        const columns = root.querySelectorAll('.column');
                        for (const aColumn of columns) {
                            if (aColumn !== column) {
                                aColumn.classList.add('collapse');
                                aColumn.classList.remove('hero');
                            }
                        }
                        column.classList.remove('collapse');
                    }
                }
                else {
                    classes.remove('hero');
                }
            });
            column.appendChild(header);
            // Filters
            const filterDock = make('div');
            filterDock.classList.add('filter-dock');
            column.appendChild(filterDock);
            const filterBar = make('div');
            filterBar.classList.add('filter-bar');
            filterDock.appendChild(filterBar);
            const htmlClass = workFlowTag.toLocaleLowerCase().replace(/\s+/, '-');
            const filterSet = make('div');
            filterSet.classList.add('filter-set', htmlClass);
            filterBar.appendChild(filterSet);
            const statuses = workFlowTagStatuses.get(workFlowTag);
            for (const status of statuses) {
                const filter = make('div');
                filter.setAttribute('status', status.toLocaleLowerCase().replace(/\s+/, '-'));
                filter.classList.add('filter');
                filterSet.appendChild(filter);
                const checkbox = make('input');
                checkbox.type = 'checkbox';
                filter.appendChild(checkbox);
                function onclick(event) {
                    checkbox.checked = !checkbox.checked;
                    const activeKeys = [];
                    const filters = filterSet.querySelectorAll('.filter');
                    for (const filter of filters) {
                        const input = filter.children[0];
                        if (input.checked) {
                            activeKeys.push(filter.getAttribute('status'));
                        }
                    }
                    filterColumn(column, activeKeys);
                }
                filter.onclick = onclick;
                const label = make('p');
                label.textContent = status;
                filter.appendChild(label);
            }
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
        const columnContainer = make('div');
        columnContainer.classList.add('column-container');
        container.appendChild(columnContainer);
        // Create all the layout elements 
        for (const workFlowTag of workFlowTags) {
            // Filter the data down to those specific to this tag
            const dataForTag = data.filter(issue => {
                return issue.workFlowTag === workFlowTag;
            });
            const column = makeColumn(workFlowTag, dataForTag);
            columnContainer.appendChild(column);
        }
    }
    global.kanban = kanban;
}(this));
