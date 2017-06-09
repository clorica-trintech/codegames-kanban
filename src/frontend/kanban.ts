type WorkFlowTag = 'To Do' |
  'In Progress' |
  'Done';

interface IssueSummary {
  workFlowTag: WorkFlowTag;
  'assignee': string;
  'id': string;
  'name': string;
  'actionPlan': string;
  'action': string;
  'startDate': string;
  'dueDate': string;
  'status': string;
  'entity': string;
  'closePeriod': string;
  'priority': string;
  'toDoRole': string;
  'inProgressStatus': string;
  'doneStatus': string;
  'canReopen': string;
};

(function(global) {
  const make: Document['createElement'] = document.createElement.bind(document);

  function pick<T extends Object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K> {
    const picked: Pick<T, K> = {} as any;

    for (const key of keys) {
      picked[key] = source[key];
    }
    return picked;
  }

  function debounce<T extends Function>(toDebounce: T, delayMs: number) {
    let timeout: any;

    return function (...args: any[]) {    
      const callback = () => {
        timeout = null;
        return toDebounce.apply(this, args);
      }
      clearTimeout(timeout);
      timeout = setTimeout(callback, delayMs);
    }
  }

  function once<T extends Function>(toDoOnce: T) {
    const doNothing = () => {};
    let toDo: any = toDoOnce;

    return function (...args: any[]) {
      const toReturn = toDo.apply(this, args);
      toDo = doNothing;
      return toReturn;
    }
  }
  
  const workFlowTags = new Set<WorkFlowTag>([
    'To Do', 
    'In Progress', 
    'Done'
  ]);

  const searchableFields = new Set<keyof IssueSummary>([
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


  function makeCardRows<T extends {}>(fields: T, isSummary: boolean) {      
    const rows: Element[] = [];
    const keys = Object.keys(fields);

    for (const key of keys) {
      const value = (fields as any)[key];
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
        rowVal.classList.add('past-due');
      }

      row.appendChild(label);
      row.appendChild(rowVal);
      rows.push(row);
    }
    return rows;
  }

  //Ok this is real stupid, but I needed something fast
  function getFieldDisplayName(key: string) {
    switch (key)
    {
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
    }
    return "";
  }

  const searchableText = new Map<keyof IssueSummary, [string, any][]>();

  function makeTitleBar(root: Element, searcher: Searcher) {
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
        const cards = root.querySelectorAll('.card') as any;
        cards.forEach((card: Element) => card.classList.remove('hidden'));
        return;
      }
      const selectedOption = select.selectedOptions[0];
      const issueField = selectedOption.value;

      if (issueField === 'Search by Field') {
        return;
      }
      const searchTuples = searchableText.get(issueField as any)!;
      const results = searcher.score(searchTerm, searchTuples, '<strong>', '</strong>');

      let count = 0;

      if (results.length) {
        typeAhead.classList.remove('hidden');
      } else {
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
        } else {
          card.classList.add('hidden');
        }
      }
    }, 500));

    input.addEventListener('blur', () => typeAhead.innerHTML = '');

    return titleBar;    
  }

  function kanban(root: HTMLElement, data: IssueSummary[], searcher: Searcher) {
    const titlebar = makeTitleBar(root, searcher);
    root.appendChild(titlebar);

    const container = make('div');
    // Mark the container with a class to namespace styling
    container.classList.add('trintech-kanban');
    root.appendChild(container);

    // Click Shield
    const clickShield = make('div');
    clickShield.classList.add('trintech-kanban-shield');
    clickShield.addEventListener('click', (event: Event) => {
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


    const userIcon = new Map<string, string>();

    function getUserIcon(name: string) {
      if (!userIcon.has(name)) {
        userIcon.set(name, "public/images/icons/" + (userIcon.size + 1) + ".png");
      }
      var iconImg = userIcon.get(name);
      return iconImg == undefined ? "" : iconImg;
    }

    function makeCard(issue: IssueSummary) {
      const card = make('div');
      card.classList.add('card', 'compact');
      card.addEventListener('click', (event: Event) => {
        iframe.src = `http://localhost:8080/console/OC?&_oc_pid=RetrieveFormInFrame&_oc_tid=RetrieveFormInFrame&_orig_oc_tid=MyForms&_orig_oc_pid=MyForms&selected_id=&formlistversion=All&_view=Inbox&_button_clicked=&pageHit=true&_form_list_sid=_all&freq_lov_id=0&_cancel_orig_tid=MyForms&_cancel_orig_pid=MyForms&isBulkTransfer=&isBulkSubmit=&_cancelform_formlistsid=&_cancelform_reference=&action=&customPerPage=10&log_sid=14904&_oc_pid=RetrieveFormInFrame&_oc_tid=RetrieveFormInFrame&14904_acting_as_cm=art,U,-1&_firstpass=true&_ispopup=true&_nohelp=true#`;
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
      img.width = 40;
      img.height = 40;
      img.title = issue.assignee;
      assigneeContainer.appendChild(img);

      header.appendChild(assigneeContainer);

      const idContainer = make('div');
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
      const summaryFields = pick(issue, 
        //'startDate',
        'dueDate',
        //'actionPlan',
        //'priority', This needs to be a color
        //'entity',
        //'closePeriod'
        );

      const detailsFields = pick(issue, 
        'startDate',
        //'dueDate',
        'actionPlan',
        'entity',
        'closePeriod'
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

      const tagDiv = make('div');

      if (issue.workFlowTag == 'To Do') {
        //show toDoRole
        const toDoRole = make('div');
        toDoRole.classList.add('tag');
        toDoRole.textContent = issue.toDoRole;
        switch (issue.toDoRole)
        {
          case "Preparer": toDoRole.classList.add('preparer');break;
          case "Reviewer": toDoRole.classList.add('reviewer');break;
          case "Approver": toDoRole.classList.add('approver');break;
          case "Proxy": toDoRole.classList.add('proxy');break;
        }
        tagDiv.appendChild(toDoRole);
      } else if (issue.workFlowTag == 'In Progress') {
        //show inProgressStatus
        const inProgressStatus = make('div');
        inProgressStatus.classList.add('tag');
        inProgressStatus.textContent = issue.inProgressStatus;
        switch (issue.inProgressStatus)
        {
          case "In Review": inProgressStatus.classList.add('in-review');break;
          case "In Approval": inProgressStatus.classList.add('in-approval');break;
          case "Proxy": inProgressStatus.classList.add('in-proxy');break;
        }
        tagDiv.appendChild(inProgressStatus);
      } else if (issue.workFlowTag == 'Done') {
        //show Completed/Cancelled and Can Reopen
        const doneStatus = make('div');
        doneStatus.classList.add('tag');
        doneStatus.title = issue.doneStatus;
        
        switch (issue.doneStatus)
        {
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
          canReopen.innerHTML = "&#8635;";//9851
          canReopen.classList.add('tag');
          canReopen.classList.add('can-reopen');
          canReopen.title = "Can Re-open"
          tagDiv.appendChild(canReopen);
        }
        
      }

      main.appendChild(tagDiv);


      const keys: (keyof IssueSummary)[] = Object.keys(issue) as any;

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

    function getBackgroundColor(name: string) {
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

    function getInitials(name: string) {
      var names = name.split(' ');
      var initials = names[0].substring(0, 1).toUpperCase();
      
      if (names.length > 1) {
          initials += names[names.length - 1].substring(0, 1).toUpperCase();
      }
      return initials;
    }

    function makeColumn(workFlowTag: WorkFlowTag, issues: IssueSummary[]) {
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
        const columns: Element[] = [...root.querySelectorAll('.column') as any];

        let isCollapseAll = true;

        for (const aColumn of columns) {
          // If the column is already collapsed
          if (aColumn === column) {
            if (column.classList.contains(COLLAPSE)) {
              isCollapseAll = false;
            }
          }
          // If some other column is not collapsed
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
      minMax.addEventListener('click', (event: Event) => {
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
          // If the column is already in an expanded state, expand it more
          // by collapsing everything else
          else {
            const columns: Element[] = [...root.querySelectorAll('.column') as any];

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

    const filterDock = make('div');
    filterDock.classList.add('filter-dock');
    container.appendChild(filterDock);

    const columnContainer = make('div');
    columnContainer.classList.add('column-container');
    container.appendChild(columnContainer);

    // Create all the layout elements 
    for (const workFlowTag of workFlowTags) {
      // Filter the data down to those specific to this tag
      const dataForTag = data.filter(issue => {
        return issue.workFlowTag === workFlowTag
      });

      const column = makeColumn(workFlowTag, dataForTag);
      columnContainer.appendChild(column);
    }
  }

  global.kanban = kanban;
}(this));