export function makeHtmlElem(html) {

  const element = document.createElement('div');
  element.innerHTML = html;

  return element.children[0];

}

export async function waitForSelector(selector) {

  while (!document.querySelector(selector)) {
    await new Promise(_ => setTimeout(_, 100));
  }

}

export function copyToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
