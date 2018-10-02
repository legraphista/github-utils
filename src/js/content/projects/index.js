import {makeHtmlElem, copyToClipboard} from '../helpers';
import projectSummary from './project-summary';

const summaryBtn = makeHtmlElem(`
<div class="pl-4 hide-sm">
<a class="muted-link v-align-middle no-underline no-wrap project-header-link js-project-fullscreen-link" >Summary</a> 
</div>
`);

summaryBtn.children[0].addEventListener('click', async (e) => {
  e.preventDefault();
  const data = await projectSummary();

  console.log(data.join('\n'));
  copyToClipboard(data.join('\n'));

  alert('Summary is in clipboard');
});

document.querySelector('.project-header-controls').prepend(summaryBtn);
