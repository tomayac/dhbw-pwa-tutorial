import { bresenhamLine, getImage, toBlob } from './helpers.js';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d', {
  desynchronized: true,
});

const clear = () => {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
};
clear();

const btnClear = document.querySelector('#clear');
btnClear.addEventListener('click', clear);

let previousPoint = null;
canvas.addEventListener('pointerdown', (event) => {
  previousPoint = { x: ~~event.offsetX, y: ~~event.offsetY };
});
canvas.addEventListener('pointermove', (event) => {
  if (previousPoint) {
    const currentPoint = { x: ~~event.offsetX, y: ~~event.offsetY };
    for (const point of bresenhamLine(
      previousPoint.x,
      previousPoint.y,
      currentPoint.x,
      currentPoint.y
    )) {
      ctx.fillRect(point.x, point.y, 2, 2);
    }
    previousPoint = currentPoint;
  }
});
canvas.addEventListener('pointerup', () => {
  previousPoint = null;
});

const txtColor = document.querySelector('#color');
txtColor.addEventListener('change', () => {
  ctx.fillStyle = txtColor.value;
});

const fileOptions = {
  types: [
    {
      description: 'PNG files',
      accept: { 'image/png': ['.png'] },
    },
    {
      description: 'JPG files',
      accept: { 'image/jpeg': ['.jpg', '.jpeg'] },
    },
  ],
};

const btnSave = document.querySelector('#save');
btnSave.addEventListener('click', async () => {
  const blob = await toBlob(canvas);
  if ('showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker(fileOptions);
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    const anchor = document.createElement('a');
    const url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = '';
    anchor.click();
    URL.revokeObjectURL(url);
  }
});

const btnOpen = document.querySelector('#open');
btnOpen.addEventListener('click', async () => {
  if ('showOpenFilePicker' in window) {
    const [handle] = await window.showOpenFilePicker(fileOptions);
    const file = await handle.getFile();
    const image = await getImage(file);
    ctx.drawImage(image, 0, 0);
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,.png,.jpg,.jpeg,.webp,.gif';
    input.addEventListener('change', async () => {
      try {
        const blob = input.files[0];
        const image = await getImage(blob);
        ctx.drawImage(image, 0, 0);
      } catch (e) {
        console.error(e.message, e.name);
      }
    });
    input.click();
  }
});

const btnCopy = document.querySelector('#copy');
btnCopy.disabled = !(
  'clipboard' in navigator && 'write' in navigator.clipboard
);
btnCopy.addEventListener('click', async () => {
  const blob = await toBlob(canvas);
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
});

const btnPaste = document.querySelector('#paste');
btnPaste.disabled = !(
  'clipboard' in navigator && 'read' in navigator.clipboard
);
btnPaste.addEventListener('click', async () => {
  const clipboardItems = await navigator.clipboard.read();
  for (const clipboardItem of clipboardItems) {
    for (const type of clipboardItem.types) {
      if (type === 'image/png') {
        const blob = await clipboardItem.getType(type);
        const image = await getImage(blob);
        ctx.drawImage(image, 0, 0);
      }
    }
  }
});

const btnShare = document.querySelector('#share');
btnShare.disabled = !('canShare' in navigator);
btnShare.addEventListener('click', async () => {
  const blob = await toBlob(canvas);
  const file = new File([blob], 'untitled.png', { type: 'image/png' });
  const item = { files: [file], title: 'untitled.png' };
  if (navigator.canShare(item)) {
    await navigator.share(item);
  }
});

window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.register('sw.js');
    console.log(`Service worker registered for ${registration.scope}.`);
  }
});
