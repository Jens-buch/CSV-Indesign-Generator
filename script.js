let fields = [];

function setItemType() {
  document.getElementById('itemType').disabled = true;
  document.getElementById('fieldSetup').classList.remove('hidden');
  const btn = document.getElementById('startBtn');
  btn.textContent = 'Edit List Name';
  btn.onclick = editItemType;
  //  Add one default empty field
  addField();
}

function editItemType() {
  document.getElementById('itemType').disabled = false;
  document.getElementById('fieldSetup').classList.add('hidden');
  document.getElementById('recordSection').classList.add('hidden');
  const btn = document.getElementById('startBtn');
  btn.textContent = 'Next';
  btn.onclick = setItemType;
}

function addField() {
  const container = document.getElementById('fieldInputs');
  const wrapper = document.createElement('div');
  wrapper.className = 'flex gap-2 items-center';

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Field name';
  nameInput.className = 'flex-1 bg-white text-gray-900 placeholder-gray-400 rounded px-5 py-4';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'custom-select bg-white text-gray-900 rounded px-5 py-4 text-sm';
  ['Text', 'Image path'].forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Remove';
  deleteBtn.className = 'text-sm bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200';
  deleteBtn.onclick = () => {
    container.removeChild(wrapper);
    saveToLocalStorage();
  };

  wrapper.appendChild(nameInput);
  wrapper.appendChild(typeSelect);
  wrapper.appendChild(deleteBtn);
  container.appendChild(wrapper);

  saveToLocalStorage();
}

function lockFields() {
  const wrappers = document.querySelectorAll('#fieldInputs > .flex');
  fields = [];

  wrappers.forEach(wrapper => {
    const nameInput = wrapper.querySelector('input');
    const typeSelect = wrapper.querySelector('select');
    const name = nameInput?.value.trim();
    const type = typeSelect?.value;
    if (name) {
      fields.push(type === 'Image path' ? '@' + name : name);
    }
  });

  if (fields.length === 0) {
    alert('Please define at least one field.');
    return;
  }

  document.getElementById('fieldSetup').classList.add('hidden');
  document.getElementById('recordSection').classList.remove('hidden');
  document.getElementById('records').innerHTML = '';
  addRecord();
  saveToLocalStorage();
}

function addRecord(data = {}) {
  const container = document.getElementById('records');
  const row = document.createElement('div');
  row.className = 'flex gap-4 mb-4 items-end record-row';

  fields.forEach(field => {
    const isImageField = field.startsWith('@');
    const label = document.createElement('label');
    label.className = 'flex flex-col flex-1 text-sm font-medium text-gray-900';
    label.textContent = field.replace(/^@/, '');

    const input = document.createElement('input');
    input.setAttribute('data-field', field);
    input.className = 'bg-white text-gray-900 placeholder-gray-400 rounded px-5 py-4';
    input.placeholder = isImageField ? 'e.g. Images/photo.jpg' : '';
    input.value = data[field] || '';

    label.appendChild(input);
    row.appendChild(label);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Remove';
  deleteBtn.className = 'text-sm bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200';
  deleteBtn.onclick = () => {
    container.removeChild(row);
    saveToLocalStorage();
  };

  row.appendChild(deleteBtn);
  container.appendChild(row);
  saveToLocalStorage();
}

function exportCSV() {
  const rows = [fields];
  const recordDivs = document.querySelectorAll('.record-row');

  if (recordDivs.length === 0) {
    alert('Please add at least one row of data before exporting.');
    return;
  }

  recordDivs.forEach(div => {
    const row = fields.map(field => {
      const input = div.querySelector(`input[data-field='${field}']`);
      return (input?.value || '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    });
    rows.push(row);
  });

  const content = rows.map(r => r.join('\t')).join('\r\n') + '\r\n';
  const buffer = new ArrayBuffer(2 + content.length * 2);
  const view = new DataView(buffer);
  view.setUint16(0, 0xFEFF, true); // BOM

  for (let i = 0; i < content.length; i++) {
    view.setUint16(2 + i * 2, content.charCodeAt(i), true);
  }

  const blob = new Blob([buffer], { type: 'text/plain;charset=utf-16le' });
  const itemType = document.getElementById('itemType').value.trim() || 'data-list';
  const today = new Date().toISOString().split('T')[0];
  const filename = `${itemType.replace(/\s+/g, '-').toLowerCase()}-${today}.txt`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function editFields() {
  document.getElementById('fieldSetup').classList.remove('hidden');
  document.getElementById('recordSection').classList.add('hidden');
  saveToLocalStorage();
}

function saveToLocalStorage() {
  const itemType = document.getElementById('itemType').value.trim();
  const fieldDefs = [];
  document.querySelectorAll('#fieldInputs > .flex').forEach(wrapper => {
    const nameInput = wrapper.querySelector('input');
    const typeSelect = wrapper.querySelector('select');
    if (nameInput && typeSelect) {
      fieldDefs.push({ name: nameInput.value, type: typeSelect.value });
    }
  });

  const records = [];
  document.querySelectorAll('.record-row').forEach(row => {
    const record = {};
    fields.forEach(field => {
      const input = row.querySelector(`input[data-field='${field}']`);
      record[field] = input?.value || '';
    });
    records.push(record);
  });

  localStorage.setItem('csvBuilderData', JSON.stringify({ itemType, fieldDefs, records }));
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem('csvBuilderData');
  if (!raw) return;

  const data = JSON.parse(raw);
  if (!data || !data.fieldDefs || !data.records) return;

  document.getElementById('itemType').value = data.itemType || '';
  setItemType();

  document.getElementById('fieldInputs').innerHTML = '';
  data.fieldDefs.forEach(({ name, type }) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex gap-2 items-center';

    const nameInput = document.createElement('input');
    nameInput.value = name;
    nameInput.className = 'flex-1 bg-white text-gray-900 rounded px-5 py-4';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'custom-select bg-white text-gray-900 rounded px-5 py-4 text-sm';
    ['Text', 'Image path'].forEach(optType => {
      const opt = document.createElement('option');
      opt.value = optType;
      opt.textContent = optType;
      if (optType === type) opt.selected = true;
      typeSelect.appendChild(opt);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Remove';
    deleteBtn.className = 'text-sm bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200';
    deleteBtn.onclick = () => {
      wrapper.remove();
      saveToLocalStorage();
    };

    wrapper.appendChild(nameInput);
    wrapper.appendChild(typeSelect);
    wrapper.appendChild(deleteBtn);
    document.getElementById('fieldInputs').appendChild(wrapper);
  });

  lockFields();
  document.getElementById('records').innerHTML = '';
  data.records.forEach(record => addRecord(record));
}

function clearSession() {
  localStorage.removeItem('csvBuilderData');
  location.reload();
}

window.addEventListener('DOMContentLoaded', loadFromLocalStorage);


const guideContent = {
  existing: `
    <p><strong>Step 1:</strong> Launch InDesign and open your <code>.indd</code> file.</p>
    <p><strong>Step 2:</strong> Go to <em>Window → Utilities → Data Merge</em>. From the panel menu (☰), choose <strong>Select Data Source...</strong> and select your <code>.csv</code> file.</p>
    <p><strong>Step 3:</strong> Click into a text frame, then click a field name in the Data Merge panel (e.g. <code>&lt;&lt;Title&gt;&gt;</code>). Do the same for other fields. For images, create an image frame, click it, then insert the image field (e.g. <code>&lt;&lt;ImageURL&gt;&gt;</code>).</p>
    <p><strong>Step 4:</strong> Toggle <strong>Preview</strong> in the Data Merge panel to see results. Go to <strong>Create Merged Document...</strong> or <strong>Export to PDF</strong> via <em>File → Export</em>.</p>
  `,
  new: `
    <p><strong>Step 1:</strong> Create a new InDesign document and set up your page size, margins, and layout.</p>
    <p><strong>Step 2:</strong> Open the <em>Data Merge</em> panel via <em>Window → Utilities → Data Merge</em>, then choose <strong>Select Data Source...</strong> to load your <code>.csv</code> file.</p>
    <p><strong>Step 3:</strong> Add text and image frames to your layout. Insert merge fields by clicking the frame, then selecting a field from the panel (e.g. <code>&lt;&lt;Title&gt;&gt;</code>, <code>&lt;&lt;ImageURL&gt;&gt;</code>).</p>
    <p><strong>Step 4:</strong> Use <strong>Preview</strong> to check how records look, then generate the final output with <strong>Create Merged Document...</strong> or export as PDF.</p>
  `
};


function openGuide(type) {
  document.getElementById('guideContent').innerHTML = guideContent[type] || '';
  document.getElementById('guidePanel').classList.remove('translate-x-full');
}

function closeGuide() {
  document.getElementById('guidePanel').classList.add('translate-x-full');
}
