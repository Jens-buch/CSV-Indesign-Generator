let fields = [];

function setItemType() {
  const itemTypeInput = document.getElementById('itemType');
  const startBtn = document.getElementById('startBtn');

  itemTypeInput.disabled = true;
  document.getElementById('fieldSetup').classList.remove('hidden');
  startBtn.textContent = 'Edit';
  startBtn.onclick = editItemType;
}

function editItemType() {
  const itemTypeInput = document.getElementById('itemType');
  const startBtn = document.getElementById('startBtn');

  itemTypeInput.disabled = false;
  document.getElementById('fieldSetup').classList.add('hidden');
  document.getElementById('recordSection').classList.add('hidden');
  startBtn.textContent = 'Next';
  startBtn.onclick = setItemType;
}

function addField() {
  const container = document.getElementById('fieldInputs');
  const wrapper = document.createElement('div');
  wrapper.className = 'flex gap-2 items-center';

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Field name';
  nameInput.className = 'flex-1 border border-gray-300 rounded px-3 py-2';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'border border-gray-300 rounded px-2 py-2 text-sm';
  ['Text', 'Image path'].forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Remove';
  deleteBtn.className = 'text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700';
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

    if (!name) return;

    if (type === 'Image path') {
      fields.push('@' + name);
    } else {
      fields.push(name);
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

function addRecord() {
  const container = document.getElementById('records');
  const row = document.createElement('div');
  row.className = 'flex gap-4 mb-4 items-end record-row';

  fields.forEach(field => {
    const isImageField = field.startsWith('@');

    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col flex-1';

    const label = document.createElement('label');
    label.textContent = field.replace(/^@/, '');
    label.className = 'text-sm font-medium text-gray-700 mb-1';

    const input = document.createElement('input');
    input.setAttribute('data-field', field);
    input.placeholder = isImageField ? 'e.g. Images/photo.jpg' : '';
    input.className = 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400';

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    row.appendChild(wrapper);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Remove';
  deleteBtn.className = 'text-sm bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700';
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
    const row = [];
    fields.forEach(field => {
      const input = div.querySelector(`input[data-field='${field}']`);
      const value = input?.value.trim().replace(/\t/g, ' ').replace(/\r?\n/g, ' ') || '';
      row.push(value);
    });
    rows.push(row);
  });

  const content = rows.map(r => r.join('\t')).join('\r\n') + '\r\n';

  const buffer = new ArrayBuffer(2 + content.length * 2);
  const view = new DataView(buffer);
  view.setUint16(0, 0xFEFF, true); // BOM

  for (let i = 0; i < content.length; i++) {
    view.setUint16(2 + i * 2, content.charCodeAt(i), true); // UTF-16LE
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

  const data = { itemType, fieldDefs, records };
  localStorage.setItem('csvBuilderData', JSON.stringify(data));
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
    nameInput.className = 'flex-1 border border-gray-300 rounded px-3 py-2';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'border border-gray-300 rounded px-2 py-2 text-sm';
    ['Text', 'Image path'].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      if (option === type) opt.selected = true;
      typeSelect.appendChild(opt);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Remove';
    deleteBtn.className = 'text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700';
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

  data.records.forEach(record => {
    const container = document.getElementById('records');
    const row = document.createElement('div');
    row.className = 'flex gap-4 mb-4 items-end record-row';

    fields.forEach(field => {
      const isImageField = field.startsWith('@');

      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col flex-1';

      const label = document.createElement('label');
      label.textContent = field.replace(/^@/, '');
      label.className = 'text-sm font-medium text-gray-700 mb-1';

      const input = document.createElement('input');
      input.setAttribute('data-field', field);
      input.placeholder = isImageField ? 'e.g. Images/photo.jpg' : '';
      input.className = 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400';
      input.value = record[field] || '';

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      row.appendChild(wrapper);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Remove';
    deleteBtn.className = 'text-sm bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700';
    deleteBtn.onclick = () => {
      container.removeChild(row);
      saveToLocalStorage();
    };

    row.appendChild(deleteBtn);
    container.appendChild(row);
  });
}

function clearLocalStorage() {
  localStorage.removeItem('csvBuilderData');
  location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
});

function clearSession() {
  localStorage.removeItem('csvBuilderData');

  // Clear all dynamic sections
  document.getElementById('itemType').value = '';
  document.getElementById('itemType').disabled = false;

  document.getElementById('fieldInputs').innerHTML = '';
  document.getElementById('records').innerHTML = '';

  fields = [];

  // Reset buttons
  const startBtn = document.getElementById('startBtn');
  startBtn.textContent = 'Next';
  startBtn.onclick = setItemType;

  // Show only step 1, hide others
  document.getElementById('fieldSetup').classList.add('hidden');
  document.getElementById('recordSection').classList.add('hidden');

  // Optionally scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

