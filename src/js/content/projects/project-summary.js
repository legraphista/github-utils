import {waitForSelector} from '../helpers';

function eventElementToRepoName(e) {
  try {
    const id = e.querySelector('strong > a').getAttribute('href').split('#')[1];
    const card = document.querySelector(`div[id='${id}']`).getAttribute('data-card-repo');

    return JSON.parse(card)[0].split('/')[1];
  } catch (e) {
  }
  return 'note';
}

function took(seconds) {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  }
  if (seconds < 60 * 60) {
    return `${(seconds / 60).toFixed(0)}m`;
  }

  const h = (seconds / 3600).toFixed(0);
  const m = (seconds % 3600 / 60).toFixed(0);

  return `${h}h ${m}m`;
}

function time(date) {
  let h = date.getHours();
  if (h < 10) {
    h = `0${h}`;
  }

  let m = date.getMinutes();
  if (m < 10) {
    m = `0${m}`;
  }

  return `${h}:${m}`;
}

async function openHistory() {
  if (document.querySelector(`div.js-project-menu-pane.d-none`)) {
    document.querySelector('button.js-show-project-menu').click();
    // todo wait for button to exist
    await waitForSelector(`form[action='${window.location.pathname}/activity'] > button:not([disabled])`);
  }
}

async function loadMoreHistory() {
  await openHistory();
  document.querySelector(`form[action='${window.location.pathname}/activity'] > button`).click();
  // todo wait for button to be back to normal
  await waitForSelector(`form[action='${window.location.pathname}/activity'] > button:not([disabled])`);
  document.querySelector(`div.js-project-menu-pane`).scrollTo(0, 2 ** 53);
}

async function loadHistoryTo(date) {
  await openHistory();

  document
    .querySelector(`form[action='${window.location.pathname}/activity'] > input[name='latest_allowed_entry_time']`)
    .value = date.toISOString();
  document.querySelector(`form[action='${window.location.pathname}/activity'] > button`).click();
  // todo wait for button to be back to normal
  await waitForSelector(`form[action='${window.location.pathname}/activity'] > button:not([disabled])`);
  document.querySelector(`div.js-project-menu-pane`).scrollTo(0, 2 ** 53);
}

export default async function projectSummary() {

  // for (let i = 0; i < 5; i++) {
  //   await loadMoreHistory();
  // }

  const now = new Date();
  const filterSince = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0);

  // fixme this might not work
  await loadHistoryTo(filterSince);

  const elements = document.querySelectorAll('.js-project-activity-container > li > p');

  const events = [];
  const eventMap = new Map();

  for (let i = 0; i < elements.length; i++) {

    const e = elements[i];

    let [title, from, to] = [...e.querySelectorAll('strong')].map(x => x.innerText.trim());

    if (!to) {
      to = from;
    }

    let id = title.toLowerCase().trim();
    id = /^(\[.*?\])?(.*)$/.exec(id)[2].trim().substr(0, 50);

    const repo = eventElementToRepoName(e);

    const isMoved = e.innerText.indexOf(' moved ') !== -1;
    const isAdded = e.innerText.indexOf(' added ') !== -1;
    const isUpdated = e.innerText.indexOf(' updated ') !== -1;
    const isRemoved = e.innerText.indexOf(' removed ') !== -1;

    const time = new Date(e.querySelector('span > relative-time').getAttribute('datetime'));

    if (time > filterSince) {
      const item = { id, title, from, to, time, isMoved, isAdded, isUpdated, repo, e };
      events.push(item);

      if (!eventMap.has(id)) {
        eventMap.set(id, []);
      }

      eventMap.get(id).push(item);
    }
  }

  [...eventMap.values()].forEach(events => events.sort((a, b) => a.time.getTime() - b.time.getTime()));

  console.log(eventMap);

  let toPrint = [];

  [...eventMap.values()].forEach(events => {

    const title = `*${events[0].title}*`;
    const repo = `*\`${events[0].repo}\`*`;

    let inProgressAt;
    let doneAt;

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.to) {
        switch (e.to.toLowerCase().trim()) {
          case 'in progress':
//                 case 'backlog':
//                 case 'new issues':
            inProgressAt = e.time;
            doneAt = null;
            break;
          case 'qa/pr':
          case 'done':
            if (!doneAt) {
              doneAt = e.time;
            }
            break;
        }
      }
    }

    if (inProgressAt && doneAt) {
      const duration = took(
        (doneAt.getTime() - inProgressAt.getTime())
        / 1000
      );

      toPrint.push({
        text:
          'Started task ' + repo + '/' + title +
          ' at ' + time(inProgressAt) +
          ' and finished at ' + time(doneAt) +
          ` (took ${duration})`,
        sort: doneAt.getTime()
      });
    } else if (doneAt) {
      toPrint.push({
        text:
          'Finished task ' + repo + '/' + title +
          ' at ' + time(doneAt),
        sort: doneAt.getTime()
      });
    } else if (inProgressAt) {
      toPrint.push({
        text:
          'Started task ' + repo + '/' + title +
          ' at ' + time(inProgressAt),
        sort: inProgressAt.getTime()
      });
    } else {
      console.log(events);
    }
  });

  return toPrint
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.text);
}
