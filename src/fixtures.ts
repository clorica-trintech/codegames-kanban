(function (global) {
  const FIVE_DAYS = 1000 * 60 * 60 * 24 * 5;

  const issueSummaries: IssueSummary[] = [
    {
      id: 6,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'To Do',
      name: 'Fix the Race Condition',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 1,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'To Do',
      name: 'Refactor the Rules Engine',
      actionPlan: 'Test',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 2,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'In Progress',
      name: 'Add Filtering to Search Page',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 3,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'In Progress',
      name: 'Fix the Access Control Bug',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 4,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'Done',
      name: 'Rewrite Mobile Navigation',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 7,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'Done',
      name: 'Fix the Duplicate Job Bug',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 8,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'To Do',
      name: 'Implement In Process Caching with Coherence',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    },
    {
      id: 5,
      assignee: `clorica@trintech.com`,
      workFlowTag: 'In Progress',
      name: 'Install Cassandra on EC2',
      actionPlan: 'Close Task',
      action: 'Save',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Identicon.svg/1200px-Identicon.svg.png',
      dateTime: new Date(),
      status: 'Active',
      dueDate: new Date(Date.now() + FIVE_DAYS),
      entity: 'Corporate HQ',
      closePeriod: new Date(),
      issuePriority: 'High'
    }
  ];

  global.initialState = issueSummaries;
}(this));