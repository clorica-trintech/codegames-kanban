type WorkFlowTag = 'To Do' | 'In Progress' | 'Done';

interface IssueSummary {
  workFlowTag: WorkFlowTag;
  assignee: string;
  id: number;
  name: string;
  iconUrl: string;
  actionPlan: 'Test' | 'Close Task' | 'Issue' | 'Remediation';
  action: 'Save' | 'Submit' | 'Approve';
  dateTime: Date;
  status: 'Active' | 'Inactive';
  dueDate: Date,
  entity: 'Corporate HQ' | 'LE4';
  closePeriod: Date;
  issuePriority: 'Low' | 'Medium' | 'High';
};

(function(global) {
  const make = document.createElement.bind(document);

  function pick<T extends Object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K> {
    const picked: Pick<T, K> = {} as any;

    for (const key of keys) {
      picked[key] = source[key];
    }
    return picked;
  }
  
  const workFlowTags = new Set<WorkFlowTag>([
    'To Do', 
    'In Progress', 
    'Done'
  ]);

  function makeCardRows<T extends {}>(fields: T, isSummary: boolean) {      
    const rows: Element[] = [];
    const keys = Object.keys(fields);

    for (const key of keys) {
      const value = (fields as any)[key];
      const row = make('div');
      const classes = isSummary ? ['row', 'summary'] : ['row'];
      row.classList.add(...classes);

      const label = make('span');
      label.classList.add('label');
      label.textContent = key;

      const rowVal = make('span');
      rowVal.classList.add('row-value');
      rowVal.textContent = value;

      row.appendChild(label);
      row.appendChild(rowVal);
      rows.push(row);
    }
    return rows;
  }

  function trintechKanban(root: HTMLElement, data: IssueSummary[]) {
    const container = make('div');
    // Mark the container with a class to namespace styling
    container.classList.add('trintech-kanban')
    root.appendChild(container);

    function makeIssueCard(issue: IssueSummary) {
      const card = make('div');
      card.classList.add('card', 'compact', issue.issuePriority.toLocaleLowerCase());
      
      // card header
      const header = make('header');

      const img = make('img');
      img.src = issue.iconUrl;
      header.appendChild(img)

      const assignee = make('div');
      assignee.classList.add('assignee');
      assignee.textContent = issue.assignee;
      header.appendChild(assignee);

      card.appendChild(header);

      // card rows
      const summaryFields = pick(issue, 
        'id',
        'name',
        'issuePriority',
        'dueDate');

      const detailsFields = pick(issue, 
        'actionPlan',
        'action',
        'dateTime',
        'status',
        'entity',
        'closePeriod');

      const summaryRows = makeCardRows(summaryFields, true);
      const detailsRows = makeCardRows(detailsFields, false);


      summaryRows.forEach(row => card.appendChild(row));
      detailsRows.forEach(row => card.appendChild(row));
      return card;
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
        const card = makeIssueCard(issue);
        container.appendChild(card);
      } 
      return column;
    }

    // Create all the layout elements 
    for (const workFlowTag of workFlowTags) {
      // Filter the data down to those specific to this tag
      const dataForTag = data.filter(issue => {
        return issue.workFlowTag === workFlowTag
      });

      const column = makeColumn(workFlowTag, dataForTag);
      container.appendChild(column);
    }
  }

  global.trintechKanban = trintechKanban;
}(this));